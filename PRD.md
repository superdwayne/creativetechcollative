# PRD: AI-Powered Job Matching Engine for CTC Network Directory

## Introduction

Build an intelligent job matching engine that allows registered companies to submit job specifications and receive AI-curated matches from the Creative Technologists Collective directory. The system uses semantic understanding via vector embeddings and Claude AI to match job requirements with member capabilities—even inferring skills from portfolio context that members haven't explicitly listed.

The matching engine will be API-first (no UI initially), with an admin review workflow before introductions are facilitated.

## Goals

- Enable companies to register accounts and submit structured job specifications
- Generate rich semantic embeddings for all member profiles (including scraped portfolio data)
- Build a matching engine that understands context beyond explicit skills/keywords
- Surface top candidates with AI-generated explanations for why they match
- Provide admin interface to review matches before facilitating introductions
- Store all job submissions and match results for analytics and improvement

## User Stories

### US-001: Enable pgvector extension in Supabase
**Description:** As a developer, I need the pgvector extension enabled so I can store and query vector embeddings for semantic search.

**Acceptance Criteria:**
- [x] Create migration to enable pgvector extension (`CREATE EXTENSION IF NOT EXISTS vector`)
- [x] Migration runs successfully in Supabase
- [x] Verify extension is active with test query
- [x] Typecheck passes

---

### US-002: Create companies table schema
**Description:** As a developer, I need a companies table to store registered company accounts that can submit job specs.

**Acceptance Criteria:**
- [x] Create `companies` table with columns:
  - `id` (UUID, primary key)
  - `user_id` (UUID, FK to auth.users, unique, not null)
  - `company_name` (VARCHAR 255, not null)
  - `company_website` (TEXT, nullable)
  - `contact_name` (VARCHAR 255, not null)
  - `contact_email` (VARCHAR 255, not null)
  - `contact_phone` (VARCHAR 50, nullable)
  - `company_size` (VARCHAR 50, nullable) - startup/small/medium/large/enterprise
  - `industry` (VARCHAR 255, nullable)
  - `verified` (BOOLEAN, default false) - admin verification status
  - `created_at` (TIMESTAMP, default now())
  - `updated_at` (TIMESTAMP, default now())
- [x] Add appropriate indexes on user_id, verified, created_at
- [x] Add RLS policies: companies can read/update own record, admins can read all
- [x] Migration runs successfully
- [x] Typecheck passes

---

### US-003: Create job_submissions table schema
**Description:** As a developer, I need a job_submissions table to store job specifications submitted by companies.

**Acceptance Criteria:**
- [x] Create `job_submissions` table with columns:
  - `id` (UUID, primary key)
  - `company_id` (UUID, FK to companies.id, not null)
  - `title` (VARCHAR 255, not null) - job title
  - `description` (TEXT, not null) - full job description
  - `requirements` (TEXT, nullable) - specific requirements
  - `preferred_skills` (TEXT[], nullable) - array of desired skills
  - `focus_areas` (TEXT[], nullable) - relevant focus areas from our taxonomy
  - `budget_range` (VARCHAR 100, nullable) - budget indication
  - `project_type` (VARCHAR 50, not null) - freelance/contract/full-time/project-based
  - `remote_preference` (VARCHAR 50, not null) - remote/hybrid/onsite/flexible
  - `location` (VARCHAR 255, nullable) - if onsite/hybrid
  - `timeline` (VARCHAR 255, nullable) - project timeline
  - `status` (VARCHAR 50, default 'pending') - pending/reviewed/matched/closed/rejected
  - `admin_notes` (TEXT, nullable) - internal notes
  - `created_at` (TIMESTAMP, default now())
  - `updated_at` (TIMESTAMP, default now())
- [x] Add indexes on company_id, status, created_at
- [x] Add RLS policies: companies see own submissions, admins see all
- [x] Add trigger to update updated_at on changes
- [x] Migration runs successfully
- [x] Typecheck passes

---

### US-004: Create job_matches table schema
**Description:** As a developer, I need a job_matches table to store AI-generated matches between jobs and members.

**Acceptance Criteria:**
- [x] Create `job_matches` table with columns:
  - `id` (UUID, primary key)
  - `job_id` (UUID, FK to job_submissions.id, not null)
  - `profile_id` (UUID, FK to network_profiles.id, not null)
  - `match_score` (FLOAT, not null) - 0-100 relevance score
  - `match_reasoning` (TEXT, not null) - AI explanation of why they match
  - `skill_matches` (JSONB, nullable) - specific skills that matched
  - `vector_similarity` (FLOAT, nullable) - raw cosine similarity score
  - `admin_approved` (BOOLEAN, default null) - null=pending, true=approved, false=rejected
  - `member_notified` (BOOLEAN, default false)
  - `member_response` (VARCHAR 50, nullable) - interested/not-interested/no-response
  - `created_at` (TIMESTAMP, default now())
