import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import Analytics from "@/components/Analytics";
import {Toaster} from "@/components/ui/sonner";
import { APP_NAME, SITE_URL } from "@/lib/constants";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const DESCRIPTION = `${APP_NAME} brings the whole market into focus. Charts, watchlists, heatmaps and market news for every stock you follow, free.`;

// The share image comes from app/opengraph-image.jpg and app/twitter-image.jpg
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — The whole market, in focus`,
    description: DESCRIPTION,
    url: "/",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — The whole market, in focus`,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${jakarta.variable} ${plexMono.variable} font-sans antialiased`}
            >
                {children}
                <Toaster/>
                <Analytics />
            </body>
        </html>
    );
}
