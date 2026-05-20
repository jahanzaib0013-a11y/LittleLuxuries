import { createFileRoute } from "@tanstack/react-router";
import { getAllReports, createPasswordProtectedDownload } from "@/lib/comprehensive-reports";

export const Route = createFileRoute("/api/cron")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const authHeader = request.headers.get("Authorization");
        const expectedSecret = `Bearer ${process.env.CRON_SECRET || "development-cron-secret"}`;

        if (authHeader !== expectedSecret && process.env.NODE_ENV !== "development") {
          return new Response(JSON.stringify({ error: "Unauthorized cron execution attempt" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const reports = await getAllReports();

          for (const report of reports) {
            await createPasswordProtectedDownload(report);
            console.log(`✅ Automated generation successful for: ${report.name}`);
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: `Cron job executed successfully. Generated ${reports.length} reports.`,
              reports: reports.map((r) => r.name),
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Cron job failed:", error);
          return new Response(
            JSON.stringify({
              error: "Cron execution failed",
              details: error instanceof Error ? error.message : "Unknown error",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
