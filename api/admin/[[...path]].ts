import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import {
  betaAccountCreationEmail,
  betaApplicationRejectedEmail,
  profileApprovedEmail,
  profileRejectedEmail,
  companyApprovedEmail,
  companyRejectedEmail,
  EMAIL_FROM_DOMAIN,
  PUBLIC_URL,
} from '../lib/email-templates.js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Token expiration in days
const TOKEN_EXPIRATION_DAYS = 7;

/**
 * Check if a user is an admin based on ADMIN_USER_IDS env var
 */
function isAdmin(userId: string): boolean {
  const adminUserIds = process.env.ADMIN_USER_IDS || '';
  const adminIds = adminUserIds.split(',').map((id) => id.trim()).filter(Boolean);
  return adminIds.includes(userId);
}

/**
 * Generate a secure random token for account creation
 */
function generateAccountCreationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Calculate token expiration date
 */
function getTokenExpirationDate(): string {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + TOKEN_EXPIRATION_DAYS);
  return expirationDate.toISOString();
}

/**
 * Send email via Resend
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('[ADMIN] RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Creative Technology Collective <noreply@${EMAIL_FROM_DOMAIN}>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn(`[ADMIN] Resend API error: ${error}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ADMIN] Failed to send email:', error);
    return false;
  }
}

/**
 * Authenticate request and verify admin status
 */
async function authenticateAdmin(
  req: VercelRequest,
  supabase: SupabaseClient
): Promise<{ user: any; error?: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Unauthorized' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return { user: null, error: 'Invalid token' };
  }

  if (!isAdmin(user.id)) {
    return { user: null, error: 'Admin access required' };
  }

  return { user };
}

// ============================================================================
// BETA APPLICATIONS HANDLERS
// ============================================================================

async function handleBetaApplicationsList(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { status } = req.query;

  let query = supabase
    .from('beta_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && typeof status === 'string' && ['pending', 'approved', 'rejected'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data: applications, error } = await query;

  if (error) {
    console.error('[ADMIN] Error fetching beta applications:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }

  return res.status(200).json({
    success: true,
    applications: applications || [],
    count: applications?.length || 0
  });
}

async function handleBetaApplicationsApprove(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  adminUserId: string
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { applicationId, notes } = req.body;

  if (!applicationId) {
    return res.status(400).json({ error: 'Application ID is required' });
  }

  const { data: application, error: fetchError } = await supabase
    .from('beta_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (fetchError || !application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  if (application.status === 'approved') {
    return res.status(400).json({ error: 'Application already approved' });
  }

  const accountCreationToken = generateAccountCreationToken();
  const tokenExpiresAt = getTokenExpirationDate();

  const { error: updateError } = await supabase
    .from('beta_applications')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
      admin_notes: notes || null,
      account_creation_token: accountCreationToken,
      token_expires_at: tokenExpiresAt,
      account_created: false
    })
    .eq('id', applicationId);

  if (updateError) {
    console.error('[ADMIN] Error updating application:', updateError);
    return res.status(500).json({ error: 'Failed to approve application' });
  }

  // Send account creation email
  const accountCreationUrl = `${PUBLIC_URL}/beta/create-account?token=${accountCreationToken}`;
  const htmlContent = betaAccountCreationEmail({
    name: application.name,
    email: application.email,
    accountCreationUrl,
    expiresInDays: TOKEN_EXPIRATION_DAYS,
  });
  await sendEmail(application.email, "You're Approved! Create Your CTC Beta Account", htmlContent);

  return res.status(200).json({
    success: true,
    message: 'Application approved successfully'
  });
}

async function handleBetaApplicationsReject(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  adminUserId: string
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { applicationId, notes, sendEmail: shouldSendEmail = true } = req.body;

  if (!applicationId) {
    return res.status(400).json({ error: 'Application ID is required' });
  }

  const { data: application, error: fetchError } = await supabase
    .from('beta_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (fetchError || !application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  if (application.status === 'rejected') {
    return res.status(400).json({ error: 'Application already rejected' });
  }

  const { error: updateError } = await supabase
    .from('beta_applications')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
      admin_notes: notes || null
    })
    .eq('id', applicationId);

  if (updateError) {
    console.error('[ADMIN] Error updating application:', updateError);
    return res.status(500).json({ error: 'Failed to reject application' });
  }

  let emailSent = false;
  if (shouldSendEmail) {
    const htmlContent = betaApplicationRejectedEmail({
      name: application.name,
      reason: notes,
    });
    emailSent = await sendEmail(application.email, 'Beta Program Application Update - CTC Network', htmlContent);
  }

  return res.status(200).json({
    success: true,
    message: 'Application rejected successfully',
    emailSent,
  });
}

