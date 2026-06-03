import { notFound } from "next/navigation";
import { Calendar, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { cache } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLayout } from "@/components/layout/external-layout";
import { formatDate } from "@/lib/utils";
import { marked } from "marked";
import ClientCodeHighlighter from "@/components/ClientCodeHighlighter";
import { getBlogDetail, getPublishedBlogSlugs } from "@/services/db.service";
import TableOfContents from "@/components/TableOfContents";

interface BlogDetailProps {
  params: Promise<{ slug: string }>;
}

/**
 * Pre-render all published blog slugs at build time.
 * Next.js will statically generate a page for each slug.
 */
export async function generateStaticParams() {
  const slugs = await getPublishedBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * Cached per-request wrapper around getBlogDetail.
 * React cache() deduplicates calls within the same render pass,
 * so generateMetadata and the page component share one DB round-trip.
 */
const getCachedBlogDetail = cache(getBlogDetail);

export async function generateMetadata({
  params,
}: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCachedBlogDetail(slug);

  if (!data) return { title: "Blog Not Found" };

  return {
    title: data.blog.title,
    description: data.blog.excerpt || undefined,
  };
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params;
  const data = await getCachedBlogDetail(slug);

  if (!data) notFound();

  const { blog, author, tags, avatarUrl, coverImageUrl } = data;

  // Convert markdown to HTML on the server so the blog is markdown-first.
  // If markdown is missing, fall back to legacy html content.
  const rawContent = blog.contentMarkdown
    ? await marked.parse(blog.contentMarkdown)
    : (blog.contentHtml ?? "");

  return (
    <ExternalLayout>
      <div className="container max-w-7xl mx-auto py-16 px-4">
        <div className="lg:flex lg:gap-8">
          <article className="flex-1 lg:max-w-4xl">
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
                    <AvatarImage src={avatarUrl} className="object-cover" />
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
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {tags.map((tag) => (
                    <Link key={tag.id} href={`/tag/${tag.id}/${tag.slug}`}>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80"
                      >
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Cover Image */}
              {coverImageUrl && (
                <div className="mb-8">
                  <img
                    src={coverImageUrl}
                    alt={blog.title}
                    className="w-full h-64 md:h-96 object-contain rounded-lg"
                  />
                </div>
              )}
            </header>

            {/* Article Content */}
            <div className="blog-content tiptap prose prose-lg dark:prose-invert max-w-none">
              {rawContent ? (
                <ClientCodeHighlighter html={rawContent} />
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
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="text-lg">
                        {author.displayName?.charAt(0)?.toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">
                        About {author.displayName}
                      </h3>
                      {author.bio && (
                        <p className="text-muted-foreground mb-4">
                          {author.bio}
                        </p>
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

          {/* Table of Contents Sidebar */}
          <aside className="w-72 shrink-0">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </ExternalLayout>
  );
}
