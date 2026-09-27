import { describe, expect, it } from 'vitest';
import { isIndianSymbol, mentionsCompany, parseGoogleNewsRss } from '@/lib/google-news';

const item = ({ title, link, pubDate, source }: { title: string; link: string; pubDate: string; source: string }) =>
    `<item><title>${title}</title><link>${link}</link><guid isPermaLink="false">x</guid><pubDate>${pubDate}</pubDate>` +
    `<description>&lt;a href="${link}"&gt;${title}&lt;/a&gt;</description><source url="https://example.com">${source}</source></item>`;

const feed = (...items: string[]) => `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>x</title>${items.join('')}</channel></rss>`;

describe('Indian stock news from Google News RSS', () => {
    it('recognises NSE/BSE symbols in both formats', () => {
        expect(isIndianSymbol('RELIANCE.NS')).toBe(true);
        expect(isIndianSymbol('TCS.BO')).toBe(true);
        expect(isIndianSymbol('NSE:INFY')).toBe(true);
        expect(isIndianSymbol('BSE:HDFCBANK')).toBe(true);
        expect(isIndianSymbol('AAPL')).toBe(false);
        expect(isIndianSymbol('BINANCE:BTCUSDT')).toBe(false);
        expect(isIndianSymbol('BARC.L')).toBe(false);
    });

    it('parses items, splits off the publisher and decodes entities', () => {
        const [article] = parseGoogleNewsRss(feed(item({
            title: 'Reliance Q2 profit rises 12%; Jio &amp; retail lead - Business Standard',
            link: 'https://news.google.com/rss/articles/abc?oc=5',
            pubDate: 'Thu, 24 Sep 2026 07:45:45 GMT',
            source: 'Business Standard',
        })), 'RELIANCE.NS');

        expect(article.headline).toBe('Reliance Q2 profit rises 12%; Jio & retail lead');
        expect(article.source).toBe('Business Standard');
        expect(article.url).toBe('https://news.google.com/rss/articles/abc?oc=5');
        expect(article.datetime).toBe(Date.UTC(2026, 8, 24, 7, 45, 45) / 1000);
        expect(article.related).toBe('RELIANCE.NS');
    });

    it('drops live price pages and items without a usable link or date', () => {
        const articles = parseGoogleNewsRss(feed(
            item({ title: 'Reliance Industries Share Price - Live NSE: RELIANCE Stock Price &amp; Chart - Upstox', link: 'https://x.com/a', pubDate: 'Sat, 26 Sep 2026 01:21:30 GMT', source: 'Upstox' }),
            item({ title: 'Real news - Mint', link: 'javascript:alert(1)', pubDate: 'Sat, 26 Sep 2026 01:21:30 GMT', source: 'Mint' }),
            item({ title: 'Undated story - Mint', link: 'https://x.com/b', pubDate: 'not a date', source: 'Mint' }),
            item({ title: 'Reliance to invest in green energy - Mint', link: 'https://x.com/c', pubDate: 'Sat, 26 Sep 2026 01:21:30 GMT', source: 'Mint' }),
        ), 'RELIANCE.NS');

        expect(articles.map((a) => a.headline)).toEqual(['Reliance to invest in green energy']);
    });

    it('drops daily prediction SEO pages', () => {
        const articles = parseGoogleNewsRss(feed(
            item({ title: 'Reliance Industries Prediction for Tomorrow: 28 Sept 2026 - Univest', link: 'https://x.com/p', pubDate: 'Sun, 27 Sep 2026 01:00:00 GMT', source: 'Univest' }),
        ), 'RELIANCE.NS');
        expect(articles).toEqual([]);
    });

    it('keeps only headlines that name the company', () => {
        expect(mentionsCompany('Zee seeks action against Reliance-Disney JioStar', 'Reliance Industries Ltd', 'RELIANCE.NS')).toBe(true);
        expect(mentionsCompany('Reliance Industries rallies Friday', 'Reliance Industries Ltd', 'RELIANCE.NS')).toBe(true);
        expect(mentionsCompany('TCS launches lights-out factory lab in Pune', 'Tata Consultancy Services Limited', 'TCS.NS')).toBe(true);
        expect(mentionsCompany('HDFC Bank shares hit 52-week low', 'HDFC Bank Ltd', 'BSE:HDFCBANK')).toBe(true);
        // Mentioned only in the article body, or a generic first word
        expect(mentionsCompany('Microsoft shares jump 4% after Copilot overhaul', 'Reliance Industries Ltd', 'RELIANCE.NS')).toBe(false);
        expect(mentionsCompany('State pension rules change', 'State Bank of India', 'SBIN.NS')).toBe(false);
        expect(mentionsCompany('SBIN hits record high', 'State Bank of India', 'SBIN.NS')).toBe(true);
    });

    it('matches on the ticker when the watchlist stored the symbol as the company name', () => {
        expect(mentionsCompany('Cupid shares surge 10% on export order', 'CUPID.NS', 'CUPID.NS')).toBe(true);
        expect(mentionsCompany('Reliance Industries rallies Friday', 'RELIANCE.NS', 'RELIANCE.NS')).toBe(true);
        expect(mentionsCompany('Cupid-themed Valentine sales jump', 'CUPID.NS', 'CUPID.NS')).toBe(true); // ticker match is best effort
        expect(mentionsCompany('Nifty ends flat', 'CUPID.NS', 'CUPID.NS')).toBe(false);
    });
});
