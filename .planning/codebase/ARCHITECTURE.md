# Architecture

**Analysis Date:** 2026-01-22

## Pattern Overview

**Overall:** Hybrid Full-Stack Architecture with Headless Backend

This codebase combines a React SPA frontend (deployed as static HTML) with serverless edge functions (Vercel Functions) serving as the backend. Data persistence uses Supabase (PostgreSQL + Auth + Realtime) with vector search for AI-powered matching. The system supports multiple user roles (consumers, companies, admins) with different feature sets and data models.

**Key Characteristics:**
- Frontend and backend deployed separately (Vite SPA + Vercel Functions)
- Edge runtime functions for performance-critical operations
- Supabase for authentication, authorization, and data storage
- Vector embeddings for semantic matching (profile-to-job matching)
- Role-based access control through environment-based admin checks
- API routes as Vercel serverless functions under `/api` directory
- Client-side routing with React Router v6

## Layers

**Frontend (React/Vite):**
- Purpose: User interface layer serving desktop and mobile clients
- Location: `src/`
- Contains: Pages, components, contexts, hooks, utilities, types
- Depends on: Supabase client, external APIs (Stripe, N8N webhooks), custom library functions
- Used by: End users, admins via web browsers

**Backend API Layer (Serverless):**
- Purpose: Business logic and data processing via HTTP endpoints
- Location: `api/`
- Contains: Vercel Functions using Node.js edge runtime
- Depends on: Supabase service client, OpenAI API, Stripe API, external services
- Used by: Frontend via fetch, webhooks from N8N, external systems

**Data Layer (Supabase):**
- Purpose: Persistent data storage, authentication, and real-time subscriptions
- Handles: User accounts, profiles, jobs, companies, matches, credits
- Storage: PostgreSQL with vector extensions (pgvector) for embeddings
- Auth: Supabase Auth with email/password and OAuth (Google)

**Business Logic Libraries:**
- Purpose: Reusable AI/ML and matching algorithms
- Location: `src/lib/` (shared utilities), `api/` (server-side logic)
- Contains: Matching engine, embeddings, ranking, enrichment, scraping

## Data Flow

**User Profile Creation Flow:**

1. User navigates to `/directory/create` (NetworkCreateProfilePage)
2. Frontend collects profile data through multi-step form
3. User submits; frontend calls `/api/` endpoint or direct Supabase insert
4. Backend generates embedding via OpenAI API: `api/enrich-profile.ts`
5. Embedding stored in `network_profiles.embedding` (vector column)
6. Admin notified via N8N webhook
7. After approval, profile becomes searchable and matchable

**Job Matching Flow:**

1. Company posts job via `/company/dashboard` → `api/submit-job.ts`
2. Backend analyzes job spec: `api/analyze-job.ts` (or `api/analyse-job.ts`)
3. Job embedding generated
4. Backend performs vector search against profile embeddings
5. Matches ranked via Claude AI: `api/match-job.ts`
6. Company sees matches in dashboard or receives notifications

**Authentication Flow:**

1. User visits `/directory/auth` (NetworkAuthPage)
2. Frontend calls Supabase Auth (email/password or Google OAuth)
3. Supabase returns session and user object
4. AuthContext stores user state across app
5. Protected pages check useAuth() hook for authorization
6. API endpoints verify Bearer token using Supabase service client

**State Management:**

- Local React state in components for UI state (forms, modals, loading)
- Supabase Auth for session/user state (AuthContext wraps app)
- Direct Supabase queries via client library (no Redux/Zustand)
- Webhook-driven updates from N8N for job posting and enrichment
- Vector database for semantic state (embeddings enable matching)

## Key Abstractions

**AuthContext & useAuth Hook:**
- Purpose: Global authentication state and auth methods
- Location: `src/contexts/AuthContext.tsx`
- Pattern: React Context Provider + custom hook
- Provides: user, session, signUp, signIn, signInWithGoogle, signOut
- Used by: Protected pages check user existence, routes redirect to auth

**Supabase Client Wrapper:**
- Purpose: Centralized data access and utility functions
- Location: `src/lib/supabase.ts` (38KB, primary integration layer)
- Exports: createProfile, getProfileByUserId, uploadImage, getJobs, submitJob, etc.
- Handles: Auth token management, image uploads, profile enrichment triggers

