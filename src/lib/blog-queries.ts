import { queryOptions, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { blogService, type Blog } from "./blog-service";
import { FIVE_MINUTES } from "./query-client";

export const blogKeys = {
  all: ["blogs"] as const,
  lists: () => [...blogKeys.all, "list"] as const,
  list: (status?: string) => [...blogKeys.lists(), status ?? "all"] as const,
};

export const publishedBlogsQueryOptions = () =>
  queryOptions({
    queryKey: blogKeys.list("published"),
    queryFn: (): Promise<Blog[]> => blogService.getBlogs("published"),
    staleTime: FIVE_MINUTES,
  });

export const adminBlogsQueryOptions = () =>
  queryOptions({
    queryKey: blogKeys.list("all"),
    queryFn: (): Promise<Blog[]> => blogService.getBlogs("all"),
    staleTime: FIVE_MINUTES,
  });

export function usePublishedBlogs() {
  return useQuery(publishedBlogsQueryOptions());
}

export function useAdminBlogs() {
  return useQuery(adminBlogsQueryOptions());
}

export function invalidateBlogQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: blogKeys.all });
}

/** Call after any create/update/delete so admin + public lists stay in sync. */
export function useInvalidateBlogs() {
  const queryClient = useQueryClient();
  return useCallback(() => invalidateBlogQueries(queryClient), [queryClient]);
}
