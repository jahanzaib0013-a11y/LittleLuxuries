import { useState, useEffect } from "react";

export type BadgeDef = { id: string; name: string };

const defaultBadgeOptions: BadgeDef[] = [
  { id: "b1", name: "New" },
  { id: "b2", name: "Bestseller" },
  { id: "b3", name: "Low stock" },
  { id: "b4", name: "Limited edition" },
  { id: "b5", name: "Sale" },
  { id: "b6", name: "Out of Stock" },
];

export function useBadges() {
  const [badges, setBadgesState] = useState<BadgeDef[]>(defaultBadgeOptions);

  useEffect(() => {
    const saved = localStorage.getItem("site_badges");
    if (saved) {
      try {
        setBadgesState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse badges", e);
      }
    }

    const handleStorageChange = () => {
      const updated = localStorage.getItem("site_badges");
      if (updated) {
        try {
          setBadgesState(JSON.parse(updated));
        } catch (e) {
          console.error("Failed to parse storage update", e);
        }
      }
    };

    window.addEventListener("badges-updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("badges-updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setBadges = (newBadges: BadgeDef[] | ((prev: BadgeDef[]) => BadgeDef[])) => {
    setBadgesState((prev) => {
      const updated = typeof newBadges === "function" ? newBadges(prev) : newBadges;
      localStorage.setItem("site_badges", JSON.stringify(updated));
      window.dispatchEvent(new Event("badges-updated"));
      return updated;
    });
  };

  return { badges, setBadges, defaultBadgeOptions };
}
