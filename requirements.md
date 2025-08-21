You need to build a **Next.js application** using **AWS Amplify Gen 2** ([https://docs.amplify.aws/](https://docs.amplify.aws/)).
The application will have **two parts**:

---

### **1. Public Website** (SEO-friendly, server-side rendered using App Router)

* Displays all **published blogs**.
* Each blog should be accessible via `/blog/<slug>` (SEO-friendly).
* Before saving a blog, check if the slug already exists. If it does, warn the user.
* Create a **GSI** in DynamoDB on `slug` for fast lookups.
* Use a clean layout with **Tailwind CSS**, and optimize for **SEO**.

---

### **2. User Dashboard** (authenticated area, client-side only — SEO not required)

#### Authentication

* Implement login/registration via **Amazon Cognito** using the **Authenticator component**.
* ⚠️ Do **not** use Cognito `sub` directly in the `Blogs` table.
* Instead, create a **Users table** in DynamoDB that maps:

  * `id` (internal unique user ID, to be used across entities)
  * `cognito_sub`
  * `email`
* Handle the case where the same email registers via different OAuth providers (Cognito may create multiple users). In that case, ensure both map to the same internal `id`.

#### Blog Management (CRUD)

* Users can create, edit, publish/unpublish, and delete blogs.
* Blog states: **Unpublished** and **Published**.
* **On Create**

  * First ask for a **title**.
  * Generate a **BLOGID**.
  * Create an initial blog entry (title, BLOGID, slug).
* **Blog Editor**

  * Use **Tiptap** for editing blog content.
  * Allow optional **profile picture upload**.
  * Support **auto-save**:

    * Auto-save when the user stops typing.
    * Do **not** save if there are no content changes.
    * On auto-save, update `updatedAt` in DB.
    * Show **ephemeral toast notifications** (`toastr` + **Lucide icons**).
* **Publishing**

  * Users can **self-publish immediately** (no moderation).

---

### **3. Image Uploads**

* Use **Amplify Gen 2 Storage category**.
* Configure **Authenticated Users** with **write permissions only** (no direct read).
* Store images in S3 under:

  ```
  s3://<bucket>/public/blogs/<BLOGID>/img_<unique>.png
  ```
* Configure Tiptap editor to upload images into the respective blog folder.
* Serving will later be done via **CloudFront**, but for now just implement raw uploads.

---

### **4. Data Layer (DynamoDB)**

* Use **Amplify Gen 2 Data category**.
* **Users table**: manages internal `id` mapping to Cognito `sub` + email.
* **Blogs table**: stores blog data (BLOGID, userId, title, slug, state, content, profile image, timestamps).
* Add **GSI on slug** for fast lookups.

---

### **5. General Requirements**

* Use **Tailwind CSS** for styling.
* Use **Zod** for validations.
* Use **Toastr + Lucide icons** for user notifications.
* Public pages must follow **SEO best practices**.
* Dashboard can be a client component (SEO not required).


## Answered clarifying questions
- Auto merge in DynamoDB, no need to ask user to choose one. We just store 3 things, ID, email, list of cognito subs. Create GSI on email to check if its a new user or existing one, if new add new record, else update cognito sub in list.  Use this table's id elsewhere.
- Store blog as markdown (later we can also store JSON in S3, but not now)
- Yes, 15 seconds after they stop typing
- Its not author picture, its blogs cover photo kind of thing.
- Google only, no default cognito.
- Slugs should be auto generated.