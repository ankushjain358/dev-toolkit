import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/data';
import { cookies } from 'next/headers';
import type { Schema } from '@/../amplify/data/resource';
import outputs from '../../amplify_outputs.json';

export const serverClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
  authMode: 'identityPool', // Use identity pool for guest access
});

// Helper function to get published blogs for server-side rendering
export async function getPublishedBlogs() {
  try {
    console.log('Fetching published blogs from server...');
    
    const { data, errors } = await serverClient.models.Blogs.list({
      filter: {
        state: {
          eq: 'PUBLISHED'
        }
      },
      authMode: 'identityPool', // Explicitly use identity pool for guest access
    });
    
    console.log('Server client response:', { data, errors });
    
    if (errors) {
      console.error('GraphQL errors:', errors);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching published blogs:', error);
    return [];
  }
}

// Helper function to get a blog by slug for server-side rendering
export async function getBlogBySlug(slug: string) {
  try {
    console.log('Fetching blog by slug:', slug);
    
    const { data, errors } = await serverClient.models.Blogs.list({
      filter: {
        slug: { eq: slug },
        state: { eq: 'PUBLISHED' }
      },
      authMode: 'identityPool', // Explicitly use identity pool for guest access
    });
    
    console.log('Blog by slug response:', { data, errors });
    
    if (errors) {
      console.error('GraphQL errors:', errors);
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    return null;
  }
}
