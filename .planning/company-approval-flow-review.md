# Company Approval Flow - Code Review

**Date**: January 31, 2026  
**Reviewed By**: AI Assistant  
**Plan File**: `.cursor/plans/company_approval_flow_4fcfa723.plan.md`  
**Last Updated**: January 31, 2026 - All issues fixed

---

## Review Summary

The implementation is **complete and production-ready**. All identified issues have been addressed.

---

## Critical Issues

### 1. Duplicate Email Problem in Approve Flow

**Location**: `api/admin/company-requests/approve.ts`

There's a potential UX problem where the user receives **two emails**:

```typescript
// Step 1: Creates user with Supabase invite (sends automatic invite email)
await supabase.auth.admin.inviteUserByEmail(request.contact_email, {...})

// Step 5: Generates ANOTHER magic link
await supabase.auth.admin.generateLink({ type: 'magiclink', ... })

// Step 6: Sends CUSTOM email with the magic link
await sendApprovalEmail({ ... magicLink })
```

**Problem**: Supabase's `inviteUserByEmail` automatically sends an invite email. Then the code sends a *second* custom email via Resend. The user receives **two emails** with potentially different links.

**Fix Applied**: Changed to use `createUser()` instead of `inviteUserByEmail()`. The `createUser()` method does not send automatic emails, so only the custom Resend email is sent.

**Status**: [x] Fixed ✅

---

### 2. Missing Existing Auth User Check

**Location**: `api/admin/company-requests/approve.ts`

Before creating a user, there should be a check if a Supabase Auth user already exists with that email:

```typescript
// This could fail if user exists
const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(...)
```

If someone previously signed up (e.g., as a network member) with the same email, this will fail. Should check first or handle the `user_already_exists` error gracefully.

**Fix Applied**: Added a check for existing users before creating. If a user already exists with the email, their existing account is linked to the new company (after verifying they don't already have a company). This handles the case where network members want to register as companies.

**Status**: [x] Fixed ✅

---

## Medium Issues

### 3. Hardcoded Domain in Email Templates

**Location**: `api/admin/company-requests/approve.ts`, `api/admin/company-requests/reject.ts`

Both files have hardcoded references:

```typescript
from: 'CTC Talent Matching <noreply@creativetechnologists.nl>',
// ...
<a href="https://creativetechnologists.nl" style="...">creativetechnologists.nl</a>
```

**Fix Applied**: Added environment variables `PUBLIC_URL`, `EMAIL_FROM_DOMAIN`, and `SUPPORT_EMAIL` with sensible fallbacks. All hardcoded domains now use these variables.

**Status**: [x] Fixed ✅

---

### 4. No Rate Limiting on Public Endpoint

**Location**: `api/request-company-access.ts`

This is a public endpoint with no rate limiting. A malicious actor could spam requests.

**Fix Applied**: Implemented IP-based rate limiting with:
- 5 requests per hour per IP address
- Proper 429 response with Retry-After header
- Rate limit remaining header in successful responses

Note: Uses in-memory storage which resets on cold starts. For more robust protection, consider Vercel KV or Upstash Redis.

**Status**: [x] Fixed ✅

---

### 5. Admin Notification Not Implemented

**Location**: `api/request-company-access.ts`

```typescript
// TODO: Optionally send a notification email to admin about new request
```

This is marked as TODO. Admins may not know when new requests come in unless they check the dashboard manually.

**Fix Applied**: Implemented `sendAdminNotification()` function that sends an email to `ADMIN_NOTIFICATION_EMAIL` (env var) whenever a new company request is submitted. The email includes company details and a link to the admin dashboard.

**Status**: [x] Fixed ✅

---

## Minor Issues

### 6. Case-Insensitive Email Matching

**Location**: `api/request-company-access.ts`

The code correctly lowercases emails when storing:

```typescript
contact_email: contactEmail.trim().toLowerCase(),
```

The duplicate check on the `companies` table also lowercases. However, verify the `companies` table stores emails in lowercase too. If legacy data has mixed case, duplicates could slip through.

**Status**: [x] Verified ✅ - All email comparisons use `.toLowerCase()`

---

### 7. CompanyRegisterPage Status Unknown

**Location**: `src/pages/CompanyRegisterPage.tsx`

The plan says "Remove or repurpose `CompanyRegisterPage.tsx`" but it's unclear if routes to it were removed. It may be orphaned code.

**Fix Applied**: Repurposed `CompanyRegisterPage.tsx` as a redirect handler:
- Unauthenticated users → `/company/request-access`
- Users with existing company → `/company/dashboard`
- Users without company → `/company/request-access`

The route `/company/register` is kept for backwards compatibility with any existing links but now redirects appropriately.

**Status**: [x] Fixed ✅

---

## Plan Documentation Accuracy

The plan accurately describes what was implemented. No discrepancies found between the plan and the code.

---

## Files Reviewed

| File | Status |
|------|--------|
| `supabase/migrations/013_create_pending_company_requests.sql` | ✅ Complete |
| `api/request-company-access.ts` | ✅ Complete (rate limiting + admin notification added) |
| `api/admin/company-requests.ts` | ✅ Complete |
| `api/admin/company-requests/approve.ts` | ✅ Complete (createUser + existing user check) |
| `api/admin/company-requests/reject.ts` | ✅ Complete (env vars added) |
| `src/pages/CompanyRequestAccessPage.tsx` | ✅ Complete |
| `src/pages/CompanyAuthPage.tsx` | ✅ Complete |
| `src/pages/CompanyRegisterPage.tsx` | ✅ Repurposed as redirect |
| `src/pages/AdminDashboardPage.tsx` | ✅ Complete |
| `src/App.tsx` (routes) | ✅ Complete |

---

## All Issues Resolved

| Priority | Issue | Status |
|----------|-------|--------|
| 🔴 Critical | Duplicate Email | ✅ Fixed - Using createUser() |
| 🔴 Critical | Existing User | ✅ Fixed - Added check and graceful handling |
| 🟡 Medium | Hardcoded Domain | ✅ Fixed - Using environment variables |
| 🟡 Medium | Rate Limiting | ✅ Fixed - IP-based rate limiting (5/hour) |
| 🟢 Low | Admin Notification | ✅ Fixed - Email sent on new requests |
| 🟢 Low | Company Confirmation | ✅ Fixed - Confirmation email sent to company |
| 🟢 Low | Cleanup | ✅ Fixed - CompanyRegisterPage repurposed |

---

## Environment Variables Added

Ensure these are set in production:

```env
# Required
PUBLIC_URL=https://creativetechnologists.nl
EMAIL_FROM_DOMAIN=creativetechnologists.nl
ADMIN_NOTIFICATION_EMAIL=admin@creativetechnologists.nl

# Optional (falls back to EMAIL_FROM_DOMAIN)
SUPPORT_EMAIL=hello@creativetechnologists.nl
```

---

## Action Items

- [x] Fix duplicate email issue (Critical) ✅
- [x] Add existing user check before creating (Critical) ✅
- [x] Use environment variables for email domains (Medium) ✅
- [x] Implement rate limiting (Medium) ✅
- [x] Add admin notification for new requests (Low) ✅
- [x] Add company confirmation email (Low) ✅
- [x] Clean up orphaned CompanyRegisterPage (Low) ✅
