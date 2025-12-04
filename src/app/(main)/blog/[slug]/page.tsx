import Link from "next/link";
import { getBlogBySlug } from "@/lib/server-client";
import { notFound } from "next/navigation";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
            >
              ← Back to Blog
            </Link>
            <Link
              href="/me"
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {blog.coverImage && (
            <div className="h-64 md:h-96 bg-gray-200">
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {blog.title}
              </h1>
              <div className="flex items-center text-gray-600 text-sm">
                <time dateTime={blog.createdAt}>
                  Published{" "}
                  {new Date(blog.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                {blog.updatedAt !== blog.createdAt && (
                  <span className="ml-4">
                    • Updated{" "}
                    {new Date(blog.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </header>

            <div className="prose prose-lg prose-gray max-w-none tiptap">
              {blog.contentHtml ? (
                <div
                  className="b"
                  dangerouslySetInnerHTML={{
                    __html: blog.contentHtml,
                  }}
                />
              ) : (
                <p className="text-gray-500 italic">No content available.</p>
              )}
            </div>
          </div>
        </article>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Read More Posts
          </Link>
        </div>
      </main>
    </div>
  );
}
