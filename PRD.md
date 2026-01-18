# PRD: Token-Based AI Analysis Billing System

## Introduction

Implement a usage-based billing system for the AI job analysis feature. Companies receive a fixed number of free analyses (5), after which they must purchase analysis bundles to continue using the feature. This creates a sustainable revenue model while providing initial value for free.

**Key Decisions (from user input):**
- Token counting: Both input and output tokens combined
- Free tier: Fixed number of free analyses (5 per company)
- Payment: Pre-purchase token/analysis bundles
- Out of credits: Block analysis with "buy more" message
- Management: Companies see usage, CTC admins manage billing

## Goals

- Give each company 5 free AI job analyses to experience the feature
- Track analysis usage per company with logging
- Block analysis requests when a company has no remaining credits
- Allow companies to purchase analysis bundles via Stripe (pre-paid credits)
- Provide usage visibility to companies on their dashboard
- Enable CTC admins to view usage, revenue, and grant bonus credits

## User Stories

---

### US-001: Create analysis credits database schema
**Description:** As a developer, I need database tables to track company analysis credits and usage history.

**Acceptance Criteria:**
- [x] Create `company_analysis_credits` table with columns:
  - `id` (UUID, primary key)
  - `company_id` (UUID, FK to companies, unique, not null)
  - `free_analyses_remaining` (INTEGER, default 5)
  - `purchased_credits` (INTEGER, default 0)
  - `created_at` (TIMESTAMP, default now())
  - `updated_at` (TIMESTAMP, default now())
- [x] Create `analysis_usage_logs` table with columns:
  - `id` (UUID, primary key)
  - `company_id` (UUID, FK to companies, not null)
  - `job_title` (VARCHAR, not null)
  - `credit_type` (VARCHAR, 'free' or 'purchased')
  - `created_at` (TIMESTAMP, default now())
- [x] Create `credit_purchases` table with columns:
  - `id` (UUID, primary key)
  - `company_id` (UUID, FK to companies, not null)
  - `credits_amount` (INTEGER, not null)
  - `price_cents` (INTEGER, not null)
  - `stripe_payment_id` (VARCHAR)
  - `created_at` (TIMESTAMP, default now())
- [x] Add indexes on company_id columns for all tables
- [x] Add RLS policies: companies read own records, service role full access
- [x] Migration runs successfully
- [x] Typecheck passes

---

### US-002: Initialize credits for new companies
**Description:** As a new company, I should automatically receive 5 free analysis credits when I register.

**Acceptance Criteria:**
- [x] Modify `api/register-company.ts` to create a `company_analysis_credits` record
- [x] Set `free_analyses_remaining: 5` and `purchased_credits: 0`
- [x] Credits record created in the same request as company registration
- [x] Handle case where credits record already exists (idempotent)
- [x] Typecheck passes

---

### US-003: Add credit check to analyze-job API
**Description:** As the system, I need to verify a company has available credits before allowing an analysis.

**Acceptance Criteria:**
- [x] Add `company_id` parameter to analyze-job request schema (required)
- [x] Query `company_analysis_credits` to check balance
- [x] Allow if `free_analyses_remaining > 0` OR `purchased_credits > 0`
- [x] Return 402 Payment Required with JSON body: `{ error: 'No analysis credits remaining', code: 'CREDITS_EXHAUSTED' }`
- [x] Include `X-Credits-Remaining` header in successful response
- [x] Typecheck passes

---

### US-004: Deduct credits after successful analysis
**Description:** As the system, I need to deduct one credit after an analysis stream completes.

**Acceptance Criteria:**
- [x] After streaming completes successfully, deduct 1 credit
- [x] Deduct from `free_analyses_remaining` first (if > 0), else from `purchased_credits`
- [x] Create entry in `analysis_usage_logs` with job title and credit type
- [x] Use database transaction to ensure atomicity
- [x] Update `company_analysis_credits.updated_at` timestamp
- [x] Typecheck passes

---

### US-005: Update useJobAnalysis hook for credit errors
**Description:** As a company user, I should see a clear message when I'm out of credits.

**Acceptance Criteria:**
- [x] Detect 402 status code in `useJobAnalysis` hook
- [x] Parse response JSON to extract error code
- [x] Set error state with type: `{ type: 'credits_exhausted', message: string }`
- [x] Add `creditsRemaining` state (from X-Credits-Remaining header)
- [x] Update hook return type to include new states
- [x] Typecheck passes

---

### US-006: Show "Buy More Credits" prompt when exhausted
**Description:** As a company user who has run out of credits, I should see a prompt to purchase more.

**Acceptance Criteria:**
- [x] When analysis fails with credits_exhausted error, show alert/modal
- [x] Display message: "You've used all your analysis credits"
- [x] Show "Purchase More Credits" button linking to `/company/purchase-credits`
- [x] Display current credit balance (0 free, 0 purchased)
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-007: Add credits section to company dashboard
**Description:** As a company user, I want to see my credit balance and usage history on my dashboard.