- [x] Add unique constraint on (job_id, profile_id)
- [x] Add indexes on job_id, profile_id, match_score, admin_approved
- [x] Add RLS policies: admins full access, companies see approved matches for own jobs
- [x] Migration runs successfully
- [x] Typecheck passes

---

### US-005: Add embedding column to network_profiles
**Description:** As a developer, I need to store vector embeddings for each member profile to enable semantic search.

**Acceptance Criteria:**
- [x] Add `embedding` column to network_profiles (vector(1536) for OpenAI embeddings)
- [x] Add `embedding_updated_at` timestamp column
- [x] Add `enriched_content` TEXT column for storing scraped/processed portfolio content
- [x] Create index for vector similarity search (ivfflat or hnsw)
- [x] Migration runs successfully without affecting existing data
- [x] Typecheck passes

---

### US-006: Create TypeScript types for new tables
**Description:** As a developer, I need TypeScript interfaces for the new database tables to ensure type safety.

**Acceptance Criteria:**
- [x] Create `Company` interface matching companies table schema
- [x] Create `JobSubmission` interface matching job_submissions table schema
- [x] Create `JobMatch` interface matching job_matches table schema
- [x] Update `NetworkProfile` interface to include embedding fields
- [x] Create union types for status/enum fields (JobStatus, ProjectType, RemotePreference, etc.)
- [x] Export all types from appropriate location
- [x] Typecheck passes

---

### US-007: Create Supabase client functions for companies
**Description:** As a developer, I need CRUD functions for company management in the Supabase client library.

**Acceptance Criteria:**
- [x] Add `createCompany(data)` function - creates company linked to auth user
- [x] Add `getCompanyByUserId(userId)` function - fetch company by auth user
- [x] Add `updateCompany(id, data)` function - update company details
- [x] Add `getCompanyById(id)` function - fetch single company
- [x] All functions include proper error handling
- [x] All functions are properly typed
- [x] Typecheck passes

---

### US-008: Create Supabase client functions for job submissions
**Description:** As a developer, I need CRUD functions for job submission management.

**Acceptance Criteria:**
- [ ] Add `createJobSubmission(companyId, data)` function
- [ ] Add `getJobSubmissionsByCompany(companyId)` function - list company's jobs
- [ ] Add `getJobSubmissionById(id)` function - fetch single job
- [ ] Add `updateJobSubmissionStatus(id, status, adminNotes?)` function
- [ ] Add `getAllPendingJobSubmissions()` function - for admin review
- [ ] All functions include proper error handling and typing
- [ ] Typecheck passes

---

### US-009: Create Supabase client functions for job matches
**Description:** As a developer, I need functions to create and manage job matches.

**Acceptance Criteria:**
- [ ] Add `createJobMatches(jobId, matches[])` function - bulk insert matches
- [ ] Add `getMatchesByJobId(jobId)` function - fetch all matches for a job
- [ ] Add `updateMatchApproval(matchId, approved, adminNotes?)` function
- [ ] Add `updateMemberResponse(matchId, response)` function
- [ ] Add `getApprovedMatchesForCompany(companyId)` function
- [ ] All functions include proper error handling and typing
- [ ] Typecheck passes

---

### US-010: Create profile embedding generation utility
**Description:** As a developer, I need a utility function to generate embeddings from member profile data.

**Acceptance Criteria:**
- [ ] Create `generateProfileEmbedding(profile)` function using OpenAI embeddings API
- [ ] Function combines: bio, skills, focus areas, project descriptions into embedding text
- [ ] Use text-embedding-3-small model (1536 dimensions, cost-effective)
- [ ] Include proper error handling and retry logic
- [ ] Function returns embedding vector array
- [ ] Typecheck passes

---

### US-011: Create job spec embedding generation utility
**Description:** As a developer, I need a utility function to generate embeddings from job specifications.

**Acceptance Criteria:**
- [ ] Create `generateJobEmbedding(jobSubmission)` function using OpenAI embeddings API
- [ ] Function combines: title, description, requirements, preferred_skills, focus_areas
- [ ] Use same model as profile embeddings (text-embedding-3-small)
- [ ] Include proper error handling and retry logic
- [ ] Function returns embedding vector array
- [ ] Typecheck passes

---

### US-012: Create portfolio content scraping utility
**Description:** As a developer, I need a utility to scrape and extract relevant content from member portfolio URLs.

