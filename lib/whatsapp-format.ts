// Pure helpers for WhatsApp alerts: phone numbers and message text. No I/O, safe to unit test.

// WhatsApp wants international numbers as digits only ("919876543210"). A bare 10-digit number
// starting 6-9 is taken as Indian (+91), the most common case here; anything else needs its country code.
export function normalizePhone(input: string): string | null {
    const trimmed = input.trim();
    const digits = trimmed.replace(/[\s\-().]/g, '').replace(/^\+/, '').replace(/^00/, '');
    if (!/^\d+$/.test(digits)) return null;
    if (digits.length === 10 && /^[6-9]/.test(digits) && !trimmed.startsWith('+')) return `91${digits}`;
    if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits[1])) return `91${digits.slice(1)}`;
    // E.164: country code + subscriber number, 8 to 15 digits, never starting with 0
    return digits.length >= 8 && digits.length <= 15 && !digits.startsWith('0') ? digits : null;
}

// "+91 98765 xxx10": enough to recognise your own number without showing it in full
export function maskPhone(digits: string): string {
    const national = digits.slice(-10);
    const countryCode = digits.slice(0, -10);
    return `+${countryCode ? `${countryCode} ` : ''}${national.slice(0, 5)} xxx${national.slice(-2)}`;
}

// Template parameters can't contain newlines, tabs or 4+ spaces in a row (Meta rejects the send)
export const templateText = (text: string) => text.replace(/\s+/g, ' ').trim();

const money = (symbol: string, value: number) => symbol.toUpperCase().startsWith('BINANCE:')
    ? `${value.toLocaleString('en-US', { maximumFractionDigits: value < 1 ? 6 : 2 })} USDT`
    : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const displaySymbol = (symbol: string) => symbol.replace(/^BINANCE:/i, '').replace(/USDT$/i, '');

// Parameters for the price alert template: {{1}} symbol, {{2}} price, {{3}} above/below, {{4}} target
export function priceAlertParams({ symbol, currentPrice, targetPrice, condition }: { symbol: string; currentPrice: number; targetPrice: number; condition: 'ABOVE' | 'BELOW' }) {
    return [displaySymbol(symbol), money(symbol, currentPrice), condition === 'ABOVE' ? 'above' : 'below', money(symbol, targetPrice)].map(templateText);
}

export const DIGEST_STORIES = 3;
const DIGEST_HEADLINE_CHARS = 140;

// "RELIANCE.NS", "NSE:TCS", "BINANCE:BTCUSDT" -> "RELIANCE", "TCS", "BTC"
const stockLabel = (symbol: string) => displaySymbol(symbol).replace(/^(NSE|BSE):/i, '').replace(/\.(NS|BO)$/i, '').toUpperCase();

// Cut at a word boundary, never mid-word
function shorten(text: string, max: number) {
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–-]+$/, '')}…`;
}

// The weekly digest on WhatsApp: one line per story, "NVDA: Nvidia beats estimates (Reuters)".
// Stories are newest first; each stock gets one before any stock gets a second. Always returns
// DIGEST_STORIES lines (the template has that many slots), or null when there are no stories.
export function digestStories(articles: { headline: string; related?: string; source?: string }[]): string[] | null {
    const usable = articles.filter((a) => templateText(a.headline ?? ''));
    const firstPerStock = usable.filter((a, i) => usable.findIndex((b) => (b.related ?? '') === (a.related ?? '')) === i);
    const picked = [...firstPerStock, ...usable.filter((a) => !firstPerStock.includes(a))].slice(0, DIGEST_STORIES);
    if (picked.length === 0) return null;

    const lines = picked.map((a) => {
        const label = a.related ? `${stockLabel(a.related)}: ` : '';
        const source = a.source ? ` (${templateText(a.source)})` : '';
        return templateText(`${label}${shorten(templateText(a.headline), DIGEST_HEADLINE_CHARS)}${source}`);
    });
    while (lines.length < DIGEST_STORIES) lines.push('More stories are on your StockLens watchlist');
    return lines;
}

// "21–27 Sep": the seven days a Monday digest covers, ending on the given day
export function digestWeek(end: Date, timeZone = 'Asia/Kolkata'): string {
    const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    const day = (d: Date) => new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric' }).format(d);
    const month = (d: Date) => new Intl.DateTimeFormat('en-US', { timeZone, month: 'short' }).format(d);
    return month(start) === month(end)
        ? `${day(start)}–${day(end)} ${month(end)}`
        : `${day(start)} ${month(start)} – ${day(end)} ${month(end)}`;
}

const WRAP_MAX_STOCKS = 10;

// One line for the daily wrap-up: biggest movers first, e.g. "NVDA +2.1% ($231.40) · AAPL −0.4% ($201.10)"
export function wrapLine(quotes: { symbol: string; price: number; changePercent: number }[]): string | null {
    const lines = [...quotes]
        .filter((q) => Number.isFinite(q.price) && q.price > 0 && Number.isFinite(q.changePercent))
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, WRAP_MAX_STOCKS)
        .map((q) => `${displaySymbol(q.symbol)} ${q.changePercent >= 0 ? '+' : '−'}${Math.abs(q.changePercent).toFixed(1)}% (${money(q.symbol, q.price)})`);
    const extra = quotes.length - lines.length;
    if (lines.length === 0) return null;
    return templateText(lines.join(' · ') + (extra > 0 ? ` · +${extra} more on your watchlist` : ''));
}
