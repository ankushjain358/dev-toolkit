import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data";
import { cookies } from "next/headers";
import type { Schema } from "@/../amplify/data/resource";
import outputs from "../../amplify_outputs.json";

export const serverClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
  authMode: "apiKey",
});

// Helper function to get published blogs for server-side rendering
export async function getPublishedBlogs() {
  try {
    console.log("Fetching published blogs from server...");

    const { data, errors } = await serverClient.models.Blog.list({
      filter: {
        state: {
          eq: "PUBLISHED",
        },
      },
    });

    // console.log('Server client response:', { data, errors });

    if (errors) {
      console.error("GraphQL errors:", errors);
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching published blogs:", error);
    return [];
  }
}

// Helper function to get a blog by slug for server-side rendering
export async function getBlogBySlug(slug: string) {
  try {
    console.log("Fetching blog by slug:", slug);

    const { data, errors } = await serverClient.models.Blog.list({
      filter: {
        slug: { eq: slug },
        state: { eq: "PUBLISHED" },
      },
    });

    console.log("Blog by slug response:", { data, errors });

    if (errors) {
      console.error("GraphQL errors:", errors);
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    return null;
  }
}

// Helper function to get tags for a given blog id (server-side)
export async function getTagsForBlog(blogId: string) {
  try {
    const { data: blogTagData, errors: blogTagErrors } =
      await serverClient.models.BlogTag.list({
        filter: { blogId: { eq: blogId } },
      });

    if (blogTagErrors) {
      console.error("GraphQL errors fetching BlogTag:", blogTagErrors);
    }

    const blogTags = blogTagData || [];
    const tags: Array<any> = [];

    for (const bt of blogTags) {
      try {
        const { data: tagData, errors: tagErrors } =
          await serverClient.models.Tag.get({ id: bt.tagId });
        if (tagErrors) {
          console.error("GraphQL errors fetching Tag:", tagErrors);
          continue;
        }
        if (tagData) tags.push(tagData);
      } catch (err) {
        console.error("Error fetching tag for blogTag", bt, err);
      }
    }

    return tags;
  } catch (error) {
    console.error("Error fetching tags for blog:", error);
    return [];
  }
}
