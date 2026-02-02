import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  betaApplicationReceivedEmail,
  betaApplicationAdminEmail,
  EMAIL_FROM_DOMAIN,
  PUBLIC_URL,
} from '../_lib/email-templates.js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Get admin notification email
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || `admin@${EMAIL_FROM_DOMAIN}`;

/**
 * Check if a user is an admin based on ADMIN_USER_IDS env var
 */
function isAdmin(userId: string): boolean {
  const adminUserIds = process.env.ADMIN_USER_IDS || '';
  const adminIds = adminUserIds.split(',').map((id) => id.trim()).filter(Boolean);
  return adminIds.includes(userId);
}

/**
 * Send email via Resend
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return false;

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
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// SIGNUP HANDLER
// ============================================================================

async function handleSignup(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, interests = [] } = req.body;

  // Validate required fields
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  // Check if application already exists
  const { data: existing } = await supabase
    .from('beta_applications')
    .select('id, status')
    .eq('email', trimmedEmail)
    .single();

  if (existing) {
    if (existing.status === 'approved') {
      return res.status(400).json({
        error: 'You have already been approved for the beta program!'
      });
    } else if (existing.status === 'pending') {
      return res.status(400).json({
        error: "You have already applied. We'll review your application soon!"
      });
    }
    // If rejected, allow reapplication
    const { error: updateError } = await supabase
      .from('beta_applications')
      .update({
        name: trimmedName,
        interests,
        status: 'pending',
        reviewed_at: null,
        reviewed_by: null,
        admin_notes: null,
        created_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to submit application' });
    }
  } else {
    // Insert new application
    const { error: insertError } = await supabase
      .from('beta_applications')
      .insert({
        name: trimmedName,
        email: trimmedEmail,
        interests,
        status: 'pending'
      });

    if (insertError) {
      return res.status(500).json({ error: 'Failed to submit application' });
    }
  }

  // Send notification to admin
  const adminHtml = betaApplicationAdminEmail({
    name: trimmedName,
    email: trimmedEmail,
    interests,
    adminDashboardUrl: `${PUBLIC_URL}/admin`,
  });
  await sendEmail(ADMIN_NOTIFICATION_EMAIL, `New Beta Application: ${trimmedName}`, adminHtml);

  // Send confirmation to user
  const userHtml = betaApplicationReceivedEmail({ name: trimmedName });
  await sendEmail(trimmedEmail, 'Beta Application Received - CTC Network', userHtml);

  return res.status(200).json({
    success: true,
    message: 'Application submitted successfully'
  });
}

// ============================================================================
// STATUS HANDLER
// ============================================================================

async function handleStatus(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get auth header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userEmail = user.email?.toLowerCase().trim();
  if (!userEmail) {
    return res.status(400).json({ error: 'User email not found' });
  }

  // Check for beta application by user_id first, then by email
  let betaApplication = null;

  const { data: betaByUserId } = await supabase
    .from('beta_applications')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (betaByUserId) {
    betaApplication = betaByUserId;
  } else {
    const { data: betaByEmail } = await supabase
      .from('beta_applications')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (betaByEmail) {
      betaApplication = betaByEmail;

      // Link if not already linked
      if (!betaByEmail.user_id) {
        await supabase
          .from('beta_applications')
          .update({ user_id: user.id })
          .eq('id', betaByEmail.id);
        betaApplication.user_id = user.id;
      }
    }
  }

  // Check if user has a directory profile
  let hasProfile = false;
  let profileStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';

  const { data: profile } = await supabase
    .from('network_profiles')
    .select('id, approved')
    .eq('user_id', user.id)
    .single();

  if (profile) {
    hasProfile = true;
    profileStatus = profile.approved ? 'approved' : 'pending';
  }

  return res.status(200).json({
    success: true,
    betaApplication,
    hasProfile,
    profileStatus,
    isAdmin: isAdmin(user.id),
  });
}

// ============================================================================
// CREATE ACCOUNT HANDLER (LEGACY - Redirects to auth)
// ============================================================================

async function handleCreateAccount(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  // This endpoint is no longer used - accounts are created automatically on approval
  // and users receive magic links. Redirect to auth page.
  return res.status(200).json({
    success: false,
    error: 'This endpoint is deprecated. Please use the magic link sent to your email or sign in at /beta/auth',
    redirect: '/beta/auth'
  });
}

// ============================================================================
// LINK GOOGLE ACCOUNT HANDLER
// ============================================================================

async function handleLinkGoogleAccount(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get auth header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userEmail = user.email?.toLowerCase().trim();
  if (!userEmail) {
    return res.status(400).json({ error: 'User email not found' });
  }

  // Find beta application by email
  const { data: betaApplication } = await supabase
    .from('beta_applications')
    .select('*')
    .eq('email', userEmail)
    .eq('status', 'approved')
    .single();

  if (!betaApplication) {
    return res.status(404).json({ error: 'No approved beta application found for this email' });
  }

  // Link the user to the beta application
  await supabase
    .from('beta_applications')
    .update({
      user_id: user.id,
      account_created: true,
      account_created_at: new Date().toISOString(),
    })
    .eq('id', betaApplication.id);

  return res.status(200).json({
    success: true,
    message: 'Account linked successfully',
  });
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

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[BETA] Supabase not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get the path segments after /api/beta/
    // Try query.path first (Vercel catch-all), fallback to URL parsing
    let pathSegments = (req.query.path as string[]) || [];
    
    // Fallback: parse from URL if query.path is empty
    if (pathSegments.length === 0 && req.url) {
      const urlPath = req.url.split('?')[0]; // Remove query string
      const match = urlPath.match(/\/api\/beta\/(.+)/);
      if (match && match[1]) {
        pathSegments = match[1].split('/');
      }
    }
    
    const route = pathSegments.join('/');

    console.log(`[BETA] Route: "${route}", Method: ${req.method}, URL: ${req.url}`);

    switch (route) {
      case 'signup':
        return handleSignup(req, res, supabase);
      case 'status':
        return handleStatus(req, res, supabase);
      case 'create-account':
        return handleCreateAccount(req, res, supabase);
      case 'link-google-account':
        return handleLinkGoogleAccount(req, res, supabase);
      case '':
        // Empty route - only signup accepts POST at root
        if (req.method === 'POST') {
          return handleSignup(req, res, supabase);
        }
        return res.status(404).json({ error: 'Route not found: /api/beta/' });
      default:
        console.warn(`[BETA] Unknown route: ${route}`);
        return res.status(404).json({ error: `Route not found: /api/beta/${route}` });
    }
  } catch (error) {
    console.error('[BETA] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
