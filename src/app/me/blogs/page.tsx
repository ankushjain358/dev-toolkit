"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";
import { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

const client = generateClient<Schema>();

type Blog = Schema["Blogs"]["type"];

const blogSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
});

type BlogFormData = z.infer<typeof blogSchema>;

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
    },
  });

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const user = await getCurrentUser();
      const email = user.signInDetails?.loginId || user.username;
      const userId = await getOrCreateUser(email);
      setCurrentUserId(userId);
      await fetchBlogs(userId);
    } catch (error) {
      console.error("Error initializing user:", error);
      toast.error("Failed to initialize user");
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateUser = async (email: string): Promise<string> => {
    try {
      const userList = await client.models.Users.listUsersByEmail({ email });

      if (userList?.data?.length > 0) {
        return userList.data[0].id;
      }

      throw new Error("User not found after authentication");
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  };

  const fetchBlogs = async (userId: string) => {
    try {
      const { data } = await client.models.Blogs.list({
        filter: { userId: { eq: userId } },
      });

      const sortedBlogs = (data || []).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setBlogs(sortedBlogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to fetch blogs");
    }
  };

  const createBlog = async (data: BlogFormData) => {
    if (!currentUserId) return;

    try {
      toast.loading("Creating blog...", { id: "create-blog" });

      const slug = await generateUniqueSlug(data.title.trim());

      const { data: newBlog } = await client.models.Blogs.create({
        userId: currentUserId,
        title: data.title.trim(),
        slug,
        state: "UNPUBLISHED",
        contentJson: null,
        contentHtml: null,
      });

      if (newBlog) {
        setBlogs((prev) => [newBlog as Blog, ...prev]);
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
        setBlogs((prev) =>
          prev.map((b) => (b.id === blog.id ? { ...b, state: newState } : b)),
        );
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
      await client.models.Blogs.delete({ id: blog.id });
      setBlogs((prev) => prev.filter((b) => b.id !== blog.id));
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

  const LoadingState = () => (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

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
                <BreadcrumbLink href="/me">Dashboard</BreadcrumbLink>
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
      {loading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-1 flex-col gap-4 p-4">
          {blogs.length === 0 ? (
            <Alert>
              <AlertDescription className="flex flex-col items-center gap-4 py-8">
                <p>No blogs yet. Create your first blog to get started!</p>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 cursor-pointer">
                      <Plus className="h-4 w-4" /> Create Your First Blog
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
                                <Input
                                  {...field}
                                  placeholder="Enter blog title..."
                                />
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
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {blog.coverImage && (
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{blog.title}</h3>
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium shrink-0",
                            blog.state === "PUBLISHED"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800",
                          )}
                        >
                          {blog.state}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {getContentPreview(blog.contentHtml)}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        <span>Created: {formatDate(blog.createdAt)}</span>
                        <span className="mx-2">•</span>
                        <span>/{blog.slug}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="cursor-pointer"
                    >
                      <Link href={`/me/blogs/edit/${blog.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleBlogState(blog)}
                          className="cursor-pointer"
                        >
                          {blog.state === "PUBLISHED" ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        {blog.state === "PUBLISHED" && (
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/blog/${blog.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Live
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => deleteBlog(blog)}
                          className="text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
