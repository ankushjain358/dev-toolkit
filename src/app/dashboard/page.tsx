'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateUniqueSlug, formatDate, stripHtml, truncateText, Nullable } from '@/lib/utils';

const client = generateClient<Schema>();

type Blog = Schema['Blogs']['type'];

function DashboardContent() {
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
      // User is already created in post-confirmation, just get it
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
      console.log('Fetching blogs for userId:', userId);
      
      const { data } = await client.models.Blogs.list({
        filter: { userId: { eq: userId } },
      })
      
      console.log('Fetched blogs:', data);
      
      // Sort by creation date, newest first
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
      
      console.log('Creating blog with:', { 
        userId: currentUserId, 
        title: title.trim(), 
        slug 
      });

      const now = new Date().toISOString();
      
      const { data: newBlog } = await client.models.Blogs.create({
        userId: currentUserId,
        title: title.trim(),
        slug,
        state: 'UNPUBLISHED',
        content: '',
        createdAt: now,
        updatedAt: now,
      });

      console.log('Created blog:', newBlog);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <Link 
                href="/" 
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Back to Blog
              </Link>
            </div>
            <button
              onClick={createBlog}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              New Blog
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">No blogs yet</h2>
            <p className="text-gray-500 mb-6">Create your first blog to get started!</p>
            <button
              onClick={createBlog}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              Create Your First Blog
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <div key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {blog.profileImage && (
                  <div className="h-48 bg-gray-200">
                    <img 
                      src={blog.profileImage} 
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {blog.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                      blog.state === 'PUBLISHED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {blog.state}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {getContentPreview(blog.content)}
                  </p>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    <p>Created: {formatDate(blog.createdAt)}</p>
                    <p className="truncate">/{blog.slug}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/edit/${blog.id}`}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-md hover:bg-gray-100"
                        title="Edit blog"
                      >
                        <Edit size={16} />
                      </Link>
                      
                      <button
                        onClick={() => toggleBlogState(blog)}
                        className="p-2 text-gray-600 hover:text-green-600 transition-colors rounded-md hover:bg-gray-100"
                        title={blog.state === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      >
                        {blog.state === 'PUBLISHED' ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      
                      {blog.state === 'PUBLISHED' && (
                        <Link
                          href={`/blog/${blog.slug}`}
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-md hover:bg-gray-100"
                          title="View published blog"
                          target="_blank"
                        >
                          <ExternalLink size={16} />
                        </Link>
                      )}
                    </div>
                    
                    <button
                      onClick={() => deleteBlog(blog)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors rounded-md hover:bg-gray-100"
                      title="Delete blog"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Authenticator>
      <DashboardContent />
    </Authenticator>
  );
}
