// Server-only helpers for background jobs. Deliberately NOT a 'use server' module: these read
// every user's email and watchlist, so they must never be callable from a browser.

import {connectToDatabase} from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";

export const getAllUsersForNewsEmail = async () => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if(!db) throw new Error('Mongoose connection not connected');

        // weeklyDigest is only ever set to false (by the unsubscribe link); a missing field means subscribed
        const users = await db.collection('user').find(
            { email: { $exists: true, $ne: null }, weeklyDigest: { $ne: false } },
            { projection: { _id: 1, id: 1, email: 1, name: 1, country:1 }}
        ).toArray();

        return users.filter((user) => user.email && user.name).map((user) => ({
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name
        }))
    } catch (e) {
        console.error('Error fetching users for news email:', e)
        return []
    }
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    return (await getWatchlistByEmail(email)).map((item) => item.symbol);
}

export async function getWatchlistByEmail(email: string): Promise<{ symbol: string; company: string }[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        // Better Auth stores users in the "user" collection
        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        const items = await Watchlist.find({ userId }, { symbol: 1, company: 1 }).lean();
        return items.map((i) => ({ symbol: String(i.symbol), company: String(i.company ?? '') }));
    } catch (err) {
        console.error('getWatchlistByEmail error:', err);
        return [];
    }
}
