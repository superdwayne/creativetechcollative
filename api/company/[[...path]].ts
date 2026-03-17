import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  companyAccessRequestAdminEmail,
  companyAccessRequestReceivedEmail,
  contactRequestAdminEmail,
  EMAIL_FROM_DOMAIN,
  PUBLIC_URL,
} from '../_lib/email-templates.js';
import ctFinderHandler from './talent-agent.js';

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

  console.log('[COMPANY] Request access attempt:', { companyName, contactEmail });

  if (!companyName || !contactEmail) {
    console.log('[COMPANY] Missing required fields:', { companyName, contactEmail });
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
      company_name: companyName.trim(),
      contact_email: contactEmail.toLowerCase().trim(),
      contact_name: contactName?.trim() || null,
      company_website: companyWebsite?.trim() || null,
      industry: industry?.trim() || null,
      company_size: companySize || null,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    console.error('[COMPANY] Insert error:', insertError);
    return jsonResponse({ error: 'Failed to submit request' }, 500);
  }

  if (!request) {
    console.error('[COMPANY] No request returned after insert');
    return jsonResponse({ error: 'Failed to submit request' }, 500);
  }

  console.log('[COMPANY] Request created successfully:', { id: request.id, company_name: request.company_name });

  // Send admin notification
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || `admin@${EMAIL_FROM_DOMAIN}`;
  console.log('[COMPANY] Sending admin notification to:', adminEmail);
  
  const adminHtmlContent = companyAccessRequestAdminEmail({
    companyName: companyName.trim(),
    contactEmail: contactEmail.toLowerCase().trim(),
    contactName: contactName?.trim(),
    companyWebsite: companyWebsite?.trim(),
    industry: industry?.trim(),
    companySize,
    adminDashboardUrl: `${PUBLIC_URL}/admin`,
  });
  
  const adminEmailSent = await sendEmail(adminEmail, `New Company Access Request: ${companyName.trim()}`, adminHtmlContent);
  console.log('[COMPANY] Admin notification email sent:', adminEmailSent);

  // Send confirmation email to company
  console.log('[COMPANY] Sending confirmation email to company:', contactEmail.toLowerCase().trim());
  
  const companyHtmlContent = companyAccessRequestReceivedEmail({
    contactName: contactName?.trim(),
    companyName: companyName.trim(),
  });
  
  const companyEmailSent = await sendEmail(
    contactEmail.toLowerCase().trim(), 
    'Your CTC Access Request Has Been Received', 
    companyHtmlContent
  );
  console.log('[COMPANY] Company confirmation email sent:', companyEmailSent);

  return jsonResponse({
    success: true,
    message: 'Request submitted successfully. Check your email for confirmation.',
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
// MESSAGE CREDITS HANDLER
// ============================================================================

async function handleMessageCredits(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!company) {
    return jsonResponse({ error: 'Company not found' }, 404);
  }

  const { data: credits } = await supabase
    .from('company_message_credits')
    .select('free_messages_remaining, purchased_credits')
    .eq('company_id', company.id)
    .single();

  const { count: totalSent } = await supabase
    .from('message_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', company.id);

  const freeRemaining = credits?.free_messages_remaining ?? 0;
  const purchasedRemaining = credits?.purchased_credits ?? 0;

  return jsonResponse({
    success: true,
    credits: {
      freeRemaining,
      purchasedRemaining,
      totalRemaining: freeRemaining + purchasedRemaining,
    },
    totalMessagesSent: totalSent || 0,
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

  // Fetch message credits
  const { data: msgCredits } = await supabase
    .from('company_message_credits')
    .select('free_messages_remaining, purchased_credits')
    .eq('company_id', company.id)
    .single();

  const freeMsg = msgCredits?.free_messages_remaining ?? 0;
  const purchasedMsg = msgCredits?.purchased_credits ?? 0;

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
    messageCredits: {
      freeRemaining: freeMsg,
      purchasedRemaining: purchasedMsg,
      totalRemaining: freeMsg + purchasedMsg,
    },
  });
}

// ============================================================================
// CONTACT REQUESTS
// ============================================================================

async function handleContactRequest(
  req: Request,
  supabase: SupabaseClient,
  user: any
): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const { profileId, message } = await req.json();

  if (!profileId) {
    return jsonResponse({ error: 'profileId is required' }, 400);
  }

  // Get the company for this user
  const { data: company, error: companyErr } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (companyErr || !company) {
    return jsonResponse({ error: 'Company account not found' }, 404);
  }

  // Get the member profile
  const { data: profile, error: profileErr } = await supabase
    .from('network_profiles')
    .select('id, full_name, slug, email')
    .eq('id', profileId)
    .single();

  if (profileErr || !profile) {
    return jsonResponse({ error: 'Profile not found' }, 404);
  }

  // Check for existing request
  const { data: existing } = await supabase
    .from('contact_requests')
    .select('id, status')
    .eq('company_id', company.id)
    .eq('profile_id', profileId)
    .single();

  if (existing) {
    return jsonResponse({
      success: false,
      error: existing.status === 'pending'
        ? 'You already have a pending request for this member.'
        : `Your previous request was ${existing.status}. Contact us for further assistance.`,
      existingStatus: existing.status,
    }, 409);
  }

  // Create the request
  const { data: request, error: insertErr } = await supabase
    .from('contact_requests')
    .insert({
      company_id: company.id,
      profile_id: profileId,
      requested_by: user.id,
      message: message || null,
    })
    .select()
    .single();

  if (insertErr) {
    console.error('[COMPANY] Contact request insert error:', insertErr);
    return jsonResponse({ error: 'Failed to submit request' }, 500);
  }

  // Notify admin via email
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const emailHtml = contactRequestAdminEmail({
      companyName: company.company_name,
      contactName: company.contact_name,
      contactEmail: company.contact_email,
      memberName: profile.full_name,
      memberSlug: profile.slug,
      message: message || undefined,
    });

    await sendEmail(
      adminEmail,
      `Contact Request: ${company.company_name} → ${profile.full_name}`,
      emailHtml
    );
  }

  return jsonResponse({
    success: true,
    requestId: request.id,
    message: 'Your request has been submitted. We\'ll review it and connect you shortly.',
  });
}

