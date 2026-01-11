import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { postConfirmation } from "../auth/post-confirmation/resource";

const schema = a
  .schema({
    Blogs: a
      .model({
        id: a.id().required(), // This will be the BLOGID
        userId: a.string().required(),
        title: a.string().required(),
        slug: a.string().required(),
        state: a.enum(["UNPUBLISHED", "PUBLISHED"]),
        contentJson: a.string(), // JSON content from Tiptap
        contentHtml: a.string(), // HTML content from Tiptap
        coverImage: a.string(), // S3 key for cover image
      })
      .authorization((allow) => [
        allow.ownerDefinedIn("userId"), // Allow signed-in user to create, read, update, and delete their __OWN__ posts.
        allow.guest().to(["read"]), // Guests can read all blogs, filtering done in app logic
      ]),
    Blog: a
      .model({
        id: a.id().required(), // This will be the BLOGID
        userId: a.string().required(),
        title: a.string().required(),
        slug: a.string().required(),
        state: a.enum(["UNPUBLISHED", "PUBLISHED"]),
        contentJson: a.string(), // JSON content from Tiptap
        contentHtml: a.string(), // HTML content from Tiptap
        coverImage: a.string(), // S3 key for cover image
        // Add relationship field to the join model with the reference of `blogId`
        tags: a.hasMany("BlogTag", "blogId"),
      })
      .secondaryIndexes((index) => [
        index("slug"), // GSI on slug field for fast lookups
        index("userId"), // GSI on userId to query user's blogs
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("userId"), // Allow signed-in user to create, read, update, and delete their __OWN__ posts.
        allow.publicApiKey().to(["read"]), // Public API key can read all blogs, filtering done in app logic
      ]),

    Tag: a
      .model({
        id: a.id().required(),
        name: a.string().required(),
        slug: a.string().required(),
        // Add relationship field to the join model with the reference of `tagId`
        blogs: a.hasMany("BlogTag", "tagId"),
      })
      .authorization((allow) => [
        allow.authenticated().to(["read", "create", "delete"]),
        allow.publicApiKey().to(["read"]),
      ]),
    BlogTag: a
      .model({
        // 1. Create reference fields to both ends of the many-to-many relationship
        blogId: a.id().required(),
        tagId: a.id().required(),
        // 2. Create relationship fields to both ends of the many-to-many relationship using their
        // respective reference fields
        blog: a.belongsTo("Blog", "blogId"),
        tag: a.belongsTo("Tag", "tagId"),
      })
      .authorization((allow) => [
        allow.authenticated().to(["read", "create", "delete"]),
        allow.publicApiKey().to(["read"]),
      ]),

    // SiteSettings: a
    //   .model({
    //     // Tenant boundary
    //     siteId: a.string(),

    //     // Branding
    //     logoUrl: a.string(),
    //     faviconUrl: a.string(),

    //     // Home page
    //     homeBannerTitle: a.string(),
    //     homeBannerSubtitle: a.string(),
    //     homeBannerImageUrl: a.string(),
    //     tagline: a.string(),

    //     // About page
    //     aboutTitle: a.string(),
    //     aboutSubtitle: a.string(),
    //     aboutDescription: a.string(),

    //     // Social links (explicit fields)
    //     twitterUrl: a.string(),
    //     linkedinUrl: a.string(),
    //     instagramUrl: a.string(),
    //     facebookUrl: a.string(),
    //     youtubeUrl: a.string(),
    //     githubUrl: a.string(),

    //     // SEO
    //     metaTitle: a.string(),
    //     metaDescription: a.string(),
    //   })
    //   .identifier(["siteId"])
    //   .authorization((allow) => [
    //     allow.authenticated().to(["read", "create", "update"]),
    //     allow.guest().to(["read"]),
    //   ]),

    Profile: a
      .model({
        userId: a.string().required(),
        displayName: a.string(),
        bio: a.string(),
        avatarUrl: a.string(),
        location: a.string(),
        website: a.string(),
        twitterUrl: a.string(),
        linkedinUrl: a.string(),
        githubUrl: a.string(),
      })
      .identifier(["userId"])
      .authorization((allow) => [
        allow.ownerDefinedIn("userId"), // Allow signed-in user to create, read, update, and delete their __OWN__ posts.
        allow.publicApiKey().to(["read"]),
      ]),
  })
  // [Global authorization rule]
  .authorization((allow) => [allow.resource(postConfirmation)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

// References
// 1. Model a "many-to-many" relationship
// https://docs.amplify.aws/react/build-a-backend/data/data-modeling/relationships/#model-a-many-to-many-relationship
//
// 2. How allow.ownerDefinedIn works?
// You cannot create items for other users - Amplify enforces that the owner field value must match the current authenticated user's Cognito sub.
// This authorization enforcement happens at the VTL (Velocity Template Language) level in AppSync.
//
// ## Check if userId matches current user's cognito sub
// #if( $ctx.identity.sub != $ctx.args.input.userId )
//   $util.unauthorized()
// #end
//
// With allow.owner("userId"):
// User can only create blogs where userId = their Cognito sub
// User can only read/update/delete blogs where userId = their Cognito sub
