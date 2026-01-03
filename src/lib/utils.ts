/* Start: Tailwind section */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/* End: Tailwind section */

import { generateClient } from "aws-amplify/data";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Schema } from "@/../amplify/data/resource";

const client = generateClient<Schema>();

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generates a unique slug from a title, avoiding conflicts with existing blogs
 * @param baseTitle - The blog title to convert to slug
 * @param blogId - Optional blog ID to exclude from uniqueness check (for updates)
 * @returns Promise<string> - A unique slug
 */
export async function generateUniqueSlug(
  baseTitle: string,
  blogId?: string,
): Promise<string> {
  let slug = generateSlug(baseTitle);
  let counter = 1;

  while (true) {
    const [exists, existingId] = await slugExists(slug);
    // Break if slug doesn't exist OR if it belongs to the same blog being updated
    if (!exists || existingId === blogId) break;

    slug = `${generateSlug(baseTitle)}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Checks if a slug exists in the database
 * @param slug - The slug to check
 * @returns Promise<[boolean, string | null]> - Tuple of [exists, blogId]
 */
export async function slugExists(
  slug: string,
): Promise<[boolean, string | null]> {
  try {
    const { data } = await client.models.Blogs.listBlogsBySlug({
      slug,
    });

    if ((data?.length || 0) > 0) {
      return [true, data[0].id]; // Return existence and blog ID
    }
    return [false, null]; // Slug is available
  } catch (error) {
    console.error("Error checking slug existence:", error);
    return [false, null];
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export type Nullable<T> = T | null;

export async function convertToHTML(editor: any) {
  const contentHtml = await editor.blocksToFullHTML(editor.document);
  const fixedHtml = contentHtml.replace(
    /<p class="bn-inline-content"><\/p>/g,
    '<p class="bn-inline-content"><br></p>',
  );
  return fixedHtml;
}

export async function getUserInfo(): Promise<{
  identityId: string;
  userId: string;
}> {
  try {
    const data = await fetchAuthSession();

    if (!data.identityId) throw new Error("No identityId found");

    if (!data.userSub) throw new Error("No userSub found");

    return { identityId: data.identityId, userId: data.userSub };
  } catch (error) {
    console.error("Error fetching identity ID:", error);
    throw error;
  }
}
