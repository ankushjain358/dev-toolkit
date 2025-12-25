export type AppConstants = {
  readonly APP_NAME: string;
  readonly VERSION: string;
  readonly TIMEOUT_MS: number;
};

export const APP_CONSTANTS: AppConstants = {
  APP_NAME: "Dev Toolkit",
  VERSION: "1.0.0",
  TIMEOUT_MS: 5000,
};

/**
 * React Query keys for consistent cache management
 */
export const QUERY_KEYS = {
  // User queries
  CURRENT_USER_ID: ["currentUserId"] as const,

  // Blog queries
  BLOGS: (userId: string) => ["blogs", userId] as const,
  BLOG_BY_ID: (blogId: string) => ["blog", blogId] as const,
} as const;
