export interface HeroBanner {
  headline: string;
  buttonLabel: string;
  buttonLink: string;
  seasonTag: string;
  description: string;
  badgeTitle: string;
  badgeSubtitle: string;
}

export interface AnnouncementBar {
  promises: {
    title: string;
    description: string;
    iconName?: string;
  }[];
  isActive: boolean;
}

export interface SiteContent {
  heroBanner: HeroBanner;
  announcementBar: AnnouncementBar;
  layout: string;
}

export const defaultContent: SiteContent = {
  heroBanner: {
    headline: "Gentle luxuries\nfor your little one.",
    buttonLabel: "Shop Collection",
    buttonLink: "/shop",
    seasonTag: "New Collection 2026",
    description:
      "Thoughtfully designed garments that embrace your baby in softest ethically-sourced materials. Timeless elegance for modern nursery.",
    badgeTitle: "Hand-crafted",
    badgeSubtitle: "In small artisan batches",
  },
  announcementBar: {
    promises: [
      {
        title: "Ethically Made",
        description: "Responsibly sourced and sustainably produced with love for the planet.",
      },
      {
        title: "Heirloom Quality",
        description: "Standards of craftsmanship designed to last through generations.",
      },
      {
        title: "Soft on Skin",
        description: "Hypoallergenic and ultra-soft fabrics for the most sensitive skin.",
      },
    ],
    isActive: false,
  },
  layout: "Editorial Grid",
};

// Local storage key for persistence
const CONTENT_STORAGE_KEY = "little-luxuries-content";

export function loadContent(): SiteContent {
  try {
    const stored = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (stored) {
      return { ...defaultContent, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load content from localStorage:", error);
  }
  return defaultContent;
}

export function saveContent(content: Partial<SiteContent>): void {
  try {
    const currentContent = loadContent();
    const updatedContent = { ...currentContent, ...content };
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(updatedContent));
  } catch (error) {
    console.error("Failed to save content to localStorage:", error);
  }
}
