# Privacy Policy & Terms of Service Gap Analysis

**Date:** 2026-03-16
**Auditor:** Automated codebase audit
**Branch:** feature/ai-job-agent

---

## Current Coverage Summary

### Privacy Policy (12 sections)
Covers: introduction, personal info collection (name/email/professional background), technical info (IP/browser/device), how info is used (community comms, improvements, analytics), data storage (mentions Notion, not Supabase), information sharing (no third-party sharing), your rights (email removal, access, correction, unsubscribe), cookies (generic), data retention (email addresses), international users, children's privacy, changes, contact info.

### Terms & Conditions (13 sections)
Covers: introduction, membership (eligibility, obligations, termination), services and resources (member directory, networking/events), intellectual property, information sharing, third-party resources and links, your rights, cookies, data retention, liability, international users, children's privacy, changes, contact info.

---

## GAP ANALYSIS: Undisclosed Data Processing Activities

### GAP 1 (CRITICAL): AI-Powered Profile Processing - Not Disclosed

**What exists in code:**
- **OpenAI embeddings** (`api/generate-embeddings.ts`, `api/match-job.ts`): Member profile data (skills, bio, portfolio content) is sent to OpenAI's `text-embedding-3-small` API to generate 1536-dimension vector embeddings stored in `network_profiles.embedding`
- **Anthropic Claude AI** (`api/company/talent-agent.ts`): The "CT Finder" / "Talent Agent" feature sends member profile data to Anthropic's Claude Sonnet API (`claude-sonnet-4-20250514`) with tool_use capabilities for AI-powered candidate matching
- **AI-generated match scoring** (`job_matches` table): AI calculates relevance scores (0-100), generates match reasoning, identifies skill matches
- **Vector similarity search** (`supabase/migrations/008_create_similarity_search_function.sql`, `011_update_similarity_search_all_profiles.sql`): Cosine similarity search across all member profiles

**What the privacy policy says:** Nothing. Zero mention of AI, machine learning, automated decision-making, or third-party AI services (OpenAI, Anthropic).

**Files:**
- `/api/company/talent-agent.ts`
- `/api/match-job.ts`
- `/api/generate-embeddings.ts`
- `/supabase/migrations/006_create_job_matches.sql`
- `/supabase/migrations/007_add_profile_embeddings.sql`
- `/supabase/migrations/008_create_similarity_search_function.sql`

**Required disclosure:** Under GDPR Art. 22 and various AI transparency laws, automated profiling and AI-based decision-making must be explicitly disclosed, including the right to human review.

---

### GAP 2 (CRITICAL): Profile Enrichment via Web Scraping - Not Disclosed

**What exists in code:**
- `api/enrich-profile-search.ts` uses **Jina AI** (`s.jina.ai`) to search the web for member information
- Scrapes external URLs to discover projects, work experience, and portfolio content
- Stores scraped content in `network_profiles.enriched_content` column
- This enriched content is then used to generate AI embeddings

**What the privacy policy says:** Nothing about web scraping, automated data collection from external sources, or Jina AI as a data processor.

**Files:**
- `/api/enrich-profile-search.ts`
- `/supabase/migrations/007_add_profile_embeddings.sql` (adds `enriched_content` column)

**Required disclosure:** Collecting data about users from external sources requires explicit disclosure under GDPR Art. 14 (information not obtained from the data subject).

---

### GAP 3 (CRITICAL): Supabase as Primary Data Platform - Incorrect Disclosure

**What exists in code:**
- All user data is stored in **Supabase** (PostgreSQL) - profiles, messages, companies, jobs, matches, feedback, presence, chat sessions
- Supabase Auth handles authentication (signup, signin, password reset, session management)
- Supabase Realtime handles presence tracking and message notifications
- Supabase Storage handles image uploads (`profile-images` bucket)

**What the privacy policy says:** Section 4.1 states data is stored in **Notion** - this is factually incorrect/outdated. The actual storage platform is Supabase.

**Files:**
- `/src/lib/supabase.ts`
- `/src/contexts/AuthContext.tsx`
- All 28 migration files in `/supabase/migrations/`

---

