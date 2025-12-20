/* Start: Tailwind section */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/* End: Tailwind section */

import { generateClient } from "aws-amplify/data";
import { getCurrentUser } from "aws-amplify/auth";
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
    const { data } = await client.models.Blogs.listBlogsBySlug({
      slug,
    });
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error("Error checking slug existence:", error);
    return false;
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

export async function initializeUserGetId(): Promise<string> {
  try {
    const user = await getCurrentUser();
    const email = user.signInDetails?.loginId || user.username;
    const userList = await client.models.Users.listUsersByEmail({ email });

    if (userList?.data?.length > 0) {
      return userList.data[0].id;
    }

    throw new Error("User not found after authentication");
  } catch (error) {
    console.error("Error initializing user:", error);
    throw error;
  }
}
