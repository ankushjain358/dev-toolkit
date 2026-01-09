# Loading fallback behavior in Next.js App Router (why `loading.tsx` appears during SSR)

## Summary ✅

This note explains why `src/app/loading.tsx` is displayed even for Server Components (SSR) and outlines how to verify and mitigate the behavior.

---

## How it works (brief)

- The App Router uses **suspense boundaries** for async server components and streams HTML while waiting for data.
- When a route segment suspends (e.g., an `async` server component awaits data), Next renders the route's `loading.tsx` fallback for that segment while the content is generated.
- Client-side navigation to another route also triggers `loading.tsx` for the target route while the server renders it.

---

## Common causes

- Server component performs network/database/API calls per request (e.g., calling Amplify server APIs in-page). These calls are `await`ed inside the server component.
- Heavy or slow operations inside the server component or nested async components.
- Client components or request-specific data (cookies/session) prevent prefetching and slow navigation.

---

## How to confirm

- Check Network panel when navigating: the route request will be pending while `loading.tsx` shows.
- Add logs to your async data calls to see when they start/finish relative to the UI.
- Inspect the DOM to ensure the route segment is the one showing the fallback.

---

## Options / Fixes (choose depending on page needs)

1. Static / ISR for public content (best for `/blogs`):

```ts
// in page component
export const dynamic = "force-static";
// or use revalidate for ISR
export const revalidate = 60; // seconds
```

2. Reduce server suspension:

- Cache responses or move heavy work off the request path.
- Use `fetch(..., { next: { revalidate } })` and/or incremental builds.

3. Narrow suspense boundaries

- Break page into smaller server components and render critical UI first; move heavy sections to separate segments so the loading fallback covers only those parts.

4. Less-intrusive fallback

- Make `src/app/loading.tsx` small (inline spinner or subtle skeleton) or implement per-segment fallback files (e.g., `app/blogs/loading.tsx`) for localized UI.

5. Client navigation improvements

- Ensure Link prefetching is enabled (or use `prefetch={true}`) where possible. Note: prefetch may be disabled if a route needs request-only context.

6. Server-side auth flows

- For auth-guarded pages (using `runWithAmplifyServerContext`), suspending on the server is expected. Consider using middleware/session checks to short-circuit redirects.

---

## Recommendation

- For public listings (like `/blogs`) use **static or ISR** to avoid per-request suspension and remove visible loading fallback. For per-user or authenticated pages keep server rendering but reduce the visible impact with a subtler `loading.tsx` or per-segment skeletons.

---

## Quick checklist to apply

- [ ] Decide whether page can be static/ISR
- [ ] If yes: add `export const dynamic = "force-static"` or `export const revalidate = <secs>` and test
- [ ] If keeping SSR: split heavy pieces, add localized loading fallbacks, and reduce sync work
- [ ] Restart dev server and verify navigation

---

## References

- Next.js App Router docs (loading and suspense): https://nextjs.org/docs/app/building-your-application/routing/loading-ui
- Next.js data fetching / ISR docs: https://nextjs.org/docs/app/building-your-application/data-fetching

---

_Created on 2026-01-10 (project-specific guidance)_
