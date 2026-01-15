# PRD: CTC Creative Technology Platform - Phase 2: Full-Featured UI & Messaging

## Introduction

This is Phase 2 of the CTC Creative Technology Platform. Phase 1 (completed) established the API layer, database schema, and matching engine. This phase delivers the full-featured user interfaces for creative technologists, companies, and admins—plus a complete in-platform messaging system.

The platform connects creative technologists with companies seeking talent. The AI-powered matching system analyzes job specs against all member profiles—enriched with data from portfolios and social profiles—to surface the top 3-5 most relevant candidates for each opportunity.

**Completed in Phase 1:**
- Database schema (profiles, companies, jobs, matches, embeddings)
- Authentication flows (member and company)
- API endpoints (job submission, matching, profile enrichment)
- Vector search with pgvector

## Goals

- Complete member dashboard with match notifications and response flow
- Complete company dashboard with job submission form and match viewing
- Complete admin dashboard with profile approval, job approval, and match review
- Implement full messaging system between companies and matched members
- Add AI profile enrichment triggered on profile creation/update
- Deliver polished directory with search and filtering

## User Stories

---

### PHASE 2A: Member Dashboard & Matches

---

### US-026: Display approval status on member dashboard
**Description:** As a creative technologist, I want to see my profile's approval status so I know when I'm visible in the directory.

**Acceptance Criteria:**
- [x] Member dashboard shows approval status badge (Pending Review / Approved)
- [x] Pending profiles show message: "Your profile is under review and will appear in the directory once approved"
- [x] Approved profiles show "Your profile is live in the directory" with link to view
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-027: Create member matches dashboard section
**Description:** As a creative technologist, I want to see jobs I've been matched with so I can respond to opportunities.

**Acceptance Criteria:**
- [x] Member dashboard has "Job Matches" section below profile info
- [x] Lists all matches for member's profile where `admin_approved = true`
- [x] Each match card shows: job title, company name, match score percentage, date matched
- [x] Badge indicates response status (New / Responded)
- [x] Empty state: "No job matches yet. Companies will see your profile when they post relevant opportunities."
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-028: Create match detail view for members
**Description:** As a creative technologist, I want to view match details and respond so companies know my interest level.

**Acceptance Criteria:**
- [x] Clicking match card opens detail modal or page
- [x] Shows full job description, requirements, and project details
- [x] Shows AI-generated match reasoning explaining why you're a fit
- [x] Shows company name and verified badge if applicable
- [x] Response buttons: "I'm Interested" / "Not Interested"
- [x] After response, saves to `member_response` column and shows confirmation
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-029: Trigger profile enrichment on creation
**Description:** As a system, I need to automatically enrich profiles when they're created so AI matching has rich context.

**Acceptance Criteria:**
- [x] After profile creation succeeds, calls `/api/enrich-profile` endpoint
- [x] Shows "Enhancing your profile with AI..." toast during enrichment
- [x] Enrichment scrapes portfolio_url and linkedin_url if provided
- [x] Generates embedding from bio + skills + enriched content
- [x] Failure doesn't block profile creation (graceful degradation)
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-030: Trigger profile enrichment on update
**Description:** As a system, I need to re-enrich profiles when portfolio URLs change so embeddings stay current.

**Acceptance Criteria:**
- [x] After profile update, checks if portfolio_url or linkedin_url changed
- [x] If URLs changed, calls `/api/enrich-profile` endpoint
- [x] Shows "Updating your AI profile..." toast during enrichment
- [x] Updates embedding and embedding_updated_at
- [x] Failure shows warning but doesn't block update
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### PHASE 2B: Company Dashboard & Job Submission

---

### US-031: Create job submission form
**Description:** As a company, I want to submit job specifications so I can find matching creative technologists.

**Acceptance Criteria:**
- [x] Company dashboard has prominent "Submit New Job" button
- [x] Form opens in modal or new page
- [x] Required fields: title, description, project_type (select), remote_preference (select)
- [x] Optional fields: requirements (textarea), preferred_skills (tag input), focus_areas (multi-select), budget_range, location, timeline
- [x] Form validates required fields before submission
- [x] Submits to existing `/api/submit-job` endpoint
- [x] Success shows confirmation with "Pending Admin Review" message
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-032: Display company's submitted jobs list
**Description:** As a company, I want to see all my submitted jobs and their statuses so I can track my requests.

**Acceptance Criteria:**
- [x] Company dashboard shows "Your Job Submissions" section
- [x] Lists all jobs for the company, sorted by most recent
- [x] Each job card shows: title, status badge, submission date, match count (if matched)
- [x] Status badges: yellow="Pending Review", blue="Under Review", green="Matched", gray="Closed"
- [x] Click job to expand/view details
- [x] Empty state: "No job submissions yet. Submit a job spec to find matching creative technologists."
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-033: Create job detail view with matches for companies
**Description:** As a company, I want to view job details and matched candidates so I can see recommendations.

