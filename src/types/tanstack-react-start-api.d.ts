declare module "@tanstack/react-start/api" {
  export function createAPIFileRoute(
    routeId: string,
  ): (options: {
    GET?: (args: { request: Request }) => Promise<Response> | Response;
    POST?: (args: { request: Request }) => Promise<Response> | Response;
    PUT?: (args: { request: Request }) => Promise<Response> | Response;
    DELETE?: (args: { request: Request }) => Promise<Response> | Response;
    PATCH?: (args: { request: Request }) => Promise<Response> | Response;
  }) => unknown;
}