**Matching Engine:**
- Purpose: Semantic matching between profiles and jobs
- Location: `src/lib/matching-engine.ts`
- Pattern: Vector search + AI ranking
- Dependencies: Supabase embeddings, Claude API

**Embeddings Generator:**
- Purpose: Convert profile/job text to vector representations
- Location: `src/lib/embeddings.ts`
- Providers: OpenAI text-embedding-3-small
- Used by: Profile enrichment, job analysis, similarity search

**Profile Enrichment:**
- Purpose: Auto-fill and enhance profile data from external sources
- Location: `src/lib/profile-enrichment.ts`
- Sources: Web scraping (`src/lib/scraper.ts`), web search (`src/lib/web-search.ts`)
- Used by: Network profile creation (auto-fill button)

## Entry Points

**Frontend:**
- Location: `src/App.tsx`
- Triggers: Browser loads `https://[domain]/` or any route
- Responsibilities: Routes all URLs to appropriate page components, manages mobile nav state

**Pages (Routing):**
- Company flow: `/company/auth` → `/company/register` → `/company/dashboard`
- Network flow: `/directory/auth` → `/directory/create` → `/directory/profile/:slug` → `/directory/dashboard`
- Admin flow: `/admin` → AdminDashboardPage
- Hiring flow: `/discover-talent` → HirePage (job posting/matching)
- Public pages: `/`, `/resources`, `/collaborations`, `/team`, `/partners`

**API Entry Points:**
- Profiles: `api/enrich-profile.ts`, `api/enrich-profiles.ts`, `api/enrich-profile-by-name.ts`
- Jobs: `api/submit-job.ts`, `api/analyze-job.ts`, `api/match-job.ts`, `api/parse-job-spec.ts`
- Admin: `api/admin/profiles.ts`, `api/admin/companies.ts`, `api/admin/jobs.ts`, `api/admin/pending-matches.ts`
- Company: `api/company/checkout.ts` (Stripe), `api/company/credits.ts`
- Messages: `api/messages/send.ts`, `api/messages/conversation.ts`, `api/messages/unread-count.ts`
- Webhooks: `api/webhooks/stripe.ts` (payment completion)

## Error Handling

**Strategy:** Fail gracefully, validate early, log server-side

**Patterns:**
- Frontend: Try-catch blocks around async operations, display user-friendly error messages
- API: Return HTTP status codes (400, 401, 403, 404, 500) with JSON error objects
- Auth: Redirect to login if token invalid; Supabase Auth handles session refresh
- Database: Return specific error messages; admin pages show pending item counts even if fetch fails
- External APIs (OpenAI, Stripe): Retry logic with exponential backoff if available; fallback graceful degradation

**Example Error Response:**
```json
{
  "error": "Method not allowed",
  "status": 405
}
```

## Cross-Cutting Concerns

**Logging:**
- Frontend: console.log/error used throughout (no structured logging framework)
- API: console.log with `[ENDPOINT_NAME]` prefix (e.g., `[ENRICH-PROFILE]`)
- No centralized log aggregation detected

**Validation:**
- Frontend: HTML5 input validation + custom validation on form submission
- API: Zod schema validation (e.g., `EnrichProfileRequest` in `api/enrich-profile.ts`)
- Database: Constraints at table level, RLS (Row Level Security) policies in Supabase

**Authentication:**
- Frontend: AuthContext provides useAuth() hook to check session
- API: Bearer token verification via `supabase.auth.getUser(accessToken)`
- Admin: Admin check function reads `ADMIN_USER_IDS` env var (comma-separated)
- Company: Company ownership validated before operations

**Authorization:**
- Profile pages: Check `user.id` matches profile `user_id` before edit
- Admin endpoints: isAdmin() function checks `ADMIN_USER_IDS`
- Company endpoints: Verify company ownership via user's company association
- Message endpoints: Verify sender/recipient are valid users

**Rate Limiting:**
- Not detected; relies on Vercel Functions default limits

**Webhooks:**
- N8N integration for profile approval notifications
- Stripe webhook at `api/webhooks/stripe.ts` for payment events
- Outgoing webhooks triggered after state changes (e.g., job submission)

---

*Architecture analysis: 2026-01-22*