async function handleBetaApplicationsDelete(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { applicationId } = req.body;

  if (!applicationId) {
    return res.status(400).json({ error: 'Application ID is required' });
  }

  const { data: application, error: fetchError } = await supabase
    .from('beta_applications')
    .select('id, name, email')
    .eq('id', applicationId)
    .single();

  if (fetchError || !application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const { error: deleteError } = await supabase
    .from('beta_applications')
    .delete()
    .eq('id', applicationId);

  if (deleteError) {
    console.error('[ADMIN] Error deleting application:', deleteError);
    return res.status(500).json({ error: 'Failed to delete application' });
  }

  return res.status(200).json({
    success: true,
    message: `Beta application for ${application.name} deleted successfully`
  });
}

async function handleBetaApplicationsResendEmail(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { applicationId, sendToAll } = req.body;

  if (applicationId) {
    const { data: application, error: fetchError } = await supabase
      .from('beta_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({ error: 'Application is not approved' });
    }

    if (application.account_created) {
      return res.status(400).json({ error: 'Account already created' });
    }

    const newToken = generateAccountCreationToken();
    const tokenExpiresAt = getTokenExpirationDate();

    const { error: updateError } = await supabase
      .from('beta_applications')
      .update({
        account_creation_token: newToken,
        token_expires_at: tokenExpiresAt,
      })
      .eq('id', applicationId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update application' });
    }

    const accountCreationUrl = `${PUBLIC_URL}/beta/create-account?token=${newToken}`;
    const htmlContent = betaAccountCreationEmail({
      name: application.name,
      email: application.email,
      accountCreationUrl,
      expiresInDays: TOKEN_EXPIRATION_DAYS,
    });
    const emailSent = await sendEmail(application.email, 'Create Your CTC Beta Account', htmlContent);

    return res.status(200).json({
      success: true,
      message: emailSent ? 'Account creation email sent' : 'Token updated but email failed',
      emailSent,
    });
  }

  if (sendToAll) {
    const { data: applications, error: fetchError } = await supabase
      .from('beta_applications')
      .select('*')
      .eq('status', 'approved')
      .eq('account_created', false);

    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }

    if (!applications || applications.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending account creations found',
        sent: 0,
        failed: 0,
      });
    }

    let sent = 0;
    let failed = 0;

    for (const application of applications) {
      const newToken = generateAccountCreationToken();
      const tokenExpiresAt = getTokenExpirationDate();

      const { error: updateError } = await supabase
        .from('beta_applications')
        .update({
          account_creation_token: newToken,
          token_expires_at: tokenExpiresAt,
        })
        .eq('id', application.id);

      if (updateError) {
        failed++;
        continue;
      }

      const accountCreationUrl = `${PUBLIC_URL}/beta/create-account?token=${newToken}`;
      const htmlContent = betaAccountCreationEmail({
        name: application.name,
        email: application.email,
        accountCreationUrl,
        expiresInDays: TOKEN_EXPIRATION_DAYS,
      });
      const emailSent = await sendEmail(application.email, 'Create Your CTC Beta Account', htmlContent);
      
      if (emailSent) {
        sent++;
      } else {
        failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return res.status(200).json({
      success: true,
      message: `Sent ${sent} emails, ${failed} failed`,
      sent,
      failed,
      total: applications.length,
    });
  }

  return res.status(400).json({ error: 'Either applicationId or sendToAll is required' });
}

// ============================================================================
// COMPANIES HANDLERS
// ============================================================================

