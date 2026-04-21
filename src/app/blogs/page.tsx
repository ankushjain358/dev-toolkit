import type { Schema } from "@/../amplify/data/resource";
import { ExternalLayout } from "@/components/layout/external-layout";
import { serverClient } from "@/lib/server-client";
import { BlogGrid } from "@/components/blog-grid";

export const revalidate = 1800; // Revalidate blog list every 30 minutes

type Blog = Schema["Blog"]["type"];
type Profile = Schema["Profile"]["type"];

interface BlogWithAuthor extends Blog {
  author?: Profile | null;
}

async function fetchBlogsWithAuthors(): Promise<BlogWithAuthor[]> {
  try {
    const { data: blogs, errors } = await serverClient.models.Blog.list({
      filter: { state: { eq: "PUBLISHED" } },
      limit: 6,
    });

    if (errors) {
      console.error("GraphQL errors:", errors);
      return [];
    }

    if (!blogs) return [];

    // Fetch author profiles for each blog
    const blogsWithAuthors = await Promise.all(
      blogs.map(async (blog) => {
        try {
          const { data: profile } = await serverClient.models.Profile.get({
            userId: blog.userId,
          });
          return { ...blog, author: profile };
        } catch (error) {
          console.error("Error fetching author profile:", error);
          return { ...blog, author: null };
        }
      }),
    );

    // Sort by createdAt descending (newest first)
    return blogsWithAuthors.sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || ""),
    );
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return [];
  }
}

export default async function BlogsPage() {
  const blogs = await fetchBlogsWithAuthors();

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
