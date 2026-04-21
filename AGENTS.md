# AI Agent Instructions

## Project summary

- Full-stack app built with **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS v4**, and **AWS Amplify Gen 2**.
- Frontend lives in `src/app` and shared UI primitives are in `src/components/ui`.
- Backend infrastructure is defined in `amplify/` and deployed with Amplify Gen 2 tooling.
- `next.config.ts` depends on `amplify_outputs.json` for remote image domains.
- UI: ShadcnUI components, Tiptap editor, TanStack Query.
- Auth: Cognito with Google OAuth, Profile-based user management.

## Key commands

- `npm install`
- `npm run dev` – start local development server
- `npm run build` – build the Next.js app
- `npm run lint` – run ESLint
- `npx ampx sandbox` – provision local Amplify backend infrastructure

> There is no `npm test` script in this repository.

## Important files and directories

- `package.json` – app scripts, dependencies, lint-staged config
- `next.config.ts` – remote image config using Amplify outputs
- `amplify.yml` – Amplify frontend build pipeline
- `.github/workflows/deploy.yml` – backend deploy workflow for `main` and `develop`
- `amplify_outputs.json` – required for local builds and image domain resolution
- `src/app` – page routes and app layout
- `src/components` – reusable UI components and layout primitives
- `src/lib` – helper utilities and server/client wrappers
- `src/services` – application services and business logic
- `amplify/` – AWS resource definitions for auth, data, storage, and backend infrastructure

## Code Style & Patterns

- Use TypeScript with strict typing; prefer functional components with hooks.
- Use `"use client"` for client components; import React hooks explicitly.
- Use absolute imports with `@/` prefix.
- Use TanStack Query for server state with `QUERY_KEYS` from `@/lib/app-constants`.
- Use `react-hook-form` with `zodResolver` for forms; define Zod schemas outside components.
- For AWS Amplify: Use `generateClient<Schema>()` in browser; use server client for SSR with `runWithAmplifyServerContext`.
- Prefer server-side data fetching for public pages; handle lazy loading with `.data` and try/catch.
- Use ShadcnUI components consistently; apply Tailwind classes; use `cn()` for conditional classes.
- Implement loading states, error handling, and toast notifications.

## Data Models & Validation

- `Blog` - Blog posts with hasMany `BlogTag`.
- `Tag` - Global tags with hasMany `BlogTag`.
- `BlogTag` - Many-to-many join table.
- `Profile` - User profile data.
- Validation: Max 5 tags per blog; tag names 1-50 chars; blog titles 1-200 chars; prevent duplicate tags.

## Deployment and infra notes

- GitHub Actions deploys backend on pushes to `main` and `develop`, then triggers an Amplify webhook.
- `amplify.yml` is used by Amplify CI/CD for frontend builds.
- Local development requires AWS credentials configured via `aws configure` or environment variables.
- Do not change the app build logic without ensuring `amplify_outputs.json` remains available for `next.config.ts`.

## Agent guidance

- Prefer minimal changes; preserve existing architecture and file layout.
- Link to documentation instead of copying it.
- Use `README.md` for setup and deployment details.
- Use `design-docs/` for architecture and deployment guide references.

## Useful links

- [README.md](README.md)
- [design-docs/loading-behavior.md](design-docs/loading-behavior.md)
- [.github/copilot-instructions copy.md](.github/copilot-instructions%20copy.md) – detailed code patterns and conventions
