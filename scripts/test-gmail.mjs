#!/usr/bin/env node
/**
 * Checks the Gmail sender settings (NODEMAILER_EMAIL / NODEMAILER_PASSWORD) the same way the app
 * uses them, then sends one test email to the sender itself. The password is typed hidden and never
 * printed or saved.
 *
 * Usage: node scripts/test-gmail.mjs
 */
import readline from 'node:readline';
import nodemailer from 'nodemailer';

// One reader for both questions, so piped input isn't swallowed by the first prompt
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let hiding = false;
const write = rl._writeToOutput.bind(rl);
// Echo nothing but the prompt while the password is typed
rl._writeToOutput = (s) => { if (!hiding || s.includes('App Password')) write(s); };

const lines = rl[Symbol.asyncIterator]();
const ask = async (question, { hidden = false } = {}) => {
    process.stdout.write(question);
    hiding = hidden;
    const { value = '' } = await lines.next();
    hiding = false;
    if (hidden || !process.stdin.isTTY) process.stdout.write('\n');
    return value;
};

const email = (await ask('Gmail address (NODEMAILER_EMAIL): ')).trim();
const raw = await ask('App Password (NODEMAILER_PASSWORD, hidden): ', { hidden: true });
rl.close();
const password = raw.replace(/\s+/g, '');

if (raw !== password) console.log('Note: the password you typed contained spaces. The app needs it WITHOUT spaces in hPanel.');
if (password.length !== 16) console.log(`Note: Gmail App Passwords are 16 letters; this one is ${password.length} characters.`);

const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: email, pass: password } });

try {
    await transporter.verify();
    console.log('Gmail accepted the login.');
} catch (error) {
    console.log(`Gmail rejected the login: ${error.message}`);
    if (/535|BadCredentials|Username and Password not accepted/i.test(error.message)) {
        console.log('This means the App Password (or address) is wrong. Create a new App Password and use it in hPanel without spaces.');
    }
    process.exit(1);
}

const info = await transporter.sendMail({
    from: `"StockLens" <${email}>`,
    to: email,
    subject: 'StockLens email test',
    text: 'If you can read this, StockLens can send email with these settings.',
});
console.log(`Test email sent to ${email} (id ${info.messageId}). Check the inbox and spam folder.`);
