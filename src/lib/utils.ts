import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SyntheticEvent } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Only treat uploaded/remote/data URLs as usable image sources. Bundled-asset
 * paths (e.g. "/assets/hero-baby-<hash>.jpg" or "/src/assets/…") sometimes get
 * persisted into saved content/categories from an old build and then 404; we
 * ignore those so the component can fall back to its live imported default.
 */
export function isUsableImageUrl(url?: string | null): boolean {
  return !!url && /^(https?:|data:|blob:)/i.test(url);
}

/**
 * onError handler that swaps a broken <img> to a fallback once (no loop), e.g.
 * when a Supabase storage object is missing.
 */
export function imgErrorFallback(fallback: string) {
  return (e: SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    if (el.dataset.fb === "1") return;
    el.dataset.fb = "1";
    el.src = fallback;
  };
}

// UTM Parameter Tracking Utility

export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface AcquisitionData {
  acquisition_source: string;
  acquisition_channel?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referral_source?: string;
  landing_page?: string;
  referrer_url?: string;
}

// Get UTM parameters from URL
export function getUTMParameters(): UTMParameters {
  if (typeof window === "undefined") return {};

  const urlParams = new URLSearchParams(window.location.search);

  return {
    utm_source: urlParams.get("utm_source") || undefined,
    utm_medium: urlParams.get("utm_medium") || undefined,
    utm_campaign: urlParams.get("utm_campaign") || undefined,
    utm_content: urlParams.get("utm_content") || undefined,
    utm_term: urlParams.get("utm_term") || undefined,
  };
}

// Store UTM parameters in localStorage for later use
export function storeUTMParameters(): void {
  const utmParams = getUTMParameters();
  if (Object.values(utmParams).some((param) => param)) {
    localStorage.setItem("utm_params", JSON.stringify(utmParams));
    localStorage.setItem("landing_page", window.location.pathname);
    localStorage.setItem("referrer_url", document.referrer);
  }
}

// Get stored UTM parameters
export function getStoredUTMParameters(): UTMParameters {
  if (typeof window === "undefined") return {};

  const stored = localStorage.getItem("utm_params");
  return stored ? JSON.parse(stored) : {};
}

// Determine acquisition source from UTM parameters
export function determineAcquisitionSource(utmParams: UTMParameters): string {
  if (utmParams.utm_source) {
    const source = utmParams.utm_source.toLowerCase();

    // Social media platforms
    if (
      ["instagram", "tiktok", "facebook", "twitter", "pinterest", "linkedin", "youtube"].includes(
        source,
      )
    ) {
      return "social";
    }

    // Search engines
    if (["google", "bing", "yahoo", "duckduckgo"].includes(source)) {
      return utmParams.utm_medium === "paid" ? "paid_search" : "organic_search";
    }

    // Email marketing
    if (source === "email" || utmParams.utm_medium === "email") {
      return "email";
    }

    // Paid advertising
    if (
      utmParams.utm_medium === "paid" ||
      utmParams.utm_medium === "cpc" ||
      utmParams.utm_medium === "ppc"
    ) {
      return "paid";
    }

    // Referral
    if (utmParams.utm_medium === "referral") {
      return "referral";
    }
  }

  // Check referrer URL
  if (typeof window !== "undefined" && document.referrer) {
    const referrer = new URL(document.referrer).hostname.toLowerCase();

    if (
      referrer.includes("instagram.com") ||
      referrer.includes("tiktok.com") ||
      referrer.includes("facebook.com") ||
      referrer.includes("twitter.com")
    ) {
      return "social";
    }

    if (
      referrer.includes("google.com") ||
      referrer.includes("bing.com") ||
      referrer.includes("yahoo.com")
    ) {
      return "organic_search";
    }
  }

  return "direct";
}

// Get acquisition channel (specific platform)
export function getAcquisitionChannel(utmParams: UTMParameters): string | undefined {
  if (utmParams.utm_source) {
    return utmParams.utm_source.toLowerCase();
  }

  // Check referrer URL for channel
  if (typeof window !== "undefined" && document.referrer) {
    const referrer = new URL(document.referrer).hostname.toLowerCase();

    if (referrer.includes("instagram.com")) return "instagram";
    if (referrer.includes("tiktok.com")) return "tiktok";
    if (referrer.includes("facebook.com")) return "facebook";
    if (referrer.includes("twitter.com")) return "twitter";
    if (referrer.includes("pinterest.com")) return "pinterest";
    if (referrer.includes("linkedin.com")) return "linkedin";
    if (referrer.includes("youtube.com")) return "youtube";
    if (referrer.includes("google.com")) return "google";
    if (referrer.includes("bing.com")) return "bing";
    if (referrer.includes("yahoo.com")) return "yahoo";
  }

  return undefined;
}

