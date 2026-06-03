import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getAllReports, createPasswordProtectedDownload } from "@/lib/comprehensive-reports";

export const APIRoute = createAPIFileRoute("/api/cron")({
  GET: async ({ request }: { request: Request }) => {
    // Secure the cron endpoint using an Authorization Bearer token matching CRON_SECRET
    const authHeader = request.headers.get("Authorization");
    const expectedSecret = `Bearer ${process.env.CRON_SECRET || "development-cron-secret"}`;

    if (authHeader !== expectedSecret && process.env.NODE_ENV !== "development") {
      return new Response(JSON.stringify({ error: "Unauthorized cron execution attempt" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // 1. Fetch real analytics data by executing our newly updated Supabase queries
      const reports = await getAllReports();

      // 2. We can automatically generate the encrypted PDF/CSV buffers and optionally
      // upload them to Supabase Storage or email them to the administrator.
      for (const report of reports) {
        // This generates the base64 URI (which internally queries the database)
        const dataURI = await createPasswordProtectedDownload(report);

        // Log generation logic. In production, this can push to Supabase or Nodemailer:
        // const buffer = Buffer.from(dataURI.split(",")[1], "base64");
        // await supabase.storage.from("reports").upload(`automated/${report.name}`, buffer);
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
});
