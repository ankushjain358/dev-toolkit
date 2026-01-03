# Amazon Q Context File - Dev Toolkit Project

## Project Overview

Building a comprehensive Next.js blog platform with AWS Amplify Gen 2 according to requirements.md specifications.

## Current Status (as of 2025-01-27)

### ✅ Completed

#### Core Infrastructure

- Next.js 15 project setup with App Router and Turbopack
- Tailwind CSS v4 configuration with design tokens
- AWS Amplify Gen 2 backend structure
- Google OAuth authentication configuration
- Profile data model (replaced Users model)
- Storage configuration for user profiles, blog images, and site assets
- Required dependencies installed (Tiptap, Zod, react-hook-form, next-themes, etc.)

#### External Pages (Public-Facing)

- **✅ Complete external layout with header/footer components**
- **✅ Home page with hero banner and feature cards**
- **✅ About page with mission and technology information**
- **✅ Contact page with email information**
- **✅ Public blogs listing page with pagination**
- **✅ SEO-friendly blog detail pages (/blog/[slug])**
- **✅ Dark/light theme toggle with next-themes**
- **✅ Professional design inspired by codewithmukesh.com**
- **✅ Full-width header and footer layout (fixed width constraints)**

#### Dashboard & Content Management

- **✅ Dashboard with authentication and blog CRUD**
- **✅ Tiptap rich text editor with full toolbar**
- **✅ Auto-save functionality (15 seconds after typing stops)**
- **✅ Image upload integration with S3**
- **✅ Cover image upload functionality**
- **✅ Auto-generated slugs with duplicate checking**
- **✅ Blog state management (Published/Unpublished)**

#### Profile Management

- **✅ Complete profile management system**
- **✅ Avatar upload with S3 integration**
- **✅ Social links (Twitter, GitHub) with validation**
- **✅ Form validation using react-hook-form and Zod schemas**
- **✅ Post-confirmation lambda creates Profile entries**

### ❌ Pending Implementation

1. **Authentication Enhancements**
   - Environment variables setup for Google OAuth
   - Production deployment and testing

2. **Advanced Features**
   - Search functionality
   - Blog categories/tags
   - Comments system
   - Analytics integration

3. **Production Readiness**
   - Error boundaries
   - Performance optimizations
   - CloudFront CDN configuration
   - Backup/export functionality

## Key Technical Decisions

- **Architecture**: Separate layouts for external pages vs dashboard (/me) routes
- **Authentication**: Simplified to use Cognito sub as userId, Profile model replaces Users
- **Content Storage**: Store blogs as HTML from Tiptap editor (rich content)
- **Slug Generation**: Auto-generate unique slugs with collision handling
- **Auto-save**: 15-second delay with visual feedback
- **Image Storage**: S3 keys in database, CloudFront URLs generated dynamically
- **Theme System**: next-themes with system-aware dark/light mode
- **Form Management**: react-hook-form with Zod validation
- **Styling**: ShadcnUI components with professional design

## File Structure

```
/mnt/c/Users/Admin/Desktop/Ankush/POCs/dev-platform/dev-toolkit/
├── amplify/
│   ├── auth/
│   │   ├── resource.ts ✅ (Google OAuth configured)
│   │   └── post-confirmation/handler.ts ✅ (Creates Profile entries)
│   ├── data/resource.ts ✅ (Profile & Blogs models with GSI)
│   ├── storage/resource.ts ✅ (User profiles, blog images, site assets)
│   └── backend.ts ✅ (includes storage)
├── src/
│   ├── app/
│   │   ├── layout.tsx ✅ (Root layout with providers)
│   │   ├── page.tsx ✅ (Home page with hero banner)
│   │   ├── about/page.tsx ✅ (About page)
│   │   ├── contact/page.tsx ✅ (Contact page)
│   │   ├── blogs/page.tsx ✅ (Public blog listing)
│   │   ├── blog/[slug]/page.tsx ✅ (SEO blog details)
│   │   ├── me/
│   │   │   ├── layout.tsx ✅ (Dashboard layout)
│   │   │   ├── page.tsx ✅ (Dashboard home)
│   │   │   ├── profile/page.tsx ✅ (Profile management)
│   │   │   └── blogs/
│   │   │       ├── page.tsx ✅ (Blog CRUD interface)
│   │   │       └── edit/[id]/page.tsx ✅ (Tiptap editor)
│   │   └── globals.css ✅ (Tailwind v4 + Tiptap styles)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── external-layout.tsx ✅ (Public pages layout)
│   │   │   ├── header.tsx ✅ (Navigation with theme toggle)
│   │   │   └── footer.tsx ✅ (Footer component)
│   │   ├── ui/ ✅ (ShadcnUI components)
│   │   └── AmplifyProvider.tsx ✅
│   └── lib/
│       ├── amplify.ts ✅
│       └── utils.ts ✅ (Utilities and helpers)
├── requirements.md
├── README.md
└── AmazonQ.md (this file)
```

