#!/usr/bin/env node
/**
 * Checks a MongoDB connection string for the mistakes that cause "bad auth"
 * (placeholders, brackets, spaces, unencoded characters) without ever printing
 * the password. Paste the exact value you put in MONGODB_URI when asked.
 *
 * Usage: node scripts/check-mongo-uri.mjs
 */
import readline from 'node:readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the MONGODB_URI value, then press Enter:\n', (raw) => {
    rl.close();
    const problems = [];
    const uri = raw;

    if (uri !== uri.trim()) problems.push('It starts or ends with spaces. Remove them.');
    if (/\s/.test(uri.trim())) problems.push('It contains a space or line break in the middle.');
    if (/^["'].*["']$/.test(uri.trim())) problems.push('It is wrapped in quotes. Paste it without quotes.');

    const m = uri.trim().replace(/^["']|["']$/g, '').match(/^mongodb\+srv:\/\/([^:@/]+):(.*)@([^/@?]+)\/([^?]*)(\?.*)?$/);
    if (!m) {
        problems.push('It does not have the shape mongodb+srv://USER:PASSWORD@HOST/DATABASE?options');
    } else {
        const [, user, password, host, db] = m;
        if (user !== 'stocklens_app') problems.push(`The username is "${user}", expected "stocklens_app".`);
        if (host !== 'stocklens.rgouvqu.mongodb.net') problems.push(`The host is "${host}", expected "stocklens.rgouvqu.mongodb.net".`);
        if (db !== 'stocklens') problems.push(`The database name is "${db || '(empty)'}", expected "stocklens" before the "?".`);
        if (!password) problems.push('The password is empty.');
        if (/[<>]/.test(password)) problems.push('The password still has < or > around it. Remove the brackets.');
        if (/db_password|PASTE_PASSWORD_HERE|YOUR_PASSWORD/i.test(password)) problems.push('The password is still the placeholder text, not your real password.');
        if (/[@:/?#[\]]/.test(password)) problems.push('The password contains @ : / ? # [ or ], which must be URL-encoded. Easier: autogenerate a new letters-and-numbers password in Atlas.');
        if (/%(?![0-9A-Fa-f]{2})/.test(password)) problems.push('The password contains a % that is not a valid URL escape.');
        console.log(`\nPassword length: ${password.length} characters (not shown).`);
    }

    if (problems.length === 0) {
        console.log('Format looks correct. If login still fails, the password differs from the one saved in Atlas: set the same password in both places again.');
    } else {
        console.log('\nProblems found:');
        for (const p of problems) console.log(` - ${p}`);
    }
});
