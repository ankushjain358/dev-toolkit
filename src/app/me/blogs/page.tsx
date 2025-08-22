"use client"

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateUniqueSlug, formatDate, stripHtml, truncateText, Nullable, cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const client = generateClient<Schema>();

type Blog = Schema['Blogs']['type'];

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
      console.error('Error initializing user:', error);
      toast.error('Failed to initialize user');
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
      
      throw new Error('User not found after authentication');
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  };

  const fetchBlogs = async (userId: string) => {
    try {
      const { data } = await client.models.Blogs.list({
        filter: { userId: { eq: userId } },
      });
      
      const sortedBlogs = (data || []).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBlogs(sortedBlogs);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to fetch blogs');
    }
  };

  const createBlog = async () => {
    const title = prompt('Enter blog title:');
    if (!title?.trim() || !currentUserId) return;

    try {
      toast.loading('Creating blog...', { id: 'create-blog' });

      const slug = await generateUniqueSlug(title.trim());
      
      const { data: newBlog } = await client.models.Blogs.create({
        userId: currentUserId,
        title: title.trim(),
        slug,
        state: 'UNPUBLISHED',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (newBlog) {
        setBlogs(prev => [newBlog as Blog, ...prev]);
        toast.success('Blog created successfully!', { id: 'create-blog' });
      }
    } catch (error) {
      console.error('Error creating blog:', error);
      toast.error('Failed to create blog', { id: 'create-blog' });
    }
  };

  const toggleBlogState = async (blog: Blog) => {
    try {
      const newState = blog.state === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
      
      const { data: updatedBlog } = await client.models.Blogs.update({
        id: blog.id,
        state: newState,
      });

      if (updatedBlog) {
        setBlogs(prev => prev.map(b => 
          b.id === blog.id ? { ...b, state: newState } : b
        ));
        toast.success(`Blog ${newState.toLowerCase()} successfully!`);
      }
    } catch (error) {
      console.error('Error updating blog state:', error);
      toast.error('Failed to update blog state');
    }
  };

  const deleteBlog = async (blog: Blog) => {
    if (!confirm(`Are you sure you want to delete "${blog.title}"?`)) return;

    try {
      await client.models.Blogs.delete({ id: blog.id });
      setBlogs(prev => prev.filter(b => b.id !== blog.id));
      toast.success('Blog deleted successfully!');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog');
    }
  };

  const getContentPreview = (content: Nullable<string> | undefined): string => {
    if (!content) return 'No content yet...';
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
                <BreadcrumbLink href='/me'>
                    Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Blogs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button onClick={createBlog} className="gap-2">
            <Plus className="h-4 w-4" /> Write
          </Button>
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
                <Button onClick={createBlog} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" /> Create Your First Blog
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog) => (
                <Card key={blog.id} className="overflow-hidden">
                  {blog.profileImage && (
                    <div className="h-48 bg-muted">
                      <img 
                        src={blog.profileImage} 
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold line-clamp-2">
                        {blog.title}
                      </h3>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        blog.state === 'PUBLISHED' 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      )}>
                        {blog.state}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {getContentPreview(blog.content)}
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Created: {formatDate(blog.createdAt)}</p>
                      <p className="truncate">/{blog.slug}</p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="justify-between border-t pt-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link href={`/me/edit/${blog.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleBlogState(blog)}
                      >
                        {blog.state === 'PUBLISHED' ? 
                          <EyeOff className="h-4 w-4" /> : 
                          <Eye className="h-4 w-4" />
                        }
                      </Button>
                      
                      {blog.state === 'PUBLISHED' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link href={`/blog/${blog.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBlog(blog)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