async function handleCompaniesList(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ADMIN] Failed to fetch companies:', error);
    return res.status(500).json({ error: 'Failed to fetch companies' });
  }

  const companyList = (companies || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    companyWebsite: row.company_website,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    companySize: row.company_size,
    industry: row.industry,
    verified: row.verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return res.status(200).json({
    companies: companyList,
    count: companyList.length,
  });
}

async function handleCompaniesVerify(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyId, verified } = req.body;

  if (!companyId || typeof verified !== 'boolean') {
    return res.status(400).json({ error: 'companyId and verified (boolean) are required' });
  }

  const { data: company, error: updateError } = await supabase
    .from('companies')
    .update({
      verified: verified,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)
    .select()
    .single();

  if (updateError) {
    console.error('[ADMIN] Update failed:', updateError);
    return res.status(500).json({ error: 'Failed to update company verification status' });
  }

  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  return res.status(200).json({
    success: true,
    company: {
      id: company.id,
      companyName: company.company_name,
      verified: company.verified,
    },
  });
}

// ============================================================================
// COMPANY REQUESTS HANDLERS
// ============================================================================

async function handleCompanyRequestsList(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { status } = req.query;

  let query = supabase
    .from('pending_company_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && typeof status === 'string' && ['pending', 'approved', 'rejected'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data: requests, error } = await query;

  if (error) {
    console.error('[ADMIN] Error fetching company requests:', error);
    return res.status(500).json({ error: 'Failed to fetch company requests' });
  }

  return res.status(200).json({
    success: true,
    requests: requests || [],
    count: requests?.length || 0
  });
}

async function handleCompanyRequestsApprove(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  adminUserId: string
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, notes } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  const { data: request, error: fetchError } = await supabase
    .from('pending_company_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  if (request.status === 'approved') {
    return res.status(400).json({ error: 'Request already approved' });
  }

  // Generate magic link for the user
  const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: request.contact_email,
    options: {
      redirectTo: `${PUBLIC_URL}/company/dashboard`,
    }
  });

  if (magicLinkError) {
    console.error('[ADMIN] Failed to generate magic link:', magicLinkError);
    return res.status(500).json({ error: 'Failed to generate access link' });
  }

  // Update request status
  const { error: updateError } = await supabase
    .from('pending_company_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
      admin_notes: notes || null
    })
    .eq('id', requestId);

  if (updateError) {
    console.error('[ADMIN] Error updating request:', updateError);
    return res.status(500).json({ error: 'Failed to approve request' });
  }

  // Send approval email
  const htmlContent = companyApprovedEmail({
    contactName: request.contact_name || 'there',
    companyName: request.company_name,
    magicLink: magicLinkData.properties?.action_link || `${PUBLIC_URL}/company/auth`,
  });
  await sendEmail(request.contact_email, 'Welcome to CTC Talent Matching!', htmlContent);

  return res.status(200).json({
    success: true,
    message: 'Company request approved successfully'
  });
}

async function handleCompanyRequestsReject(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  adminUserId: string
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, notes, sendEmail: shouldSendEmail = true } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  const { data: request, error: fetchError } = await supabase
    .from('pending_company_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  if (request.status === 'rejected') {
    return res.status(400).json({ error: 'Request already rejected' });
  }

  const { error: updateError } = await supabase
    .from('pending_company_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
      admin_notes: notes || null
    })
    .eq('id', requestId);

  if (updateError) {
    console.error('[ADMIN] Error updating request:', updateError);
    return res.status(500).json({ error: 'Failed to reject request' });
  }

  let emailSent = false;
  if (shouldSendEmail) {
    const htmlContent = companyRejectedEmail({
      contactName: request.contact_name || 'there',
      companyName: request.company_name,
    });
    emailSent = await sendEmail(request.contact_email, 'Thank you for your interest', htmlContent);
  }

  return res.status(200).json({
    success: true,
    message: 'Company request rejected successfully',
    emailSent,
  });
}

// ============================================================================
// PROFILES HANDLERS
// ============================================================================

