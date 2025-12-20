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

## Code Quality & Hooks ✅

To keep code consistent and maintainable, this project uses the following tools:

- **ESLint** — static code analysis to catch problems and enforce code style rules.
- **Prettier** — automatic code formatting to keep formatting consistent across the project.
- **Husky + lint-staged** — runs linters and Prettier on changed files as a pre-commit hook, ensuring only linted/formatted files are committed.

### Running hooks / tools manually

- Run the pre-commit hooks manually:

  ```bash
  git hook run pre-commit
  ```

- Format the repository (warning: may take a while for larger projects):

  ```bash
  npx prettier . --write
  ```

  You can scope formatting to a directory or file to save time, e.g.:

  ```bash
  prettier --write app/
  prettier --write app/components/Button.js
  ```

- Run ESLint with auto-fix:

  ```bash
  eslint . --fix
  ```

> Tip: Run `npx prettier . --write` followed by `eslint . --fix` to format and fix code before committing.

## Key Technical Decisions

1. For blog images, CloudFront is configured with `/public` prefix to redirect requests to S3.
2. BlocknoteJS editor inherits CSS from parent, so you can control font size.
3. Amplify Data API
   - The app uses model level authorization rules, and fallsback on global level authorization rule when a model does not have a model-level authorization rule. Refer [Available authorization strategies](https://docs.amplify.aws/nextjs/build-a-backend/data/customize-authz/)
   - When you create a new Blogs item with `allow.owner()` Amplify automatically adds an owner field to your model (even though you don't see it in the schema), and set its value to the current authenticated user's Cognito sub (user identifier). Which means, user can only create items where they will be the owner.
