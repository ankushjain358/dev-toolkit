import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { postConfirmation } from "../auth/post-confirmation/resource";

// *** How allow.ownerDefinedIn works? ***
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

const schema = a
  .schema({
    Tag: a.customType({
      name: a.string().required(),
      slug: a.string().required(),
    }),

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
        tags: a.ref("Tag").array(), // Tags attached to this blog
      })
      .secondaryIndexes((index) => [
        index("slug"), // GSI on slug field for fast lookups
        index("userId"), // GSI on userId to query user's blogs
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("userId"), // Allow signed-in user to create, read, update, and delete their __OWN__ posts.
        allow.guest().to(["read"]), // Guests can read all blogs, filtering done in app logic
      ]),

    TagReferences: a
      .model({
        id: a.id().required(),
        slug: a.string().required(), // Partition key
        ref: a.string().required(), // Sort key pattern: Blog#<blogId>
      })
      .secondaryIndexes((index) => [
        index("slug").sortKeys(["ref"]), // GSI on slug with ref as sort key
        index("ref"), // GSI on ref as partition key
      ])
      .authorization((allow) => [
        allow.authenticated().to(["read", "create", "delete"]),
        allow.guest().to(["read"]),
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
        allow.guest().to(["read"]), // Guests can read all blogs, filtering done in app logic
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
