'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import type { Schema } from '@/amplify/data/resource';
import { stripHtml, truncateText, formatDate } from '@/lib/utils';
import outputs from '../../amplify_outputs.json';

interface Blog {
  id: string;
  title: string;
  slug: string;
  content?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  state: 'PUBLISHED' | 'UNPUBLISHED';
}

export default function HomePage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [amplifyConfigured, setAmplifyConfigured] = useState(false);

  useEffect(() => {
    // Configure Amplify first
    try {
      Amplify.configure(outputs);
      setAmplifyConfigured(true);
      console.log('Amplify configured on home page');
    } catch (error) {
      console.error('Error configuring Amplify:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch blogs after Amplify is configured
    if (amplifyConfigured) {
      fetchPublishedBlogs();
    }
  }, [amplifyConfigured]);

  const fetchPublishedBlogs = async () => {
    try {
      console.log('Fetching published blogs...');
      
      const client = generateClient<Schema>();
      
      const { data, errors } = await client.models.Blogs.list({
        filter: {
          state: {
            eq: 'PUBLISHED'
          }
        },
        authMode: 'identityPool', // Use identity pool for guest access
      });
      
      console.log('Published blogs response:', { data, errors });
      
      if (errors) {
        console.error('GraphQL errors:', errors);
      }
      
      // Sort by creation date, newest first
      const sortedBlogs = (data || []).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setBlogs(sortedBlogs);
    } catch (error) {
      console.error('Error fetching published blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentPreview = (content?: string): string => {
    if (!content) return 'Click to read more...';
    const plainText = stripHtml(content);
    return truncateText(plainText, 150);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blogs...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Dev Toolkit Blog</h1>
              <p className="text-gray-600 mt-1">Discover the latest in development and technology</p>
            </div>
            <Link 
              href="/dashboard" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">No blogs published yet</h2>
              <p className="text-gray-500 mb-6">Be the first to share your thoughts and ideas!</p>
              <Link 
                href="/dashboard" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Start Writing
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Featured/Latest Blog */}
            {blogs.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Post</h2>
                <article className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="md:flex">
                    {blogs[0].profileImage && (
                      <div className="md:w-1/2 h-64 md:h-auto bg-gray-200">
                        <img 
                          src={blogs[0].profileImage} 
                          alt={blogs[0].title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className={`p-8 ${blogs[0].profileImage ? 'md:w-1/2' : 'w-full'}`}>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        <Link 
                          href={`/blog/${blogs[0].slug}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {blogs[0].title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {getContentPreview(blogs[0].content)}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-500 text-sm">
                          {formatDate(blogs[0].createdAt)}
                        </p>
                        <Link 
                          href={`/blog/${blogs[0].slug}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Read more →
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            )}

            {/* Other Blog Posts */}
            {blogs.length > 1 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">More Posts</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {blogs.slice(1).map((blog) => (
                    <article key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                          <Link 
                            href={`/blog/${blog.slug}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {blog.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {getContentPreview(blog.content)}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-gray-500 text-sm">
                            {formatDate(blog.createdAt)}
                          </p>
                          <Link 
                            href={`/blog/${blog.slug}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Read more →
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Dev Toolkit Blog. Built with Next.js and AWS Amplify.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
