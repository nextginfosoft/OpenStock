'use client';

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    confirmWhatsAppCode,
    disconnectWhatsApp,
    setWhatsAppPreferences,
    startWhatsAppVerification,
    type WhatsAppStatus,
} from "@/lib/actions/whatsapp.actions";

// Connect a WhatsApp number (verified with a code sent on WhatsApp), then choose which alerts to get.
// This page is the only way to turn WhatsApp alerts off: replies in the chat don't reach StockLens.
export default function WhatsAppAlerts({ initial }: { initial: WhatsAppStatus }) {
    const [status, setStatus] = useState(initial);
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [pending, startTransition] = useTransition();

    if (!status.available) {
        return <p className="p-4 text-[14px] text-muted-foreground">WhatsApp alerts are coming soon.</p>;
    }

    const sendCode = () => startTransition(async () => {
        const result = await startWhatsAppVerification(phone);
        if (!result.success) return void toast.error('Code not sent', { description: result.error });
        toast.success('Code sent on WhatsApp', { description: `Check WhatsApp on ${result.sentTo}.` });
        setStatus((s) => ({ ...s, pendingNumber: result.sentTo ?? null }));
    });

    const verify = () => startTransition(async () => {
        const result = await confirmWhatsAppCode(code);
        if (!result.success) return void toast.error('Not verified', { description: result.error });
        toast.success('WhatsApp connected', { description: 'You’ll get alerts on WhatsApp from now on.' });
        setStatus((s) => ({ ...s, verified: true, number: s.pendingNumber, pendingNumber: null, priceAlerts: true, dailyWrap: true, weeklyDigest: true }));
        setCode('');
    });

    const toggle = (key: 'priceAlerts' | 'dailyWrap' | 'weeklyDigest', value: boolean) => startTransition(async () => {
        const next = { priceAlerts: status.priceAlerts, dailyWrap: status.dailyWrap, weeklyDigest: status.weeklyDigest, [key]: value };
        setStatus((s) => ({ ...s, ...next }));
        const result = await setWhatsAppPreferences(next);
        if (!result.success) {
            toast.error('Not saved');
            setStatus((s) => ({ ...s, [key]: !value }));
        }
    });

    const disconnect = () => startTransition(async () => {
        await disconnectWhatsApp();
        toast.success('WhatsApp removed', { description: 'You won’t get any more WhatsApp alerts.' });
        setStatus((s) => ({ ...s, verified: false, number: null, pendingNumber: null }));
    });

    if (status.verified) {
        return (
            <div className="flex flex-col gap-4 p-4">
                <p className="text-[14px]">Connected: <span className="num font-semibold">{status.number}</span></p>
                <label className="flex items-start gap-3 text-[14px]">
                    <input type="checkbox" className="mt-1 size-4 accent-[var(--brand)]" checked={status.priceAlerts} disabled={pending}
                        onChange={(e) => toggle('priceAlerts', e.target.checked)} />
                    <span><b>Price alerts</b><br /><span className="text-muted-foreground">When a stock crosses a target you set on your watchlist.</span></span>
                </label>
                <label className="flex items-start gap-3 text-[14px]">
                    <input type="checkbox" className="mt-1 size-4 accent-[var(--brand)]" checked={status.dailyWrap} disabled={pending}
                        onChange={(e) => toggle('dailyWrap', e.target.checked)} />
                    <span><b>Morning wrap-up</b><br /><span className="text-muted-foreground">Weekdays at 8:30 IST: how your watchlist’s US stocks and crypto moved.</span></span>
                </label>
                <label className="flex items-start gap-3 text-[14px]">
                    <input type="checkbox" className="mt-1 size-4 accent-[var(--brand)]" checked={status.weeklyDigest} disabled={pending}
                        onChange={(e) => toggle('weeklyDigest', e.target.checked)} />
                    <span><b>Weekly digest</b><br /><span className="text-muted-foreground">Mondays at 9:00 IST: the week’s top news for your watchlist.</span></span>
                </label>
                <button type="button" onClick={disconnect} disabled={pending} className="btn btn-ghost self-start">Remove number</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            {status.pendingNumber ? (
                <>
                    <p className="text-[14px] text-muted-foreground">We sent a 6-digit code to <span className="num font-semibold text-foreground">{status.pendingNumber}</span> on WhatsApp.</p>
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp-code" className="form-label">Code</Label>
                        <Input id="whatsapp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456"
                            className="form-input num" value={code} onChange={(e) => setCode(e.target.value)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={verify} disabled={pending || code.length < 6} className="btn btn-primary">{pending ? 'Checking' : 'Verify'}</button>
                        <button type="button" onClick={() => setStatus((s) => ({ ...s, pendingNumber: null }))} disabled={pending} className="btn btn-ghost">Use another number</button>
                    </div>
                </>
            ) : (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp-phone" className="form-label">WhatsApp number</Label>
                        <Input id="whatsapp-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210 or +1 415 555 0100"
                            className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-faint">
                        By connecting, you agree to receive StockLens alerts on WhatsApp. Turn them off here at any time.
                        Alerts are information, not investment advice.
                    </p>
                    <button type="button" onClick={sendCode} disabled={pending || phone.trim().length < 8} className="btn btn-primary self-start">
                        {pending ? 'Sending' : 'Send code on WhatsApp'}
                    </button>
                </>
            )}
        </div>
    );
}
