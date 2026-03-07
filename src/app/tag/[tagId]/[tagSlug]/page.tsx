import { notFound } from "next/navigation";
import { ExternalLayout } from "@/components/layout/external-layout";
import { BlogGrid } from "@/components/blog-grid";
import { getBlogsWithTag } from "@/lib/server-client";

interface TagPageProps {
  params: Promise<{ tagId: string; tagSlug: string }>;
}

export default async function TagPage({ params }: TagPageProps) {
  const { tagId } = await params;
  const result = await getBlogsWithTag(tagId);

  if (!result) {
    notFound();
  }

  const { tag, blogs } = result;

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
