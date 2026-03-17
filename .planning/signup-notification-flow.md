# Signup & Notification Flow - Implementation Summary

**Date**: January 31, 2026  
**Status**: Completed

---

## Overview

This document describes the fixes made to the user signup and admin notification flow for the CTC Network Directory.

---

## Changes Made

### 1. Email Confirmations Enabled

**File**: `supabase/config.toml`

Changed `enable_confirmations` from `false` to `true`. Now when users sign up:
- They receive a confirmation email from Supabase
- They must confirm their email before signing in
- The confirmation email uses Supabase's default template

```toml
[auth.email]
enable_confirmations = true
```

---

### 2. Admin Notification via Resend (Replaced n8n Webhook)

**Previous Implementation**: Used n8n webhook (`profile-approval`) which required:
- `VITE_N8N_BASIC_AUTH_USERNAME`
- `VITE_N8N_BASIC_AUTH_PASSWORD`
- An active n8n workflow

**New Implementation**: Uses Resend API directly, which is more reliable and consistent with other notification emails (company approvals, messages, etc.).

#### New Files Created:

1. **`api/notify-profile-created.ts`**
   - Authenticated endpoint to send admin notification
   - Called from frontend after profile creation
   - Uses Resend API to send email

2. **Email Template in `api/lib/email-templates.ts`**:
   - `newProfilePendingAdminEmail()` - Notification to admin about new profile
   - `welcomeNewUserEmail()` - Welcome email for new users (optional future use)

#### Updated Files:

1. **`src/lib/supabase.ts`**
   - `sendProfileApprovalNotification()` now calls the new API endpoint
   - Accepts optional `accessToken` parameter
   - Removed n8n webhook dependency
   - Removed unused `getWebhookUrl` import

2. **`src/pages/NetworkCreateProfilePage.tsx`**
   - `createProfile()` call now passes `session?.access_token`

---

## Flow Diagram

```
User Signs Up (NetworkAuthPage)
       ↓
Supabase sends confirmation email (automatic)
       ↓
User confirms email → Can now log in
       ↓
User creates profile (NetworkCreateProfilePage)
       ↓
createProfile() called with accessToken
       ↓
Profile saved to database
       ↓
/api/notify-profile-created called
       ↓
Resend API sends email to ADMIN_NOTIFICATION_EMAIL
       ↓
Admin receives email with:
  - Profile name, email, location
  - Bio preview
  - Focus areas
  - Link to view profile
  - Link to admin dashboard
```

---

## Environment Variables Required

```env
# Required for Resend email delivery
RESEND_API_KEY=re_xxxxxxxx

# Admin notification recipient
ADMIN_NOTIFICATION_EMAIL=admin@creativetechnologists.nl

# Email configuration
EMAIL_FROM_DOMAIN=creativetechnologists.nl
PUBLIC_URL=https://creativetechnologists.nl

# Supabase (already configured)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

---

## Admin Dashboard

Pending profiles appear in the Admin Dashboard under the "Pending Profiles" section. Admins can:
- View profile details
- Approve profiles (triggers approval email to user)
- Reject profiles with optional reason (triggers rejection email)

---

## Testing Checklist

- [ ] Sign up as a new user → Confirm email received
- [ ] Confirm email → Can log in
- [ ] Create profile → Admin receives notification email
- [ ] Check Admin Dashboard → Profile appears in pending list
- [ ] Approve profile → User receives approval email
- [ ] Reject profile → User receives rejection email

---

## Removed Dependencies

The following n8n-related environment variables are **no longer required** for profile notifications:
- `VITE_N8N_BASIC_AUTH_USERNAME`
- `VITE_N8N_BASIC_AUTH_PASSWORD`

These may still be needed for other n8n workflows (resources, newsletter signups, etc.).
