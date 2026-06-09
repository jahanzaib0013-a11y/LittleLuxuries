import { useDbList } from "@/hooks/use-db-list";

export type BadgeDef = { id: string; name: string };

const defaultBadgeOptions: BadgeDef[] = [
  { id: "b1", name: "New" },
  { id: "b2", name: "Bestseller" },
  { id: "b3", name: "Low stock" },
  { id: "b4", name: "Limited edition" },
  { id: "b5", name: "Sale" },
  { id: "b6", name: "Out of Stock" },
];

/** Global badge list — persisted in Supabase (`site_lists` id="badges"). */
export function useBadges() {
  const { items: badges, setItems: setBadges } = useDbList<BadgeDef>(
    "badges",
    defaultBadgeOptions,
    "badges-updated",
    "site_badges",
  );
  return { badges, setBadges, defaultBadgeOptions };
}