async function handleContactRequestStatus(
  req: Request,
  supabase: SupabaseClient,
  user: any
): Promise<Response> {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(req.url);
  const profileId = url.searchParams.get('profileId');

  if (!profileId) {
    return jsonResponse({ error: 'profileId query param required' }, 400);
  }

  // Get the company for this user
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!company) {
    return jsonResponse({ exists: false, status: null });
  }

  const { data: request } = await supabase
    .from('contact_requests')
    .select('id, status, created_at')
    .eq('company_id', company.id)
    .eq('profile_id', profileId)
    .single();

  return jsonResponse({
    exists: !!request,
    status: request?.status || null,
    createdAt: request?.created_at || null,
  });
}

// ============================================================================
// SAVE AGENT CHAT HANDLER
// ============================================================================

async function handleSaveAgentChat(
  req: Request,
  supabase: SupabaseClient,
  user: any
): Promise<Response> {
  // Get the company for this user
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!company) {
    return jsonResponse({ error: 'Company not found' }, 404);
  }

  if (req.method === 'PUT') {
    const { sessionId, title, messages } = await req.json();
    if (!sessionId || !messages) {
      return jsonResponse({ error: 'sessionId and messages are required' }, 400);
    }

    const { error } = await supabase
      .from('agent_chat_sessions')
      .upsert({
        company_id: company.id,
        session_id: sessionId,
        title: title || 'New Chat',
        messages,
        message_count: messages.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id,session_id' });

    if (error) {
      console.error('[COMPANY] Save agent chat error:', error);
      return jsonResponse({ error: 'Failed to save chat' }, 500);
    }

    return jsonResponse({ success: true });
  }

  if (req.method === 'DELETE') {
    const sessionId = getQueryParams(req).get('sessionId');
    if (!sessionId) {
      return jsonResponse({ error: 'sessionId query param required' }, 400);
    }

    const { error } = await supabase
      .from('agent_chat_sessions')
      .delete()
      .eq('company_id', company.id)
      .eq('session_id', sessionId);

    if (error) {
      console.error('[COMPANY] Delete agent chat error:', error);
      return jsonResponse({ error: 'Failed to delete chat' }, 500);
    }

    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
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
      case 'message-credits':
        return handleMessageCredits(req, supabase, user);
      case 'ct-finder':
        return ctFinderHandler(req);
      case 'talent-agent':
        return ctFinderHandler(req);
      case 'contact-request':
        return handleContactRequest(req, supabase, user);
      case 'contact-request/status':
        return handleContactRequestStatus(req, supabase, user);
      case 'save-agent-chat':
        return handleSaveAgentChat(req, supabase, user);
      default:
        console.warn(`[COMPANY] Unknown route: ${route}`);
        return jsonResponse({ error: `Route not found: /api/company/${route}` }, 404);
    }
  } catch (error) {
    console.error('[COMPANY] Error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
