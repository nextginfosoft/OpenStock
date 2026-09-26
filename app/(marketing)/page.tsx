import Link from "next/link";
import { CandlestickChart, Command, Grid3x3, MailOpen, MessagesSquare, Star } from "lucide-react";
import { MarketDial, MarketStatus } from "@/components/landing/MarketClock";
import ProductPreview from "@/components/landing/ProductPreview";
import SectionHead from "@/components/marketing/SectionHead";
import IconCard from "@/components/marketing/IconCard";
import { getSession } from "@/lib/better-auth/auth";
import { APP_NAME, UPSTREAM_AUTHOR, UPSTREAM_NAME, UPSTREAM_REPO_URL } from "@/lib/constants";

const FEATURES = [
    { icon: CandlestickChart, title: 'Charts that move', body: 'TradingView candles, technicals and financials for any listed company, full screen when you need room.' },
    { icon: Star, title: 'Your watchlist', body: 'Star the stocks you follow and keep them one click away in the sidebar.' },
    { icon: MessagesSquare, title: 'Sentiment in one read', body: 'Buzz and bullishness from Reddit, X.com, news and Polymarket, side by side for each stock.' },
    { icon: Grid3x3, title: 'The whole market', body: 'Sector heatmap, movers and top stories on one screen before the bell.' },
    { icon: Command, title: 'Find anything with ⌘K', body: 'Search every exchange Finnhub covers and open a stock as a tab, like a browser.' },
    { icon: MailOpen, title: 'A Monday digest', body: 'A short, AI-written summary of the week’s news for the stocks you watch.' },
];

const DATA_SOURCES = [
    {
        name: 'Charts', source: 'TradingView', cadence: 'Live', perHour: 240,
        body: 'Candles, technicals, heatmaps and market widgets stream live, straight from TradingView.',
    },
    {
        name: 'Quotes and watchlists', source: 'Finnhub', cadence: 'Hourly', perHour: 1,
        body: 'Prices on your watchlist and dashboard refresh every hour, and every price shows when it last traded.',
    },
];

// 60 minutes of updates drawn as ticks: one line per refresh.
const CadenceRail = ({ perHour }: { perHour: number }) => (
    <div
        className="h-7 rounded-md bg-page shadow-[inset_0_0_0_1px_var(--line)]"
        style={{
            backgroundImage: perHour > 1
                ? `repeating-linear-gradient(90deg, var(--brand) 0 1px, transparent 1px calc(100% / ${perHour}))`
                : 'linear-gradient(90deg, var(--brand) 0 2px, transparent 2px)',
        }}
        aria-hidden
    />
);

export default async function LandingPage() {
    const session = await getSession();
    const start = session?.user ? { href: '/dashboard', label: 'Open dashboard' } : { href: '/sign-up', label: 'Get started free' };

    return (
        <>
            <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 pt-14 md:pt-20 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                    <MarketStatus />
                    <h1 className="mt-6 text-[44px] font-bold leading-[1.02] tracking-[-0.05em] md:text-[68px]">
                        The whole market,<br />in focus.
                    </h1>
                    <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                        {APP_NAME} is a free market app. Track prices, watch the whole market and dig into
                        company insights, without a paywall.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-2">
                        <Link href={start.href} className="btn btn-primary h-11 px-5 text-[15px]">{start.label}</Link>
                        <Link href="#inside" className="btn btn-ghost h-11 px-5 text-[15px]">See what’s inside</Link>
                    </div>
                </div>
                <div className="hatch">
                    <div className="card px-6 pb-5 pt-6"><MarketDial /></div>
                </div>
            </section>

            <section className="mx-auto mt-16 max-w-[1200px] px-5">
                <ProductPreview />
            </section>

            <section id="inside" className="mx-auto mt-28 max-w-[1200px] scroll-mt-24 px-5">
                <SectionHead kicker="What's inside" title="A terminal for people who aren't at a bank." sub="Everything you need to follow the market, in one place, without a subscription." />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map(({ icon, title, body }) => (
                        <IconCard key={title} icon={icon} title={title}>{body}</IconCard>
                    ))}
                </div>
            </section>

            <section id="data" className="mx-auto mt-28 max-w-[1200px] scroll-mt-24 px-5">
                <SectionHead
                    kicker="Data"
                    title="How fresh are the numbers?"
                    sub="Charts come live from TradingView. Quotes and watchlist prices come from Finnhub."
                />
                <div className="grid gap-3 lg:grid-cols-2">
                    {DATA_SOURCES.map((item) => (
                        <div key={item.name} className="hatch">
                            <div className="card flex h-full flex-col gap-4 p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-[18px] font-bold tracking-[-0.02em]">{item.name}</h3>
                                    <span className="pill">{item.source}</span>
                                </div>
                                <p className="text-[14px] leading-relaxed text-muted-foreground">{item.body}</p>
                                <div className="mt-auto flex flex-col gap-2">
                                    <CadenceRail perHour={item.perHour} />
                                    <p className="num text-[12px] text-faint">{item.cadence}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-auto mt-28 max-w-[1200px] px-5">
                <div className="hatch">
                    <div className="card flex flex-col items-start gap-6 p-8 md:p-12">
                        <h2 className="text-[30px] font-bold leading-tight tracking-[-0.04em] md:text-[38px]">
                            Bring the whole market into focus.
                        </h2>
                        <Link href={start.href} className="btn btn-primary h-11 px-5 text-[15px]">{start.label}</Link>
                        <p className="text-[13px] text-faint">
                            Built on{' '}
                            <a href={UPSTREAM_REPO_URL} target="_blank" rel="noreferrer" className="underline hover:text-muted-foreground">{UPSTREAM_NAME}</a>{' '}
                            by {UPSTREAM_AUTHOR}.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