**Acceptance Criteria:**
- [ ] Create `scrapePortfolioContent(urls[])` function
- [ ] Accepts portfolio_url, linkedin_url, and other_social_links
- [ ] Uses web scraping to extract text content (project descriptions, about sections)
- [ ] Handles rate limiting and timeouts gracefully
- [ ] Returns cleaned, concatenated text for embedding
- [ ] Respects robots.txt and includes reasonable delays
- [ ] Typecheck passes

---

### US-013: Create profile enrichment function
**Description:** As a developer, I need a function that enriches a profile with scraped content and generates its embedding.

**Acceptance Criteria:**
- [ ] Create `enrichProfile(profileId)` function
- [ ] Fetches profile from database
- [ ] Calls scrapePortfolioContent for profile URLs
- [ ] Stores enriched_content in profile record
- [ ] Generates embedding from profile + enriched content
- [ ] Updates embedding and embedding_updated_at in database
- [ ] Returns success/failure status
- [ ] Typecheck passes

---

### US-014: Create batch profile enrichment API endpoint
**Description:** As a developer, I need an API endpoint to trigger enrichment for all profiles (admin use).

**Acceptance Criteria:**
- [ ] Create `/api/enrich-profiles.ts` edge function
- [ ] Accepts optional `profileIds[]` param (or enriches all if not provided)
- [ ] Only processes profiles where embedding is null or outdated
- [ ] Implements batching to avoid rate limits (max 10 concurrent)
- [ ] Returns progress/status JSON
- [ ] Requires admin authentication
- [ ] Typecheck passes

---

### US-015: Create vector similarity search function
**Description:** As a developer, I need a function to find similar profiles using vector search.

**Acceptance Criteria:**
- [ ] Create `findSimilarProfiles(embedding, limit, threshold?)` function
- [ ] Uses pgvector cosine similarity operator (<=>)
- [ ] Only searches approved profiles with available availability status
- [ ] Returns profiles ordered by similarity with scores
- [ ] Accepts optional minimum similarity threshold
- [ ] Typecheck passes

---

### US-016: Create Claude match ranking utility
**Description:** As a developer, I need a utility that uses Claude to analyze and rank candidate matches.

**Acceptance Criteria:**
- [ ] Create `rankMatchesWithClaude(job, candidates[])` function
- [ ] Sends job spec and top N candidates (from vector search) to Claude
- [ ] Claude analyzes fit based on job requirements vs candidate profiles
- [ ] Returns ranked list with match_score (0-100) and match_reasoning for each
- [ ] Includes skill_matches extraction in response
- [ ] Uses structured output for consistent parsing
- [ ] Typecheck passes

---

### US-017: Create main matching engine function
**Description:** As a developer, I need the core matching engine that orchestrates the full matching pipeline.

**Acceptance Criteria:**
- [ ] Create `runJobMatching(jobId)` function
- [ ] Fetches job submission from database
- [ ] Generates embedding for job spec
- [ ] Performs vector similarity search (top 20 candidates)
- [ ] Calls Claude ranking for detailed analysis (top 10)
- [ ] Creates job_matches records in database
- [ ] Updates job status to 'matched'
- [ ] Returns array of created matches
- [ ] Typecheck passes

---

### US-018: Create job matching API endpoint
**Description:** As a developer, I need an API endpoint to trigger matching for a job submission.

**Acceptance Criteria:**
- [ ] Create `/api/match-job.ts` edge function
- [ ] Accepts `jobId` in request body
- [ ] Validates job exists and is in 'pending' or 'reviewed' status
- [ ] Calls runJobMatching function
- [ ] Returns matches with scores and reasoning
- [ ] Requires authentication (admin or owning company)
- [ ] Typecheck passes

---

### US-019: Create job submission API endpoint
**Description:** As a developer, I need an API endpoint for companies to submit new job specs.

**Acceptance Criteria:**
- [ ] Create `/api/submit-job.ts` edge function
- [ ] Accepts job specification fields in request body
- [ ] Validates required fields (title, description, project_type, remote_preference)
- [ ] Creates job_submission record linked to company
- [ ] Sends notification webhook to admin (like profile approval flow)
- [ ] Returns created job record
- [ ] Requires authenticated company user
- [ ] Typecheck passes

---

### US-020: Create admin match review API endpoint
**Description:** As a developer, I need an API endpoint for admins to approve/reject matches.

**Acceptance Criteria:**
- [ ] Create `/api/review-match.ts` edge function
- [ ] Accepts matchId, approved (boolean), adminNotes (optional)
- [ ] Updates job_match record with approval status
- [ ] If approved, optionally triggers member notification
- [ ] Returns updated match record
- [ ] Requires admin authentication
- [ ] Typecheck passes

