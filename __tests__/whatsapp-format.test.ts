import { describe, expect, it } from 'vitest';
import { digestHeadlines, maskPhone, normalizePhone, priceAlertParams, templateText, wrapLine } from '@/lib/whatsapp-format';

describe('WhatsApp phone numbers', () => {
    it('treats a bare 10-digit mobile number as Indian', () => {
        expect(normalizePhone('98765 43210')).toBe('919876543210');
        expect(normalizePhone('098765-43210')).toBe('919876543210');
    });

    it('keeps international numbers written with a country code', () => {
        expect(normalizePhone('+91 98765 43210')).toBe('919876543210');
        expect(normalizePhone('+1 (415) 555-0100')).toBe('14155550100');
        expect(normalizePhone('0044 20 7946 0958')).toBe('442079460958');
    });

    it('rejects things that are not phone numbers', () => {
        expect(normalizePhone('')).toBeNull();
        expect(normalizePhone('12345')).toBeNull();
        expect(normalizePhone('call me maybe')).toBeNull();
        expect(normalizePhone('+1234567890123456')).toBeNull();
    });

    it('masks a number for display', () => {
        expect(maskPhone('919876543210')).toBe('+91 98765 xxx10');
        expect(maskPhone('14155550100')).toBe('+1 41555 xxx00');
    });
});

describe('WhatsApp message text', () => {
    it('strips what Meta rejects in template parameters', () => {
        expect(templateText(' a\nb\t c      d ')).toBe('a b c d');
    });

    it('builds price alert parameters for stocks and crypto', () => {
        expect(priceAlertParams({ symbol: 'NVDA', currentPrice: 231.4, targetPrice: 230, condition: 'ABOVE' }))
            .toEqual(['NVDA', '$231.40', 'above', '$230.00']);
        expect(priceAlertParams({ symbol: 'BINANCE:BTCUSDT', currentPrice: 61234.5, targetPrice: 62000, condition: 'BELOW' }))
            .toEqual(['BTC', '61,234.5 USDT', 'below', '62,000 USDT']);
    });

    it('puts the biggest movers first in the wrap-up line', () => {
        expect(wrapLine([
            { symbol: 'AAPL', price: 201.1, changePercent: -0.4 },
            { symbol: 'NVDA', price: 231.4, changePercent: 2.13 },
            { symbol: 'BINANCE:ETHUSDT', price: 3120, changePercent: -3.5 },
        ])).toBe('ETH −3.5% (3,120 USDT) · NVDA +2.1% ($231.40) · AAPL −0.4% ($201.10)');
    });

    it('caps the wrap-up at 10 stocks and says how many more there are', () => {
        const quotes = Array.from({ length: 12 }, (_, i) => ({ symbol: `S${i}`, price: 10, changePercent: i }));
        const line = wrapLine(quotes)!;
        expect(line.split(' · ')).toHaveLength(11);
        expect(line.endsWith('+2 more on your watchlist')).toBe(true);
    });

    it('has nothing to send without usable quotes', () => {
        expect(wrapLine([])).toBeNull();
        expect(wrapLine([{ symbol: 'X', price: 0, changePercent: 1 }])).toBeNull();
    });

    it('puts up to three headlines on one line for the weekly digest', () => {
        expect(digestHeadlines(['Nvidia beats\nestimates', 'Apple unveils a phone', 'Third', 'Fourth']))
            .toBe('“Nvidia beats estimates” · “Apple unveils a phone” · “Third”');
        const long = digestHeadlines(['x'.repeat(300)])!;
        expect(long.length).toBeLessThanOrEqual(112);
        expect(long.endsWith('…”')).toBe(true);
        expect(digestHeadlines([])).toBeNull();
        expect(digestHeadlines(['  ', ''])).toBeNull();
    });
});
