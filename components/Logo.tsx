import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

// StockLens mark: a lens over a rising line, followed by the wordmark.
// Scales with font-size, so size it with a text-[..] class.
export const LogoMark = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 32 32" className={cn('size-[1.6em] shrink-0', className)} aria-hidden>
        <circle cx="14" cy="14" r="10" fill="none" stroke="var(--brand)" strokeWidth="3" />
        <path d="M21.5 21.5 28.5 28.5" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" />
        <polyline points="8.5,17 12,13.5 15,16 19.5,10.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const Logo = ({ className }: { className?: string }) => (
    <span className={cn('inline-flex items-center gap-2 text-[20px] font-bold tracking-[-0.04em] text-foreground', className)} aria-label={APP_NAME}>
        <LogoMark />
        <span aria-hidden>Stock<span className="text-brand-ink">Lens</span></span>
    </span>
);

export default Logo;
