'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import type { Schema } from '@/amplify/data/resource';
import outputs from '../../../../amplify_outputs.json';

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

export default function BlogPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [amplifyConfigured, setAmplifyConfigured] = useState(false);

  useEffect(() => {
    // Configure Amplify first
    try {
      Amplify.configure(outputs);
      setAmplifyConfigured(true);
      console.log('Amplify configured on blog page');
    } catch (error) {
      console.error('Error configuring Amplify:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch blog after Amplify is configured and we have a slug
    if (amplifyConfigured && slug) {
      fetchBlog();
    }
  }, [amplifyConfigured, slug]);

  const fetchBlog = async () => {
    try {
      console.log('Fetching blog by slug:', slug);
      
      const client = generateClient<Schema>();
      
      const { data, errors } = await client.models.Blogs.list({
        filter: {
          slug: { eq: slug },
          state: { eq: 'PUBLISHED' }
        },
        authMode: 'identityPool', // Use identity pool for guest access
      });
      
      console.log('Blog by slug response:', { data, errors });
      
      if (errors) {
        console.error('GraphQL errors:', errors);
      }
      
      const foundBlog = data?.[0];
      if (foundBlog) {
        setBlog(foundBlog);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog...</p>
        </div>
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Not Found</h1>
          <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist or has been unpublished.</p>
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
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
              href="/dashboard" 
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {blog.profileImage && (
            <div className="h-64 md:h-96 bg-gray-200">
              <img 
                src={blog.profileImage} 
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
                  Published {new Date(blog.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                {blog.updatedAt !== blog.createdAt && (
                  <span className="ml-4">
                    • Updated {new Date(blog.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </header>

            <div className="prose prose-lg prose-gray max-w-none">
              {blog.content ? (
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: blog.content
                  }} 
                />
              ) : (
                <p className="text-gray-500 italic">No content available.</p>
              )}
            </div>
          </div>
        </article>

        {/* Related or navigation section */}
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