async function handleProfilesList(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: profiles, error } = await supabase
    .from('network_profiles')
    .select('*')
    .eq('approved', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[ADMIN] Failed to fetch profiles:', error);
    return res.status(500).json({ error: 'Failed to fetch pending profiles' });
  }

  const pendingProfiles = (profiles || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    location: row.location,
    bio: row.bio,
    skills: row.skills || [],
    focusAreas: row.focus_areas || [],
    availability: row.availability,
    portfolioUrl: row.portfolio_url,
    linkedinUrl: row.linkedin_url,
    profilePictureUrl: row.profile_picture_url,
    projects: row.projects || [],
    createdAt: row.created_at,
    slug: row.slug,
  }));

  return res.status(200).json({
    profiles: pendingProfiles,
    count: pendingProfiles.length,
  });
}

async function handleProfilesApprove(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  adminUserId: string
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { profileId } = req.body;

  if (!profileId) {
    return res.status(400).json({ error: 'profileId is required' });
  }

  const { data: profile, error: updateError } = await supabase
    .from('network_profiles')
    .update({
      approved: true,
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
    })
    .eq('id', profileId)
    .select()
    .single();

  if (updateError) {
    console.error('[ADMIN] Failed to approve profile:', updateError);
    return res.status(500).json({ error: 'Failed to approve profile' });
  }

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // Send approval email
  const profileUrl = `https://${EMAIL_FROM_DOMAIN}/directory/profile/${profile.slug}`;
  const htmlContent = profileApprovedEmail({
    fullName: profile.full_name,
    profileUrl,
  });
  await sendEmail(profile.email, 'Your CTC Directory profile is live!', htmlContent);

  return res.status(200).json({
    success: true,
    profile: {
      id: profile.id,
      fullName: profile.full_name,
      approved: profile.approved,
      approvedAt: profile.approved_at,
      approvedBy: profile.approved_by,
    },
  });
}

