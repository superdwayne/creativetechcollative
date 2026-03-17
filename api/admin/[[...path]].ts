import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import {
  betaApplicationApprovedEmail,
  betaApplicationRejectedEmail,
  profileApprovedEmail,
  profileRejectedEmail,
  companyApprovedEmail,
  companyRejectedEmail,
  passwordResetEmail,
  welcomeNewUserEmail,
  profileCompletionReminderEmail,
  testMessageEmail,
  platformUpdateEmail,
  quickMessageEmail,
  EMAIL_FROM_DOMAIN,
  PUBLIC_URL,
} from '../_lib/email-templates.js';
import type { UpdateSection } from '../_lib/email-templates.js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Check if a user is an admin based on ADMIN_USER_IDS env var
 */
function isAdmin(userId: string): boolean {
  const adminUserIds = process.env.ADMIN_USER_IDS || '';
  const adminIds = adminUserIds.split(',').map((id) => id.trim()).filter(Boolean);
  return adminIds.includes(userId);
}

/**
 * Generate a random password for account creation (user will use magic link)
 */
function generateRandomPassword(): string {
  return randomBytes(32).toString('hex');
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

  // Create user account immediately
  let userId: string | null = null;

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: application.email,
    password: generateRandomPassword(),
    email_confirm: true,
    user_metadata: {
      full_name: application.name,
      beta_member: true,
      beta_application_id: application.id,
    },
  });

  if (authError) {
    if (authError.message?.includes('already been registered') || 
        authError.message?.includes('already exists')) {
      // User already exists — look up their ID
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(
        u => u.email?.toLowerCase() === application.email.toLowerCase()
      );
      if (existing) {
        userId = existing.id;
      }
    } else {
      console.error('[ADMIN] Error creating user:', authError);
      return res.status(500).json({ error: 'Failed to create user account' });
    }
  } else {
    userId = authData?.user?.id || null;
  }

  // Update application status
  const { error: updateError } = await supabase
    .from('beta_applications')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
      admin_notes: notes || null,
      account_created: true,
      account_created_at: new Date().toISOString(),
      user_id: userId,
      account_creation_token: null,
      token_expires_at: null,
    })
    .eq('id', applicationId);

  if (updateError) {
    console.error('[ADMIN] Error updating application:', updateError);
    return res.status(500).json({ error: 'Failed to approve application' });
  }

  // Generate a magic link so the user can sign in directly from the email
  let dashboardUrl = `${PUBLIC_URL}/beta/auth`;
  try {
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: application.email,
      options: {
        redirectTo: `${PUBLIC_URL}/directory/auth`,
      },
    });
    if (linkData?.properties?.action_link) {
      dashboardUrl = linkData.properties.action_link;
    }
  } catch (linkErr) {
    console.warn('[ADMIN] Could not generate magic link for approval, falling back to auth page URL:', linkErr);
  }

  const htmlContent = betaApplicationApprovedEmail({
    name: application.name,
    dashboardUrl,
  });
  await sendEmail(application.email, "You're Approved! Welcome to CTC Beta", htmlContent);

  return res.status(200).json({
    success: true,
    message: 'Application approved and account created successfully'
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

    // Generate a magic link so the user can sign in directly
    let dashboardUrl = `${PUBLIC_URL}/beta/auth`;
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: application.email,
        options: {
          redirectTo: `${PUBLIC_URL}/directory/auth`,
        },
      });
      if (linkData?.properties?.action_link) {
        dashboardUrl = linkData.properties.action_link;
      }
    } catch (linkErr) {
      console.warn('[ADMIN] Could not generate magic link, falling back to auth page URL:', linkErr);
    }

    const htmlContent = betaApplicationApprovedEmail({
      name: application.name,
      dashboardUrl,
    });
    const emailSent = await sendEmail(application.email, 'Your CTC Beta Access Link', htmlContent);

    return res.status(200).json({
      success: true,
      message: emailSent ? 'Access email with sign-in link sent' : 'Failed to send email',
      emailSent,
    });
  }

  if (sendToAll) {
    const { data: applications, error: fetchError } = await supabase
      .from('beta_applications')
      .select('*')
      .eq('status', 'approved');

    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }

    if (!applications || applications.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No approved applications found',
        sent: 0,
        failed: 0,
      });
    }

    let sent = 0;
    let failed = 0;

    for (const application of applications) {
      let dashboardUrl = `${PUBLIC_URL}/beta/auth`;
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: application.email,
          options: {
            redirectTo: `${PUBLIC_URL}/directory/auth`,
          },
        });
        if (linkData?.properties?.action_link) {
          dashboardUrl = linkData.properties.action_link;
        }
      } catch {
        // Fall back to static URL
      }

      const htmlContent = betaApplicationApprovedEmail({
        name: application.name,
        dashboardUrl,
      });
      const emailSent = await sendEmail(application.email, 'Your CTC Beta Access Link', htmlContent);
      
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

