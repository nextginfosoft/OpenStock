import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { alertsEnabled } from "@/lib/market-data";
import { sendWeeklyNewsSummary, sendSignUpEmail, checkStockAlerts, whatsappDailyWrap } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        sendSignUpEmail,
        sendWeeklyNewsSummary,
        // Skips itself until WhatsApp is configured
        whatsappDailyWrap,
        // Price alerts: realtime mode, or NEXT_PUBLIC_PRICE_ALERTS=on (see lib/market-data.ts)
        ...(alertsEnabled ? [checkStockAlerts] : []),
        // checkInactiveUsers is not registered: its send step is still a mock (see lib/inngest/functions.ts)
    ],
})
