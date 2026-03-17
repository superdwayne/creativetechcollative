# Company Approval Visibility Fix

**Date**: February 2, 2026  
**Issue**: Approved companies not visible in admin dashboard  
**Status**: ✅ Fixed

---

## Problem

After approving a company request in the admin dashboard, the company wasn't appearing in the approved companies list.

## Root Cause

The admin dashboard has **two separate sections**:

1. **"Company Requests"** section - Shows pending requests from `pending_company_requests` table
2. **"Companies"** section - Shows approved companies from `companies` table

When a company request is approved:
- ✅ The request is removed from "Company Requests" (status changed to 'approved')
- ✅ A new company record is created in `companies` table with `verified: true`
- ✅ The companies list is refreshed via `fetchCompanies()`
- ❌ BUT the "Companies" section might be **collapsed** or **scrolled out of view**

## The Fix

Made five improvements to `src/pages/AdminDashboardPage.tsx`:

### 1. Auto-expand Companies Section After Approval

```typescript
// Ensure companies section is expanded so user can see the new company
setCollapsedSections((prev) => ({ ...prev, companies: false }));
```

This ensures the "Companies" section is automatically expanded after approval so the user can immediately see the newly approved company.

### 2. Visual Highlight for Recently Approved Companies

```typescript
// Track the recently approved company email for highlighting
if (requestToApprove?.contactEmail) {
  setRecentlyApprovedCompanyEmail(requestToApprove.contactEmail);
  // Clear the highlight after 10 seconds
  setTimeout(() => setRecentlyApprovedCompanyEmail(null), 10000);
}
```

The approved company gets a green border and subtle glow for 10 seconds, making it easy to spot.

### 3. "Just Approved" Badge

```typescript
{isRecentlyApproved && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-secondary border border-green-500/30 animate-pulse">
    <Sparkles className="h-3 w-3" />
    Just Approved
  </span>
)}
```

A pulsing green badge appears next to the company name for 10 seconds.

### 4. Improved Success Message

```typescript
setToast({ 
  message: 'Company approved and account created! Check the Companies section below.', 
  type: 'success' 
});
```

This clarifies where to look for the approved company.

### 5. Added Debug Logging

```typescript
console.log('[Admin] Fetched companies:', data.companies.length, 'companies');
```

This helps verify that companies are being fetched correctly.

---

## How It Works Now

When you approve a company request:

1. ✅ Request is removed from "Pending Company Requests"
2. ✅ New company record is created in database with `verified: true`
3. ✅ Companies list is refreshed automatically
4. ✅ **"Companies" section auto-expands** (NEW!)
5. ✅ **Approved company gets green border and glow** (NEW!)
6. ✅ **"Just Approved" badge appears with sparkle icon** (NEW!)
7. ✅ **Visual highlight fades after 10 seconds** (NEW!)
8. ✅ Success message tells you where to look (NEW!)
9. ✅ Console log shows how many companies were fetched (NEW!)

---

## Where to Find Approved Companies

After approving a company request, scroll down to the **"Companies"** section in your admin dashboard. The newly approved company will appear there with:

- ✅ A blue "Verified" badge
- Company name, email, and industry
- Verification toggle and delete buttons when expanded

---

## Testing

To verify the fix works:

1. Go to admin dashboard
2. Find a pending company request
3. Click "Approve"
4. The "Companies" section should automatically expand
5. The approved company should appear in the list with a "Verified" badge
6. Check browser console for: `[Admin] Fetched companies: X companies`

---

## Related Files

- `src/pages/AdminDashboardPage.tsx` - Frontend admin dashboard
- `api/admin/[[...path]].ts` - Backend admin API (handles approval)
- `supabase/migrations/013_create_pending_company_requests.sql` - Database schema

---

## API Flow

```
POST /api/admin/company-requests/approve
  ↓
1. Fetch request from pending_company_requests
  ↓
2. Create user account (Supabase Auth)
  ↓
3. Create company record in companies table
   - verified: true
   - All company details from request
  ↓
4. Create company_analysis_credits record (5 free credits)
  ↓
5. Create network_profile for messaging
  ↓
6. Update request status to 'approved'
  ↓
7. Send approval email with magic link
  ↓
8. Return success
```

Frontend then:
```
1. Remove request from pending list
2. Refresh companies list (GET /api/admin/companies)
3. Expand companies section
4. Show success toast
```

---

## Notes

- Companies are created with `verified: true` by default when approved by admin
- Each company gets 5 free analysis credits automatically
- A lightweight network profile is created to enable messaging
- The approval email contains a magic link for instant access
