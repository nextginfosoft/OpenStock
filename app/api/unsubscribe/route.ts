import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { APP_NAME, SITE_URL } from "@/lib/constants";
import { verifyDigestToken } from "@/lib/digest-unsubscribe";
import { escapeHtml } from "@/lib/utils";

// GET shows a confirm button instead of unsubscribing: mail scanners open every link in an email.
// POST does the work, for that button and for Gmail's one-click List-Unsubscribe.

const page = (title: string, body: string, status = 200) =>
    new Response(
        `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | ${APP_NAME}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0c0b;color:#f4f2ee;font-family:system-ui,sans-serif}
main{max-width:420px;padding:32px;text-align:center}h1{font-size:24px;margin:0 0 12px}p{color:#b9b6ae;line-height:1.6;margin:0 0 24px}
button,a.btn{display:inline-block;background:#5fd9c4;color:#0b0c0b;border:0;border-radius:10px;padding:12px 20px;font-weight:700;font-size:15px;cursor:pointer;text-decoration:none}
a{color:#5fd9c4}</style></head><body><main>${body}</main></body></html>`,
        { status, headers: { 'content-type': 'text/html; charset=utf-8' } },
    );

const invalid = () => page('Link not valid', `<h1>This link isn't valid</h1><p>It may be incomplete. Use the unsubscribe link from your latest email, or <a href="${SITE_URL}/help">contact us</a>.</p>`, 400);

export async function GET(req: NextRequest) {
    const u = req.nextUrl.searchParams.get('u') ?? '';
    const t = req.nextUrl.searchParams.get('t') ?? '';
    if (!verifyDigestToken(u, t)) return invalid();

    return page('Unsubscribe', `<h1>Stop the weekly digest?</h1>
<p>You won't get the Monday market summary any more. Your account and watchlist stay as they are.</p>
<form method="post" action="/api/unsubscribe?u=${encodeURIComponent(u)}&amp;t=${encodeURIComponent(t)}"><button type="submit">Unsubscribe</button></form>`);
}

export async function POST(req: NextRequest) {
    const u = req.nextUrl.searchParams.get('u') ?? '';
    const t = req.nextUrl.searchParams.get('t') ?? '';
    if (!verifyDigestToken(u, t)) return invalid();

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return page('Try again', '<h1>Something went wrong</h1><p>Please try again in a minute.</p>', 500);

    const byId = ObjectId.isValid(u) ? { _id: new ObjectId(u) } : { id: u };
    await db.collection('user').updateOne(byId, { $set: { weeklyDigest: false } });

    return page('Unsubscribed', `<h1>You're unsubscribed</h1>
<p>You won't receive the weekly digest any more.</p><a class="btn" href="${escapeHtml(SITE_URL)}/">Back to ${APP_NAME}</a>`);
}
