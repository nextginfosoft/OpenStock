import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
    process.env.BETTER_AUTH_SECRET = 'test-secret-for-unsubscribe-links';
});

describe('weekly digest unsubscribe links', async () => {
    const { digestUnsubscribeUrl, verifyDigestToken } = await import('@/lib/digest-unsubscribe');
    const tokenOf = (userId: string) => new URL(digestUnsubscribeUrl(userId)).searchParams.get('t') ?? '';

    it('builds a link to the unsubscribe endpoint for that user', () => {
        const url = new URL(digestUnsubscribeUrl('user-123'));
        expect(url.pathname).toBe('/api/unsubscribe');
        expect(url.searchParams.get('u')).toBe('user-123');
    });

    it('accepts the token issued for the same user', () => {
        expect(verifyDigestToken('user-123', tokenOf('user-123'))).toBe(true);
    });

    it("rejects another user's token, so IDs can't be swapped", () => {
        expect(verifyDigestToken('user-456', tokenOf('user-123'))).toBe(false);
    });

    it('rejects missing or tampered tokens', () => {
        expect(verifyDigestToken('user-123', '')).toBe(false);
        expect(verifyDigestToken('', tokenOf('user-123'))).toBe(false);
        expect(verifyDigestToken('user-123', tokenOf('user-123').slice(1) + 'A')).toBe(false);
        expect(verifyDigestToken('user-123', 'short')).toBe(false);
    });
});