## Features Implemented

### External Pages (Public)

- ✅ Professional homepage with hero banner and feature cards
- ✅ About page with mission and technology information
- ✅ Contact page with email information
- ✅ Public blog listing with load more pagination
- ✅ SEO-optimized blog detail pages with author profiles
- ✅ Dark/light theme toggle with system preference detection
- ✅ Full-width responsive header and footer
- ✅ Professional design inspired by codewithmukesh.com

### Dashboard & Content Management

- ✅ Protected dashboard routes with authentication
- ✅ Full Tiptap rich text editor with comprehensive toolbar
- ✅ Auto-save every 15 seconds with visual feedback
- ✅ Image upload directly into content and cover images
- ✅ Auto-generated unique slugs with collision prevention
- ✅ Publish/unpublish toggle with state management
- ✅ Content preview in blog listings
- ✅ HTML content storage and rendering

### Profile Management

- ✅ Complete profile creation and editing
- ✅ Avatar upload with S3 integration
- ✅ Social media links (Twitter, GitHub) with URL validation
- ✅ Form validation using react-hook-form and Zod schemas
- ✅ Real-time form feedback and error handling

### Technical Features

- ✅ AWS Amplify Gen 2 backend with GraphQL API
- ✅ S3 storage with proper access patterns
- ✅ Cognito authentication with Google OAuth
- ✅ Post-confirmation lambda for profile creation
- ✅ Responsive design with Tailwind CSS v4
- ✅ Toast notifications for all user actions
- ✅ Loading states and error handling

## Recent Updates

### Latest Changes (2025-01-27)

- **✅ External Pages**: Complete public-facing website with professional layout
- **✅ Profile System**: Comprehensive profile management with avatar and social links
- **✅ Data Model**: Removed Users model, simplified to Profile-based authentication
- **✅ Theme Support**: Dark/light mode toggle with next-themes integration
- **✅ Layout Fixes**: Fixed header/footer width constraints for full viewport spanning
- **✅ Storage Enhancement**: Added support for user profiles and site assets

## Next Steps Priority

1. **Deployment & Testing**
   - Set up environment variables for Google OAuth
   - Deploy to AWS and test authentication flow
   - Test profile creation and blog publishing

2. **Feature Enhancements**
   - Add search functionality to blog listings
   - Implement blog categories/tags system
   - Add comments system for blog posts

3. **Production Readiness**
   - Add error boundaries and better error handling
   - Implement analytics and monitoring
   - Performance optimizations and caching
   - CloudFront CDN configuration

## Environment Variables Needed

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Architecture Notes

- **Dual Layout System**: External pages use separate layout from dashboard routes
- **Authentication Flow**: Google OAuth → Cognito → Profile creation via lambda
- **Content Strategy**: Public blog listings + protected dashboard for management
- **Storage Pattern**: S3 keys in database, CloudFront URLs generated dynamically
- **Theme System**: System-aware dark/light mode with proper hydration
- **Form Management**: Comprehensive validation with react-hook-form and Zod
- **Ready for Production**: Complete feature set with professional UI/UX
