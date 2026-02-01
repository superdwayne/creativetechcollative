import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  companyAccessRequestAdminEmail,
  EMAIL_FROM_DOMAIN,
  PUBLIC_URL,
} from '../lib/email-templates.js';

export const config = {
  runtime: 'edge',
};

/**
 * Parse URL path segments from request
 */
function getPathSegments(req: Request): string[] {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/company/', '').replace(/^\/+|\/+$/g, '');
  return path ? path.split('/') : [];
}

/**
 * Get query params from request
 */
function getQueryParams(req: Request): URLSearchParams {
  const url = new URL(req.url);
  return url.searchParams;
}

/**
 * JSON response helper
 */
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Authenticate user from request
 */
async function authenticateUser(
  req: Request,
  supabase: SupabaseClient
): Promise<{ user: any; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Authentication required' };
  }

  const accessToken = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return { user: null, error: 'Invalid authentication token' };
  }

  return { user };
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
// REGISTER COMPANY HANDLER
// ============================================================================

async function handleRegister(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const { companyName, companyWebsite, contactName, contactEmail, contactPhone, companySize, industry } = body;

  if (!companyName || !contactName || !contactEmail) {
    return jsonResponse({ error: 'Company name, contact name, and contact email are required' }, 400);
  }

  // Check if user already has a company
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return jsonResponse({ error: 'You already have a registered company' }, 400);
  }

  // Create the company
  const { data: company, error: insertError } = await supabase
    .from('companies')
    .insert({
      user_id: user.id,
      company_name: companyName,
      company_website: companyWebsite || null,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone || null,
      company_size: companySize || null,
      industry: industry || null,
      verified: false,
    })
    .select()
    .single();

  if (insertError || !company) {
    return jsonResponse({ error: 'Failed to register company' }, 500);
  }

  // Initialize analysis credits for the company
  await supabase
    .from('company_analysis_credits')
    .insert({
      company_id: company.id,
      free_analyses_remaining: 3,
      purchased_credits: 0,
    });

  return jsonResponse({
    success: true,
    company: {
      id: company.id,
      companyName: company.company_name,
      verified: company.verified,
    },
  }, 201);
}

// ============================================================================
// REQUEST ACCESS HANDLER
// ============================================================================

async function handleRequestAccess(
  req: Request,
  supabase: SupabaseClient
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const { companyName, contactEmail, contactName, companyWebsite, industry, companySize } = body;

  if (!companyName || !contactEmail) {
    return jsonResponse({ error: 'Company name and contact email are required' }, 400);
  }

  // Check if request already exists
  const { data: existing } = await supabase
    .from('pending_company_requests')
    .select('id, status')
    .eq('contact_email', contactEmail.toLowerCase().trim())
    .single();

  if (existing) {
    if (existing.status === 'pending') {
      return jsonResponse({ error: 'A request with this email is already pending' }, 400);
    } else if (existing.status === 'approved') {
      return jsonResponse({ error: 'This email has already been approved. Please check your email for login instructions.' }, 400);
    }
  }

  // Create the request
  const { data: request, error: insertError } = await supabase
    .from('pending_company_requests')
    .insert({
      company_name: companyName,
      contact_email: contactEmail.toLowerCase().trim(),
      contact_name: contactName || null,
      company_website: companyWebsite || null,
      industry: industry || null,
      company_size: companySize || null,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError || !request) {
    return jsonResponse({ error: 'Failed to submit request' }, 500);
  }

  // Send admin notification
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || `admin@${EMAIL_FROM_DOMAIN}`;
  const htmlContent = companyAccessRequestAdminEmail({
    companyName,
    contactEmail,
    contactName,
    companyWebsite,
    industry,
    companySize,
    adminDashboardUrl: `${PUBLIC_URL}/admin`,
  });
  await sendEmail(adminEmail, `New Company Access Request: ${companyName}`, htmlContent);

  return jsonResponse({
    success: true,
    message: 'Request submitted successfully. We will review and get back to you.',
  });
}

// ============================================================================
// CREDITS HANDLER
// ============================================================================

async function handleCredits(
  req: Request,
  supabase: SupabaseClient
) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const companyId = getQueryParams(req).get('company_id');
  if (!companyId) {
    return jsonResponse({ error: 'company_id is required' }, 400);
  }

  // Fetch credit balance
  const { data: credits, error: creditsError } = await supabase
    .from('company_analysis_credits')
    .select('free_analyses_remaining, purchased_credits')
    .eq('company_id', companyId)
    .single();

  if (creditsError) {
    if (creditsError.code === 'PGRST116') {
      return jsonResponse({
        success: true,
        credits: {
          freeAnalysesRemaining: 0,
          purchasedCredits: 0,
          totalCredits: 0,
        },
        totalAnalysesUsed: 0,
        recentUsage: [],
      });
    }
    return jsonResponse({ error: 'Failed to fetch credits' }, 500);
  }

  // Fetch total analyses used
  const { count: totalUsed } = await supabase
    .from('analysis_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  // Fetch recent usage
  const { data: recentLogs } = await supabase
    .from('analysis_usage_logs')
    .select('id, job_title, credit_type, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(5);

  const freeRemaining = credits?.free_analyses_remaining || 0;
  const purchased = credits?.purchased_credits || 0;

  return jsonResponse({
    success: true,
    credits: {
      freeAnalysesRemaining: freeRemaining,
      purchasedCredits: purchased,
      totalCredits: freeRemaining + purchased,
    },
    totalAnalysesUsed: totalUsed || 0,
    recentUsage: (recentLogs || []).map(log => ({
      id: log.id,
      jobTitle: log.job_title,
      creditType: log.credit_type,
      createdAt: log.created_at,
    })),
  });
}

// ============================================================================
// GET COMPANY HANDLER
// ============================================================================

async function handleGetCompany(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !company) {
    return jsonResponse({ error: 'Company not found' }, 404);
  }

  return jsonResponse({
    success: true,
    company: {
      id: company.id,
      companyName: company.company_name,
      companyWebsite: company.company_website,
      contactName: company.contact_name,
      contactEmail: company.contact_email,
      contactPhone: company.contact_phone,
      companySize: company.company_size,
      industry: company.industry,
      verified: company.verified,
      createdAt: company.created_at,
    },
  });
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

export default async function handler(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: 'Supabase not configured' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const pathSegments = getPathSegments(req);
  const route = pathSegments.join('/');

  console.log(`[COMPANY] Route: ${route}, Method: ${req.method}`);

  try {
    // Routes that don't require auth
    if (route === 'request-access') {
      return handleRequestAccess(req, supabase);
    }

    if (route === 'credits') {
      return handleCredits(req, supabase);
    }

    // Routes that require auth
    const { user, error: authError } = await authenticateUser(req, supabase);
    if (authError) {
      return jsonResponse({ error: authError }, 401);
    }

    switch (route) {
      case '':
      case 'get':
        return handleGetCompany(req, supabase, user);
      case 'register':
        return handleRegister(req, supabase, user);
      default:
        console.warn(`[COMPANY] Unknown route: ${route}`);
        return jsonResponse({ error: `Route not found: /api/company/${route}` }, 404);
    }
  } catch (error) {
    console.error('[COMPANY] Error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
