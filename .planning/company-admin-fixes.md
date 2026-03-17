# Company Admin Dashboard Fixes

## Issues Fixed

### 1. Companies Not Showing in Directory Members After Approval
**Problem**: When a company request was approved, a company record was created in the `companies` table AND a network profile was created with `membership_type: 'company'`. However, these company profiles were not clearly visible in the admin dashboard.

**Solution**: 
- Added a "COMPANY" badge to directory members with `membershipType === 'company'` to clearly distinguish them from regular members
- The company profiles are now visible in the "Directory Members" section with a green "COMPANY" badge
- Regular members show a purple "BETA" badge if they have `membershipType === 'beta'`

### 2. Unable to Delete Approved Companies
**Problem**: There was no way to delete companies that had already been approved. The admin dashboard only had verify/unverify functionality.

**Solution**:
- Added a new `deleteCompany` function in `AdminDashboardPage.tsx`
- Added a "Delete Company" button in the company details section (red button with trash icon)
- Created a new API endpoint `/api/admin/companies/delete` that:
  - Deletes the company record from the `companies` table
  - Deletes the associated network profile (if exists)
  - Deletes the auth user account
  - Shows a confirmation dialog before deletion
- Added proper loading states and error handling

## Changes Made

### Frontend (`src/pages/AdminDashboardPage.tsx`)
1. Added `deletingCompanyId` state to track which company is being deleted
2. Added `deleteCompany` function that:
   - Shows a confirmation dialog
   - Calls the delete API endpoint
   - Updates local state on success
   - Shows success/error toasts
3. Added delete button in the company details section
4. Added "COMPANY" badge display in directory members list

### Backend (`api/admin/[[...path]].ts`)
1. Created `handleCompaniesDelete` function that:
   - Validates the request
   - Fetches the company to get user_id
   - Deletes the company record (cascade handles related data)
   - Deletes the network profile
   - Deletes the auth user
   - Returns success message
2. Added route handler for `companies/delete`
3. Updated endpoint list documentation

## How Company Profiles Work

When a company request is approved:
1. A user account is created in Supabase Auth
2. A company record is created in the `companies` table
3. A network profile is created in `network_profiles` with:
   - `membership_type: 'company'`
   - `approved: true`
   - A company-specific slug
4. Analysis credits are initialized

The company profile appears in:
- **Companies Section**: Shows company details, verification status, and delete button
- **Directory Members Section**: Shows as a member with a green "COMPANY" badge

## Testing

To test these changes:
1. Approve a company request from the "Pending Company Requests" section
2. Verify the company appears in both:
   - The "Companies" section (with company details)
   - The "Directory Members" section (with green "COMPANY" badge)
3. Test deleting a company:
   - Click the "Delete Company" button
   - Confirm the deletion
   - Verify the company is removed from both sections
   - Verify the user account is deleted

## Notes

- The delete operation is permanent and cannot be undone
- Deleting a company also deletes:
  - The company record
  - The network profile
  - The auth user account
  - All related data (via cascade)
- A confirmation dialog is shown before deletion to prevent accidental deletions
