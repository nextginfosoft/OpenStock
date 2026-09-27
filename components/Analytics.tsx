import Script from "next/script";

// Cloudflare Web Analytics: cookie-free visitor stats. The token is public (it ships in every page),
// so it lives in a NEXT_PUBLIC_ variable. Without it, nothing loads.
const token = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;

export default function Analytics() {
    if (!token) return null;
    return (
        <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token })}
            strategy="afterInteractive"
            defer
        />
    );
}
