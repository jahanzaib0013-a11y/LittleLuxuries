import { createFileRoute } from "@tanstack/react-router";
import { handleAdminLogin } from "@/lib/admin-login.server";

export const Route = createFileRoute("/api/admin-login")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        let body: { email?: string; password?: string };
        try {
          body = (await request.json()) as { email?: string; password?: string };
        } catch {
          return Response.json(
            { success: false, message: "Invalid request body." },
            { status: 400 },
          );
        }

        const result = await handleAdminLogin(body.email ?? "", body.password ?? "");
        return Response.json(result, { status: result.success ? 200 : 401 });
      },
    },
  },
});