### GAP 4 (HIGH): Direct Messaging System - Not Disclosed

**What exists in code:**
- Full direct messaging system between members and companies (`supabase/migrations/012_create_direct_messaging.sql`)
- Tables: `direct_conversations`, `direct_messages`, `typing_indicators`, `message_templates`, `message_attachments`
- Real-time message delivery via Supabase Realtime channels
- Email notifications sent when recipients are offline
- Message read receipts (`read_at` timestamps)
- Typing indicators tracked in database
- File attachments uploaded by users

**What the privacy policy says:** Nothing about messaging, message storage, read receipts, typing indicators, or message retention.

**Files:**
- `/api/messages/[[...path]].ts`
- `/supabase/migrations/009_create_messages.sql`
- `/supabase/migrations/012_create_direct_messaging.sql`
- `/src/components/MessageNotification.tsx`

---

### GAP 5 (HIGH): Company/Employer Data Processing - Not Disclosed

**What exists in code:**
- Companies register with: company name, contact email, industry, website, hiring needs, team size (`supabase/migrations/004_create_companies.sql`)
- Company approval workflow (`supabase/migrations/013_create_pending_company_requests.sql`)
- Contact requests: companies can request connections with specific member profiles (`supabase/migrations/026_create_contact_requests.sql`)
- Agent chat sessions stored per company (`supabase/migrations/028_create_agent_chat_sessions.sql`)
- Company message credits system (free + purchased)
- Company analysis credits system

**What the privacy policy says:** Nothing about company accounts, employer data collection, or the two-sided marketplace nature of the platform.

**Files:**
- `/api/company/[[...path]].ts`
- `/supabase/migrations/004_create_companies.sql`
- `/supabase/migrations/005_create_job_submissions.sql`
- `/supabase/migrations/026_create_contact_requests.sql`
- `/supabase/migrations/028_create_agent_chat_sessions.sql`

---

### GAP 6 (HIGH): Stripe Payment Processing - Not Disclosed

**What exists in code:**
- Stripe integration for purchasing message credits (`api/webhooks/stripe.ts`)
- Payment data: `stripe_payment_id`, `amount_total`, bundle purchases
- Tables: `company_message_credits`, `message_usage_logs`, `message_credit_purchases`, `credit_purchases`
- Idempotency checks on payment processing

**What the privacy policy says:** Nothing about payment processing, Stripe as a payment processor, or financial data handling.

**Files:**
- `/api/webhooks/stripe.ts`
- `/supabase/migrations/010_create_analysis_credits.sql`
- `/supabase/migrations/024_create_company_message_credits.sql`

**Required disclosure:** PCI-DSS compliance expectations and Stripe's role as a data processor must be disclosed.

---

### GAP 7 (HIGH): User Presence Tracking - Not Disclosed

**What exists in code:**
- `user_presence` table tracks: user_id, status (online/offline/away), last_seen timestamp (`supabase/migrations/015_add_presence_tracking.sql`, `020_create_user_presence_table.sql`)
- Real-time presence via Supabase channels
- `usePresence.ts` hook sends heartbeat signals
- Other users can see who is online

**What the privacy policy says:** Nothing about online/offline status tracking or visibility to other users.

**Files:**
- `/src/hooks/usePresence.ts`
- `/supabase/migrations/015_add_presence_tracking.sql`
- `/supabase/migrations/020_create_user_presence_table.sql`

---

### GAP 8 (HIGH): Google Analytics - Inadequately Disclosed

**What exists in code:**
- Google Analytics 4 with measurement ID `G-Z517VSCQWM`
- Page view tracking on every route change (`src/hooks/usePageTracking.ts`)
- Global `gtag` function on window object

**What the privacy policy says:** Section 7 mentions cookies generically but does not name Google Analytics, disclose the measurement ID, or explain what GA4 collects (demographics, interests, device data, geographic location).

**Files:**
- `/src/hooks/usePageTracking.ts`
- `/src/App.tsx` (line 107)

**Required disclosure:** Google Analytics must be explicitly named as a third-party analytics provider, and the specific data it collects must be listed.

---

### GAP 9 (MEDIUM): n8n Webhook Automation - Not Disclosed

