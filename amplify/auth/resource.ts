import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    // TODO: Configure Google OAuth when environment variables are set up
    // externalProviders: {
    //   google: {
    //     clientId: process.env.GOOGLE_CLIENT_ID!,
    //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //     scopes: ['email', 'profile'],
    //   },
    //   callbackUrls: [
    //     'http://localhost:3000/dashboard',
    //     'https://main.d1234567890.amplifyapp.com/dashboard', // Update with your actual domain
    //   ],
    //   logoutUrls: [
    //     'http://localhost:3000/',
    //     'https://main.d1234567890.amplifyapp.com/', // Update with your actual domain
    //   ],
    // },
  },
});