**Acceptance Criteria:**
- [x] Create `api/company/credits.ts` endpoint to fetch company's credit balance and recent usage
- [x] Add "Analysis Credits" card to company dashboard (above or beside job submissions)
- [x] Display: free credits remaining, purchased credits, total analyses used
- [x] Show last 5 analyses with job title and date
- [x] Include "Purchase More" button
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-008: Create credit bundle purchase page
**Description:** As a company user, I want to see available credit bundles and their pricing.

**Acceptance Criteria:**
- [x] Create `/company/purchase-credits` route and page
- [x] Display 3 bundle options:
  - 10 analyses for $29 ($2.90/analysis)
  - 25 analyses for $59 ($2.36/analysis)
  - 50 analyses for $99 ($1.98/analysis)
- [x] Each bundle card shows: credit count, price, price per analysis
- [x] Highlight "Most Popular" on middle tier
- [x] "Buy Now" button on each (placeholder action for now)
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-009: Create Stripe checkout API endpoint
**Description:** As a company, I need to start a Stripe checkout session to purchase credits.

**Acceptance Criteria:**
- [x] Create `api/company/checkout.ts` endpoint
- [x] Accept `bundle_id` ('basic' | 'popular' | 'pro') in request body
- [x] Map bundle_id to correct price in cents (2900, 5900, 9900)
- [x] Create Stripe Checkout session with:
  - mode: 'payment'
  - line_items with bundle description and price
  - metadata: { company_id, bundle_id, credits_amount }
  - success_url: `/company/purchase-credits?success=true`
  - cancel_url: `/company/purchase-credits?canceled=true`
- [x] Return `{ url: checkoutSession.url }`
- [x] Typecheck passes

---

### US-010: Connect purchase page to Stripe checkout
**Description:** As a company, clicking "Buy Now" should redirect me to Stripe payment.

**Acceptance Criteria:**
- [ ] "Buy Now" buttons call `/api/company/checkout` with bundle_id
- [ ] Show loading state while creating checkout session
- [ ] Redirect to Stripe checkout URL on success
- [ ] Handle success/canceled URL params with toast messages
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

### US-011: Create Stripe webhook for payment completion
**Description:** As the system, I need to add purchased credits when Stripe payment succeeds.

**Acceptance Criteria:**
- [ ] Create `api/webhooks/stripe.ts` endpoint
- [ ] Verify Stripe webhook signature using STRIPE_WEBHOOK_SECRET
- [ ] Handle `checkout.session.completed` event
- [ ] Extract company_id and credits_amount from session metadata
- [ ] Add credits to `company_analysis_credits.purchased_credits`
- [ ] Create record in `credit_purchases` table with stripe_payment_id
- [ ] Return 200 OK to acknowledge receipt
- [ ] Typecheck passes

---

### US-012: Add credit usage to admin dashboard
**Description:** As a CTC admin, I want to see credit usage and revenue across all companies.

**Acceptance Criteria:**
- [ ] Create `api/admin/credit-usage.ts` endpoint
- [ ] Add "Credit Usage" section to admin dashboard
- [ ] Show table with columns: company name, free used, purchased remaining, total analyses, total revenue
- [ ] Sort by total analyses (most active first)
- [ ] Show platform totals: total analyses, total revenue
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

### US-013: Add admin ability to grant bonus credits
**Description:** As a CTC admin, I want to manually add credits to a company account for support or promotions.

**Acceptance Criteria:**
- [ ] Add "Grant Credits" button in admin credit usage section for each company
- [ ] Button opens modal with: credit amount input, optional note textarea
- [ ] Create `api/admin/grant-credits.ts` endpoint
- [ ] Add credits to `purchased_credits` (not free credits)
- [ ] Log grant in `credit_purchases` with stripe_payment_id = 'ADMIN_GRANT' and note
- [ ] Show success toast: "Added X credits to [Company Name]"
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

## Non-Goals

- Subscription/recurring billing (bundle purchase only)
- Refunds or credit expiration
- Different pricing tiers per company
- Usage-based pricing tied to actual AI token counts (we count analyses, not tokens)
- Credit transfer between companies
- Automatic top-up when credits run low
- Invoicing or receipts (Stripe handles this)

## Technical Considerations

### Existing Infrastructure
- Supabase for database with RLS
- Vercel Edge Functions for API
- Companies table already exists with user_id FK to auth.users
- `api/analyze-job.ts` is an edge function using streaming

### Stripe Integration
- Use Stripe Checkout for payments (simplest integration)
- Store STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in environment
- Webhook endpoint must be registered in Stripe dashboard
- Use `stripe` npm package for API calls

### Credit Deduction Logic
```
if (free_analyses_remaining > 0) {
  deduct from free_analyses_remaining
  log with credit_type = 'free'
} else if (purchased_credits > 0) {
  deduct from purchased_credits
  log with credit_type = 'purchased'
} else {
  return 402 CREDITS_EXHAUSTED
}
```

### Key Patterns to Follow
- Service role key for admin operations (bypasses RLS)
- Edge runtime for API endpoints
- Toast notifications for user feedback
- React Query or direct fetch for data loading
