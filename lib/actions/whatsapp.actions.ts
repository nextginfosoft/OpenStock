'use server';

import { randomInt, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/database/mongoose";
import { requireUserId } from "@/lib/better-auth/auth";
import { hashCode, sendWhatsAppCode, whatsappConfigured } from "@/lib/whatsapp";
import { maskPhone, normalizePhone } from "@/lib/whatsapp-format";

// One document per user in "whatsapp_alerts". Every action acts on the signed-in user only.
type WhatsAppDoc = {
    userId: string;
    number?: string;
    verified?: boolean;
    verifiedAt?: Date;
    priceAlerts?: boolean;
    dailyWrap?: boolean;
    pending?: { number: string; codeHash: string; expiresAt: Date; attempts: number; sentAt: Date };
    // Codes sent today, so the form can't be used to message arbitrary numbers at our cost
    codeSends?: { day: string; count: number };
};

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_AFTER_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_CODES_PER_DAY = 5;

async function collection() {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');
    return db.collection<WhatsAppDoc>('whatsapp_alerts');
}

export type WhatsAppStatus = {
    available: boolean;
    verified: boolean;
    number: string | null;
    pendingNumber: string | null;
    priceAlerts: boolean;
    dailyWrap: boolean;
};

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
    const userId = await requireUserId();
    const doc = await (await collection()).findOne({ userId });
    const pending = doc?.pending && doc.pending.expiresAt > new Date() ? doc.pending : null;
    return {
        available: whatsappConfigured(),
        verified: Boolean(doc?.verified && doc.number),
        number: doc?.verified && doc.number ? maskPhone(doc.number) : null,
        pendingNumber: pending ? maskPhone(pending.number) : null,
        priceAlerts: doc?.priceAlerts ?? true,
        dailyWrap: doc?.dailyWrap ?? true,
    };
}

// Step 1: send a 6-digit code to the number over WhatsApp
export async function startWhatsAppVerification(phone: string) {
    const userId = await requireUserId();
    if (!whatsappConfigured()) return { success: false, error: 'WhatsApp alerts aren’t available yet.' };

    const number = normalizePhone(phone);
    if (!number) return { success: false, error: 'Enter a mobile number, with the country code if it isn’t Indian (e.g. +1 415 555 0100).' };

    const alerts = await collection();
    const existing = await alerts.findOne({ userId });
    if (existing?.pending && Date.now() - existing.pending.sentAt.getTime() < RESEND_AFTER_MS) {
        return { success: false, error: 'A code was just sent. Wait a minute before asking for another.' };
    }
    const today = new Date().toISOString().slice(0, 10);
    const sentToday = existing?.codeSends?.day === today ? existing.codeSends.count : 0;
    if (sentToday >= MAX_CODES_PER_DAY) {
        return { success: false, error: 'That’s the most codes for today. Try again tomorrow.' };
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    try {
        await sendWhatsAppCode(number, code);
    } catch (error) {
        console.error('WhatsApp code send failed', error);
        return { success: false, error: 'Couldn’t send a WhatsApp message to that number. Check it’s on WhatsApp and try again.' };
    }

    const now = new Date();
    await alerts.updateOne(
        { userId },
        {
            $set: {
                userId,
                pending: { number, codeHash: hashCode(userId, code), expiresAt: new Date(now.getTime() + CODE_TTL_MS), attempts: 0, sentAt: now },
                codeSends: { day: today, count: sentToday + 1 },
            },
        },
        { upsert: true },
    );
    return { success: true, sentTo: maskPhone(number) };
}

// Step 2: check the code; on success the number is verified and alerts are on
export async function confirmWhatsAppCode(input: string) {
    const userId = await requireUserId();
    const code = input.replace(/\D/g, '');
    if (code.length !== 6) return { success: false, error: 'Enter the 6-digit code from WhatsApp.' };

    const alerts = await collection();
    const doc = await alerts.findOne({ userId });
    const pending = doc?.pending;
    if (!pending || pending.expiresAt < new Date()) return { success: false, error: 'That code has expired. Send a new one.' };
    if (pending.attempts >= MAX_ATTEMPTS) return { success: false, error: 'Too many wrong codes. Send a new one.' };

    const expected = Buffer.from(pending.codeHash);
    const given = Buffer.from(hashCode(userId, code));
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
        await alerts.updateOne({ userId }, { $inc: { 'pending.attempts': 1 } });
        return { success: false, error: 'That code isn’t right.' };
    }

    await alerts.updateOne(
        { userId },
        {
            $set: { number: pending.number, verified: true, verifiedAt: new Date(), priceAlerts: doc?.priceAlerts ?? true, dailyWrap: doc?.dailyWrap ?? true },
            $unset: { pending: '' },
        },
    );
    revalidatePath('/profile');
    return { success: true };
}

export async function setWhatsAppPreferences(prefs: { priceAlerts: boolean; dailyWrap: boolean }) {
    const userId = await requireUserId();
    await (await collection()).updateOne(
        { userId, verified: true },
        { $set: { priceAlerts: Boolean(prefs.priceAlerts), dailyWrap: Boolean(prefs.dailyWrap) } },
    );
    revalidatePath('/profile');
    return { success: true };
}

// Turns off all WhatsApp alerts and forgets the number
export async function disconnectWhatsApp() {
    const userId = await requireUserId();
    await (await collection()).deleteOne({ userId });
    revalidatePath('/profile');
    return { success: true };
}
