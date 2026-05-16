import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import outputs from "@/../amplify_outputs.json";
import type { Schema } from "@/../amplify/data/resource";

// =============================================================================
// Types
// =============================================================================

export type Blog = Schema["Blog"]["type"];
export type Profile = Schema["Profile"]["type"];
export type Tag = Schema["Tag"]["type"];

export interface BlogWithAuthor extends Blog {
  author?: Profile | null;
}

/** Shape returned by getBlogDetail — includes resolved CDN URLs */
export type BlogDetail = {
  blog: Blog;
  author: Profile | null;
  tags: Tag[];
  avatarUrl: string | undefined;
  coverImageUrl: string | undefined;
};

/** Shape returned by getTagWithBlogs */
export type TagDetail = {
  tag: Tag;
  blogs: BlogWithAuthor[];
};

export type SiteSettingsData = {
  id: string;
  siteName: string;
  tagline: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  bannerTitle: string;
  bannerDescription: string;
  email: string;
  website: string;
  twitterUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  instagramUrl: string;
  aboutPhotoUrl: string;
  aboutText: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  googleAnalyticsId: string;
  keywords: string;
};

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  id: "default",
  siteName: "Dev Toolkit",
  tagline: "A comprehensive productivity platform",
  logoLightUrl: "",
  logoDarkUrl: "",
  faviconUrl: "",
  bannerTitle: "Welcome to Dev Toolkit",
  bannerDescription: "Manage your blogs, bookmarks, and notes in one place",
  email: "",
  website: "",
  twitterUrl: "",
  linkedinUrl: "",
  githubUrl: "",
  instagramUrl: "",
  aboutPhotoUrl: "",
  aboutText: "",
  metaTitle: "Dev Toolkit",
  metaDescription: "A comprehensive productivity platform",
  ogImageUrl: "",
  googleAnalyticsId: "",
  keywords: "",
};

const dynamoRegion =
  outputs.data?.aws_region ||
  process.env.AWS_REGION ||
  process.env.NEXT_PUBLIC_AWS_REGION ||
  "us-east-1";

const cdnBase = `https://${outputs.custom.distributionDomainName}`;

// DynamoDB GSI names
const GSI_BLOG_BY_SLUG = "blogsBySlug";
const GSI_BLOGTAG_BY_BLOG_ID = "gsi-Blog.tags";
const GSI_BLOGTAG_BY_TAG_ID = "gsi-Tag.blogs";

// DynamoDB client
const dynamoDbClient = new DynamoDBClient({ region: dynamoRegion });
const documentClient = DynamoDBDocumentClient.from(dynamoDbClient);

// =============================================================================
// Methods
// =============================================================================

/**
 * Returns the slugs of all published blogs.
 * Used by generateStaticParams to pre-render blog detail pages at build time.
 */
export async function getPublishedBlogSlugs(): Promise<string[]> {
  const { Items } = await documentClient.send(
    new ScanCommand({
      TableName: outputs.custom.blogTableName,
      FilterExpression: "#st = :published",
      ExpressionAttributeNames: { "#st": "state" },
      ExpressionAttributeValues: { ":published": "PUBLISHED" },
      ProjectionExpression: "slug",
    }),
  );

  return (Items ?? [])
    .map((item) => item.slug as string | undefined)
    .filter((slug): slug is string => !!slug);
}

/**
 * Fetches a published blog by slug together with its author profile and tags.
 * Resolves CDN URLs for avatar and cover image.
 * Returns null when no matching published blog is found.
 */
export async function getBlogDetail(slug: string): Promise<BlogDetail | null> {
  // --- 1. Find the blog by slug using the GSI ---
  const { Items: blogItems } = await documentClient.send(
    new QueryCommand({
      TableName: outputs.custom.blogTableName,
      IndexName: GSI_BLOG_BY_SLUG,
      KeyConditionExpression: "slug = :slug",
      FilterExpression: "#st = :published",
      ExpressionAttributeNames: { "#st": "state" },
      ExpressionAttributeValues: { ":slug": slug, ":published": "PUBLISHED" },
      Limit: 1,
    }),
  );

  const blog = blogItems?.[0] as Blog | undefined;
  if (!blog) return null;

  // --- 2. Fetch author profile and BlogTag rows in parallel ---
  const [profileResult, blogTagResult] = await Promise.all([
    documentClient.send(
      new GetCommand({
        TableName: outputs.custom.profileTableName,
        Key: { userId: blog.userId },
      }),
    ),
    documentClient.send(
      new QueryCommand({
        TableName: outputs.custom.blogTagTableName,
        IndexName: GSI_BLOGTAG_BY_BLOG_ID,
        KeyConditionExpression: "blogId = :bid",
        ExpressionAttributeValues: { ":bid": blog.id },
      }),
    ),
  ]);

  const author = (profileResult.Item as Profile | undefined) ?? null;
  const blogTags = blogTagResult.Items ?? [];

  // --- 3. Fetch each Tag by its primary key in parallel ---
  const tagResults = await Promise.all(
    blogTags.map((bt) =>
      documentClient.send(
        new GetCommand({
          TableName: outputs.custom.tagTableName,
          Key: { id: bt.tagId },
        }),
      ),
    ),
  );

  const tags = tagResults
    .map((r) => r.Item as Tag | undefined)
    .filter((t): t is Tag => t !== undefined);

  // --- 4. Resolve CDN URLs ---
  const avatarUrl = author?.avatarUrl
    ? `${cdnBase}/${author.avatarUrl}`
    : undefined;
  const coverImageUrl = blog.coverImage
    ? `${cdnBase}/${blog.coverImage}`
    : undefined;

  return { blog, author, tags, avatarUrl, coverImageUrl };
}

