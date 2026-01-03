"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { Calendar, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLayout } from "@/components/layout/external-layout";
import { formatDate } from "@/lib/utils";
import outputs from "@/../amplify_outputs.json";

// Configure Amplify for client-side rendering
Amplify.configure(outputs);
const client = generateClient<Schema>();

type Blog = Schema["Blogs"]["type"];
type Profile = Schema["Profile"]["type"];

interface BlogDetailProps {
  params: Promise<{ slug: string }>;
}

export default function BlogDetailPage({ params }: BlogDetailProps) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<string>("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const fetchBlog = async () => {
      try {
        const { data } = await client.models.Blogs.listBlogsBySlug({ slug });

        if (!data || data.length === 0) {
          notFound();
          return;
        }

        const blogData = data[0];

        // Only show published blogs on external pages
        if (blogData.state !== "PUBLISHED") {
          notFound();
          return;
        }

        setBlog(blogData);

        // Fetch author profile
        try {
          const { data: profileData } = await client.models.Profile.get({
            userId: blogData.userId,
          });
          setAuthor(profileData);
        } catch (error) {
          console.error("Error fetching author profile:", error);
        }
      } catch (error) {
        console.error("Error fetching blog:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  const getAvatarUrl = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return undefined;
    return `https://${outputs.custom.distributionDomainName}/${avatarUrl}`;
  };

  if (loading) {
    return (
      <ExternalLayout>
        <div className="container max-w-4xl mx-auto py-16 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-24 mb-8"></div>
            <div className="h-12 bg-muted rounded w-3/4 mb-6"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-muted rounded mb-8"></div>
          </div>
        </div>
      </ExternalLayout>
    );
  }

  if (!blog) {
    notFound();
  }

  return (
    <ExternalLayout>
      <article className="container max-w-4xl mx-auto py-16 px-4">
        {/* Back Button */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/blogs">
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </Link>
          </Button>
        </div>

        {/* Article Header */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {blog.title}
          </h1>

          {/* Author and Meta Info */}
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={getAvatarUrl(author?.avatarUrl)} />
                <AvatarFallback>
                  {author?.displayName?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <User className="h-3 w-3" />
                  <span>{author?.displayName || "Anonymous"}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(blog.createdAt!)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {blog.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag?.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Cover Image */}
          {blog.coverImage && (
            <div className="mb-8">
              <img
                src={`https://${outputs.custom.distributionDomainName}/${blog.coverImage}`}
                alt={blog.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
              />
            </div>
          )}
        </header>

        {/* Article Content */}
        <div className="tiptap prose prose-lg dark:prose-invert max-w-none">
          {blog.contentHtml ? (
            <div dangerouslySetInnerHTML={{ __html: blog.contentHtml }} />
          ) : (
            <p className="text-muted-foreground">No content available.</p>
          )}
        </div>

        {/* Author Bio */}
        {author &&
          (author.bio ||
            author.website ||
            author.twitterUrl ||
            author.githubUrl ||
            author.linkedinUrl) && (
            <div className="mt-16 p-6 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={getAvatarUrl(author.avatarUrl)} />
                  <AvatarFallback className="text-lg">
                    {author.displayName?.charAt(0)?.toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    About {author.displayName}
                  </h3>
                  {author.bio && (
                    <p className="text-muted-foreground mb-4">{author.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {author.website && (
                      <a
                        href={author.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Website
                      </a>
                    )}
                    {author.twitterUrl && (
                      <a
                        href={author.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Twitter
                      </a>
                    )}
                    {author.githubUrl && (
                      <a
                        href={author.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        GitHub
                      </a>
                    )}
                    {author.linkedinUrl && (
                      <a
                        href={author.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
      </article>
    </ExternalLayout>
  );
}
