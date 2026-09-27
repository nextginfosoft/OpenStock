// WhatsApp Cloud API client for StockLens alerts. Server-only: uses the access token.
//
// StockLens shares a WhatsApp number with another NextG project, whose webhook receives all
// replies. StockLens therefore only SENDS here (sending needs no webhook), and people manage
// or turn off their alerts on their StockLens profile, which every message links to.
//
// Every message is a pre-approved template (WhatsApp requires templates for messages a business
// starts). Names can be overridden in env if the approved templates are named differently.

import { createHmac } from "node:crypto";
import { SITE_URL } from "@/lib/constants";
import { priceAlertParams } from "@/lib/whatsapp-format";

const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';

export const WHATSAPP_TEMPLATES = {
    // Authentication category, with a "Copy code" button
    verifyCode: process.env.WHATSAPP_TEMPLATE_VERIFY || 'stocklens_verify_code',
    // Utility: {{1}} symbol, {{2}} price, {{3}} above/below, {{4}} target
    priceAlert: process.env.WHATSAPP_TEMPLATE_PRICE_ALERT || 'stocklens_price_alert',
    // Utility: {{1}} date, {{2}} one-line list of watchlist moves
    dailyWrap: process.env.WHATSAPP_TEMPLATE_DAILY_WRAP || 'stocklens_daily_wrap',
};
const TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';

export const whatsappConfigured = () => Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

export const PROFILE_URL = `${SITE_URL}/profile`;

type TemplateComponent = { type: 'body' | 'button'; sub_type?: 'url'; index?: string; parameters: { type: 'text'; text: string }[] };

async function sendTemplate(to: string, name: string, components: TemplateComponent[]) {
    if (!whatsappConfigured()) return { status: 'skipped' as const };
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            // The "+" matters: without it Meta prepends the business number's country code (91),
            // turning 919876543210 into +91 919876543210 and silently not delivering
            to: `+${to}`,
            type: 'template',
            template: { name, language: { code: TEMPLATE_LANGUAGE }, components },
        }),
        signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
        // Meta's error message says what's wrong (template not approved, number not on WhatsApp, ...)
        const detail = await res.json().then((d: { error?: { message?: string } }) => d?.error?.message).catch(() => undefined);
        throw new Error(`WhatsApp send failed: ${res.status}${detail ? ` - ${detail.slice(0, 200)}` : ''}`);
    }
    return { status: 'sent' as const };
}

const body = (...texts: string[]): TemplateComponent => ({ type: 'body', parameters: texts.map((text) => ({ type: 'text', text })) });

export function sendWhatsAppCode(to: string, code: string) {
    // Authentication templates take the code in the body and again for the copy-code button
    return sendTemplate(to, WHATSAPP_TEMPLATES.verifyCode, [
        body(code),
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
    ]);
}

export function sendWhatsAppPriceAlert(to: string, alert: Parameters<typeof priceAlertParams>[0]) {
    return sendTemplate(to, WHATSAPP_TEMPLATES.priceAlert, [body(...priceAlertParams(alert))]);
}

export function sendWhatsAppDailyWrap(to: string, date: string, line: string) {
    return sendTemplate(to, WHATSAPP_TEMPLATES.dailyWrap, [body(date, line)]);
}

// Codes are stored as a keyed hash, so a database leak doesn't reveal pending codes
export const hashCode = (userId: string, code: string) => {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) throw new Error('BETTER_AUTH_SECRET is not set');
    return createHmac('sha256', secret).update(`whatsapp-code:${userId}:${code}`).digest('hex');
};
