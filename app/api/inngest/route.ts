import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { alertsEnabled } from "@/lib/market-data";
import { sendWeeklyNewsSummary, sendSignUpEmail, checkStockAlerts } from "@/lib/inngest/functions";

// The weekly digest is sent as a Kit broadcast, so it only runs once Kit is configured
const kitEnabled = Boolean(process.env.KIT_API_KEY && process.env.KIT_API_SECRET);

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        sendSignUpEmail,
        ...(kitEnabled ? [sendWeeklyNewsSummary] : []),
        // Price alerts need realtime quotes, so the checker only runs where they are on
        ...(alertsEnabled ? [checkStockAlerts] : []),
        // checkInactiveUsers is not registered: its send step is still a mock (see lib/inngest/functions.ts)
    ],
})
