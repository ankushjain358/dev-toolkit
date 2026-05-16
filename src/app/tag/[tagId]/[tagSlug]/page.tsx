import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { ExternalLayout } from "@/components/layout/external-layout";
import { BlogGrid } from "@/components/blog-grid";
import { getTagWithBlogs, getPublishedTagParams } from "@/services/db.service";

interface TagPageProps {
  params: Promise<{ tagId: string; tagSlug: string }>;
}

/**
 * Pre-render all tag pages at build time.
 * Next.js will statically generate a page for each { tagId, tagSlug } pair.
 */
export async function generateStaticParams() {
  return getPublishedTagParams();
}

/**
 * Cached per-request wrapper around getTagWithBlogs.
 * Shared between generateMetadata and the page component — one DB call per request.
 */
const getCachedTagWithBlogs = cache(getTagWithBlogs);

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tagId } = await params;
  const data = await getCachedTagWithBlogs(tagId);

  if (!data) return { title: "Tag Not Found" };

  return {
    title: `#${data.tag.name}`,
    description: `Articles tagged with ${data.tag.name}`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tagId } = await params;
  const data = await getCachedTagWithBlogs(tagId);

  if (!data) notFound();

  const { tag, blogs } = data;

  return (
    <ExternalLayout>
      <div className="container max-w-6xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">#{tag.name}</h1>
          <p className="text-xl text-muted-foreground">
            {blogs.length} {blogs.length === 1 ? "article" : "articles"} tagged
            with {tag.name}
          </p>
        </div>

        <BlogGrid blogs={blogs} />
      </div>
    </ExternalLayout>
  );
}
