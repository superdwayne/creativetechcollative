# External Integrations

**Analysis Date:** 2026-01-22

## APIs & External Services

**AI & ML:**
- OpenAI (text-embedding-3-small, GPT-4o, GPT-4o-mini)
  - SDK/Client: `@ai-sdk/openai` via Vercel AI SDK
  - Auth: `OPENAI_API_KEY`
  - Usage: Vector embeddings for profile/job similarity matching, job analysis streaming
  - Models: text-embedding-3-small (1536 dimensions, ~$0.02 per 1M tokens)
  - Rate limits: 3,000 RPM, 1,000,000 TPM on free tier

- Anthropic Claude
  - SDK/Client: `@ai-sdk/anthropic` via Vercel AI SDK
  - Auth: `ANTHROPIC_API_KEY`
  - Usage: Job matching analysis, match ranking, profile enrichment
  - Model: claude-sonnet-4-20250514 (cost-effective for analysis)
  - Rate limits: 60 RPM, 100,000 TPM on free tier
  - Pricing: ~$3/$15 per 1M tokens (input/output)

**Job Analysis:**
- Workflow endpoints (`api/analyze-job.ts`, `api/analyse-job.ts`)
  - Streams job analysis from GPT-4o to client
  - Deducts analysis credits from company account
  - Performs vector similarity search against profiles
  - Optionally searches web for member portfolio info (optional, disabled by default)

## Data Storage

**Databases:**
- PostgreSQL (via Supabase)
  - Connection: Environment variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client)
  - Client: `@supabase/supabase-js` 2.90.1
  - Tables:
    - `network_profiles` - User profiles with embeddings, focus areas, skills
    - `companies` - Company data
    - `job_submissions` - Job postings
    - `job_matches` - Matching results between profiles and jobs
    - `company_analysis_credits` - Credit tracking for job analyses
    - `analysis_usage_logs` - Audit trail for credit usage
    - `admins` - Admin email list
    - `email_templates` - Email notification templates
    - `email_services` - Email service configuration
  - Features:
    - pgvector extension enabled for similarity search (cosine similarity, 1536 dimensions)
    - Vector search function: `find_similar_profiles(query_embedding, match_limit, similarity_threshold)`
    - Migrations stored in `supabase/migrations/`

**File Storage:**
- Supabase Storage
  - Bucket: `profile-images`
  - Upload functions: `uploadImage()`, `deleteImage()` in `src/lib/supabase.ts`
  - Max file size: 5MB
  - Allowed formats: JPG, PNG, GIF, WebP
  - Public URL access enabled

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in)
  - Implementation: OAuth2 and email/password
  - Client-side: `supabase.auth.getUser()`, OTP signup/login
  - Email confirmation flow: Sends verification email, redirect to `/directory/auth?mode=login`

**Admin Access:**
- Role-based via `ADMIN_USER_IDS` environment variable
  - Comma-separated UUID list of authorized admin users
  - Implementation: `isAdmin(userId)` helper in `api/match-job.ts`
  - Admin functions in `api/admin/*.ts` routes

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, DataDog, etc. integration)

**Logs:**
- Console logging throughout API routes
- Structured log prefixes: `[ANALYZE-JOB]`, `[MATCH-JOB]`, `[STRIPE-WEBHOOK]`, etc.
- Log levels: info, warn, error
- Example: `api/analyze-job.ts` logs timing, credit checks, search results

## CI/CD & Deployment

**Hosting:**
- Vercel - Full stack hosting
  - Frontend built from Vite
  - Serverless functions from `/api` directory
  - Environment variables managed in Vercel dashboard

**CI Pipeline:**
- Not detected (no GitHub Actions, CircleCI config found)

## Environment Configuration

**Required env vars:**

**Supabase (Database):**
- `VITE_SUPABASE_URL` - Client-side project URL
- `VITE_SUPABASE_ANON_KEY` - Client-side anonymous key
- `SUPABASE_URL` - Server-side project URL (same as VITE_)
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side service role (full permissions)

**AI APIs:**
- `OPENAI_API_KEY` - OpenAI API key for embeddings and GPT-4o
- `ANTHROPIC_API_KEY` - Claude API key for job matching

**Payments:**
- `STRIPE_SECRET_KEY` - Stripe secret API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature verification

**Admin:**
- `ADMIN_USER_IDS` - Comma-separated UUIDs of admin users
- Example: `uuid1,uuid2,uuid3`

**Webhooks:**
- `VITE_N8N_BASIC_AUTH_USERNAME` - n8n HTTP authentication username
- `VITE_N8N_BASIC_AUTH_PASSWORD` - n8n HTTP authentication password

