import { serverClient } from "@/lib/server-client";

type SiteSettingsData = {
  id: string;
  siteName: string;
  tagline: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  bannerTitle: string;
  bannerDescription: string;
  email: string;
  website: string;
  twitterUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  instagramUrl: string;
  aboutPhotoUrl: string;
  aboutText: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  googleAnalyticsId: string;
  keywords: string;
};

const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  id: "default",
  siteName: "Dev Toolkit",
  tagline: "A comprehensive productivity platform",
  logoLightUrl: "",
  logoDarkUrl: "",
  faviconUrl: "",
  bannerTitle: "Welcome to Dev Toolkit",
  bannerDescription: "Manage your blogs, bookmarks, and notes in one place",
  email: "",
  website: "",
  twitterUrl: "",
  linkedinUrl: "",
  githubUrl: "",
  instagramUrl: "",
  aboutPhotoUrl: "",
  aboutText: "",
  metaTitle: "Dev Toolkit",
  metaDescription: "A comprehensive productivity platform",
  ogImageUrl: "",
  googleAnalyticsId: "",
  keywords: "",
};

export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const { data: settings } = await serverClient.models.SiteSettings.list();
    const dbSettings = settings?.[0];

    if (!dbSettings) {
      return DEFAULT_SITE_SETTINGS;
    }

    return {
      id: dbSettings.id,
      siteName: dbSettings.siteName || "",
      tagline: dbSettings.tagline || "",
      logoLightUrl: dbSettings.logoLightUrl || "",
      logoDarkUrl: dbSettings.logoDarkUrl || "",
      faviconUrl: dbSettings.faviconUrl || "",
      bannerTitle: dbSettings.bannerTitle || "",
      bannerDescription: dbSettings.bannerDescription || "",
      email: dbSettings.email || "",
      website: dbSettings.website || "",
      twitterUrl: dbSettings.twitterUrl || "",
      linkedinUrl: dbSettings.linkedinUrl || "",
      githubUrl: dbSettings.githubUrl || "",
      instagramUrl: dbSettings.instagramUrl || "",
      aboutPhotoUrl: dbSettings.aboutPhotoUrl || "",
      aboutText: dbSettings.aboutText || "",
      metaTitle: dbSettings.metaTitle || "",
      metaDescription: dbSettings.metaDescription || "",
      ogImageUrl: dbSettings.ogImageUrl || "",
      googleAnalyticsId: dbSettings.googleAnalyticsId || "",
      keywords: dbSettings.keywords || "",
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
