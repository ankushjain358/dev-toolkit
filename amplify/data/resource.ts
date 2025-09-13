import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { postConfirmation } from "../auth/post-confirmation/resource";

const schema = a
  .schema({
    Users: a
      .model({
        id: a.id().required(),
        email: a.string().required(),
        cognito_subs: a.string().array().required(),
        createdAt: a.datetime(),
        updatedAt: a.datetime(),
      })
      .secondaryIndexes((index) => [
        index("email"), // GSI on email field
      ])
      .authorization((allow) => [allow.authenticated()]),

    Blogs: a
      .model({
        id: a.id().required(), // This will be the BLOGID
        userId: a.string().required(),
        title: a.string().required(),
        slug: a.string().required(),
        state: a.enum(["UNPUBLISHED", "PUBLISHED"]),
        contentJson: a.string(), // JSON content from Tiptap
        contentHtml: a.string(), // HTML content from Tiptap
        profileImage: a.string(), // S3 key for cover image
        createdAt: a.datetime().required(),
        updatedAt: a.datetime().required(),
      })
      .secondaryIndexes((index) => [
        index("slug"), // GSI on slug field for fast lookups
        index("userId"), // GSI on userId to query user's blogs
      ])
      .authorization((allow) => [
        allow.authenticated(),
        allow.guest().to(["read"]), // Guests can read all blogs, filtering done in app logic
      ]),
  })
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
