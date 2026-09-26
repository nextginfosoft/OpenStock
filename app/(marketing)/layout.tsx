import Link from "next/link";
import { getSession } from "@/lib/better-auth/auth";
import Logo from "@/components/Logo";
import OpenDevSocietyBranding from "@/components/OpenDevSocietyBranding";
import { APP_NAME, REPO_URL, UPSTREAM_AUTHOR, UPSTREAM_NAME, UPSTREAM_REPO_URL } from "@/lib/constants";

const FOOTER_LINKS = [
    { href: '/about', label: 'About' },
    { href: '/help', label: 'Help' },
    { href: '/api-docs', label: 'Architecture' },
    { href: '/terms', label: 'Terms' },
    // Required by AGPL-3.0 section 13: users of the hosted app must be offered the source
    { href: REPO_URL, label: 'Source code' },
];

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession();
    const signedIn = !!session?.user;

    return (
        <div className="min-h-dvh bg-page">
            <header className="sticky top-0 z-40 border-b border-transparent bg-page/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5">
                    <Link href="/" aria-label={`${APP_NAME} home`} className="shrink-0">
                        <Logo />
                    </Link>
                    <nav className="hidden items-center gap-1 md:flex">
                        {[['/#inside', 'Product'], ['/#data', 'Data'], ['/about', 'About'], ['/help', 'Help']].map(([href, label]) => (
                            <Link key={href} href={href} className="side-item h-8 font-semibold">{label}</Link>
                        ))}
                    </nav>
                    <div className="ml-auto flex items-center gap-2">
                        {signedIn ? (
                            <Link href="/dashboard" className="btn btn-primary h-9">Open dashboard</Link>
                        ) : (
                            <>
                                <Link href="/sign-in" className="btn h-9 px-3 text-muted-foreground hover:text-foreground">Sign in</Link>
                                <Link href="/sign-up" className="btn btn-primary h-9">Get started</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main>{children}</main>

            <footer className="mx-auto mt-24 flex max-w-[1200px] flex-col gap-6 px-5 pb-10 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-3">
                    <Logo className="text-[17px]" />
                    <p className="text-[13px] text-faint">
                        © {new Date().getFullYear()} NextG Infosoft · Built on{' '}
                        <a href={UPSTREAM_REPO_URL} target="_blank" rel="noreferrer" className="underline hover:text-muted-foreground">{UPSTREAM_NAME}</a> by {UPSTREAM_AUTHOR}
                    </p>
                </div>
                <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold text-muted-foreground">
                    {FOOTER_LINKS.map(({ href, label }) => (
                        <Link key={label} href={href} className="transition-colors hover:text-foreground" {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>
                            {label}
                        </Link>
                    ))}
                </nav>
                <OpenDevSocietyBranding />
            </footer>
        </div>
    );
}
