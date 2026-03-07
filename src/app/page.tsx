import Link from "next/link";
import { ArrowRight, Code, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLayout } from "@/components/layout/external-layout";
import { getSiteSettings } from "@/services/common.service";
import { BlogGrid } from "@/components/blog-grid";
import { serverClient } from "@/lib/server-client";
import type { Schema } from "@/../amplify/data/resource";

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

export default async function HomePage() {
  const settings = await getSiteSettings();
  const blogs = await fetchBlogsWithAuthors();
  const bannerTitle = settings.bannerTitle;
  const bannerDescription = settings.bannerDescription;

  return (
    <ExternalLayout>
      {/* Hero Banner */}
      <section className="py-20 px-4 bg-gradient-to-br from-background to-muted/50">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {bannerTitle}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto whitespace-pre-line">
            {bannerDescription}
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/blogs">
              Explore Articles <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Latest Articles</h2>
            <p className="text-muted-foreground text-lg">
              Discover insights, tutorials, and thoughts from our community
            </p>
          </div>

          <BlogGrid blogs={blogs} />

          {blogs.length > 0 && (
            <div className="text-center mt-12">
              <Button asChild variant="outline" size="lg">
                <Link href="/blogs">
                  View All Articles <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything you need to stay productive
            </h2>
            <p className="text-muted-foreground text-lg">
              Streamline your development workflow with our integrated tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Code className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Blog & Share</h3>
                <p className="text-muted-foreground">
                  Write and publish technical articles with our rich text editor
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Stay Organized</h3>
                <p className="text-muted-foreground">
                  Manage bookmarks, notes, and tasks with Kanban boards
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Connect & Grow</h3>
                <p className="text-muted-foreground">
                  Build your developer profile and connect with the community
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </ExternalLayout>
  );
}
