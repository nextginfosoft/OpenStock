import { Metadata } from 'next';
import { BookOpen, Bug, ChevronDown, Mail } from 'lucide-react';
import PageHero from '@/components/marketing/PageHero';
import SectionHead from '@/components/marketing/SectionHead';
import IconCard from '@/components/marketing/IconCard';
import { APP_NAME, SUPPORT_EMAIL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Help',
    description: `Support for ${APP_NAME}. No paywalls, just help.`,
};

const FAQS = [
    {
        question: `Is ${APP_NAME} really free?`,
        answer: 'Yes. Charts, watchlists and research are free, with no card needed.',
    },
    {
        question: 'How do I add a stock to my watchlist?',
        answer: 'Press ⌘K (or Search stocks in the sidebar), open the company, then press Watch. It shows up in your watchlist and in the sidebar.',
    },
    {
        question: 'Where does the market data come from?',
        answer: 'Charts come live from TradingView. Quotes, watchlist prices and alerts come from Finnhub; on this site they refresh hourly and every price shows when it was last traded.',
    },
    {
        question: 'Which markets are supported?',
        answer: 'US stocks, crypto and forex live; Canada and Australia delayed; India (through BSE) and Germany end of day. Alerts work for US stocks and crypto.',
    },
    {
        question: 'My alert hasn’t fired.',
        answer: 'Alerts are checked every five minutes against live prices for US stocks and crypto, and sent to your account email (and WhatsApp, if you’ve connected it) when the price crosses your target. Each alert fires once. Check its status on the watchlist page.',
    },
    {
        question: 'How do WhatsApp alerts work?',
        answer: 'Connect your number on your profile page and confirm it with the code we send on WhatsApp. You can then get price alerts, a morning wrap-up of your watchlist’s US stocks and crypto, and the weekly digest’s top headlines on Mondays. Turn any of them off, or remove your number, on your profile page at any time; replies in the WhatsApp chat aren’t read by StockLens.',
    },
];

export default function HelpPage() {
    return (
        <>
            <PageHero kicker="Help" title="How can we help?" sub={`Support for everyone who uses ${APP_NAME}.`} />

            <section className="mx-auto mt-14 grid max-w-[1200px] gap-3 px-5 md:grid-cols-3">
                <IconCard icon={BookOpen} title="How it works" footer={<a href="/api-docs" className="btn btn-ghost w-full">Read the architecture</a>}>
                    Data sources, background jobs and the AI behind the emails.
                </IconCard>
                <IconCard icon={Mail} title="Email us" footer={<a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-ghost w-full">{SUPPORT_EMAIL}</a>}>
                    Questions, feedback or account problems. We read every message.
                </IconCard>
                <IconCard icon={Bug} title="Report a bug" footer={<a href={`mailto:${SUPPORT_EMAIL}?subject=Bug%20report`} className="btn btn-ghost w-full">Report a bug</a>}>
                    Found something broken? Tell us what happened and we’ll fix it.
                </IconCard>
            </section>

            <section className="mx-auto mt-24 max-w-[1200px] px-5">
                <SectionHead kicker="FAQ" title="Common questions." />
                <div className="hatch">
                    <div className="card row-list overflow-hidden">
                        {FAQS.map(({ question, answer }) => (
                            <details key={question} className="group">
                                {/* Padding lives on the summary so the whole row is the click target, in every browser */}
                                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-foreground transition-colors hover:bg-hover/40 [&::-webkit-details-marker]:hidden">
                                    {question}
                                    <ChevronDown className="size-4 flex-none text-faint transition-transform duration-200 group-open:rotate-180" />
                                </summary>
                                <p className="max-w-3xl px-5 pb-5 text-[15px] leading-relaxed text-muted-foreground">{answer}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-24 max-w-[1200px] px-5">
                <div className="hatch">
                    <div className="card flex flex-col items-start justify-between gap-5 p-8 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-[22px] font-bold tracking-[-0.03em]">Still stuck?</h2>
                            <p className="mt-1 text-muted-foreground">Our team answers emails, for free.</p>
                        </div>
                        <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-primary h-11 px-5 text-[15px]">Email support</a>
                    </div>
                </div>
            </section>
        </>
    );
}
