// Trading sessions for the landing clock, in the exchange's local minutes-of-day.
// ponytail: exchange holidays and half-days are ignored; add a holiday list if it matters.
import { getMarket, type MarketId } from "@/lib/markets";

export const DAY = 24 * 60;

export type Phase = 'pre' | 'open' | 'after' | 'closed';

type Window = { from: number; to: number; name: string };

export type ExchangeClock = {
    market: MarketId;
    city: string;
    exchange: string;
    timeZone: string;
    open: number;
    close: number;
    pre?: Window;
    after?: Window;
};

const hm = (h: number, m = 0) => h * 60 + m;

// Regular hours and time zones come from lib/markets.ts; only the extra sessions live here.
const EXTRAS: Partial<Record<MarketId, Pick<ExchangeClock, 'city' | 'exchange' | 'pre' | 'after'>>> = {
    us: { city: 'New York', exchange: 'NYSE', pre: { from: hm(4), to: hm(9, 30), name: 'Pre-market' }, after: { from: hm(16), to: hm(20), name: 'After hours' } },
    in: { city: 'Mumbai', exchange: 'NSE · BSE', pre: { from: hm(9), to: hm(9, 15), name: 'Pre-open' }, after: { from: hm(15, 40), to: hm(16), name: 'Post-close' } },
    de: { city: 'Frankfurt', exchange: 'Xetra' },
    ca: { city: 'Toronto', exchange: 'TSX' },
    au: { city: 'Sydney', exchange: 'ASX', pre: { from: hm(7), to: hm(10), name: 'Pre-open' } },
};

function buildClock(id: MarketId): ExchangeClock | null {
    const market = getMarket(id);
    const extras = EXTRAS[id];
    if (!extras || typeof market.hours === 'string') return null; // 24/7 and 24/5 markets have no trading day to draw
    return { market: id, timeZone: market.timeZone, open: market.hours.open, close: market.hours.close, ...extras };
}

export const US_CLOCK = buildClock('us')!;

// Crypto, forex and unknown ids fall back to New York
export const clockForMarket = (id?: string | null): ExchangeClock =>
    (id ? buildClock(id as MarketId) : null) ?? US_CLOCK;

// Best guess from the visitor's time zone, for people who haven't picked a market yet
export function marketForTimeZone(timeZone?: string | null): MarketId {
    if (!timeZone) return 'us';
    if (timeZone === 'Asia/Kolkata' || timeZone === 'Asia/Calcutta') return 'in';
    if (timeZone === 'Europe/Berlin' || timeZone === 'Europe/Busingen') return 'de';
    if (/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Montreal|Moncton|Whitehorse)$/.test(timeZone)) return 'ca';
    if (timeZone.startsWith('Australia/')) return 'au';
    return 'us';
}

export function localNow(date: Date, timeZone = US_CLOCK.timeZone) {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
            .formatToParts(date).map((p) => [p.type, p.value]),
    );
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
    return { weekday, minutes: Number(parts.hour) * 60 + Number(parts.minute), time: `${parts.hour.padStart(2, '0')}:${parts.minute}` };
}

export const isWeekday = (d: number) => d >= 1 && d <= 5;

export function sessionOf(weekday: number, minutes: number, clock: ExchangeClock = US_CLOCK): { phase: Phase; line: string } {
    const { open, close, pre, after } = clock;
    const until = (target: number) => formatSpan(target - minutes);
    if (isWeekday(weekday)) {
        if (minutes >= open && minutes < close) return { phase: 'open', line: `Market open · closes in ${until(close)}` };
        if (pre && minutes >= pre.from && minutes < pre.to) return { phase: 'pre', line: `${pre.name} · opens in ${until(open)}` };
        if (after && minutes >= after.from && minutes < after.to) return { phase: 'after', line: `${after.name} · ends in ${until(after.to)}` };
        if (minutes < (pre?.from ?? open)) return { phase: 'closed', line: `Market closed · opens in ${until(open)}` };
    }
    // Next weekday open, counting whole days from today
    let days = 1;
    while (!isWeekday((weekday + days) % 7)) days++;
    return { phase: 'closed', line: `Market closed · opens in ${formatSpan(days * DAY + open - minutes)}` };
}

export function formatSpan(totalMinutes: number) {
    const d = Math.floor(totalMinutes / DAY);
    const h = Math.floor((totalMinutes % DAY) / 60);
    const m = totalMinutes % 60;
    if (d > 0) return `${d}d ${h}h`;
    return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
