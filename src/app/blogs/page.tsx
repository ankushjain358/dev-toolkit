"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLayout } from "@/components/layout/external-layout";
import { formatDate, stripHtml, truncateText } from "@/lib/utils";
import outputs from "@/../amplify_outputs.json";

// Configure Amplify for client-side rendering
Amplify.configure(outputs);
const client = generateClient<Schema>();

type Blog = Schema["Blogs"]["type"];
type Profile = Schema["Profile"]["type"];

interface BlogWithAuthor extends Blog {
  author?: Profile | null;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchBlogs = async (token?: string | null) => {
    try {
      const { data, nextToken: newToken } = await client.models.Blogs.list({
        filter: { state: { eq: "PUBLISHED" } },
        limit: 6,
        nextToken: token || undefined,
      });

      if (data) {
        // Fetch author profiles for each blog
        const blogsWithAuthors = await Promise.all(
          data.map(async (blog) => {
            try {
              const { data: profile } = await client.models.Profile.get({
                userId: blog.userId,
              });
              return { ...blog, author: profile };
            } catch (error) {
              console.error("Error fetching author profile:", error);
              return { ...blog, author: null };
            }
          }),
        );

        if (token) {
          setBlogs((prev) => [...prev, ...blogsWithAuthors]);
        } else {
          setBlogs(blogsWithAuthors);
        }
      }

      setNextToken(newToken || null);
      setHasMore(!!newToken);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    }
  };

  useEffect(() => {
    fetchBlogs().finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    await fetchBlogs(nextToken);
    setLoadingMore(false);
  };

  const getContentPreview = (content: string | null | undefined): string => {
    if (!content) return "No content available...";
    const plainText = stripHtml(content);
    return truncateText(plainText, 150);
  };

  if (loading) {
    return (
      <ExternalLayout>
        <div className="container max-w-6xl mx-auto py-16 px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="h-20 bg-muted rounded mb-4"></div>
                  <div className="h-3 bg-muted rounded w-24"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ExternalLayout>
    );
  }

  return (
    <ExternalLayout>
      <div className="container max-w-6xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Latest Articles</h1>
          <p className="text-xl text-muted-foreground">
            Discover insights, tutorials, and thoughts from our community
          </p>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground">
              Check back soon for new content!
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {blogs.map((blog) => (
                <Card
                  key={blog.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
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
                          {getContentPreview(blog.contentHtml)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>
                              {blog.author?.displayName || "Anonymous"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(blog.createdAt!)}</span>
                          </div>
                        </div>
                      </div>

                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {blog.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag?.name}
                            </Badge>
                          ))}
                        </div>
                      )}

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
              ))}
            </div>

            {hasMore && (
              <div className="text-center">
                <Button onClick={loadMore} disabled={loadingMore} size="lg">
                  {loadingMore ? "Loading..." : "Load More Articles"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ExternalLayout>
  );
}
