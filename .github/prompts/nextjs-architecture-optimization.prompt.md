Description: Set up Playwright in the project and create a minimal working test.

Arguments: None

---

# Next.js Architecture Optimization

## Goal

Analyze my Next.js application and recommend how to reduce API calls, improve performance, and lower AWS costs while maintaining SEO and scalability.

---

## Context

- Framework: Next.js 15 (App Router)
- Hosting: AWS Amplify
- Backend: AWS AppSync (GraphQL)
- Type: Blog/content-driven website with admin panel

---

## Current Problem

Each page load triggers multiple API calls:

- Header → API call
- Footer → API call
- Page content → API call

Result:

- ~3 API calls per page load
- High cost and latency at scale

---

## Constraints

- Content updates are infrequent
- SEO is important
- Need low latency and cost efficiency
- Admin panel required for content updates

---

## Tasks

### 1. Architecture Recommendation

Suggest the best approach:

- Optimize existing Next.js app
- Full static React app (S3 + CloudFront)
- Hybrid approach (SSG + ISR + SSR)

Provide pros/cons and final recommendation.

---

### 2. API Optimization

Suggest how to:

- Avoid repeated API calls for header/footer
- Share data across layouts/pages
- Use caching effectively

---

### 3. Next.js Best Practices

Recommend usage of:

- fetch caching (`force-cache`, `revalidate`)
- Incremental Static Regeneration (ISR)
- Static generation
- Layout-level data fetching

---

### 4. Caching Strategy

Propose:

- CDN caching (CloudFront)
- Edge caching
- AppSync caching (if applicable)
- Cache invalidation strategy

---

### 5. Admin vs Frontend Separation

Recommend:

- Single app vs separate apps
- Deployment strategy for:
  - Admin (dynamic)
  - Frontend (static or hybrid)

---

### 6. Build & Deployment

Explain:

- How to handle updates without full rebuild
- ISR vs full static regeneration strategy

---

### 7. Cost Optimization

Compare:

- Current API-heavy approach
- Cached + ISR approach
- Fully static hosting

---

### 8. Migration Plan

Provide step-by-step plan for:

- Optimizing current Next.js app OR
- Migrating to static/hybrid architecture

---

## Output Format

- Clear recommendation (1–2 approaches)
- Concise explanation of trade-offs
- Practical, production-ready suggestions
- Optional: simple architecture diagram (text)

---

## Notes

- Avoid over-engineering
- Focus on reducing API calls and cost
- Keep solution scalable and maintainable
