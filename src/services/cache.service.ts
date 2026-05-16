/**
 * Service for programmatically clearing Next.js ISR cache.
 * Calls the /api/cache/clear route — fire-and-forget, never blocks the UI.
 */
class CacheService {
  private async clearPath(path: string): Promise<void> {
    try {
      await fetch(`/api/cache/clear?path=${encodeURIComponent(path)}`);
    } catch (error) {
      console.error("Failed to clear cache for path:", path, error);
    }
  }

  /** Clears all cached pages site-wide — used when site settings or profile are updated. */
  clearAllCache(): void {
    fetch("/api/cache/clear?all=true").catch((error) =>
      console.error("Failed to clear all cache:", error),
    );
  }

  /** Clears / and /blogs — used when a blog is published or unpublished from the list page. */
  clearListingCache(): void {
    this.clearPath("/");
    this.clearPath("/blogs");
  }

  /** Clears /, /blogs, and /blog/{slug} — used when a blog's publish state changes from the editor. */
  clearBlogCache(slug: string): void {
    this.clearPath("/");
    this.clearPath("/blogs");
    this.clearPath(`/blog/${slug}`);
  }

  /** Clears /tag/{id}/{slug} — used when a blog's tags are saved. */
  clearTagCache(tagId: string, tagSlug: string): void {
    this.clearPath(`/tag/${tagId}/${tagSlug}`);
  }
}

export const cacheService = new CacheService();