---

### US-021: Create company registration API endpoint
**Description:** As a developer, I need an API endpoint for company account registration.

**Acceptance Criteria:**
- [ ] Create `/api/register-company.ts` edge function
- [ ] Accepts company details (name, website, contact info, size, industry)
- [ ] Links to authenticated user account
- [ ] Creates company record with verified=false
- [ ] Sends notification to admin for verification
- [ ] Returns created company record
- [ ] Requires authentication, rejects if user already has company
- [ ] Typecheck passes

---

### US-022: Create webhook for member match notification
**Description:** As a developer, I need a function to notify members when they've been matched to a job.

**Acceptance Criteria:**
- [ ] Create `notifyMemberOfMatch(matchId)` function
- [ ] Fetches match, job, and profile details
- [ ] Sends webhook to n8n with match details (similar to approval notification)
- [ ] Updates member_notified flag on match record
- [ ] Includes job title, company name, match reasoning in payload
- [ ] Returns success/failure status
- [ ] Typecheck passes

---

### US-023: Create admin jobs list API endpoint
**Description:** As a developer, I need an API endpoint for admins to list and filter all job submissions.

**Acceptance Criteria:**
- [ ] Create `/api/admin/jobs.ts` edge function
- [ ] Returns paginated list of job submissions
- [ ] Supports filtering by status (pending, reviewed, matched, closed)
- [ ] Includes company name and match count for each job
- [ ] Supports sorting by created_at, status
- [ ] Requires admin authentication
- [ ] Typecheck passes

---

### US-024: Create admin matches list API endpoint
**Description:** As a developer, I need an API endpoint for admins to view matches for a specific job.

**Acceptance Criteria:**
- [ ] Create `/api/admin/matches.ts` edge function
- [ ] Accepts jobId query parameter
- [ ] Returns all matches for the job with full profile details
- [ ] Includes match_score, match_reasoning, admin_approved status
- [ ] Orders by match_score descending
- [ ] Requires admin authentication
- [ ] Typecheck passes

---

### US-025: Add environment variables documentation
**Description:** As a developer, I need documentation for required environment variables for the matching system.

**Acceptance Criteria:**
- [ ] Update .env.example with new variables:
  - `OPENAI_API_KEY` (for embeddings)
  - `ANTHROPIC_API_KEY` (for Claude matching)
  - `ADMIN_USER_IDS` (comma-separated UUIDs for admin access)
- [ ] Add comments explaining each variable's purpose
- [ ] Document any rate limits or quotas to be aware of
- [ ] Typecheck passes

## Non-Goals

- **No company-facing UI in this phase** - API only, UI comes later
- **No real-time matching** - Jobs are processed asynchronously
- **No member opt-out system** - Members can respond to matches but can't pre-emptively opt out
- **No automated introductions** - Admin manually facilitates after approval
- **No payment/billing integration** - Future phase
- **No job posting expiration** - Manual status management only
- **No public job board** - Jobs are private between company and matched members
- **No matching algorithm tuning UI** - Weights and thresholds hardcoded initially

## Technical Considerations

### Existing Infrastructure to Leverage
- Supabase PostgreSQL with RLS already configured
- Auth system with user accounts ready
- n8n webhook integration for notifications (used in profile approval)
- OpenAI integration already exists in `/api/analyze-job.ts`
- Vercel Edge Functions pattern established

### New Dependencies Required
- `@anthropic-ai/sdk` - Claude API for match ranking
- pgvector extension in Supabase (free tier compatible)

### Embedding Strategy
- Use OpenAI `text-embedding-3-small` (1536 dimensions)
- ~$0.00002 per 1K tokens - very cost effective
- Re-generate embeddings when profile is updated
- Batch processing for initial enrichment

### Matching Pipeline
1. Job submitted → stored with status 'pending'
2. Admin triggers matching → generates job embedding
3. Vector search finds top 20 similar profiles
4. Claude ranks top 10 with detailed reasoning
5. Matches stored → admin reviews
6. Approved matches → members notified
7. Members respond → admin facilitates intro

### Performance Considerations
- pgvector HNSW index for fast approximate nearest neighbor search
- Limit Claude calls to top 10 candidates per job (cost control)
- Cache embeddings - only regenerate on profile update
- Batch profile enrichment during off-peak hours

### Security Considerations
- Admin-only access to matching triggers and reviews
- Companies only see approved matches for their own jobs
- Members only see jobs they've been matched to (future UI)
- Rate limiting on API endpoints
- Validate admin status via ADMIN_USER_IDS env var
