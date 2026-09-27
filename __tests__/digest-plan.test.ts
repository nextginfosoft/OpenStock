import { describe, expect, it, vi } from 'vitest';

// planDigest is pure; stub the modules functions.ts pulls in so importing it needs no DB, mail or Inngest
vi.mock('@/lib/inngest/client', () => ({ inngest: { createFunction: () => ({}) } }));
vi.mock('@/lib/nodemailer', () => ({}));
vi.mock('@/lib/actions/user.actions', () => ({}));
vi.mock('@/lib/actions/finnhub.actions', () => ({}));

const { planDigest } = await import('@/lib/inngest/functions');

const user = { id: 'u1', email: 'a@example.com', name: 'A' };
const w = (symbol: string, company = symbol) => ({ symbol, company });

describe('weekly digest planning', () => {
    it('splits a watchlist into US (Finnhub) and Indian (Google News) stocks', () => {
        const plan = planDigest(user, [w('NVDA'), w('RELIANCE.NS', 'Reliance Industries Ltd'), w('BINANCE:BTCUSDT')]);
        expect(plan.source).toBe('watchlist');
        expect(plan.usSymbols).toEqual(['NVDA']);
        expect(plan.indianStocks).toEqual([w('RELIANCE.NS', 'Reliance Industries Ltd')]);
    });

    it('uses well-known companies for an empty watchlist', () => {
        const plan = planDigest(user, []);
        expect(plan.source).toBe('defaults-empty');
        expect(plan.usSymbols).toEqual(['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL']);
    });

    it('uses well-known companies when no stock has a news source', () => {
        const plan = planDigest(user, [w('BINANCE:BTCUSDT'), w('BARC.L')]);
        expect(plan.source).toBe('defaults-unsupported');
        expect(plan.usSymbols).toEqual(['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL']);
    });

    it('gives users with the same stocks the same key, whatever the order, so they share one summary', () => {
        const a = planDigest(user, [w('NVDA'), w('TCS.NS')]);
        const b = planDigest({ ...user, id: 'u2' }, [w('TCS.NS'), w('NVDA')]);
        expect(a.key).toBe(b.key);
        expect(planDigest(user, []).key).toBe(planDigest({ ...user, id: 'u3' }, []).key);
        expect(a.key).not.toBe(planDigest(user, [w('NVDA')]).key);
    });
});
