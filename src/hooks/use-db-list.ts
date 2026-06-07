import { useEffect, useRef, useState } from "react";
import { siteListsService, subscribeToSiteList } from "@/lib/supabase-service";

type Updater<T> = T[] | ((prev: T[]) => T[]);

/**
 * Generic store for a small global list (sizes / categories / badges / etc.)
 * backed by Supabase `site_lists` with a localStorage cache for instant paint
 * and offline/pre-migration fallback.
 *
 * - Initial render uses `defaults` (SSR-safe; no hydration drift).
 * - On mount: read the localStorage cache immediately, then load from the DB
 *   (DB wins when present) and refresh the cache.
 * - `setItems` updates state + cache + dispatches `eventName` (same-tab sync)
 *   and persists to the DB optimistically (fire-and-forget).
 * - A realtime subscription refreshes the list when another device edits it.
 */
export function useDbList<T>(id: string, defaults: T[], eventName: string, cacheKey: string) {
  const [items, setItemsState] = useState<T[]>(defaults);
  // Guards against an in-flight realtime/DB refresh clobbering a local edit.
  const lastWriteRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const readCache = (): T[] | null => {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as T[]) : null;
      } catch {
        return null;
      }
    };

    const cached = readCache();
    if (cached) setItemsState(cached);

    const loadFromDb = async () => {
      const remote = await siteListsService.getList<T>(id);
      if (cancelled || !remote) return;
      // Don't overwrite a very recent local edit that may not have round-tripped.
      if (Date.now() - lastWriteRef.current < 1500) return;
      setItemsState(remote);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(remote));
      } catch {
        /* ignore */
      }
    };

    loadFromDb();

    const refresh = () => {
      const next = readCache();
      if (next) setItemsState(next);
    };
    window.addEventListener(eventName, refresh);
    window.addEventListener("storage", refresh);
    const channel = subscribeToSiteList(id, loadFromDb);

    return () => {
      cancelled = true;
      window.removeEventListener(eventName, refresh);
      window.removeEventListener("storage", refresh);
      channel?.unsubscribe?.();
    };
  }, [id, eventName, cacheKey]);

  const setItems = (next: Updater<T>) => {
    setItemsState((prev) => {
      const updated = typeof next === "function" ? (next as (p: T[]) => T[])(prev) : next;
      lastWriteRef.current = Date.now();
      try {
        localStorage.setItem(cacheKey, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event(eventName));
      void siteListsService.saveList(id, updated);
      return updated;
    });
  };

  return { items, setItems };
}