**Features:**
- `VITE_TEST` - Set to TRUE for test webhook endpoints (default FALSE)
- `ENABLE_WEB_SEARCH` - Set to true to search web for member profiles (default false, saves API costs)
- `USE_GPT4O` - Set to true to use GPT-4o instead of GPT-4o-mini (default false, more expensive)
- `USE_CLAUDE_SONNET` - Set to true to use Claude Sonnet for matching (experimental)
- `TEST_MODE` - Set to TRUE for test mode in review-match endpoint
- `N8N_BASIC_AUTH_USERNAME` - n8n webhook auth (also used server-side)
- `N8N_BASIC_AUTH_PASSWORD` - n8n webhook auth (also used server-side)

**Secrets location:**
- Development: `.env` (local, not committed)
- Production: Vercel environment variables dashboard
- Config example: `.env.example` in repository root

## Webhooks & Callbacks

**Incoming:**

Stripe Webhooks (`api/webhooks/stripe.ts`):
- Endpoint: `POST /api/webhooks/stripe`
- Signature verification via `STRIPE_WEBHOOK_SECRET`
- Events handled: `checkout.session.completed` (and others implied)
- Action: Updates `company_analysis_credits` with purchased credits
- Logs to `analysis_usage_logs` table

**Outgoing:**

N8N Workflow Webhooks (`src/lib/supabase.ts`, `api/review-match.ts`):
- Base URL: `https://n8n.creativetechnologists.nl/webhook` (production) or `/webhook-test` (test mode)
- Test webhook base: `https://n8n.creativetechnologists.nl/webhook-test`
- Auth: Basic HTTP authentication (username/password in env vars)
- Endpoints:
  - `POST /webhook/profile-approval` - Notifies admin when new profile created (name, email, slug, profile URL)
  - `POST /webhook/resources` - Always uses production endpoint
  - `POST /webhook/mailinglist` - Sign-ups notification
  - `POST /webhook/match-review` - Notifies n8n when match approved/rejected (in `api/review-match.ts`)
- Proxy: Vite dev server proxies `/api/webhook*` to n8n instances

Vite Dev Proxy Configuration:
- `/api/webhook` → `https://n8n.creativetechnologists.nl/webhook`
- `/api/webhook-test` → `https://n8n.creativetechnologists.nl/webhook-test`
- `/api/*` → `http://localhost:3000` (Vercel dev server)

## Credit System

**Company Analysis Credits:**
- Table: `company_analysis_credits`
- Fields: `free_analyses_remaining`, `purchased_credits`
- Deduction: `api/analyze-job.ts` deducts 1 credit after successful streaming
- Purchase: `api/company/checkout.ts` creates Stripe checkout session
- Bundles:
  - Basic (Starter Pack): 10 credits for $29
  - Popular (Growth Pack): 25 credits for $59
  - Pro (Scale Pack): 50 credits for $99
- Purchase flow: Company initiates checkout → Stripe session created → User completes payment → Webhook updates credits

## API Routes

**Public:**
- `POST /api/analyze-job` - Analyze job posting (requires company_id, returns streaming response)
- `POST /api/match-job` - Find matches for job (requires jobId, admin only)
- `POST /api/parse-job-spec` - Parse job requirements (Claude-based)
- `POST /api/enrich-profile` - Enrich single profile with AI (embeddings)
- `POST /api/enrich-profiles` - Batch enrich multiple profiles (5-minute timeout)
- `POST /api/enrich-profile-by-name` - Search and enrich by name via web search
- `POST /api/enrich-profile-search` - Search for profile info
- `POST /api/update-profile-enrichment` - Update enrichment data
- `POST /api/generate-embeddings` - Generate embeddings for all profiles (batch, 5-minute timeout)
- `POST /api/submit-job` - Submit job posting
- `POST /api/review-match` - Review and approve/reject match

**Admin:**
- `GET /api/admin/jobs` - List all jobs
- `GET /api/admin/profiles` - List all profiles
- `GET /api/admin/companies` - List companies
- `GET /api/admin/matches` - List matches
- `GET /api/admin/pending-matches` - List pending matches
- `POST /api/admin/jobs/reject` - Reject job
- `POST /api/admin/profiles/approve` - Approve profile
- `POST /api/admin/profiles/reject` - Reject profile
- `POST /api/admin/companies/verify` - Verify company
- `POST /api/admin/grant-credits` - Grant bonus credits
- `GET /api/admin/credit-usage` - View credit usage
- `POST /api/admin/enrich-profile-web` - Web search enrichment (admin)

**Webhooks:**
- `POST /api/webhooks/stripe` - Stripe payment webhook

## Messages/Messaging

**Conversation API:**
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversation` - Get conversation history
- `GET /api/messages/unread-count` - Get unread message count
- `GET /api/messages/unread-status` - Get unread status per conversation

---

*Integration audit: 2026-01-22*
