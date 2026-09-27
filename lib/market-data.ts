// How fresh market numbers are. Safe to import from client components (no keys here).
//
//   cached   (default) Public instance: quotes refresh hourly, shared by every user via the data cache.
//   realtime           self-hosted with your own Finnhub keys: quotes refresh every 15s.
export type DataMode = 'cached' | 'realtime';

export const DATA_MODE: DataMode = process.env.NEXT_PUBLIC_OPENSTOCK_DATA_MODE === 'realtime' ? 'realtime' : 'cached';

export const QUOTE_TTL_SECONDS = DATA_MODE === 'realtime' ? 15 : 3600;

export const isRealtime = DATA_MODE === 'realtime';

// Price alerts (email and WhatsApp) are checked every 5 minutes against fresh quotes. They are on in
// realtime mode, or on their own with NEXT_PUBLIC_PRICE_ALERTS=on while on-screen prices stay hourly.
export const alertsEnabled = isRealtime || process.env.NEXT_PUBLIC_PRICE_ALERTS === 'on';
