import Image from 'next/image';
import { Code, Globe, ShieldCheck } from 'lucide-react';
import PageHero from '@/components/marketing/PageHero';
import SectionHead from '@/components/marketing/SectionHead';
import IconCard from '@/components/marketing/IconCard';
import { APP_NAME, REPO_URL, UPSTREAM_AUTHOR, UPSTREAM_NAME, UPSTREAM_REPO_URL } from '@/lib/constants';

export const metadata = {
    title: 'About',
    description: `What ${APP_NAME} is, who runs it, and the open-source project it is built on.`,
};

const PRINCIPLES = [
    { icon: Globe, title: 'Open access', body: 'No paywall. Charts, watchlists and research are free for everyone.' },
    { icon: Code, title: 'Open source', body: 'The full source code of this site is public under AGPL-3.0. Read it, run it or improve it.' },
    { icon: ShieldCheck, title: 'Not financial advice', body: `${APP_NAME} is a research tool, not a broker or an advisor. Always do your own research.` },
];

export default function AboutPage() {
    return (
        <>
            <PageHero
                kicker="About"
                title="The whole market, in focus."
                sub={`${APP_NAME} is a free stock market app run by NextG Infosoft. Follow prices, charts, news and sentiment for the companies you care about.`}
            >
                <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn btn-primary h-11 px-5 text-[15px]">See the code</a>
            </PageHero>

            <section className="mx-auto mt-20 max-w-[1200px] px-5">
                <SectionHead kicker="Principles" title="What we stand for." />
                <div className="grid gap-3 md:grid-cols-3">
                    {PRINCIPLES.map(({ icon, title, body }) => <IconCard key={title} icon={icon} title={title}>{body}</IconCard>)}
                </div>
            </section>

            <section className="mx-auto mt-24 max-w-[1200px] px-5">
                <div className="hatch">
                    <div className="card grid items-center gap-10 p-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:p-12">
                        <div className="flex flex-col gap-4">
                            <p className="kicker text-brand-ink">Credits</p>
                            <h2 className="text-[30px] font-bold leading-tight tracking-[-0.04em]">Built on {UPSTREAM_NAME}.</h2>
                            <p className="text-[16px] leading-relaxed text-muted-foreground">
                                {APP_NAME} is a modified version of {UPSTREAM_NAME}, an open-source stock market app created by {UPSTREAM_AUTHOR}.
                                It is licensed under the GNU Affero General Public License v3.0, and so is {APP_NAME}.
                            </p>
                            <p className="text-[16px] leading-relaxed text-muted-foreground">
                                Thank you to {UPSTREAM_AUTHOR} and every {UPSTREAM_NAME} contributor for making this possible.
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <a href={UPSTREAM_REPO_URL} target="_blank" rel="noreferrer" className="btn btn-ghost">Original {UPSTREAM_NAME} project</a>
                                <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn btn-ghost">{APP_NAME} source code</a>
                            </div>
                        </div>
                        <div className="relative grid aspect-square max-h-[340px] place-items-center rounded-[16px] bg-page shadow-[inset_0_0_0_1px_var(--line)]">
                            <Image src="/assets/icons/odsLogo.svg" alt={UPSTREAM_AUTHOR} fill className="object-contain p-16 opacity-90" />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
