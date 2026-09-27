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
