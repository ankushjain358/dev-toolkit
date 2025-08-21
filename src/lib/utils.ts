import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';

const client = generateClient<Schema>();

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export async function generateUniqueSlug(baseTitle: string): Promise<string> {
  let slug = generateSlug(baseTitle);
  let counter = 1;
  
  while (await slugExists(slug)) {
    slug = `${generateSlug(baseTitle)}-${counter}`;
    counter++;
  }
  
  return slug;
}

export async function slugExists(slug: string): Promise<boolean> {
  try {
    const { data } = await client.models.Blogs.list({
      filter: { slug: { eq: slug } }
    });
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking slug existence:', error);
    return false;
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export type Nullable<T> = T | null;