async function handleCompaniesDelete(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyId } = req.body;

  if (!companyId) {
    return res.status(400).json({ error: 'companyId is required' });
  }

  // Get company to find user_id
  const { data: company, error: fetchError } = await supabase
    .from('companies')
    .select('id, company_name, user_id')
    .eq('id', companyId)
    .single();

  if (fetchError || !company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  // Delete the company (cascade will handle related records)
  const { error: deleteError } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId);

  if (deleteError) {
    console.error('[ADMIN] Error deleting company:', deleteError);
    return res.status(500).json({ error: 'Failed to delete company' });
  }

  // Delete the network profile if it exists
  await supabase
    .from('network_profiles')
    .delete()
    .eq('user_id', company.user_id);

  // Delete the auth user
  if (company.user_id) {
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(company.user_id);
    if (authDeleteError) {
      console.warn('[ADMIN] Failed to delete auth user:', authDeleteError);
      // Don't fail the whole operation if auth deletion fails
    }
  }

  return res.status(200).json({
    success: true,
    message: `Company ${company.company_name} deleted successfully`,
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

  // Transform to camelCase for frontend
  const transformedRequests = (requests || []).map((r: any) => ({
    id: r.id,
    companyName: r.company_name,
    companyWebsite: r.company_website,
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    companySize: r.company_size,
    industry: r.industry,
    status: r.status,
    adminNotes: r.admin_notes,
    reviewedAt: r.reviewed_at,
    reviewedBy: r.reviewed_by,
    createdAt: r.created_at,
  }));

  return res.status(200).json({
    success: true,
    requests: transformedRequests,
    count: transformedRequests.length
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

  // Create user account immediately
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: request.contact_email,
    password: generateRandomPassword(),
    email_confirm: true,
    user_metadata: {
      full_name: request.contact_name,
      company_name: request.company_name,
    },
  });

  let userId = authData?.user?.id;

  if (authError) {
    // If user already exists, that's okay - we'll fetch the existing user and generate a magic link
    if (authError.message?.includes('already been registered') || 
        authError.message?.includes('already exists')) {
      console.log('[ADMIN] User already exists, fetching existing user:', request.contact_email);
      
      // Fetch the existing user by email
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('[ADMIN] Error listing users:', listError);
        return res.status(500).json({ error: 'Failed to fetch existing user' });
      }
      
      if (existingUsers?.users) {
        const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === request.contact_email.toLowerCase());
        if (existingUser) {
          userId = existingUser.id;
          console.log('[ADMIN] Found existing user ID:', userId);
        } else {
          console.error('[ADMIN] User exists but could not be found in user list');
          return res.status(500).json({ error: 'User exists but could not be retrieved' });
        }
      } else {
        console.error('[ADMIN] No users returned from list');
        return res.status(500).json({ error: 'Failed to retrieve user list' });
      }
    } else {
      console.error('[ADMIN] Error creating user:', authError);
      console.error('[ADMIN] Auth error details:', JSON.stringify(authError, null, 2));
      return res.status(500).json({ 
        error: 'Failed to create user account',
        details: authError.message 
      });
    }
  }

  // Validate userId before proceeding
  if (!userId) {
    console.error('[ADMIN] No user ID available after user creation/lookup');
    console.error('[ADMIN] Auth data:', authData);
    console.error('[ADMIN] Auth error:', authError);
    return res.status(500).json({ 
      error: 'Failed to get user ID for company creation',
      details: 'User ID is null or undefined after account creation'
    });
  }

  console.log('[ADMIN] Creating company for user:', userId);
  console.log('[ADMIN] Company data:', {
    user_id: userId,
    company_name: request.company_name,
    contact_email: request.contact_email,
  });
  
  // Check if company already exists for this user
  const { data: existingCompany, error: existingCompanyError } = await supabase
    .from('companies')
    .select('id, company_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingCompanyError) {
    console.error('[ADMIN] Error checking existing company:', existingCompanyError);
    return res.status(500).json({ error: 'Failed to check existing company' });
  }

  if (existingCompany) {
    console.log('[ADMIN] Company already exists for user:', existingCompany.company_name);
    return res.status(400).json({ 
      error: 'User already has a company account',
      companyName: existingCompany.company_name 
    });
  }
  
  // Provide a fallback for contact_name since pending_company_requests allows null
  // but the companies table requires it
  const contactName = request.contact_name || request.company_name || 'Contact';
  
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      user_id: userId,
      company_name: request.company_name,
      company_website: request.company_website,
      contact_name: contactName,
      contact_email: request.contact_email,
      contact_phone: request.contact_phone,
      company_size: request.company_size,
      industry: request.industry,
      verified: true, // Auto-verify admin-approved companies
    })
    .select()
    .single();

  if (companyError) {
    console.error('[ADMIN] Error creating company:', companyError);
    console.error('[ADMIN] Company error details:', JSON.stringify(companyError, null, 2));
    return res.status(500).json({ 
      error: 'Failed to create company record',
      details: companyError.message,
      code: companyError.code
    });
  }

  if (company) {
    console.log('[ADMIN] Company created successfully:', company.id, company.company_name);
    
    // Initialize analysis credits for the company
    await supabase
      .from('company_analysis_credits')
      .insert({
        company_id: company.id,
        free_analyses_remaining: 5,
        purchased_credits: 0,
      });

    // Initialize message credits for the company
    await supabase
      .from('company_message_credits')
      .insert({
        company_id: company.id,
        free_messages_remaining: 25,
        purchased_credits: 0,
      });

    // Create a lightweight network profile for the company to enable messaging
    // This allows companies to participate in direct conversations with members
    const companySlug = request.company_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + `-company-${company.id.substring(0, 8)}`;

    await supabase
      .from('network_profiles')
      .insert({
        user_id: userId,
        full_name: request.company_name,
        email: request.contact_email,
        bio: `${request.company_name}${request.industry ? ` - ${request.industry}` : ''}`,
        location: '',
        skills: [],
        focus_areas: [],
        availability: 'not-available',
        slug: companySlug,
        approved: true, // Auto-approve company profiles
        approved_at: new Date().toISOString(),
        approved_by: adminUserId,
        membership_type: 'company', // Mark as company profile
      });
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
    contactName: contactName,
    companyName: request.company_name,
    magicLink: magicLinkData.properties?.action_link || `${PUBLIC_URL}/company/auth`,
  });
  await sendEmail(request.contact_email, 'Welcome to CTC Talent Matching!', htmlContent);

  return res.status(200).json({
    success: true,
    message: 'Company request approved and company created successfully'
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
    const contactNameForEmail = request.contact_name || request.company_name || 'there';
    const htmlContent = companyRejectedEmail({
      contactName: contactNameForEmail,
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

  // Parse pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const status = req.query.status as string | undefined;
  const offset = (page - 1) * limit;

  // Get total count first
  let countQuery = supabase
    .from('job_submissions')
    .select('*', { count: 'exact', head: true });

  if (status && ['pending', 'approved', 'rejected', 'matched', 'closed'].includes(status)) {
    countQuery = countQuery.eq('status', status);
  }

  const { count: totalCount, error: countError } = await countQuery;

  if (countError) {
    console.error('[ADMIN] Failed to count jobs:', countError);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }

  // Fetch paginated jobs
  let query = supabase
    .from('job_submissions')
    .select(`
      *,
      companies (
        id,
        company_name,
        verified
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && ['pending', 'approved', 'rejected', 'matched', 'closed'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data: jobs, error } = await query;

  if (error) {
    console.error('[ADMIN] Failed to fetch jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }

  const total = totalCount || 0;
  const totalPages = Math.ceil(total / limit);

  // Transform jobs to camelCase for frontend
  const transformedJobs = (jobs || []).map((job: any) => ({
    id: job.id,
    companyId: job.company_id,
    companyName: job.companies?.company_name || 'Unknown Company',
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    preferredSkills: job.preferred_skills || [],
    focusAreas: job.focus_areas || [],
    budgetRange: job.budget_range,
    projectType: job.project_type,
    remotePreference: job.remote_preference,
    location: job.location,
    timeline: job.timeline,
    status: job.status,
    adminNotes: job.admin_notes,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    matchCount: job.match_count || 0,
  }));

  return res.status(200).json({
    success: true,
    jobs: transformedJobs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
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

  const jobId = req.query.jobId as string | undefined;

  let query = supabase
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
        slug,
        location,
        bio,
        skills,
        focus_areas,
        availability,
        portfolio_url,
        linkedin_url,
        profile_picture_url
      )
    `)
    .order('created_at', { ascending: false });

  // Filter by jobId if provided
  if (jobId) {
    query = query.eq('job_id', jobId);
  }

  const { data: matches, error } = await query;

  if (error) {
    console.error('[ADMIN] Failed to fetch matches:', error);
    return res.status(500).json({ error: 'Failed to fetch matches' });
  }

  // Transform matches to camelCase for frontend
  const transformedMatches = (matches || []).map((match: any) => ({
    id: match.id,
    jobId: match.job_id,
    profileId: match.profile_id,
    matchScore: match.match_score || 0,
    matchReasoning: match.match_reasoning || '',
    skillMatches: match.skill_matches || [],
    vectorSimilarity: match.vector_similarity,
    adminApproved: match.admin_approved,
    memberNotified: match.member_notified || false,
    memberResponse: match.member_response,
    createdAt: match.created_at,
    profile: match.network_profiles ? {
      id: match.network_profiles.id,
      fullName: match.network_profiles.full_name,
      email: match.network_profiles.email,
      location: match.network_profiles.location || '',
      bio: match.network_profiles.bio || '',
      skills: match.network_profiles.skills || [],
      focusAreas: match.network_profiles.focus_areas || [],
      availability: match.network_profiles.availability || '',
      portfolioUrl: match.network_profiles.portfolio_url,
      linkedinUrl: match.network_profiles.linkedin_url,
      profilePictureUrl: match.network_profiles.profile_picture_url,
    } : null,
  }));

  return res.status(200).json({
    success: true,
    matches: transformedMatches,
    count: transformedMatches.length,
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
// CREDIT USAGE HANDLERS
// ============================================================================

async function handleCreditUsageList(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get all companies with their credit info
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, company_name');

  if (companiesError) {
    console.error('[ADMIN] Error fetching companies:', companiesError);
    return res.status(500).json({ error: 'Failed to fetch companies' });
  }

  // Get credit balances for all companies
  const { data: credits, error: creditsError } = await supabase
    .from('company_analysis_credits')
    .select('company_id, free_analyses_remaining, purchased_credits');

  if (creditsError) {
    console.error('[ADMIN] Error fetching credits:', creditsError);
    return res.status(500).json({ error: 'Failed to fetch credits' });
  }

  // Get usage stats grouped by company
  const { data: usageStats, error: usageError } = await supabase
    .from('analysis_usage_logs')
    .select('company_id');

  if (usageError) {
    console.error('[ADMIN] Error fetching usage:', usageError);
    return res.status(500).json({ error: 'Failed to fetch usage' });
  }

  // Get purchase totals (revenue) grouped by company
  const { data: purchases, error: purchasesError } = await supabase
    .from('credit_purchases')
    .select('company_id, price_cents');

  if (purchasesError) {
    console.error('[ADMIN] Error fetching purchases:', purchasesError);
    return res.status(500).json({ error: 'Failed to fetch purchases' });
  }

  // Build credit map
  const creditMap = new Map<string, { free: number; purchased: number }>();
  for (const c of credits || []) {
    creditMap.set(c.company_id, {
      free: 5 - (c.free_analyses_remaining || 0), // Used free credits
      purchased: c.purchased_credits || 0,
    });
  }

  // Count usage per company
  const usageMap = new Map<string, number>();
  for (const u of usageStats || []) {
    usageMap.set(u.company_id, (usageMap.get(u.company_id) || 0) + 1);
  }

  // Sum revenue per company
  const revenueMap = new Map<string, number>();
  for (const p of purchases || []) {
    revenueMap.set(p.company_id, (revenueMap.get(p.company_id) || 0) + (p.price_cents || 0));
  }

  // Build response
  const companyUsage = (companies || []).map((company) => ({
    companyId: company.id,
    companyName: company.company_name,
    freeUsed: creditMap.get(company.id)?.free || 0,
    purchasedRemaining: creditMap.get(company.id)?.purchased || 0,
    totalAnalyses: usageMap.get(company.id) || 0,
    totalRevenue: revenueMap.get(company.id) || 0,
  }));

  // Calculate totals
  const totals = {
    totalAnalyses: Array.from(usageMap.values()).reduce((a, b) => a + b, 0),
    totalRevenue: Array.from(revenueMap.values()).reduce((a, b) => a + b, 0),
  };

  return res.status(200).json({
    success: true,
    companies: companyUsage,
    totals,
  });
}

async function handleGrantCredits(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyId, creditsAmount, note } = req.body;

  if (!companyId) {
    return res.status(400).json({ error: 'Company ID is required' });
  }

  if (!creditsAmount || typeof creditsAmount !== 'number' || creditsAmount <= 0) {
    return res.status(400).json({ error: 'Valid credits amount is required' });
  }

  // Check if company exists
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, company_name')
    .eq('id', companyId)
    .single();

  if (companyError || !company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  // Get or create credit record
  const { data: existingCredits } = await supabase
    .from('company_analysis_credits')
    .select('*')
    .eq('company_id', companyId)
    .single();

  let newBalance: number;

  if (existingCredits) {
    // Update existing credits
    newBalance = (existingCredits.purchased_credits || 0) + creditsAmount;
    const { error: updateError } = await supabase
      .from('company_analysis_credits')
      .update({ purchased_credits: newBalance })
      .eq('company_id', companyId);

    if (updateError) {
      console.error('[ADMIN] Error updating credits:', updateError);
      return res.status(500).json({ error: 'Failed to grant credits' });
    }
  } else {
    // Insert new credit record
    newBalance = creditsAmount;
    const { error: insertError } = await supabase
      .from('company_analysis_credits')
      .insert({
        company_id: companyId,
        purchased_credits: creditsAmount,
      });

    if (insertError) {
      console.error('[ADMIN] Error creating credits:', insertError);
      return res.status(500).json({ error: 'Failed to grant credits' });
    }
  }

  // Log the grant as a purchase with $0
  const { error: purchaseError } = await supabase
    .from('credit_purchases')
    .insert({
      company_id: companyId,
      credits_amount: creditsAmount,
      price_cents: 0,
      stripe_payment_id: `ADMIN_GRANT${note ? `: ${note}` : ''}`,
    });

  if (purchaseError) {
    console.warn('[ADMIN] Failed to log credit grant:', purchaseError);
  }

  return res.status(200).json({
    success: true,
    message: `Granted ${creditsAmount} credits to ${company.company_name}`,
    newBalance,
  });
}

// ============================================================================
// COMPANY CONVERSATION HISTORY
// ============================================================================

async function handleCompanyConversations(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const companyId = (req.query as any).companyId || new URL(req.url!, 'http://x').searchParams.get('companyId');
  if (!companyId) {
    return res.status(400).json({ error: 'companyId is required' });
  }

  // Get the company's user_id so we can find their network profile
  const { data: company } = await supabase
    .from('companies')
    .select('id, user_id, company_name')
    .eq('id', companyId)
    .single();

  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  const allConversations: any[] = [];

  // ── 1. Job Match Conversations ──
  const { data: jobs } = await supabase
    .from('job_submissions')
    .select('id, title')
    .eq('company_id', companyId);

  if (jobs && jobs.length > 0) {
    const jobIds = jobs.map((j: any) => j.id);
    const jobMap = new Map(jobs.map((j: any) => [j.id, j.title]));

    const { data: matches } = await supabase
      .from('job_matches')
      .select(`
        id,
        job_id,
        profile_id,
        created_at,
        network_profiles (id, full_name, profile_picture_url)
      `)
      .in('job_id', jobIds)
      .order('created_at', { ascending: false });

    if (matches && matches.length > 0) {
      // Fetch messages per-match in parallel to avoid Supabase max_rows (1000) limit
      // on the aggregate query which was silently truncating conversations
      const matchMessagePromises = matches.map(async (match: any) => {
        const { data: msgs } = await supabase
          .from('messages')
          .select('id, match_id, sender_type, sender_id, content, created_at, read_at')
          .eq('match_id', match.id)
          .order('created_at', { ascending: true });
        return { match, msgs: msgs || [] };
      });

      const matchResults = await Promise.all(matchMessagePromises);

      for (const { match, msgs } of matchResults) {
        if (msgs.length === 0) continue;
        const profile = match.network_profiles as any;
        allConversations.push({
          conversationType: 'job_match',
          matchId: match.id,
          jobTitle: jobMap.get(match.job_id) || 'Unknown Job',
          participantName: profile?.full_name || 'Unknown Member',
          participantAvatar: profile?.profile_picture_url || null,
          messageCount: msgs.length,
          lastMessageAt: msgs[msgs.length - 1]?.created_at || null,
          messages: msgs.map((m: any) => ({
            id: m.id,
            senderType: m.sender_type,
            senderName: m.sender_type === 'company' ? company.company_name : (profile?.full_name || 'Member'),
            content: m.content,
            createdAt: m.created_at,
            readAt: m.read_at,
          })),
        });
      }
    }
  }

  // ── 2. Direct Message Conversations ──
  const { data: companyProfile } = await supabase
    .from('network_profiles')
    .select('id')
    .eq('user_id', company.user_id)
    .single();

  if (companyProfile) {
    const { data: directConvos } = await supabase
      .from('direct_conversations')
      .select('id, participant_1_id, participant_2_id, updated_at')
      .or(`participant_1_id.eq.${companyProfile.id},participant_2_id.eq.${companyProfile.id}`)
      .order('updated_at', { ascending: false });

    // Fetch profile + messages for each conversation in parallel
    const directConvoPromises = (directConvos || []).map(async (conv: any) => {
      const otherId = conv.participant_1_id === companyProfile.id
        ? conv.participant_2_id
        : conv.participant_1_id;

      const [profileResult, msgsResult] = await Promise.all([
        supabase
          .from('network_profiles')
          .select('id, full_name, profile_picture_url')
          .eq('id', otherId)
          .single(),
        supabase
          .from('direct_messages')
          .select('id, sender_id, content, created_at, read_at, edited_at, deleted_at')
          .eq('conversation_id', conv.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true }),
      ]);

      return { conv, otherProfile: profileResult.data, directMsgs: msgsResult.data };
    });

    const directResults = await Promise.all(directConvoPromises);

    for (const { conv, otherProfile, directMsgs } of directResults) {
      if (!directMsgs || directMsgs.length === 0) continue;

      allConversations.push({
        conversationType: 'direct',
        conversationId: conv.id,
        participantName: otherProfile?.full_name || 'Unknown',
        participantAvatar: otherProfile?.profile_picture_url || null,
        messageCount: directMsgs.length,
        lastMessageAt: directMsgs[directMsgs.length - 1]?.created_at || null,
        messages: directMsgs.map((m: any) => ({
          id: m.id,
          senderType: m.sender_id === companyProfile.id ? 'company' : 'member',
          senderName: m.sender_id === companyProfile.id
            ? company.company_name
            : (otherProfile?.full_name || 'Member'),
          content: m.content,
          createdAt: m.created_at,
          readAt: m.read_at,
        })),
      });
    }
  }

  // ── 3. Contact Requests ──
  const { data: contactRequests } = await supabase
    .from('contact_requests')
    .select(`
      id,
      profile_id,
      message,
      status,
      admin_notes,
      created_at,
      updated_at,
      network_profiles (id, full_name, profile_picture_url)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  for (const cr of contactRequests || []) {
    const profile = cr.network_profiles as any;
    allConversations.push({
      conversationType: 'contact_request',
      contactRequestId: cr.id,
      status: cr.status,
      participantName: profile?.full_name || 'Unknown Member',
      participantAvatar: profile?.profile_picture_url || null,
      messageCount: 1,
      lastMessageAt: cr.created_at,
      messages: [
        {
          id: cr.id,
          senderType: 'company',
          senderName: company.company_name,
          content: cr.message || '(No message)',
          createdAt: cr.created_at,
          readAt: null,
        },
        ...(cr.admin_notes ? [{
          id: `${cr.id}-admin`,
          senderType: 'admin',
          senderName: 'Admin',
          content: cr.admin_notes,
          createdAt: cr.updated_at || cr.created_at,
          readAt: null,
        }] : []),
      ],
    });
  }

  // ── 4. Agent Chat Sessions (CT Finder) ──
  const { data: agentSessions } = await supabase
    .from('agent_chat_sessions')
    .select('id, session_id, title, messages, message_count, created_at, updated_at')
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false });

  for (const session of agentSessions || []) {
    const msgs = (session.messages as any[]) || [];
    allConversations.push({
      conversationType: 'agent_chat',
      sessionId: session.session_id,
      participantName: session.title || 'CT Finder Chat',
      participantAvatar: null,
      messageCount: session.message_count || msgs.length,
      lastMessageAt: session.updated_at || session.created_at,
      messages: msgs.map((m: any) => ({
        id: m.id,
        senderType: m.role === 'user' ? 'company' : 'agent',
        senderName: m.role === 'user' ? company.company_name : 'CT Finder',
        content: m.content,
        createdAt: m.timestamp || session.created_at,
        readAt: null,
      })),
    });
  }

  // Sort all conversations by last message date
  allConversations.sort((a, b) => {
    const aDate = a.lastMessageAt || '';
    const bDate = b.lastMessageAt || '';
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return res.status(200).json({ success: true, conversations: allConversations });
}

// ============================================================================
// MESSAGE CREDIT HANDLERS
// ============================================================================

async function handleMessageCreditsList(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, company_name, verified, created_at');

  if (companiesError) {
    console.error('[ADMIN] Error fetching companies:', companiesError);
    return res.status(500).json({ error: 'Failed to fetch companies' });
  }

  const { data: credits } = await supabase
    .from('company_message_credits')
    .select('company_id, free_messages_remaining, purchased_credits');

  const { data: usageLogs } = await supabase
    .from('message_usage_logs')
    .select('company_id');

  const { data: purchases } = await supabase
    .from('message_credit_purchases')
    .select('company_id, credits_amount');

  // Build lookup maps
  const creditMap = new Map<string, { freeRemaining: number; purchasedRemaining: number }>();
  for (const c of credits || []) {
    creditMap.set(c.company_id, {
      freeRemaining: c.free_messages_remaining ?? 0,
      purchasedRemaining: c.purchased_credits ?? 0,
    });
  }

  const usageMap = new Map<string, number>();
  for (const u of usageLogs || []) {
    usageMap.set(u.company_id, (usageMap.get(u.company_id) || 0) + 1);
  }

  const grantedMap = new Map<string, number>();
  for (const p of purchases || []) {
    grantedMap.set(p.company_id, (grantedMap.get(p.company_id) || 0) + (p.credits_amount || 0));
  }

  const companyCredits = (companies || []).map((company) => {
    const creds = creditMap.get(company.id);
    const freeRemaining = creds?.freeRemaining ?? 25;
    const purchasedRemaining = creds?.purchasedRemaining ?? 0;
    const messagesSent = usageMap.get(company.id) || 0;
    const totalGranted = grantedMap.get(company.id) || 0;

    return {
      companyId: company.id,
      companyName: company.company_name,
      verified: company.verified,
      createdAt: company.created_at,
      freeRemaining,
      purchasedRemaining,
      totalRemaining: freeRemaining + purchasedRemaining,
      messagesSent,
      totalGranted,
    };
  });

  const totals = {
    totalMessagesSent: Array.from(usageMap.values()).reduce((a, b) => a + b, 0),
    totalCreditsGranted: Array.from(grantedMap.values()).reduce((a, b) => a + b, 0),
  };

  return res.status(200).json({
    success: true,
    companies: companyCredits,
    totals,
  });
}

async function handleGrantMessageCredits(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  adminUserId: string
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyId, creditsAmount, note } = req.body;

  if (!companyId) {
    return res.status(400).json({ error: 'Company ID is required' });
  }

  if (!creditsAmount || typeof creditsAmount !== 'number' || creditsAmount <= 0) {
    return res.status(400).json({ error: 'Valid credits amount is required' });
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, company_name')
    .eq('id', companyId)
    .single();

  if (companyError || !company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  const { data: existingCredits } = await supabase
    .from('company_message_credits')
    .select('*')
    .eq('company_id', companyId)
    .single();

  let newBalance: number;

  if (existingCredits) {
    newBalance = (existingCredits.purchased_credits || 0) + creditsAmount;
    const { error: updateError } = await supabase
      .from('company_message_credits')
      .update({ purchased_credits: newBalance })
      .eq('company_id', companyId);

    if (updateError) {
      console.error('[ADMIN] Error updating message credits:', updateError);
      return res.status(500).json({ error: 'Failed to grant message credits' });
    }
  } else {
    newBalance = creditsAmount;
    const { error: insertError } = await supabase
      .from('company_message_credits')
      .insert({
        company_id: companyId,
        free_messages_remaining: 25,
        purchased_credits: creditsAmount,
      });

    if (insertError) {
      console.error('[ADMIN] Error creating message credits:', insertError);
      return res.status(500).json({ error: 'Failed to grant message credits' });
    }
  }

  await supabase
    .from('message_credit_purchases')
    .insert({
      company_id: companyId,
      credits_amount: creditsAmount,
      price_cents: 0,
      note: note || `Admin grant by ${adminUserId}`,
      granted_by: adminUserId,
    });

  return res.status(200).json({
    success: true,
    message: `Granted ${creditsAmount} message credits to ${company.company_name}`,
    newBalance,
  });
}

// ============================================================================
// USER MANAGEMENT HANDLERS
// ============================================================================

async function handleUsersList(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, status, search } = req.query;

  // Get all users from auth
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('[ADMIN] Error fetching users:', authError);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }

  const authUsers = authData?.users || [];

  // Get all profiles
  const { data: profiles } = await supabase
    .from('network_profiles')
    .select('id, user_id, full_name, approved, location');

  // Get all companies
  const { data: companies } = await supabase
    .from('companies')
    .select('id, user_id, company_name, verified, industry');

  // Build lookup maps
  const profileMap = new Map<string, any>();
  for (const p of profiles || []) {
    if (p.user_id) profileMap.set(p.user_id, p);
  }

  const companyMap = new Map<string, any>();
  for (const c of companies || []) {
    if (c.user_id) companyMap.set(c.user_id, c);
  }

  // Build user list
  let users = authUsers.map((user) => {
    const profile = profileMap.get(user.id);
    const company = companyMap.get(user.id);
    
    let userType: 'member' | 'company' | 'unknown' = 'unknown';
    let userStatus: 'active' | 'pending' | 'unverified' = 'unverified';
    let name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown';

    if (profile) {
      userType = 'member';
      name = profile.full_name || name;
      userStatus = profile.approved ? 'active' : 'pending';
    } else if (company) {
      userType = 'company';
      name = company.company_name || name;
      userStatus = company.verified ? 'active' : 'unverified';
    }

    return {
      id: user.id,
      email: user.email || '',
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at || null,
      userType,
      status: userStatus,
      name,
      profile: profile ? {
        id: profile.id,
        fullName: profile.full_name,
        approved: profile.approved,
        location: profile.location,
      } : undefined,
      company: company ? {
        id: company.id,
        companyName: company.company_name,
        verified: company.verified,
        industry: company.industry,
      } : undefined,
    };
  });

  // Apply filters
  if (type && type !== 'all') {
    users = users.filter((u) => u.userType === type);
  }
  if (status && status !== 'all') {
    if (status === 'active') {
      users = users.filter((u) => u.status === 'active');
    } else if (status === 'pending') {
      users = users.filter((u) => u.status === 'pending' || u.status === 'unverified');
    }
  }
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    users = users.filter((u) =>
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    );
  }

  // Calculate stats
  const stats = {
    totalUsers: authUsers.length,
    totalMembers: authUsers.filter((u) => profileMap.has(u.id)).length,
    totalCompanies: authUsers.filter((u) => companyMap.has(u.id)).length,
    pendingMembers: (profiles || []).filter((p) => !p.approved).length,
    unverifiedCompanies: (companies || []).filter((c) => !c.verified).length,
  };

  return res.status(200).json({
    success: true,
    users,
    stats,
  });
}

async function handleUserActivity(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Get user info
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !userData?.user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = userData.user;

  // Get profile
  const { data: profile } = await supabase
    .from('network_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get company
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get direct conversations
  let conversations: any[] = [];
  let totalMessagesSent = 0;
  let totalMessagesReceived = 0;

  if (profile) {
    // Get conversations for this profile
    const { data: convs } = await supabase
      .from('direct_conversations')
      .select(`
        id,
        participant_1_id,
        participant_2_id,
        updated_at
      `)
      .or(`participant_1_id.eq.${profile.id},participant_2_id.eq.${profile.id}`);

    for (const conv of convs || []) {
      const otherProfileId = conv.participant_1_id === profile.id 
        ? conv.participant_2_id 
        : conv.participant_1_id;

      // Get other participant info
      const { data: otherProfile } = await supabase
        .from('network_profiles')
        .select('full_name, email')
        .eq('id', otherProfileId)
        .single();

      // Get message counts
      const { data: messages } = await supabase
        .from('direct_messages')
        .select('id, sender_id, content, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false });

      const msgCount = messages?.length || 0;
      const sentCount = messages?.filter((m) => m.sender_id === profile.id).length || 0;
      const receivedCount = msgCount - sentCount;
      const lastMsg = messages?.[0];

      totalMessagesSent += sentCount;
      totalMessagesReceived += receivedCount;

      conversations.push({
        conversationId: conv.id,
        conversationType: 'direct',
        participantId: otherProfileId,
        participantName: otherProfile?.full_name || 'Unknown',
        participantEmail: otherProfile?.email,
        messageCount: msgCount,
        lastMessageAt: lastMsg?.created_at || conv.updated_at,
        lastMessagePreview: lastMsg?.content?.substring(0, 100) || '',
        lastMessageSentByUser: lastMsg?.sender_id === profile.id,
      });
    }
  }

  // Sort by last message
  conversations.sort((a, b) => 
    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

  return res.status(200).json({
    success: true,
    activity: {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
      },
      profile: profile ? {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        location: profile.location,
        approved: profile.approved,
        createdAt: profile.created_at,
      } : undefined,
      company: company ? {
        id: company.id,
        companyName: company.company_name,
        contactName: company.contact_name,
        contactEmail: company.contact_email,
        verified: company.verified,
        createdAt: company.created_at,
      } : undefined,
      conversations,
      stats: {
        totalConversations: conversations.length,
        totalMessagesSent,
        totalMessagesReceived,
        directConversations: conversations.filter((c) => c.conversationType === 'direct').length,
        jobMatchConversations: conversations.filter((c) => c.conversationType === 'job_match').length,
      },
    },
  });
}

async function handleUserResetPassword(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Get user email
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !userData?.user?.email) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Generate password reset link
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: userData.user.email,
    options: {
      redirectTo: `${PUBLIC_URL}/beta/auth`,
    },
  });

  if (linkError) {
    console.error('[ADMIN] Error generating reset link:', linkError);
    return res.status(500).json({ error: 'Failed to generate password reset link' });
  }

  // Get user name from profile if available
  let userName: string | undefined;
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', userId)
    .single();
  
  if (profile?.full_name) {
    userName = profile.full_name;
  }

  // Send reset email using styled template
  const htmlContent = passwordResetEmail({
    recipientName: userName,
    resetLink: linkData.properties?.action_link || '',
  });

  await sendEmail(userData.user.email, 'Reset Your Password - CTC Network', htmlContent);

  return res.status(200).json({
    success: true,
    message: 'Password reset email sent',
  });
}

async function handleUserSendWelcome(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, userType, includeLoginLink } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Get user
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !userData?.user?.email) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = userData.user;
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';

  let loginLink = `${PUBLIC_URL}/beta/auth`;
  if (includeLoginLink) {
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        redirectTo: userType === 'company' ? `${PUBLIC_URL}/company/dashboard` : `${PUBLIC_URL}/directory`,
      },
    });
    if (linkData?.properties?.action_link) {
      loginLink = linkData.properties.action_link;
    }
  }

  const htmlContent = welcomeNewUserEmail({
    userName: name,
    createProfileUrl: loginLink,
  });

  await sendEmail(user.email, 'Welcome to Creative Technology Collective!', htmlContent);

  return res.status(200).json({
    success: true,
    message: 'Welcome email sent',
  });
}

async function handleUserSendProfileReminder(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Get user
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !userData?.user?.email) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = userData.user;

  // Generate a magic link so they can sign in directly.
  // redirectTo must point to the auth callback page — it processes the tokens
  // from the URL hash and then redirects to /directory/create if no profile exists.
  // Pointing directly to /directory/create-profile would lose the tokens because
  // that page redirects unauthenticated users before Supabase can set the session.
  let loginLink = `${PUBLIC_URL}/directory/auth`;
  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email!,
    options: {
      redirectTo: `${PUBLIC_URL}/auth/callback`,
    },
  });
  if (linkData?.properties?.action_link) {
    loginLink = linkData.properties.action_link;
  }

  const htmlContent = profileCompletionReminderEmail({
    recipientEmail: user.email!,
    loginLink,
  });

  await sendEmail(user.email, 'Complete Your CTC Profile', htmlContent);

  return res.status(200).json({
    success: true,
    message: 'Profile reminder sent',
  });
}

async function handleUserDelete(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  console.log('[ADMIN] Attempting to delete user:', userId);

  // Get user to verify exists
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !userData?.user) {
    console.error('[ADMIN] User not found:', userError);
    return res.status(404).json({ error: 'User not found' });
  }

  console.log('[ADMIN] User found:', userData.user.email);

  // Delete related data (cascade should handle most, but let's be explicit)
  // Note: RLS is bypassed with service role key

  try {
    // Delete profile if exists
    const { error: profileError } = await supabase.from('network_profiles').delete().eq('user_id', userId);
    if (profileError) {
      console.error('[ADMIN] Error deleting profile:', profileError);
      // Continue anyway - profile might not exist
    } else {
      console.log('[ADMIN] Profile deleted (if existed)');
    }

    // Delete company if exists (this will cascade to related tables)
    const { error: companyError } = await supabase.from('companies').delete().eq('user_id', userId);
    if (companyError) {
      console.error('[ADMIN] Error deleting company:', companyError);
      // Continue anyway - company might not exist
    } else {
      console.log('[ADMIN] Company deleted (if existed)');
    }

    // Delete beta application if exists
    const { error: betaError } = await supabase.from('beta_applications').delete().eq('user_id', userId);
    if (betaError) {
      console.error('[ADMIN] Error deleting beta application:', betaError);
      // Continue anyway - beta application might not exist
    } else {
      console.log('[ADMIN] Beta application deleted (if existed)');
    }

    // Delete the auth user (this should be last)
    console.log('[ADMIN] Deleting auth user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[ADMIN] Error deleting auth user:', deleteError);
      return res.status(500).json({ 
        error: 'Failed to delete user account', 
        details: deleteError.message 
      });
    }

    console.log('[ADMIN] User successfully deleted:', userData.user.email);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN] Unexpected error during user deletion:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred while deleting user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ============================================================================
// PROFILE ENRICHMENT HANDLER
// ============================================================================

async function handleEnrichProfileWeb(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { profileId, autoApply } = req.body;

  if (!profileId) {
    return res.status(400).json({ error: 'Profile ID is required' });
  }

  // Get the profile
  const { data: profile, error: profileError } = await supabase
    .from('network_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // For now, return a placeholder response
  // In a real implementation, this would call an external enrichment service
  // like a web scraper, LinkedIn API, or AI-based profile analyzer
  
  const enrichmentResult = {
    success: true,
    profileId,
    profileName: profile.full_name,
    discoveredProjects: [],
    additionalSkills: [],
    webSummary: 'Web enrichment feature is available. Connect to an enrichment service for full functionality.',
    error: null,
  };

  // If autoApply is true and we had actual data, we would update the profile here
  if (autoApply && enrichmentResult.additionalSkills.length > 0) {
    const currentSkills = profile.skills || [];
    const newSkills = [...new Set([...currentSkills, ...enrichmentResult.additionalSkills])];
    
    await supabase
      .from('network_profiles')
      .update({ skills: newSkills })
      .eq('id', profileId);
  }

  return res.status(200).json(enrichmentResult);
}

// ============================================================================
// TEST EMAIL HANDLER
// ============================================================================

async function handleTestEmailNotification(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  adminUserId: string
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipientEmail, templateType } = req.body;

  // Get admin email if no recipient specified
  let toEmail = recipientEmail;
  if (!toEmail) {
    const { data: adminData } = await supabase.auth.admin.getUserById(adminUserId);
    toEmail = adminData?.user?.email;
  }

  if (!toEmail) {
    return res.status(400).json({ error: 'Recipient email is required' });
  }

  const htmlContent = testMessageEmail(PUBLIC_URL);

  const emailSent = await sendEmail(toEmail, 'Test Email - CTC Admin', htmlContent);

  return res.status(200).json({
    success: emailSent,
    message: emailSent ? 'Test email sent successfully' : 'Failed to send test email',
    recipient: toEmail,
  });
}

// ============================================================================
// BETA BROADCAST EMAIL HANDLER
// ============================================================================

async function handleBetaBroadcast(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  adminUserId: string
) {
  // ---- GET: Return list of approved beta recipients for the UI picker ----
  if (req.method === 'GET') {
    const { data: betaApps, error: fetchError } = await supabase
      .from('beta_applications')
      .select('id, name, email')
      .eq('status', 'approved')
      .order('name', { ascending: true });

    if (fetchError) {
      console.error('[ADMIN] Error fetching beta recipients:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch beta users' });
    }

    // Deduplicate by email
    const seen = new Set<string>();
    const recipients = (betaApps || [])
      .filter((app: any) => {
        if (!app.email || seen.has(app.email.toLowerCase())) return false;
        seen.add(app.email.toLowerCase());
        return true;
      })
      .map((app: any) => ({ name: app.name || '', email: app.email }));

    return res.status(200).json({ recipients, total: recipients.length });
  }

  // ---- POST: Send broadcast emails ----
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, headline, introText, updates, closingText, testMode, testEmail, selectedEmails } = req.body;

  // Validate required fields
  if (!subject || !headline || !introText) {
    return res.status(400).json({ error: 'Subject, headline, and intro text are required' });
  }

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'At least one update section is required' });
  }

  // Validate update sections
  for (const update of updates) {
    if (!update.title || !update.description) {
      return res.status(400).json({ error: 'Each update section needs a title and description' });
    }
  }

  // Build the email HTML using the existing platformUpdateEmail template
  const htmlContent = platformUpdateEmail({
    headline,
    introText,
    updates: updates as UpdateSection[],
    closingText: closingText || undefined,
  });

  // TEST MODE: Send to a single test email address
  if (testMode) {
    let toEmail = testEmail;
    if (!toEmail) {
      const { data: adminData } = await supabase.auth.admin.getUserById(adminUserId);
      toEmail = adminData?.user?.email;
    }

    if (!toEmail) {
      return res.status(400).json({ error: 'Test email address is required' });
    }

    const emailSent = await sendEmail(toEmail, `[TEST] ${subject}`, htmlContent);

    return res.status(200).json({
      success: emailSent,
      message: emailSent ? `Test broadcast sent to ${toEmail}` : 'Failed to send test email',
      testMode: true,
      recipient: toEmail,
    });
  }

  // BROADCAST MODE: Send to selected or all approved beta users
  const { data: betaApps, error: fetchError } = await supabase
    .from('beta_applications')
    .select('id, name, email')
    .eq('status', 'approved');

  if (fetchError) {
    console.error('[ADMIN] Error fetching beta applications:', fetchError);
    return res.status(500).json({ error: 'Failed to fetch beta users' });
  }

  if (!betaApps || betaApps.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No approved beta users to send to',
      sent: 0,
      failed: 0,
      total: 0,
    });
  }

  // Deduplicate by email (in case of duplicate entries)
  const uniqueEmails = new Map<string, { name: string; email: string }>();
  for (const app of betaApps) {
    if ((app as any).email && !uniqueEmails.has((app as any).email.toLowerCase())) {
      uniqueEmails.set((app as any).email.toLowerCase(), { name: (app as any).name, email: (app as any).email });
    }
  }

  // If selectedEmails is provided, filter to only those recipients
  let recipientsToSend: { name: string; email: string }[] = [];
  if (Array.isArray(selectedEmails) && selectedEmails.length > 0) {
    const selectedSet = new Set(selectedEmails.map((e: string) => e.toLowerCase()));
    for (const [emailKey, recipient] of uniqueEmails) {
      if (selectedSet.has(emailKey)) {
        recipientsToSend.push(recipient);
      }
    }
    if (recipientsToSend.length === 0) {
      return res.status(400).json({ error: 'None of the selected emails match approved beta users' });
    }
  } else {
    // Send to all
    recipientsToSend = Array.from(uniqueEmails.values());
  }

  let sent = 0;
  let failed = 0;
  const failedEmails: string[] = [];

  for (const recipient of recipientsToSend) {
    try {
      const emailSent = await sendEmail(recipient.email, subject, htmlContent);
      if (emailSent) {
        sent++;
      } else {
        failed++;
        failedEmails.push(recipient.email);
      }
    } catch (error) {
      console.error(`[ADMIN] Failed to send broadcast to ${recipient.email}:`, error);
      failed++;
      failedEmails.push(recipient.email);
    }

    // Rate limit: small delay between sends to avoid hitting Resend limits
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  const targetLabel = Array.isArray(selectedEmails) && selectedEmails.length > 0
    ? `${sent} selected beta user${sent !== 1 ? 's' : ''}`
    : `${sent} beta user${sent !== 1 ? 's' : ''}`;

  console.log(`[ADMIN] Broadcast complete: ${sent} sent, ${failed} failed out of ${recipientsToSend.length} recipients`);

  return res.status(200).json({
    success: true,
    message: `Broadcast sent to ${targetLabel}${failed > 0 ? `, ${failed} failed` : ''}`,
    sent,
    failed,
    total: recipientsToSend.length,
    failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
  });
}

// ============================================================================
// QUICK MESSAGE TO BETA USERS
// ============================================================================

async function handleQuickMessage(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  adminUserId: string
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, message, ctaText, ctaUrl, testMode, testEmail } = req.body;

  if (!subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  const htmlContent = quickMessageEmail({
    message: message.trim(),
    ctaText: ctaText?.trim() || undefined,
    ctaUrl: ctaUrl?.trim() || undefined,
  });

  if (testMode) {
    let toEmail = testEmail?.trim();
    if (!toEmail) {
      const { data: adminData } = await supabase.auth.admin.getUserById(adminUserId);
      toEmail = adminData?.user?.email;
    }
    if (!toEmail) {
      return res.status(400).json({ error: 'Test email address is required' });
    }

    const emailSent = await sendEmail(toEmail, `[TEST] ${subject.trim()}`, htmlContent);
    return res.status(200).json({
      success: emailSent,
      message: emailSent ? `Test sent to ${toEmail}` : 'Failed to send test email',
      testMode: true,
      recipient: toEmail,
    });
  }

  const { data: betaApps, error: fetchError } = await supabase
    .from('beta_applications')
    .select('id, name, email')
    .eq('status', 'approved');

  if (fetchError) {
    console.error('[ADMIN] Error fetching beta users for quick message:', fetchError);
    return res.status(500).json({ error: 'Failed to fetch beta users' });
  }

  const uniqueEmails = new Map<string, { name: string; email: string }>();
  for (const app of betaApps || []) {
    const email = (app as any).email?.toLowerCase();
    if (email && !uniqueEmails.has(email)) {
      uniqueEmails.set(email, { name: (app as any).name, email: (app as any).email });
    }
  }

  const recipientsToSend = Array.from(uniqueEmails.values());

  if (recipientsToSend.length === 0) {
    return res.status(200).json({ success: true, message: 'No approved beta users to send to', sent: 0, failed: 0, total: 0 });
  }

  let sent = 0;
  let failed = 0;
  const failedEmails: string[] = [];

  for (const recipient of recipientsToSend) {
    try {
      const emailSent = await sendEmail(recipient.email, subject.trim(), htmlContent);
      if (emailSent) { sent++; } else { failed++; failedEmails.push(recipient.email); }
    } catch {
      failed++;
      failedEmails.push(recipient.email);
    }
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  console.log(`[ADMIN] Quick message complete: ${sent} sent, ${failed} failed out of ${recipientsToSend.length}`);

  return res.status(200).json({
    success: true,
    message: `Message sent to ${sent} beta user${sent !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`,
    sent,
    failed,
    total: recipientsToSend.length,
    failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
  });
}

// ============================================================================
// CONTACT REQUESTS
// ============================================================================

async function handleContactRequestsList(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const statusFilter = (req.query.status as string) || 'pending';

  let query = supabase
    .from('contact_requests')
    .select(`
      *,
      companies!inner ( id, company_name, contact_name, contact_email, company_website ),
      network_profiles!inner ( id, full_name, email, slug, location, profile_picture_url )
    `)
    .order('created_at', { ascending: statusFilter === 'pending' });

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[ADMIN] Contact requests list error:', error);
    return res.status(500).json({ error: 'Failed to fetch contact requests' });
  }

  const requests = (data || []).map((r: any) => ({
    id: r.id,
    companyId: r.company_id,
    profileId: r.profile_id,
    companyName: r.companies.company_name,
    contactName: r.companies.contact_name,
    contactEmail: r.companies.contact_email,
    companyWebsite: r.companies.company_website,
    memberName: r.network_profiles.full_name,
    memberEmail: r.network_profiles.email,
    memberSlug: r.network_profiles.slug,
    memberLocation: r.network_profiles.location,
    memberPicture: r.network_profiles.profile_picture_url,
    message: r.message,
    status: r.status,
    adminNotes: r.admin_notes,
    reviewedAt: r.reviewed_at,
    createdAt: r.created_at,
  }));

  return res.status(200).json({ success: true, requests });
}

async function handleContactRequestsUpdate(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  adminUserId: string
) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { requestId, status, adminNotes } = req.body;

  if (!requestId || !status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'requestId and status (approved/rejected) are required' });
  }

  const { data, error } = await supabase
    .from('contact_requests')
    .update({
      status,
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    console.error('[ADMIN] Contact request update error:', error);
    return res.status(500).json({ error: 'Failed to update contact request' });
  }

  return res.status(200).json({ success: true, request: data });
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

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
    // Try query.path first (Vercel catch-all), fallback to URL parsing
    let pathSegments = (req.query.path as string[]) || [];
    
    // Fallback: parse from URL if query.path is empty
    if (pathSegments.length === 0 && req.url) {
      const urlPath = req.url.split('?')[0]; // Remove query string
      const match = urlPath.match(/\/api\/admin\/(.+)/);
      if (match && match[1]) {
        pathSegments = match[1].split('/');
      }
    }
    
    const route = pathSegments.join('/');

    console.log(`[ADMIN] Route: "${route}", Method: ${req.method}, URL: ${req.url}`);

    // Route to appropriate handler
    switch (route) {
      // Root route - return available endpoints
      case '':
        return res.status(200).json({
          success: true,
          message: 'Admin API',
          endpoints: [
            'GET /api/admin/beta-applications',
            'POST /api/admin/beta-applications/approve',
            'POST /api/admin/beta-applications/reject',
            'DELETE /api/admin/beta-applications/delete',
            'POST /api/admin/beta-applications/resend-account-email',
            'GET /api/admin/companies',
            'POST /api/admin/companies/verify',
            'DELETE /api/admin/companies/delete',
            'GET /api/admin/company-requests',
            'POST /api/admin/company-requests/approve',
            'POST /api/admin/company-requests/reject',
            'GET /api/admin/profiles',
            'POST /api/admin/profiles/approve',
            'POST /api/admin/profiles/reject',
            'GET /api/admin/members',
            'POST /api/admin/members/upgrade',
            'GET /api/admin/jobs',
            'POST /api/admin/jobs/reject',
            'GET /api/admin/matches',
            'GET /api/admin/pending-matches',
            'GET /api/admin/credit-usage',
            'POST /api/admin/grant-credits',
            'GET /api/admin/company-conversations?companyId=xxx',
            'GET /api/admin/message-credits',
            'POST /api/admin/grant-message-credits',
            'GET /api/admin/users/list',
            'GET /api/admin/users/activity',
            'POST /api/admin/users/reset-password',
            'POST /api/admin/users/send-welcome',
            'POST /api/admin/users/send-profile-reminder',
            'POST /api/admin/users/delete',
            'POST /api/admin/enrich-profile-web',
            'POST /api/admin/test-email-notification',
            'POST /api/admin/beta-broadcast',
            'POST /api/admin/quick-message',
            'GET /api/admin/contact-requests?status=pending',
            'POST /api/admin/contact-requests/update',
          ]
        });

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
      case 'companies/delete':
        return handleCompaniesDelete(req, res, supabase);

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

      // Credit Usage
      case 'credit-usage':
        return handleCreditUsageList(req, res, supabase);
      case 'grant-credits':
        return handleGrantCredits(req, res, supabase);

      // Company Conversations
      case 'company-conversations':
        return handleCompanyConversations(req, res, supabase);

      // Message Credits
      case 'message-credits':
        return handleMessageCreditsList(req, res, supabase);
      case 'grant-message-credits':
        return handleGrantMessageCredits(req, res, supabase, user.id);

      // User Management
      case 'users/list':
        return handleUsersList(req, res, supabase);
      case 'users/activity':
        return handleUserActivity(req, res, supabase);
      case 'users/reset-password':
        return handleUserResetPassword(req, res, supabase);
      case 'users/send-welcome':
        return handleUserSendWelcome(req, res, supabase);
      case 'users/send-profile-reminder':
        return handleUserSendProfileReminder(req, res, supabase);
      case 'users/delete':
        return handleUserDelete(req, res, supabase);

      // Profile Enrichment
      case 'enrich-profile-web':
        return handleEnrichProfileWeb(req, res, supabase);

      // Testing
      case 'test-email-notification':
        return handleTestEmailNotification(req, res, supabase, user.id);

      // Beta Broadcast
      case 'beta-broadcast':
        return handleBetaBroadcast(req, res, supabase, user.id);

      // Quick Message
      case 'quick-message':
        return handleQuickMessage(req, res, supabase, user.id);

      // Contact Requests
      case 'contact-requests':
        return handleContactRequestsList(req, res, supabase);
      case 'contact-requests/update':
        return handleContactRequestsUpdate(req, res, supabase, user.id);

      default:
        console.warn(`[ADMIN] Unknown route: ${route}`);
        return res.status(404).json({ error: `Route not found: /api/admin/${route}` });
    }
  } catch (error) {
    console.error('[ADMIN] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
