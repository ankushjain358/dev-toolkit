"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";
import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getUserInfo,
  generateUniqueSlug,
  formatDate,
  stripHtml,
  truncateText,
  Nullable,
  cn,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { orderBy } from "lodash";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/app-constants";

const client = generateClient<Schema>();

type Blog = Schema["Blogs"]["type"];

const blogSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
});

type BlogFormData = z.infer<typeof blogSchema>;

// Fetch blogs function
async function fetchBlogs(userId: string): Promise<Blog[]> {
  let allBlogs: Blog[] = [];
  let nextToken: string | undefined | null;

  do {
    const { data, nextToken: token } =
      await client.models.Blogs.listBlogsByUserId(
        { userId },
        nextToken ? { nextToken } : undefined,
      );

    allBlogs = [...allBlogs, ...(data || [])];
    nextToken = token;
  } while (nextToken);

  return orderBy(allBlogs, ["createdAt"], ["desc"]);
}

export default function BlogsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
    },
  });

  /**
   * Query 1: Initialize user and get userId
   */
  const {
    data: userInfo,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
  } = useQuery({
    queryKey: QUERY_KEYS.CURRENT_USER_ID,
    queryFn: getUserInfo,
    retry: false,
  });

  // Extract userId for easier access
  const userId = userInfo?.userId;

  /**
   * Query 2: Fetch blogs (runs only after userId exists)
   */
  const {
    data: blogs = [],
    isLoading: isBlogsLoading,
    isError: isBlogsError,
    error: blogsError,
  } = useQuery({
    queryKey: QUERY_KEYS.BLOGS(userId!),
    queryFn: () => fetchBlogs(userId!),
    enabled: !!userId, // dependent query
    retry: false,
  });

  /**
   * Combined loading state
   */
  if (isUserLoading || isBlogsLoading) {
    return <LoadingState />;
  }

  /**
   * Error handling
   */
  if (isUserError) {
    console.error(userError);
    toast.error("Failed to initialize user");
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Alert>
          <AlertDescription>Failed to load user</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isBlogsError) {
    console.error(blogsError);
    toast.error("Failed to load blogs");
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Alert>
          <AlertDescription>Failed to load blogs</AlertDescription>
        </Alert>
      </div>
    );
  }

  const createBlog = async (data: BlogFormData) => {
    if (!userId) return;

    try {
      toast.loading("Creating blog...", { id: "create-blog" });

      const slug = await generateUniqueSlug(data.title.trim());

      const { data: newBlog } = await client.models.Blogs.create({
        userId: userId,
        title: data.title.trim(),
        slug,
        state: "UNPUBLISHED",
        contentJson: null,
        contentHtml: null,
      });

      if (newBlog) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BLOGS(userId) });
        toast.success("Blog created successfully!", { id: "create-blog" });
        setDialogOpen(false);
        form.reset();
      }
    } catch (error) {
      console.error("Error creating blog:", error);
      toast.error("Failed to create blog", { id: "create-blog" });
    }
  };

  const toggleBlogState = async (blog: Blog) => {
    try {
      const newState = blog.state === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";

      const { data: updatedBlog } = await client.models.Blogs.update({
        id: blog.id,
        state: newState,
      });

      if (updatedBlog) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BLOGS(userId!) });
        toast.success(`Blog ${newState.toLowerCase()} successfully!`);
      }
    } catch (error) {
      console.error("Error updating blog state:", error);
      toast.error("Failed to update blog state");
    }
  };

  const deleteBlog = async (blog: Blog) => {
    if (!confirm(`Are you sure you want to delete "${blog.title}"?`)) return;

    try {
      // Delete associated tag references first
      const { data: tagRefs } =
        await client.models.TagReferences.listTagReferencesByRef({
          ref: `BLOG#${blog.id}`,
        });

      for (const ref of tagRefs || []) {
        await client.models.TagReferences.delete({ id: ref.id });
      }

      // Then delete the blog
      await client.models.Blogs.delete({ id: blog.id });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BLOGS(userId!) });
      toast.success("Blog deleted successfully!");
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog");
    }
  };

  const getContentPreview = (content: Nullable<string> | undefined): string => {
    if (!content) return "No content yet...";
    const plainText = stripHtml(content);
    return truncateText(plainText, 120);
  };

  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-1 items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/me">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Blogs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 cursor-pointer">
                <Plus className="h-4 w-4" /> Write
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Blog</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(createBlog)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blog Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter blog title..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="cursor-pointer">
                      Create Blog
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Blogs</h1>
            <p className="text-muted-foreground">
              Manage your blog posts and drafts
            </p>
          </div>
        </div>

        {blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto max-w-md">
              <h3 className="text-lg font-semibold">No blogs yet</h3>
              <p className="text-muted-foreground mb-4">
                Start writing your first blog post to share your thoughts with
                the world.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Write Your First Blog
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 overflow-hidden">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors items-center"
              >
                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                  {blog.coverImage ? (
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground text-xs text-center px-1">
                      No Image
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold truncate">{blog.title}</h3>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
                        blog.state === "PUBLISHED"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800",
                      )}
                    >
                      {blog.state === "PUBLISHED" ? (
                        <>
                          <Eye className="h-3 w-3" /> Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" /> Draft
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {getContentPreview(blog.contentHtml)}
                  </p>
                  <div className="text-xs text-muted-foreground truncate">
                    <span className="mr-2">
                      Created {formatDate(blog.createdAt)}
                    </span>
                    {blog.updatedAt !== blog.createdAt && (
                      <span>• Updated {formatDate(blog.updatedAt)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleBlogState(blog)}
                    className="gap-1 cursor-pointer"
                  >
                    {blog.state === "PUBLISHED" ? (
                      <>
                        <EyeOff className="h-4 w-4" /> Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" /> Publish
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/me/blogs/edit/${blog.id}`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      {blog.state === "PUBLISHED" && (
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/blog/${blog.slug}`}
                            target="_blank"
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <ExternalLink className="h-4 w-4" /> View Live
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => deleteBlog(blog)}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function LoadingState() {
  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-1 items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/me">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Blogs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 rounded-md overflow-hidden">
                  <Skeleton className="h-16 w-16" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    <Skeleton className="h-3 w-24 inline-block mr-2" />
                    <Skeleton className="h-3 w-16 inline-block" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