// Get complete acquisition data
export function getAcquisitionData(referralSource?: string): AcquisitionData {
  const utmParams = getStoredUTMParameters();
  const acquisitionSource = determineAcquisitionSource(utmParams);
  const acquisitionChannel = getAcquisitionChannel(utmParams);

  return {
    acquisition_source: acquisitionSource,
    acquisition_channel: acquisitionChannel,
    utm_source: utmParams.utm_source,
    utm_medium: utmParams.utm_medium,
    utm_campaign: utmParams.utm_campaign,
    utm_content: utmParams.utm_content,
    utm_term: utmParams.utm_term,
    referral_source: referralSource,
    landing_page:
      typeof window !== "undefined" ? localStorage.getItem("landing_page") || undefined : undefined,
    referrer_url:
      typeof window !== "undefined" ? localStorage.getItem("referrer_url") || undefined : undefined,
  };
}

// Generate UTM URL
export function generateUTMUrl(baseUrl: string, params: UTMParameters): string {
  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

// Preset UTM templates for social media platforms
export const socialMediaUTMTemplates = {
  instagram: {
    utm_source: "instagram",
    utm_medium: "social",
    utm_campaign: "social_media",
    utm_content: "bio_link",
  },
  tiktok: {
    utm_source: "tiktok",
    utm_medium: "social",
    utm_campaign: "social_media",
    utm_content: "bio_link",
  },
  facebook: {
    utm_source: "facebook",
    utm_medium: "social",
    utm_campaign: "social_media",
    utm_content: "post",
  },
  twitter: {
    utm_source: "twitter",
    utm_medium: "social",
    utm_campaign: "social_media",
    utm_content: "tweet",
  },
  pinterest: {
    utm_source: "pinterest",
    utm_medium: "social",
    utm_campaign: "social_media",
    utm_content: "pin",
  },
};

// Generate example UTM links for your social media
export function generateSocialMediaLinks(
  baseUrl: string = "https://littleluxuries.com",
): Record<string, string> {
  const links: Record<string, string> = {};

  // Instagram Bio Link
  links.instagram = generateUTMUrl(baseUrl, socialMediaUTMTemplates.instagram);

  // TikTok Bio Link
  links.tiktok = generateUTMUrl(baseUrl, socialMediaUTMTemplates.tiktok);

  // Facebook Post
  links.facebook = generateUTMUrl(baseUrl, socialMediaUTMTemplates.facebook);

  // Twitter/X Tweet
  links.twitter = generateUTMUrl(baseUrl, socialMediaUTMTemplates.twitter);

  // Pinterest Pin
  links.pinterest = generateUTMUrl(baseUrl, socialMediaUTMTemplates.pinterest);

  return links;
}

// Example usage and display
export function getExampleSocialMediaLinks(): {
  platform: string;
  url: string;
  description: string;
}[] {
  const links = generateSocialMediaLinks();

  return [
    {
      platform: "Instagram Bio",
      url: links.instagram,
      description: "Add this link to your Instagram bio",
    },
    {
      platform: "TikTok Bio",
      url: links.tiktok,
      description: "Add this link to your TikTok bio",
    },
    {
      platform: "Facebook Post",
      url: links.facebook,
      description: "Use this link in Facebook posts",
    },
    {
      platform: "Twitter/X Tweet",
      url: links.twitter,
      description: "Use this link in your tweets",
    },
    {
      platform: "Pinterest Pin",
      url: links.pinterest,
      description: "Use this link in your pins",
    },
  ];
}

// Analyze and fix existing URLs with proper UTM parameters
export function analyzeAndFixUrls(
  urls: string[],
): { original: string; fixed: string; platform: string; missingParams: string[] }[] {
  return urls.map((url) => {
    let platform = "Unknown";
    let fixedUrl = url;
    const missingParams: string[] = [];

    // Detect platform from URL
    if (url.includes("facebook.com/share/")) {
      platform = "Facebook Post";
      if (!url.includes("utm_source=")) {
        fixedUrl =
          url + "&utm_source=facebook&utm_medium=social&utm_campaign=social_media&utm_content=post";
        missingParams.push("utm_source", "utm_medium", "utm_campaign", "utm_content");
      }
    } else if (url.includes("tiktok.com/@")) {
      platform = "TikTok Profile";
      if (!url.includes("utm_source=")) {
        fixedUrl =
          url +
          "&utm_source=tiktok&utm_medium=social&utm_campaign=social_media&utm_content=bio_link";
        missingParams.push("utm_source", "utm_medium", "utm_campaign", "utm_content");
      }
    } else if (url.includes("instagram.com/")) {
      platform = "Instagram Profile";
      if (!url.includes("utm_source=")) {
        if (url.includes("utm_source=qr")) {
          // Replace existing qr parameter with proper UTM
          fixedUrl = url.replace(
            "utm_source=qr",
            "utm_source=instagram&utm_medium=social&utm_campaign=social_media&utm_content=bio_link",
          );
          missingParams.push("utm_medium", "utm_campaign", "utm_content");
        } else if (!url.includes("utm_source=")) {
          fixedUrl =
            url +
            "&utm_source=instagram&utm_medium=social&utm_campaign=social_media&utm_content=bio_link";
          missingParams.push("utm_source", "utm_medium", "utm_campaign", "utm_content");
        }
      }
    }

    return {
      original: url,
      fixed: fixedUrl,
      platform,
      missingParams,
    };
  });
}
