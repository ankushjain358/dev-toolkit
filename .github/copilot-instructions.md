# GitHub Copilot Instructions - Dev Toolkit (Updated)

> Last updated: 2026-01-10 — keep concise and focused; only include instructions that help generate correct, secure, and maintainable code for this repository.

## Assistant identity and behavior ✅

- When asked for your name, respond: **"GitHub Copilot"**.
- When asked about the model you're using, respond: **"Raptor mini (Preview)"**.
- Keep answers **short and impersonal**.
- If asked to generate harmful or disallowed content, respond with: **"Sorry, I can't assist with that."**
- Provide preambles at milestones: keep them short (1–2 sentences), state your finding or what you'll do next, and vary openings (e.g., "Let me…", "Proceeding to…"). Use preambles for milestone events (setup complete, fix implemented, testing finished, wrap-up).

## Project Overview

Next.js 15 blog platform with AWS Amplify Gen 2, TypeScript, Tailwind CSS v4, and ShadcnUI components.

## Tech Stack & Architecture

- **Frontend**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4
- **Backend**: AWS Amplify Gen 2, DynamoDB, S3, Cognito, AppSync GraphQL
- **UI**: ShadcnUI components, Tiptap editor, TanStack Query
- **Auth**: Cognito with Google OAuth, Profile-based user management

## Code Style & Patterns

### General Rules

- Use TypeScript with strict typing
- Prefer functional components with hooks
- Use `"use client"` for client components
- Import React hooks explicitly: `import { useState, useEffect } from "react"`
- Use absolute imports with `@/` prefix

### Component Structure

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/../amplify/data/resource";

const client = generateClient<Schema>();

export default function ComponentName() {
  // Component logic
}
```

### State Management

- Use TanStack Query for server state with `QUERY_KEYS` from `@/lib/app-constants`
- Use `useState` for local component state
- Use `useRef` for DOM references and mutable values
- Always invalidate queries after mutations

### Form Handling

- Use `react-hook-form` with `zodResolver` for validation
- Define Zod schemas outside components
- Use ShadcnUI Form components for consistent styling

```tsx
const schema = z.object({
  name: z.string().min(1, "Required").max(50, "Too long"),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { name: "" },
});
```

### AWS Amplify Patterns

- **Client (browser)**: use `generateClient<Schema>()` for GraphQL operations.
- **Server (Next.js SSR)**: use `@aws-amplify/adapter-nextjs` + `generateServerClientUsingCookies` and `runWithAmplifyServerContext` to construct a per-request server client.
- Prefer server-side data fetching for public pages (use `serverClient.models.Blog.list` with `authMode: 'apiKey'` or `'identityPool'` for guest access).
- Handle lazy loading using relationship helpers (`await data.relationship()`), or use the `BlogTag -> Tag` flow server-side to minimize round-trips.
- Access lazy-loaded data via `.data` property and always use try/catch for errors.
- When renaming models, update `amplify/data/resource.ts` and fix all usages (`server-client`, pages, and components), then re-run any codegen or build steps you use.

### UI Components

- Use ShadcnUI components consistently
- Apply Tailwind classes for styling
- Use `cn()` utility for conditional classes
- Implement loading states and error handling
- Use toast notifications for user feedback

### File Organization

- `/app` - Next.js App Router pages
- `/components/ui` - ShadcnUI components
- `/components/layout` - Layout components
- `/lib` - Utilities and constants
- `/amplify` - Backend configuration

---

## Editor (Tiptap) Recommendations ✍️

- Use `tiptap-markdown` for markdown interoperability. Configuration tips:
  - `transformPastedText: true` to convert pasted markdown into structured nodes.
  - `tightLists: true` and `tightListClass: 'tight'` to produce compact list HTML (remember to add corresponding `.tiptap ul.tight` CSS rules).
- Use `@tiptap/extension-code-block-lowlight` + `lowlight` for code blocks and syntax highlighting; import a Highlight.js theme (e.g., `github.css`) in `globals.css`.
- Prefer plugin-based paste conversion over custom paste handlers unless you need special behavior.

---

## Specific Patterns

### Blog Management

- Maximum 5 tags per blog
- Auto-save every 15 seconds with debouncing
- Separate save buttons for content and tags
- Use lazy loading for blog-tag relationships

### Authentication

- Use Cognito sub as userId
- Profile model for user data
- Post-confirmation lambda creates profiles
- Protected routes with authentication checks

### Data Models

- `Blog` - Blog posts with hasMany `BlogTag` relationship (use singular model names)
- `Tag` - Global tags with hasMany `BlogTag` relationship
- `BlogTag` - Many-to-many join table
- `Profile` - User profile data

### Query Keys

```tsx
QUERY_KEYS = {
  CURRENT_USER_ID: ["currentUserId"],
  BLOGS: (userId?: string) => (userId ? ["blogs", userId] : ["blogs"]),
  TAGS: ["tags"],
};
```

### Error Handling

- Use toast notifications for user feedback
- Console.error for debugging
- Graceful fallbacks for missing data
- Validate data before operations

### Performance

- Use lazy loading for relationships
- Avoid expensive list operations
- Implement proper loading states
- Cache queries with TanStack Query

## Common Operations

### Creating Records

```tsx
const { data: newRecord } = await client.models.ModelName.create({
  field: value,
});
```

### Updating Records

```tsx
await client.models.ModelName.update({
  id: recordId,
  field: newValue,
});
```

### Querying with Relationships

```tsx
const { data } = await client.models.Blog.get({ id });
const tags = await data.tags();
```

### File Uploads

```tsx
await uploadData({
  path: `public/folder/${filename}`,
  data: file,
}).result;
```

## Validation Rules

- Maximum 5 tags per blog
- Tag names: 1-50 characters
- Blog titles: 1-200 characters
- Prevent duplicate tag names (by slug)
- Validate tag existence before saving

## UI Guidelines

- Use consistent spacing with Tailwind classes
- Implement proper loading and disabled states
- Show clear error messages and validation feedback
- Use badges for tags, buttons for actions
- Maintain responsive design patterns

## Security & Best Practices

- Use model-level authorization in Amplify
- Validate user permissions before operations
- Sanitize user inputs
- Use environment variables for sensitive data
- Implement proper error boundaries

---

## Quick Troubleshooting Tips

- **Tiptap paste becomes code block:** ensure `transformPastedText` is enabled on the Markdown plugin.
- **Syntax highlight not showing:** verify you imported the Highlight.js CSS theme in `globals.css` and restart the dev server.
- **`loading.tsx` appears during SSR:** expected when a route segment suspends; consider static/ISR or narrower suspense boundaries.

## Testing Considerations

- Test authentication flows
- Validate form submissions
- Test lazy loading scenarios
- Verify query invalidation
- Test file upload functionality
