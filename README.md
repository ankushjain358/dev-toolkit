# Dev Toolkit

Explain what Dev Toolkit is about

## Tech Stack

## Deployment

Clone the

## Running App Locally

1. Clone the repository on your local machine.
2. Run `npm install` to install dependencies.
3. Configure AWS credentials by running `aws configure` or setting environment variables.
4. Run `npx ampx sandbox` to provision backend infra in AWS.
5. Run `npm run dev` to run the app.
6. Open `http://localhost:3000` with your browser to see the result.

## Deploying to AWS

1. Fork the repository in your GitHub account.
2. Follow the detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/#deploy-a-fullstack-app-to-aws) of our documentation.

## Architecture

## Key Technical Decisions

1. For blog images, CloudFront is configured with `/public` prefix to redirect requests to S3.
2. BlocknoteJS editor inherits CSS from parent, so you can control font size.
3. Amplify Data API
   - The app uses model level authorization rules, and fallsback on global level authorization rule when a model does not have a model-level authorization rule. Refer [Available authorization strategies](https://docs.amplify.aws/nextjs/build-a-backend/data/customize-authz/)
   - When you create a new Blogs item with `allow.owner()` Amplify automatically adds an owner field to your model (even though you don't see it in the schema), and set its value to the current authenticated user's Cognito sub (user identifier). Which means, user can only create items where they will be the owner.
