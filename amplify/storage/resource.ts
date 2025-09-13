import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "AppStorage",
  access: (allow) => ({
    "public/blogs/*": [
      allow.authenticated.to(["read", "write", "delete"]),
      // allow.guest.to(['read']),
    ],
  }),
});
