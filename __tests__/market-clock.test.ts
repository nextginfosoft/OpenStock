import { describe, expect, it } from 'vitest';
import { clockForMarket, formatSpan, marketForTimeZone, sessionOf } from '@/lib/market-session';

const at = (h: number, m = 0) => h * 60 + m;

describe('NYSE session', () => {
    it('knows each weekday phase', () => {
        expect(sessionOf(2, at(3)).phase).toBe('closed');
        expect(sessionOf(2, at(4)).phase).toBe('pre');
        expect(sessionOf(2, at(9, 30)).phase).toBe('open');
        expect(sessionOf(2, at(15, 59)).phase).toBe('open');
        expect(sessionOf(2, at(16)).phase).toBe('after');
        expect(sessionOf(2, at(20)).phase).toBe('closed');
    });

    it('counts down to the right open', () => {
        expect(sessionOf(2, at(9)).line).toBe('Pre-market · opens in 30m');
        expect(sessionOf(2, at(14)).line).toBe('Market open · closes in 2h 00m');
        // Friday night and Saturday wait for Monday 9:30
        expect(sessionOf(5, at(21)).line).toBe('Market closed · opens in 2d 12h');
        expect(sessionOf(6, at(12)).line).toBe('Market closed · opens in 1d 21h');
    });

    it('follows the Indian trading day in Mumbai time', () => {
        const india = clockForMarket('in');
        expect(india.city).toBe('Mumbai');
        expect(sessionOf(2, at(8, 30), india).line).toBe('Market closed · opens in 45m');
        expect(sessionOf(2, at(9, 5), india).line).toBe('Pre-open · opens in 10m');
        expect(sessionOf(2, at(13, 18), india).line).toBe('Market open · closes in 2h 12m');
        expect(sessionOf(2, at(15, 45), india).line).toBe('Post-close · ends in 15m');
        // Between the close and the post-close session, and on Saturday, it waits for the next open
        expect(sessionOf(2, at(15, 35), india).phase).toBe('closed');
        expect(sessionOf(6, at(12), india).line).toBe('Market closed · opens in 1d 21h');
    });

    it('picks the market from the visitor time zone', () => {
        expect(marketForTimeZone('Asia/Kolkata')).toBe('in');
        expect(marketForTimeZone('Asia/Calcutta')).toBe('in');
        expect(marketForTimeZone('Australia/Sydney')).toBe('au');
        expect(marketForTimeZone('America/Toronto')).toBe('ca');
        expect(marketForTimeZone('America/Chicago')).toBe('us');
        expect(marketForTimeZone(undefined)).toBe('us');
        // Crypto and forex have no trading day, so the dial falls back to New York
        expect(clockForMarket('crypto').city).toBe('New York');
    });

    it('formats spans', () => {
        expect(formatSpan(45)).toBe('45m');
        expect(formatSpan(125)).toBe('2h 05m');
    });
});

import { getMarket, hasFinnhubQuotes, isMarketOpen } from '@/lib/markets';

describe('markets', () => {
    it('knows which symbols Finnhub free can price', () => {
        expect(hasFinnhubQuotes('AAPL')).toBe(true);
        expect(hasFinnhubQuotes('BRK.B')).toBe(true);
        expect(hasFinnhubQuotes('BINANCE:BTCUSDT')).toBe(true);
        expect(hasFinnhubQuotes('RELIANCE.NS')).toBe(false);
        expect(hasFinnhubQuotes('BARC.L')).toBe(false);
        expect(hasFinnhubQuotes('7203.T')).toBe(false);
        expect(hasFinnhubQuotes('FX:EURUSD')).toBe(false);
    });

    it('opens each market in its own time zone', () => {
        // Wed 2026-09-23 10:00 in Mumbai = 04:30 UTC
        expect(isMarketOpen(getMarket('in'), new Date('2026-09-23T04:30:00Z'))).toBe(true);
        expect(isMarketOpen(getMarket('us'), new Date('2026-09-23T04:30:00Z'))).toBe(false);
        // Saturday: stocks and FX closed, crypto open
        expect(isMarketOpen(getMarket('de'), new Date('2026-09-26T10:00:00Z'))).toBe(false);
        expect(isMarketOpen(getMarket('fx'), new Date('2026-09-26T10:00:00Z'))).toBe(false);
        expect(isMarketOpen(getMarket('crypto'), new Date('2026-09-26T10:00:00Z'))).toBe(true);
        // FX reopens Sunday 17:00 New York (21:00 UTC in September)
        expect(isMarketOpen(getMarket('fx'), new Date('2026-09-27T21:30:00Z'))).toBe(true);
    });
});