**What exists in code:**
- n8n automation server at `n8n.creativetechnologists.nl`
- Webhooks for: member data fetching, resource directory, email signup processing
- User data (names, emails, professional info) transmitted to self-hosted n8n instance

**What the privacy policy says:** Nothing about n8n or webhook-based data processing.

**Files:**
- `/src/utils/webhookUtils.ts`
- `/src/components/MembersPage.tsx`
- `/src/components/EmailSignup.tsx`

---

### GAP 10 (MEDIUM): Beta Program Features - Not Disclosed

**What exists in code:**
- Beta applications table (`supabase/migrations/016_create_beta_applications.sql`)
- Beta feedback collection with rating, category, and free-text (`supabase/migrations/025_create_beta_feedback.sql`)
- Beta broadcast emails to all beta members
- Beta hub with protected content
- BetaFeedbackWidget stores dismissal state in localStorage

**What the privacy policy says:** Nothing about beta programs, feedback collection, or broadcast communications to beta members.

**Files:**
- `/src/components/BetaFeedbackWidget.tsx`
- `/api/beta/[[...path]].ts`
- `/supabase/migrations/016_create_beta_applications.sql`
- `/supabase/migrations/025_create_beta_feedback.sql`
- `/src/components/admin/BetaBroadcastSection.tsx`

---

### GAP 11 (MEDIUM): Image Upload & Storage - Not Disclosed

**What exists in code:**
- `profile-images` Supabase Storage bucket (`supabase/migrations/027_create_profile_images_bucket.sql`)
- Image upload component (`src/components/ui/image-upload.tsx`)
- Profile pictures stored in cloud storage
- Message attachments stored in Supabase

**What the privacy policy says:** Nothing about image storage, file uploads, or cloud storage of user media.

**Files:**
- `/src/components/ui/image-upload.tsx`
- `/src/lib/supabase.ts` (uploadImage function)
- `/supabase/migrations/027_create_profile_images_bucket.sql`

---

### GAP 12 (MEDIUM): localStorage Data Storage - Not Disclosed

**What exists in code:**
- `cookie-consent` preference stored in localStorage
- `feature-flags` stored in localStorage (can override feature toggles)
- Beta feedback widget state in localStorage (`beta-feedback-widget`)
- Supabase auth tokens in localStorage (implicit via Supabase JS client)

**What the privacy policy says:** Section 7 mentions cookies but not localStorage, which is a distinct storage mechanism.

**Files:**
- `/src/components/ui/cookie-notice.tsx`
- `/src/utils/featureFlags.ts`
- `/src/components/BetaFeedbackWidget.tsx`

---

### GAP 13 (MEDIUM): Job Submissions & Matching Pipeline - Not Disclosed

**What exists in code:**
- Companies submit job requirements (`supabase/migrations/005_create_job_submissions.sql`)
- Automated matching pipeline generates AI matches (`supabase/migrations/006_create_job_matches.sql`)
- Members are notified of matches and can respond (interested/not-interested)
- Admin approval workflow for matches
- Analysis credits consumed per matching operation

**What the privacy policy says:** Nothing about job matching, automated candidate selection, or member notification of matches.

**Files:**
- `/supabase/migrations/005_create_job_submissions.sql`
- `/supabase/migrations/006_create_job_matches.sql`
- `/api/match-job.ts`
- `/api/jobs/[[...path]].ts`

---

### GAP 14 (MEDIUM): Email Notification System - Inadequately Disclosed

**What exists in code:**
- Automated email notifications for: offline message delivery, job match notifications, beta broadcasts, company approval/rejection
- Email templates system (`api/_lib/email-templates.ts`)
- Emails sent via Supabase/n8n automation
- Supabase email templates directory (`supabase/templates/`)

**What the privacy policy says:** Mentions email for "community communications" but does not disclose automated transactional emails or the triggers that generate them.

**Files:**
- `/api/_lib/email-templates.ts`
- `/api/messages/[[...path]].ts` (notifyRecipientIfOffline)
- `/supabase/templates/`

---

### GAP 15 (LOW): Admin Dashboard Data Access - Not Disclosed

