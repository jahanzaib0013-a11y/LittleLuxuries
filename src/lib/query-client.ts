import { QueryClient } from "@tanstack/react-query";

export const FIVE_MINUTES = 5 * 60 * 1000;
export const TEN_MINUTES = 10 * 60 * 1000;
export const THIRTY_MINUTES = 30 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES,
      gcTime: THIRTY_MINUTES,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
