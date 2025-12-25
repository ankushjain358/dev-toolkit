# Dev Toolkit

Dev Toolkit is a comprehensive productivity platform built with Next.js 15 and AWS Amplify Gen 2. It provides a unified workspace for managing blogs, bookmarks, Notion-style notes, and Kanban boards with auto-save functionality and responsive design.

## Tech Stack

### Frontend

- **Next.js 15** with App Router and Turbopack
- **React 19** with TypeScript
- **Tailwind CSS v4** for styling
- **ShadcnUI** component library
- **Tiptap** rich text editor
- **TanStack Query** for state management
- **React Hook Form** with Zod validation

### Backend

- **AWS Amplify Gen 2** for backend infrastructure
- **Amazon DynamoDB** with GSI for data storage
- **Amazon S3** with CloudFront for file storage
- **Amazon Cognito** for authentication
- **AWS AppSync** GraphQL API

### Development & CI/CD

- **GitHub Actions** for automated deployment
- **ESLint & Prettier** for code quality
- **Husky** for pre-commit hooks
- **Multi-environment deployment** (dev/stage/prod)

## CI/CD Pipeline

The project uses GitHub Actions for automated deployment across multiple environments:

- **Triggers**: Push to `main` (dev), `stage`, or `prod` branches
- **Backend Deployment**: Uses `ampx pipeline-deploy` with branch-specific environments
- **Frontend Deployment**: Triggers Amplify webhook for frontend build
- **AWS Authentication**: OIDC integration for secure deployments
- **Node.js 24.x** runtime with npm caching for faster builds

## Running App Locally

1. Clone the repository on your local machine.
2. Run `npm install` to install dependencies.
3. Configure AWS credentials by running `aws configure` or setting environment variables.
4. Run `npx ampx sandbox` to provision backend infra in AWS.
   > When you deploy a cloud sandbox, Amplify creates an AWS CloudFormation stack following the naming convention of `amplify-<app-name>-<$(whoami)>-sandbox` in your AWS account with the resources configured in your amplify/ folder.
5. Run `npm run dev` to run the app.
6. Open `http://localhost:3000` with your browser to see the result.

## Deploying to AWS

TODO

## Architecture

![System Architecture](./design-docs/architecture.png)

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
