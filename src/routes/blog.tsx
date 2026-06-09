import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route for /blog and /blog/$slug. It only renders the matched child
// (the listing index or a single post) — the actual UI lives in those routes.
export const Route = createFileRoute("/blog")({
  component: () => <Outlet />,
});
