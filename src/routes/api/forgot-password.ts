import { createFileRoute } from "@tanstack/react-router";
import { handleAdminPasswordReset } from "@/lib/password-reset-mail.server";

export const Route = createFileRoute("/api/forgot-password")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        let body: { email?: string };
        try {
          body = (await request.json()) as { email?: string };
        } catch {
          return Response.json(
            { success: false, message: "Invalid request body." },
            { status: 400 },
          );
        }

        const origin = request.headers.get("origin") ?? undefined;
        const result = await handleAdminPasswordReset(body.email ?? "", origin);
        return Response.json(result);
      },
    },
  },
});
