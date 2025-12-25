# Tag Management Design (Amplify Gen2)

## Overview

This document describes the **tag management design** for the Amplify Gen2 application using a **DynamoDB-native inverted index approach**, **custom types**, and **no Lambda functions**.

The design supports:

- Attaching multiple tags to a blog
- Reusing tags across blogs (and future entities like videos)
- Efficient public queries like: `/tag/{slug}`
- Simple write logic without maintaining a global Tags master table

---

## Goals

- Avoid joins and GSIs where possible
- Optimize for **read performance** on public pages
- Keep write logic simple and client-driven
- Avoid maintaining a centralized Tags registry
- Stay within Amplify Gen2 + AppSync capabilities (no Lambda)

---

## Non‑Goals

- Tag renaming support
- Tag moderation or approval workflows
- Tag analytics (popularity, SEO metadata)

These can be added later if required.

---

## Core Idea

1. **Store tags directly on the Blog item** as a structured attribute
2. Maintain a separate **TagReferences table** as an inverted index
3. Keep both in sync at write time (attach / detach)
4. Treat tag slugs as **immutable identifiers**

---

## Custom Type Definition

### Tag Type

```ts
Tag: a.customType({
  name: a.string().required(),
  slug: a.string().required(),
});
```

This type is embedded inside other models (e.g., Blogs).

---

## Data Models

### Blogs Model

```ts
Blogs: a.model({
  id: a.id().required(),
  userId: a.string().required(),
  title: a.string().required(),
  slug: a.string().required(),
  state: a.enum(["UNPUBLISHED", "PUBLISHED"]),
  contentJson: a.string(),
  contentHtml: a.string(),
  coverImage: a.string(),

  // Tags attached to this blog
  tags: a.ref("Tag").array(),
}).authorization((allow) => [
  allow.ownerDefinedIn("userId"),
  allow.guest().to(["read"]),
]);
```

### Notes

- Tags are **embedded** for fast blog reads
- No master Tags table exists
- Tags are treated as value objects

---

### TagReferences Model (Inverted Index)

```ts
TagReferences: a.model({
  id: a.id().required(),
  slug: a.string().required(), // Partition key
  ref: a.string().required(), // Sort key pattern: Blog#<blogId>
})
  .secondaryIndexes((index) => [
    index("slug").sortKeys(["ref"]), // GSI on slug with ref as sort key
  ])
  .authorization((allow) => [
    allow.authenticated().to(["create", "delete"]),
    allow.guest().to(["read"]),
  ]);
```

---

## Key Design Decisions

### 1. No Tags Master Table

**Why?**

- Avoids global contention
- Simplifies writes
- Supports organic, user-driven tagging

Tags are identified purely by their `slug`.

---

### 2. Slug as Partition Key

```text
PK (slug): "dynamodb"
SK (ref): "Blog#123"
```

This allows:

- Fast lookup of all blogs for a tag
- Easy extension to other entities:
  - `Video#456`
  - `Article#789`

---

---

## Write Flows

### Attach Tags to Blog

1. User enters tag names in UI
2. Slug is generated (client-side)
3. Blog item is updated:
   - `tags` attribute replaced
4. For each new tag:
   - Create `TagReferences` item

---

### Detach Tags from Blog

1. Identify removed tags
2. Update `Blogs.tags`
3. Delete corresponding `TagReferences` items

---

## Query Patterns

### Public: Blogs by Tag

```ts
listTagReferencesBySlug({
  slug: "dynamodb",
});
```

Client filters:

```ts
state === "PUBLISHED";
```

---

### Blog Read

- Single read from `Blogs`
- Tags already embedded

---

## Slug Generation Rules

To avoid duplicates and inconsistencies:

```ts
function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
```

Rules:

- Lowercase only
- Hyphen separated
- Slug is immutable

---

## Authorization Summary

| Model         | Authenticated | Guest |
| ------------- | ------------- | ----- |
| Blogs         | Owner CRUD    | Read  |
| TagReferences | Create/Delete | Read  |

> No direct updates on TagReferences (delete + recreate instead).

---

## Consistency Model

- Multi-item writes are **eventually consistent**
- Client must retry failed operations
- Periodic reconciliation can be added later if needed

---

## Trade-offs

### Pros

- Extremely fast reads
- Simple public queries
- No joins or GSIs
- No Lambda required

### Cons

- No transactional guarantees
- Tag renames are expensive
- Requires disciplined slug generation

---

## Future Extensions

- `TagMeta` table for SEO & analytics
- Admin-only tag moderation
- Background cleanup job

---

## Conclusion

This design follows **DynamoDB best practices** for many-to-many relationships using inverted indexes and denormalization. It is well-suited for content-heavy, read-optimized applications and aligns cleanly with Amplify Gen2 capabilities.

---

**Status:** Approved for implementation
