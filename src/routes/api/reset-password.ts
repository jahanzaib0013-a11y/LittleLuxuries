import { createFileRoute } from "@tanstack/react-router";
import { completePasswordReset, isPasswordResetTokenValid } from "@/lib/admin-auth.server";

export const Route = createFileRoute("/api/reset-password")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token") ?? "";
        const valid = await isPasswordResetTokenValid(token);
        return Response.json({ valid });
      },
      POST: async ({ request }: { request: Request }) => {
        let body: { token?: string; password?: string };
        try {
          body = (await request.json()) as { token?: string; password?: string };
        } catch {
          return Response.json(
            { success: false, message: "Invalid request body." },
            { status: 400 },
          );
        }

        const result = await completePasswordReset(body.token ?? "", body.password ?? "");
        return Response.json(result, { status: result.success ? 200 : 400 });
      },
    },
  },
});
