// Company news for Indian stocks (NSE/BSE) from Google News RSS, which free Finnhub doesn't cover.
// Unofficial public feed: treat it as best effort and never let a failure break the caller.

const FEED_URL = 'https://news.google.com/rss/search';
const MAX_COMPANIES = 5;
const PER_COMPANY = 3;

// "RELIANCE.NS", "TCS.BO", "NSE:INFY", "BSE:HDFCBANK"
export const isIndianSymbol = (symbol: string) => /\.(NS|BO)$/i.test(symbol) || /^(NSE|BSE):/i.test(symbol);

// Quote pages and daily "prediction" SEO pages show up in search results but aren't news
const NOT_NEWS = /share price (live|today)|stock price (live|today)|price chart|live nse|live bse|stock price & chart|prediction for (tomorrow|today)|price prediction|share price target|stocks? to buy (today|tomorrow)/i;

// Words too generic to identify a company in a headline on their own
const GENERIC_WORDS = new Set(['the', 'state', 'bank', 'india', 'indian', 'national', 'united', 'new', 'general', 'first']);

const tickerOf = (symbol: string) => symbol.replace(/^(NSE|BSE):/i, '').replace(/\.(NS|BO)$/i, '');

// A story counts only if its headline names the company: search results also match articles
// that mention it once in the body
export const mentionsCompany = (headline: string, company: string, symbol: string) => {
    const text = headline.toLowerCase();
    const name = searchName(company, symbol).toLowerCase();
    const firstWord = name.split(/\s+/)[0] ?? '';
    const ticker = tickerOf(symbol).toLowerCase();
    return text.includes(name)
        || new RegExp(`\\b${ticker.replace(/[^a-z0-9]/g, '')}\\b`).test(text)
        || (firstWord.length >= 3 && !GENERIC_WORDS.has(firstWord) && new RegExp(`\\b${firstWord.replace(/[^a-z0-9]/g, '')}\\b`).test(text));
};

const decode = (text: string) =>
    text
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/&amp;/g, '&')
        .trim();

const tag = (xml: string, name: string) => {
    const match = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
    return match ? decode(match[1]) : '';
};

// Stable numeric id from the link, so the same story dedupes across companies
const idFrom = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
    return Math.abs(hash);
};

export function parseGoogleNewsRss(xml: string, symbol: string): MarketNewsArticle[] {
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    return items.flatMap((item) => {
        const source = tag(item, 'source');
        // Titles end with " - Publisher"; the publisher is kept separately
        const rawTitle = tag(item, 'title');
        const headline = source && rawTitle.endsWith(` - ${source}`) ? rawTitle.slice(0, -(source.length + 3)) : rawTitle;
        const url = tag(item, 'link');
        const datetime = Math.floor(new Date(tag(item, 'pubDate')).getTime() / 1000);
        if (!headline || !/^https?:\/\//.test(url) || !Number.isFinite(datetime) || NOT_NEWS.test(headline)) return [];
        return [{ id: idFrom(url), headline, summary: '', source, url, datetime, category: 'company', related: symbol }];
    });
}

// Search term from the company name the watchlist stored, e.g. "Reliance Industries Ltd" -> "Reliance Industries"
function searchName(company: string, symbol: string) {
    const name = company.replace(/\b(ltd|limited|pvt|private|inc|corp|corporation)\.?$/gi, '').replace(/[.,]+$/, '').trim();
    return name || tickerOf(symbol);
}

async function fetchCompanyNews({ symbol, company }: { symbol: string; company: string }) {
    const query = `"${searchName(company, symbol)}" when:7d`;
    const url = `${FEED_URL}?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockLens/1.0)' },
            signal: AbortSignal.timeout(8000),
            next: { revalidate: 1800 },
        });
        if (!res.ok) return [];
        return parseGoogleNewsRss(await res.text(), symbol).filter((a) => mentionsCompany(a.headline, company, symbol));
    } catch (error) {
        console.error(`Google News fetch failed for ${symbol}`, error);
        return [];
    }
}

// Latest stories across the given companies, a few from each, newest first
export async function getIndianStockNews(items: { symbol: string; company: string }[]): Promise<MarketNewsArticle[]> {
    const perCompany = await Promise.all(items.slice(0, MAX_COMPANIES).map(fetchCompanyNews));
    const seen = new Set<number>();
    return perCompany
        .flatMap((articles) => articles.sort((a, b) => b.datetime - a.datetime).slice(0, PER_COMPANY))
        .filter((a) => !seen.has(a.id) && seen.add(a.id))
        .sort((a, b) => b.datetime - a.datetime);
}
