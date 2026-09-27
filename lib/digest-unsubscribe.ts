import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/constants";

// Unsubscribe links for the weekly digest are signed with the auth secret, so a link only works
// for the account it was sent to and IDs can't be guessed or swapped.
const sign = (userId: string) => {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) throw new Error('BETTER_AUTH_SECRET is not set');
    return createHmac('sha256', secret).update(`weekly-digest:${userId}`).digest('base64url');
};

export const digestUnsubscribeUrl = (userId: string) =>
    `${SITE_URL}/api/unsubscribe?u=${encodeURIComponent(userId)}&t=${sign(userId)}`;

export const verifyDigestToken = (userId: string, token: string) => {
    if (!userId || !token) return false;
    const expected = Buffer.from(sign(userId));
    const given = Buffer.from(token);
    return expected.length === given.length && timingSafeEqual(expected, given);
};
