import { defineStorage } from "@aws-amplify/backend";

// Note:
// 1. For /public prefix, only write and delete access is needed, as read will be done via CloudFront

export const storage = defineStorage({
  name: "AppStorage",
  access: (allow) => ({
    // Blog-related images (cover images, content images)
    "public/blogs/*": [
      allow.authenticated.to(["write", "delete"]), // Authenticated users can manage blog images
    ],

    // User profile images (avatars)
    "public/users/{entity_id}/*": [
      // {entity_id} is the token that is replaced with the user identity id (identity pool id)
      allow.entity("identity").to(["write", "delete"]),
    ],
  }),
});