**What exists in code:**
- Admin can: view all profiles, approve/reject profiles, list all members, manage jobs, view matches, manage credits, list users, view user activity, reset user passwords, manage company conversations, grant message credits, broadcast to beta users
- Admin API with service role key bypasses RLS

**What the privacy policy says:** Nothing about admin access scope or what internal staff can see/do with user data.

**Files:**
- `/api/admin/[[...path]].ts`
- `/src/pages/AdminDashboardPage.tsx`
- `/src/components/admin/UserManagementSection.tsx`

---

### GAP 16 (LOW): Creative Spectrum / Profile Metadata - Not Disclosed

**What exists in code:**
- Creative spectrum slider collecting user self-assessment data (`supabase/migrations/023_add_creative_spectrum.sql`)
- Stored as profile metadata
- UI component: `src/components/ui/creative-spectrum-slider.tsx`

**What the privacy policy says:** "Professional background and expertise" is listed generically but does not specifically mention behavioral/psychographic profiling data.

---

### GAP 17 (LOW): Realtime Message Reactions - Not Disclosed

**What exists in code:**
- Message reactions table (`supabase/migrations/022_create_message_reactions.sql`)
- Users can react to messages with emojis
- Reactions linked to user_id

**What the privacy policy says:** Nothing about message interaction metadata.

**Files:**
- `/supabase/migrations/022_create_message_reactions.sql`

---

## Terms of Service Gaps

### TERMS GAP 1 (CRITICAL): No AI/Automated Decision-Making Terms
The terms do not mention AI processing, automated profiling, or algorithmic matching. Users have no agreed-upon terms for how their data is processed by AI systems.

### TERMS GAP 2 (CRITICAL): No Company/Employer Terms
No terms governing company accounts, their access to member data, contact request protocols, or credit-based usage model.

### TERMS GAP 3 (HIGH): No Messaging Terms of Use
No acceptable use policy for the messaging system. No terms about message retention, monitoring, or prohibited content.

### TERMS GAP 4 (HIGH): No Payment Terms
No terms governing credit purchases via Stripe, refund policy, or billing disputes.

### TERMS GAP 5 (HIGH): No Beta Program Terms
No terms specific to beta participation, feedback usage rights, or beta feature availability/reliability.

### TERMS GAP 6 (MEDIUM): No Data Processing Agreement
No DPA or sub-processor list for: Supabase, OpenAI, Anthropic, Stripe, Google Analytics, Jina AI, n8n.

### TERMS GAP 7 (MEDIUM): No User Content License
No terms granting CTC license to process user-submitted content (profiles, messages, images) through AI systems or display in directory.

---

## Third-Party Sub-Processors (Undisclosed)

| Service | Purpose | Data Shared | Disclosed? |
|---------|---------|-------------|------------|
| Supabase | Database, Auth, Storage, Realtime | All user data | NO (Notion mentioned instead) |
| OpenAI | Profile embeddings | Profile text, skills, portfolio content | NO |
| Anthropic | AI talent matching | Member profiles, job requirements | NO |
| Stripe | Payment processing | Payment details, company IDs | NO |
| Google Analytics (GA4) | Web analytics | IP, device, behavior, pages visited | Partially (generic cookies mention) |
| Jina AI | Web search/scraping | Member names, profile URLs | NO |
| n8n (self-hosted) | Workflow automation | Emails, member data, notifications | NO |

---

## Recommended Priority Actions

1. **IMMEDIATE:** Rewrite privacy policy to disclose AI processing (OpenAI embeddings, Anthropic talent matching)
2. **IMMEDIATE:** Correct storage platform from Notion to Supabase
3. **IMMEDIATE:** Add sub-processor list with all third-party services
4. **HIGH:** Add company/employer-specific privacy terms
5. **HIGH:** Add messaging, payment, and beta program sections to both documents
6. **HIGH:** Create a Data Processing Agreement (DPA) template
7. **MEDIUM:** Add GDPR Art. 22 automated decision-making disclosure
8. **MEDIUM:** Disclose presence tracking, image storage, and localStorage usage
9. **LOW:** Add admin access scope documentation