/**
 * Fetches published blogs with their author profiles.
 * Used for listing pages (e.g. homepage, blogs index).
 */
export async function getPublishedBlogsWithAuthors(
  limit = 9,
): Promise<BlogWithAuthor[]> {
  const [{ Items: blogItems }, { Items: profileItems }] = await Promise.all([
    documentClient.send(
      new ScanCommand({ TableName: outputs.custom.blogTableName }),
    ),
    documentClient.send(
      new ScanCommand({ TableName: outputs.custom.profileTableName }),
    ),
  ]);

  const blogs = (blogItems ?? []) as Blog[];
  const profiles = (profileItems ?? []) as Profile[];

  const profileByUserId = new Map<string, Profile>();
  profiles.forEach((profile) => {
    if (profile?.userId) profileByUserId.set(profile.userId, profile);
  });

  return blogs
    .filter((blog) => blog.state === "PUBLISHED")
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, limit)
    .map((blog) => ({ ...blog, author: profileByUserId.get(blog.userId) }));
}

/**
 * Returns { tagId, tagSlug } pairs for all tags that have at least one published blog.
 * Used by generateStaticParams to pre-render tag pages at build time.
 */
export async function getPublishedTagParams(): Promise<
  { tagId: string; tagSlug: string }[]
> {
  const { Items } = await documentClient.send(
    new ScanCommand({
      TableName: outputs.custom.tagTableName,
      ProjectionExpression: "id, slug",
    }),
  );

  return (Items ?? [])
    .filter(
      (item): item is { id: string; slug: string } => !!item.id && !!item.slug,
    )
    .map((item) => ({ tagId: item.id, tagSlug: item.slug }));
}

/**
 * Fetches a tag by its primary key together with all published blogs under it.
 * Returns null when the tag does not exist.
 */
export async function getTagWithBlogs(
  tagId: string,
): Promise<TagDetail | null> {
  // --- 1. Fetch the tag by primary key ---
  const { Item } = await documentClient.send(
    new GetCommand({
      TableName: outputs.custom.tagTableName,
      Key: { id: tagId },
    }),
  );

  const tag = Item as Tag | undefined;
  if (!tag) return null;

  // --- 2. Fetch all BlogTag rows for this tag ---
  const { Items: blogTagItems } = await documentClient.send(
    new QueryCommand({
      TableName: outputs.custom.blogTagTableName,
      IndexName: GSI_BLOGTAG_BY_TAG_ID,
      KeyConditionExpression: "tagId = :tid",
      ExpressionAttributeValues: { ":tid": tagId },
    }),
  );

  const blogTags = blogTagItems ?? [];

  // --- 3. Fetch each Blog by primary key in parallel ---
  const blogResults = await Promise.all(
    blogTags.map((bt) =>
      documentClient.send(
        new GetCommand({
          TableName: outputs.custom.blogTableName,
          Key: { id: bt.blogId },
        }),
      ),
    ),
  );

  const publishedBlogs = blogResults
    .map((r) => r.Item as Blog | undefined)
    .filter((b): b is Blog => b?.state === "PUBLISHED");

  // --- 4. Fetch author profiles for all published blogs in parallel ---
  const profileResults = await Promise.all(
    publishedBlogs.map((blog) =>
      documentClient.send(
        new GetCommand({
          TableName: outputs.custom.profileTableName,
          Key: { userId: blog.userId },
        }),
      ),
    ),
  );

  const blogs: BlogWithAuthor[] = publishedBlogs
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .map((blog, i) => ({
      ...blog,
      author: (profileResults[i].Item as Profile | undefined) ?? null,
    }));

  return { tag, blogs };
}

/**
 * Fetches site-wide settings from DynamoDB.
 * Falls back to DEFAULT_SITE_SETTINGS if no record exists.
 */
export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const result = await documentClient.send(
      new ScanCommand({
        TableName: outputs.custom.siteSettingsTableName,
        Limit: 1,
      }),
    );

    const item = result.Items?.[0] as SiteSettingsData | undefined;
    if (!item) return DEFAULT_SITE_SETTINGS;

    return {
      id: String(item.id ?? "default"),
      siteName: String(item.siteName ?? ""),
      tagline: String(item.tagline ?? ""),
      logoLightUrl: String(item.logoLightUrl ?? ""),
      logoDarkUrl: String(item.logoDarkUrl ?? ""),
      faviconUrl: String(item.faviconUrl ?? ""),
      bannerTitle: String(item.bannerTitle ?? ""),
      bannerDescription: String(item.bannerDescription ?? ""),
      email: String(item.email ?? ""),
      website: String(item.website ?? ""),
      twitterUrl: String(item.twitterUrl ?? ""),
      linkedinUrl: String(item.linkedinUrl ?? ""),
      githubUrl: String(item.githubUrl ?? ""),
      instagramUrl: String(item.instagramUrl ?? ""),
      aboutPhotoUrl: String(item.aboutPhotoUrl ?? ""),
      aboutText: String(item.aboutText ?? ""),
      metaTitle: String(item.metaTitle ?? ""),
      metaDescription: String(item.metaDescription ?? ""),
      ogImageUrl: String(item.ogImageUrl ?? ""),
      googleAnalyticsId: String(item.googleAnalyticsId ?? ""),
      keywords: String(item.keywords ?? ""),
    };
  } catch (error) {
    console.error("getSiteSettings DynamoDB error:", error);
    return DEFAULT_SITE_SETTINGS;
  }
}
