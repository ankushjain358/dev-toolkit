import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";
import type { Schema } from "@/../amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import outputs from "@/../amplify_outputs.json";

type Blog = Schema["Blog"]["type"];
type Profile = Schema["Profile"]["type"];

interface BlogWithAuthor extends Blog {
  author?: Profile | null;
}

interface BlogGridProps {
  blogs: BlogWithAuthor[];
}

const getContentPreview = (excerpt: string | null | undefined): string => {
  if (!excerpt) return "No content available...";
  return excerpt;
};

const getCoverImageUrl = (coverImage: string | null | undefined) => {
  if (!coverImage) return undefined;
  return `https://${outputs.custom.distributionDomainName}/${coverImage}`;
};

export function BlogGrid({ blogs }: BlogGridProps) {
  if (blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
        <p className="text-muted-foreground">
          Check back soon for new content!
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {blogs.map((blog) => {
        const coverImageUrl = getCoverImageUrl(blog.coverImage);
        return (
          <Card
            key={blog.id}
            className="hover:shadow-lg transition-shadow overflow-hidden pt-0"
          >
            <Link href={`/blog/${blog.slug}`} className="block">
              <div className="w-full h-48 overflow-hidden bg-muted">
                {coverImageUrl && (
                  <img
                    src={coverImageUrl}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </Link>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {blog.title}
                    </Link>
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {getContentPreview(blog.excerpt)}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{blog.author?.displayName || "Anonymous"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(blog.createdAt!)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={`/blog/${blog.slug}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-medium"
                    >
                      Read more <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
