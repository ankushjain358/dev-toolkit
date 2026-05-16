import { ExternalLayout } from "@/components/layout/external-layout";
import { BlogGrid } from "@/components/blog-grid";
import { getPublishedBlogsWithAuthors } from "@/services/db.service";

export default async function BlogsPage() {
  const blogs = await getPublishedBlogsWithAuthors(100);

  return (
    <ExternalLayout>
      <div className="container max-w-6xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Latest Articles</h1>
          <p className="text-xl text-muted-foreground">
            Discover insights, tutorials, and thoughts from our community
          </p>
        </div>

        <BlogGrid blogs={blogs} />
      </div>
    </ExternalLayout>
  );
}