async function handleProfilesReject(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  adminUserId: string
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { profileId, reason, sendEmail: shouldSendEmail = true } = req.body;

  if (!profileId) {
    return res.status(400).json({ error: 'profileId is required' });
  }

  const { data: profile, error: fetchError } = await supabase
    .from('network_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (fetchError || !profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // Delete the profile (rejected profiles are removed)
  const { error: deleteError } = await supabase
    .from('network_profiles')
    .delete()
    .eq('id', profileId);

  if (deleteError) {
    console.error('[ADMIN] Failed to delete profile:', deleteError);
    return res.status(500).json({ error: 'Failed to reject profile' });
  }

  let emailSent = false;
  if (shouldSendEmail) {
    const htmlContent = profileRejectedEmail({
      fullName: profile.full_name,
      reason,
    });
    emailSent = await sendEmail(profile.email, 'Profile Review Update', htmlContent);
  }

  return res.status(200).json({
    success: true,
    message: 'Profile rejected and removed',
    emailSent,
  });
}

// ============================================================================
// MEMBERS HANDLERS
// ============================================================================

async function handleMembersList(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type = 'all', status = 'approved' } = req.query;

  const response: {
    success: boolean;
    betaMembers?: any[];
    directoryMembers?: any[];
    counts: {
      betaTotal: number;
      betaApproved: number;
      betaPending: number;
      betaRejected: number;
      directoryTotal: number;
      directoryApproved: number;
      directoryPending: number;
    };
  } = {
    success: true,
    counts: {
      betaTotal: 0,
      betaApproved: 0,
      betaPending: 0,
      betaRejected: 0,
      directoryTotal: 0,
      directoryApproved: 0,
      directoryPending: 0,
    },
  };

  if (type === 'all' || type === 'beta') {
    const { count: betaApproved } = await supabase
      .from('beta_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    
    const { count: betaPending } = await supabase
      .from('beta_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    const { count: betaRejected } = await supabase
      .from('beta_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    response.counts.betaApproved = betaApproved || 0;
    response.counts.betaPending = betaPending || 0;
    response.counts.betaRejected = betaRejected || 0;
    response.counts.betaTotal = (betaApproved || 0) + (betaPending || 0) + (betaRejected || 0);

    let betaQuery = supabase
      .from('beta_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== 'all' && typeof status === 'string') {
      betaQuery = betaQuery.eq('status', status);
    }

    const { data: betaApps, error: betaError } = await betaQuery;

    if (betaError) {
      console.error('[ADMIN] Error fetching beta applications:', betaError);
      return res.status(500).json({ error: 'Failed to fetch beta applications' });
    }

    response.betaMembers = betaApps?.map((app) => ({
      id: app.id,
      name: app.name,
      email: app.email,
      interests: app.interests || [],
      status: app.status,
      adminNotes: app.admin_notes,
      createdAt: app.created_at,
      reviewedAt: app.reviewed_at,
      reviewedBy: app.reviewed_by,
      memberType: 'beta',
    })) || [];
  }

  if (type === 'all' || type === 'directory') {
    const { count: directoryApproved } = await supabase
      .from('network_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('approved', true);
    
    const { count: directoryPending } = await supabase
      .from('network_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('approved', false);

    response.counts.directoryApproved = directoryApproved || 0;
    response.counts.directoryPending = directoryPending || 0;
    response.counts.directoryTotal = (directoryApproved || 0) + (directoryPending || 0);

    let profileQuery = supabase
      .from('network_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== 'all' && typeof status === 'string') {
      if (status === 'approved') {
        profileQuery = profileQuery.eq('approved', true);
      } else if (status === 'pending') {
        profileQuery = profileQuery.eq('approved', false);
      }
    }

    const { data: profiles, error: profileError } = await profileQuery;

    if (profileError) {
      console.error('[ADMIN] Error fetching profiles:', profileError);
      return res.status(500).json({ error: 'Failed to fetch directory profiles' });
    }

    response.directoryMembers = profiles?.map((profile) => ({
      id: profile.id,
      userId: profile.user_id,
      fullName: profile.full_name,
      email: profile.email,
      location: profile.location,
      bio: profile.bio,
      skills: profile.skills || [],
      focusAreas: profile.focus_areas || [],
      availability: profile.availability,
      portfolioUrl: profile.portfolio_url,
      linkedinUrl: profile.linkedin_url,
      profilePictureUrl: profile.profile_picture_url,
      slug: profile.slug,
      approved: profile.approved,
      approvedAt: profile.approved_at,
      approvedBy: profile.approved_by,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      memberType: 'directory',
      membershipType: profile.membership_type || 'full',
    })) || [];
  }

  return res.status(200).json(response);
}

async function handleMembersUpgrade(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { profileId } = req.body;

  if (!profileId) {
    return res.status(400).json({ error: 'Profile ID is required' });
  }

  const { data: profile, error: fetchError } = await supabase
    .from('network_profiles')
    .select('id, full_name, email, membership_type')
    .eq('id', profileId)
    .single();

  if (fetchError || !profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  if (profile.membership_type === 'full') {
    return res.status(400).json({ error: 'Profile is already a full member' });
  }

  const { error: updateError } = await supabase
    .from('network_profiles')
    .update({ membership_type: 'full' })
    .eq('id', profileId);

  if (updateError) {
    console.error('[ADMIN] Error updating profile:', updateError);
    return res.status(500).json({ error: 'Failed to upgrade member' });
  }

  return res.status(200).json({
    success: true,
    message: `${profile.full_name} has been upgraded to a full directory member`,
    profile: {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      membershipType: 'full',
    },
  });
}

// ============================================================================
// JOBS HANDLERS
// ============================================================================

async function handleJobsList(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: jobs, error } = await supabase
    .from('job_submissions')
    .select(`
      *,
      companies (
        id,
        company_name,
        verified
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ADMIN] Failed to fetch jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }

  return res.status(200).json({
    success: true,
    jobs: jobs || [],
    count: jobs?.length || 0,
  });
}

async function handleJobsReject(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  adminUserId: string
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId, reason } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  const { data: job, error: updateError } = await supabase
    .from('job_submissions')
    .update({
      status: 'rejected',
      rejection_reason: reason || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
    })
    .eq('id', jobId)
    .select()
    .single();

  if (updateError) {
    console.error('[ADMIN] Failed to reject job:', updateError);
    return res.status(500).json({ error: 'Failed to reject job' });
  }

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  return res.status(200).json({
    success: true,
    job: {
      id: job.id,
      title: job.title,
      status: job.status,
    },
  });
}

// ============================================================================
// MATCHES HANDLERS
// ============================================================================

async function handleMatchesList(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: matches, error } = await supabase
    .from('job_matches')
    .select(`
      *,
      job_submissions (
        id,
        title,
        company_id,
        companies (
          id,
          company_name
        )
      ),
      network_profiles (
        id,
        full_name,
        email,
        slug
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ADMIN] Failed to fetch matches:', error);
    return res.status(500).json({ error: 'Failed to fetch matches' });
  }

  return res.status(200).json({
    success: true,
    matches: matches || [],
    count: matches?.length || 0,
  });
}

async function handlePendingMatchesList(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: matches, error } = await supabase
    .from('job_matches')
    .select(`
      *,
      job_submissions (
        id,
        title,
        company_id,
        companies (
          id,
          company_name
        )
      ),
      network_profiles (
        id,
        full_name,
        email,
        slug
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ADMIN] Failed to fetch pending matches:', error);
    return res.status(500).json({ error: 'Failed to fetch pending matches' });
  }

  return res.status(200).json({
    success: true,
    matches: matches || [],
    count: matches?.length || 0,
  });
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Check Supabase configuration
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ADMIN] Supabase not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Authenticate admin
  const { user, error: authError } = await authenticateAdmin(req, supabase);
  if (authError) {
    const status = authError === 'Unauthorized' || authError === 'Invalid token' ? 401 : 403;
    return res.status(status).json({ error: authError });
  }

  try {
    // Get the path segments after /api/admin/
    const pathSegments = (req.query.path as string[]) || [];
    const route = pathSegments.join('/');

    console.log(`[ADMIN] Route: ${route}, Method: ${req.method}`);

    // Route to appropriate handler
    switch (route) {
      // Beta Applications
      case 'beta-applications':
        return handleBetaApplicationsList(req, res, supabase);
      case 'beta-applications/approve':
        return handleBetaApplicationsApprove(req, res, supabase, user.id);
      case 'beta-applications/reject':
        return handleBetaApplicationsReject(req, res, supabase, user.id);
      case 'beta-applications/delete':
        return handleBetaApplicationsDelete(req, res, supabase);
      case 'beta-applications/resend-account-email':
        return handleBetaApplicationsResendEmail(req, res, supabase);

      // Companies
      case 'companies':
        return handleCompaniesList(req, res, supabase);
      case 'companies/verify':
        return handleCompaniesVerify(req, res, supabase);

      // Company Requests
      case 'company-requests':
        return handleCompanyRequestsList(req, res, supabase);
      case 'company-requests/approve':
        return handleCompanyRequestsApprove(req, res, supabase, user.id);
      case 'company-requests/reject':
        return handleCompanyRequestsReject(req, res, supabase, user.id);

      // Profiles
      case 'profiles':
        return handleProfilesList(req, res, supabase);
      case 'profiles/approve':
        return handleProfilesApprove(req, res, supabase, user.id);
      case 'profiles/reject':
        return handleProfilesReject(req, res, supabase, user.id);

      // Members
      case 'members':
        return handleMembersList(req, res, supabase);
      case 'members/upgrade':
        return handleMembersUpgrade(req, res, supabase);

      // Jobs
      case 'jobs':
        return handleJobsList(req, res, supabase);
      case 'jobs/reject':
        return handleJobsReject(req, res, supabase, user.id);

      // Matches
      case 'matches':
        return handleMatchesList(req, res, supabase);
      case 'pending-matches':
        return handlePendingMatchesList(req, res, supabase);

      default:
        console.warn(`[ADMIN] Unknown route: ${route}`);
        return res.status(404).json({ error: `Route not found: /api/admin/${route}` });
    }
  } catch (error) {
    console.error('[ADMIN] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