**Acceptance Criteria:**
- [x] Clicking job opens detail view (modal or page)
- [x] Shows full job specification
- [x] If status is 'matched', shows "Matched Candidates" section
- [x] Each match shows: member name, profile picture, match score, reasoning summary
- [x] Click member to view their full profile (opens in new tab or modal)
- [x] If status is 'pending', shows "Awaiting admin review"
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### PHASE 2C: Admin Dashboard

---

### US-034: Create admin pending profiles section
**Description:** As an admin, I want to see pending profiles so I can review and approve them.

**Acceptance Criteria:**
- [x] Admin dashboard has "Pending Profiles" section with count badge
- [x] Lists all profiles where `approved = false`
- [x] Each row shows: name, email, location, focus areas (tags), submission date
- [x] Click to expand and see full profile details (bio, skills, projects, portfolio links)
- [x] Sorted by oldest first (FIFO review)
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-035: Implement profile approval/rejection actions
**Description:** As an admin, I want to approve or reject profiles to control directory quality.

**Acceptance Criteria:**
- [x] Each pending profile has Approve and Reject buttons
- [x] Approve: sets `approved = true`, `approved_at = now()`, `approved_by = admin_id`
- [x] Reject: shows confirmation dialog with optional reason textarea
- [x] Rejection deletes the profile record
- [x] After action, profile removed from pending list with animation
- [x] Success toast: "Profile approved" or "Profile rejected"
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-036: Create admin pending jobs section
**Description:** As an admin, I want to see pending job submissions so I can review them before matching.

**Acceptance Criteria:**
- [x] Admin dashboard has "Pending Jobs" section with count badge
- [x] Lists all jobs where `status = 'pending'`
- [x] Each row shows: title, company name, project type, remote preference, submission date
- [x] Click to expand and see full job details
- [x] Sorted by oldest first
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-037: Implement job approval and trigger matching
**Description:** As an admin, I want to approve jobs and trigger AI matching to generate candidate recommendations.

**Acceptance Criteria:**
- [x] Each pending job has Approve and Reject buttons
- [x] Approve: calls `/api/match-job` endpoint with job ID
- [x] Shows loading state "Running AI matching..." during process
- [x] On success, job status becomes 'matched' and shows match count
- [x] Reject: shows dialog for rejection reason, sets `status = 'rejected'` with admin_notes
- [x] Success toast with match count: "Job approved - 5 candidates matched"
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-038: Create admin match review section
**Description:** As an admin, I want to review AI-generated matches before showing them to companies.

**Acceptance Criteria:**
- [x] Admin dashboard has "Pending Matches" section
- [x] Lists matches where `admin_approved IS NULL`, grouped by job
- [x] Each match shows: job title, member name, match score, reasoning preview
- [x] Individual Approve/Reject buttons per match
- [x] Bulk "Approve All" button per job
- [x] Approve sets `admin_approved = true`, Reject sets `admin_approved = false`
- [x] Only approved matches become visible to companies
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-039: Create admin company verification section
**Description:** As an admin, I want to verify companies so members know they're legitimate.

**Acceptance Criteria:**
- [x] Admin dashboard has "Companies" section
- [x] Lists all registered companies
- [x] Each row shows: company name, contact email, industry, verified status, registration date
- [x] Verify/Unverify toggle button for each company
- [x] Verify sets `verified = true`, Unverify sets `verified = false`
- [x] Verified badge appears next to company names throughout platform
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### PHASE 2D: Messaging System

---

### US-040: Create messages database table
**Description:** As a system, I need a messages table so companies and members can communicate about job matches.

**Acceptance Criteria:**
- [x] Create migration for `messages` table with columns:
  - `id` (UUID, primary key)
  - `match_id` (UUID, FK to job_matches, not null)
  - `sender_type` (VARCHAR, 'company' or 'member')
  - `sender_id` (UUID, not null) - company.id or profile.id depending on sender_type
  - `content` (TEXT, not null)
  - `created_at` (TIMESTAMP, default now())
  - `read_at` (TIMESTAMP, nullable)
- [x] Add index on match_id for fast conversation loading
- [x] Add RLS: only match participants can read/write messages
- [x] Migration runs successfully
- [x] Typecheck passes

---

### US-041: Create send message API endpoint
**Description:** As a user, I need an API to send messages so conversations happen on the platform.

**Acceptance Criteria:**
- [x] Create `/api/messages/send.ts` edge function
- [x] Accepts: match_id, content in request body
- [x] Validates sender is participant in the match (company or member)
- [x] Determines sender_type and sender_id from auth context
- [x] Creates message record
- [x] Returns created message with id and timestamp
- [x] Returns 403 if sender not authorized for this match
- [x] Typecheck passes

---

### US-042: Create get conversation API endpoint
**Description:** As a user, I need an API to fetch conversation history for a match.

**Acceptance Criteria:**
- [x] Create `/api/messages/conversation.ts` edge function
- [x] Accepts: match_id as query parameter
- [x] Validates requester is participant in the match
- [x] Returns all messages for the match, sorted by created_at ascending
- [x] Marks unread messages as read (sets read_at) for the requester
- [x] Returns 403 if requester not authorized
- [x] Typecheck passes

---

### US-043: Create unread message count API endpoint
**Description:** As a user, I need to know how many unread messages I have so I can see notifications.

