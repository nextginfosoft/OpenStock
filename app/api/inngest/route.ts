import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { alertsEnabled } from "@/lib/market-data";
import { sendWeeklyNewsSummary, sendSignUpEmail, checkStockAlerts } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        sendSignUpEmail,
        sendWeeklyNewsSummary,
        // Price alerts need realtime quotes, so the checker only runs where they are on
        ...(alertsEnabled ? [checkStockAlerts] : []),
        // checkInactiveUsers is not registered: its send step is still a mock (see lib/inngest/functions.ts)
    ],
})
