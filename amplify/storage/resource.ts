import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'blogStorage',
  access: (allow) => ({
    'blogs/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
  }),
});