**Acceptance Criteria:**
- [x] Create `/api/messages/unread-count.ts` edge function
- [x] Returns total unread message count for current user
- [x] For companies: counts messages in their job matches where sender_type='member' and read_at is null
- [x] For members: counts messages in their matches where sender_type='company' and read_at is null
- [x] Returns { count: number }
- [x] Typecheck passes

---

### US-044: Add messaging UI to company match view
**Description:** As a company, I want to message matched candidates to discuss the opportunity.

**Acceptance Criteria:**
- [x] Match detail view has "Messages" section below candidate info
- [x] Shows conversation history with timestamps and sender labels
- [x] Company messages aligned right, member messages aligned left
- [x] Text input with Send button at bottom
- [x] Sending a message immediately adds it to the conversation
- [x] Auto-scrolls to newest messages on load and send
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-045: Add messaging UI to member match view
**Description:** As a creative technologist, I want to message companies about matches to learn more.

**Acceptance Criteria:**
- [x] Match detail view has "Messages" section below job info
- [x] Shows conversation history with timestamps and sender labels
- [x] Member messages aligned right, company messages aligned left
- [x] Text input with Send button at bottom
- [x] Messaging only enabled after member responds "Interested"
- [x] If not yet responded, shows "Respond to this match to start messaging"
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-046: Show unread message indicators on dashboards
**Description:** As a user, I want to see when I have unread messages so I know to check conversations.

**Acceptance Criteria:**
- [x] Member dashboard shows red badge with unread count next to "Job Matches" header
- [x] Company dashboard shows red badge with unread count next to matched jobs
- [x] Individual match cards show blue dot indicator if conversation has unread messages
- [x] Counts update after viewing conversation
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### PHASE 2E: Directory & Polish

---

### US-047: Add search to directory page
**Description:** As a visitor, I want to search the directory to find creative technologists by name or keywords.

**Acceptance Criteria:**
- [x] Directory page has search input at top
- [x] Search filters profiles by name and bio content
- [x] Search is debounced (300ms delay)
- [x] Results update as user types
- [x] Clear button to reset search
- [x] URL updates with search param for shareability
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-048: Add filters to directory page
**Description:** As a visitor, I want to filter the directory by focus area, availability, and skills.

**Acceptance Criteria:**
- [x] Directory has filter dropdowns: Focus Areas (multi-select), Availability (single-select)
- [x] Focus areas use existing FOCUS_AREAS constant
- [x] Availability options: All, Open to Work, Open to Collaborations
- [x] Filters combine with AND logic
- [x] Filter state persists in URL params
- [x] "Clear Filters" button resets all filters
- [x] Shows result count: "Showing X creative technologists"
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-049: Enhance public profile page display
**Description:** As a visitor, I want to see rich profile details on public profile pages.

**Acceptance Criteria:**
- [x] Profile page shows profile picture prominently
- [x] Shows focus areas as colored badges with descriptions on hover
- [x] Shows skills as tag pills
- [x] Projects section with images and descriptions
- [x] External links (portfolio, LinkedIn) open in new tab with icons
- [x] Availability status clearly displayed with appropriate color
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-050: Add match email notification webhook
**Description:** As a system, I want to email members when they're matched with a job so they check the platform.

**Acceptance Criteria:**
- [ ] After admin approves a match, triggers notification
- [ ] Calls existing n8n webhook or Resend API
- [ ] Email includes: job title, match score, "Why you matched" summary, link to dashboard
- [ ] Sets `member_notified = true` on match record after sending
- [ ] Handles send failures gracefully (logs error, doesn't crash)
- [ ] Typecheck passes

---

## Non-Goals

- No real-time chat (messages use send/refresh pattern)
- No payment processing or billing
- No automated job posting from external sources (jobs are manual submissions)
- No public company profiles (companies only visible through matches)
- No mobile native apps (responsive web only)
- No calendar/scheduling integration
- No video calling integration
- No bulk messaging or marketing emails

## Technical Considerations

### Existing Infrastructure
- Supabase Auth configured for both members and companies
- Supabase Storage for file uploads (profile pictures)
- OpenAI API for embeddings (text-embedding-3-small)
- pgvector for similarity search
- n8n webhooks for notifications
- Vercel Edge Functions for API

### UI Components Available
- Button, Input, Textarea, Checkbox, RadioGroup, TagInput
- ImageUpload for profile pictures
- Alert for notifications
- Existing form patterns in profile creation pages

### Database Schema (Already Exists)
- `network_profiles` with embeddings and approval fields
- `companies` with verification
- `job_submissions` with status workflow
- `job_matches` with scores and member_response

### API Endpoints (Already Exist)
- `/api/enrich-profile.ts` - Profile enrichment
- `/api/match-job.ts` - AI matching
- `/api/submit-job.ts` - Job submission
- `/api/register-company.ts` - Company registration
- `/api/review-match.ts` - Match review

### Key Patterns
- Service role key for admin operations (bypasses RLS)
- React Hook Form with Zod validation
- Toast notifications for user feedback
- Mobile-responsive design required
