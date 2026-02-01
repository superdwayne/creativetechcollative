import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
  maxDuration: 60, // Allow up to 60 seconds for job processing
};

/**
 * Parse URL path segments from request
 */
function getPathSegments(req: Request): string[] {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/jobs/', '').replace(/^\/+|\/+$/g, '');
  return path ? path.split('/') : [];
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

// ============================================================================
// SUBMIT JOB HANDLER
// ============================================================================

async function handleSubmitJob(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const { title, description, requirements, preferredSkills, focusAreas, budgetRange, projectType, remotePreference, location, timeline } = body;

  if (!title || !description || !projectType || !remotePreference) {
    return jsonResponse({ error: 'Title, description, projectType, and remotePreference are required' }, 400);
  }

  // Get the company for this user
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, company_name, contact_name, contact_email, verified')
    .eq('user_id', user.id)
    .single();

  if (companyError || !company) {
    return jsonResponse({ error: 'No company found for this user. Please register your company first.' }, 403);
  }

  // Create the job submission
  const { data: createdJob, error: insertError } = await supabase
    .from('job_submissions')
    .insert({
      company_id: company.id,
      title,
      description,
      requirements: requirements || null,
      preferred_skills: preferredSkills || null,
      focus_areas: focusAreas || null,
      budget_range: budgetRange || null,
      project_type: projectType,
      remote_preference: remotePreference,
      location: location || null,
      timeline: timeline || null,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError || !createdJob) {
    return jsonResponse({ error: 'Failed to create job submission' }, 500);
  }

  return jsonResponse({
    success: true,
    job: {
      id: createdJob.id,
      companyId: createdJob.company_id,
      title: createdJob.title,
      description: createdJob.description,
      status: createdJob.status,
      createdAt: createdJob.created_at,
    },
  }, 201);
}

// ============================================================================
// LIST JOBS HANDLER
// ============================================================================

async function handleListJobs(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Get the company for this user
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!company) {
    return jsonResponse({ success: true, jobs: [] });
  }

  const { data: jobs, error } = await supabase
    .from('job_submissions')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false });

  if (error) {
    return jsonResponse({ error: 'Failed to fetch jobs' }, 500);
  }

  return jsonResponse({
    success: true,
    jobs: (jobs || []).map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      status: job.status,
      createdAt: job.created_at,
      projectType: job.project_type,
      remotePreference: job.remote_preference,
    })),
  });
}

// ============================================================================
// GET JOB HANDLER
// ============================================================================

async function handleGetJob(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(req.url);
  const jobId = url.searchParams.get('id');

  if (!jobId) {
    return jsonResponse({ error: 'Job ID is required' }, 400);
  }

  // Get the company for this user
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!company) {
    return jsonResponse({ error: 'No company found' }, 403);
  }

  const { data: job, error } = await supabase
    .from('job_submissions')
    .select('*')
    .eq('id', jobId)
    .eq('company_id', company.id)
    .single();

  if (error || !job) {
    return jsonResponse({ error: 'Job not found' }, 404);
  }

  return jsonResponse({
    success: true,
    job: {
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      preferredSkills: job.preferred_skills,
      focusAreas: job.focus_areas,
      budgetRange: job.budget_range,
      projectType: job.project_type,
      remotePreference: job.remote_preference,
      location: job.location,
      timeline: job.timeline,
      status: job.status,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    },
  });
}

// ============================================================================
// REVIEW MATCH HANDLER
// ============================================================================

async function handleReviewMatch(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const { matchId, action, notes } = body;

  if (!matchId || !action) {
    return jsonResponse({ error: 'matchId and action are required' }, 400);
  }

  if (!['accept', 'reject', 'interested'].includes(action)) {
    return jsonResponse({ error: 'Invalid action' }, 400);
  }

  // Get the company for this user
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!company) {
    return jsonResponse({ error: 'No company found' }, 403);
  }

  // Verify the match belongs to this company's job
  const { data: match, error: matchError } = await supabase
    .from('job_matches')
    .select(`
      id,
      job_submissions!inner (company_id)
    `)
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    return jsonResponse({ error: 'Match not found' }, 404);
  }

  const jobSubmission = match.job_submissions as any;
  if (jobSubmission.company_id !== company.id) {
    return jsonResponse({ error: 'Not authorized to review this match' }, 403);
  }

  // Update the match status
  const statusMap: Record<string, string> = {
    accept: 'accepted',
    reject: 'rejected',
    interested: 'interested',
  };

  const { error: updateError } = await supabase
    .from('job_matches')
    .update({
      status: statusMap[action],
      company_notes: notes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', matchId);

  if (updateError) {
    return jsonResponse({ error: 'Failed to update match' }, 500);
  }

  return jsonResponse({
    success: true,
    message: `Match ${statusMap[action]} successfully`,
  });
}

// ============================================================================
// PARSE JOB SPEC HANDLER
// ============================================================================

interface ParsedJobSpec {
  title: string;
  description: string;
  requirements?: string;
  preferredSkills?: string[];
  focusAreas?: string[];
  budgetRange?: string;
  projectType?: string;
  remotePreference?: string;
  location?: string;
  timeline?: string;
}

async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  
  if (fileType === 'text/plain') {
    return await file.text();
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const rawText = decoder.decode(uint8Array);
  
  const cleanedText = rawText
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleanedText.length < 100) {
    throw new Error(
      'Could not extract text from file. For best results, copy and paste the job description into the form.'
    );
  }
  
  return cleanedText;
}

async function parseJobSpecWithAI(
  text: string,
  anthropicApiKey: string
): Promise<ParsedJobSpec> {
  const prompt = `You are a job specification parser. Analyze the following job description/specification and extract structured information.

Job Specification Text:
"""
${text.substring(0, 10000)}
"""

Extract the following fields and return them as a JSON object. Only include fields that are clearly present in the text:

{
  "title": "Job title",
  "description": "A clear description of the role and project (combine relevant sections)",
  "requirements": "Required qualifications, experience, etc.",
  "preferredSkills": ["skill1", "skill2"],
  "focusAreas": [],
  "budgetRange": "Budget or salary range if mentioned",
  "projectType": "One of: freelance, contract, full-time, project-based",
  "remotePreference": "One of: remote, hybrid, onsite, flexible",
  "location": "Location if mentioned",
  "timeline": "Project timeline or duration if mentioned"
}

Return ONLY the JSON object, no additional text.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`AI parsing failed: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const aiResponse = data.content?.[0]?.text;

  if (!aiResponse) {
    throw new Error('No response from AI parser');
  }

  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse AI response as JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    title: parsed.title || '',
    description: parsed.description || '',
    requirements: parsed.requirements,
    preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : undefined,
    focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas : undefined,
    budgetRange: parsed.budgetRange,
    projectType: parsed.projectType,
    remotePreference: parsed.remotePreference,
    location: parsed.location,
    timeline: parsed.timeline,
  };
}

async function handleParseJobSpec(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const contentType = req.headers.get('content-type') || '';
  const isUrlFetch = contentType.includes('application/json');
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!isUrlFetch && !anthropicApiKey) {
    return jsonResponse({ error: 'AI parsing not configured' }, 500);
  }

  try {
    if (isUrlFetch) {
      const body = await req.json();
      const { url } = body;

      if (!url) {
        return jsonResponse({ error: 'No URL provided' }, 400);
      }

      console.log(`[PARSE-JOB-SPEC] Fetching URL: ${url}`);

      const urlResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobSpecParser/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!urlResponse.ok) {
        return jsonResponse({
          error: `Failed to fetch URL: ${urlResponse.status} ${urlResponse.statusText}`
        }, 400);
      }

      const htmlContent = await urlResponse.text();

      let cleanedContent = htmlContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ');

      cleanedContent = cleanedContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanedContent.length < 50) {
        return jsonResponse({
          error: 'Could not extract meaningful content from the URL.'
        }, 400);
      }

      return jsonResponse({
        success: true,
        content: cleanedContent.substring(0, 50000),
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return jsonResponse({ error: 'No file provided' }, 400);
    }

    if (file.size > 10 * 1024 * 1024) {
      return jsonResponse({ error: 'File too large. Maximum size is 10MB.' }, 400);
    }

    const text = await extractTextFromFile(file);
    const parsed = await parseJobSpecWithAI(text, anthropicApiKey!);

    return jsonResponse({
      success: true,
      parsed,
      extractedTextLength: text.length,
    });
  } catch (error) {
    console.error('[PARSE-JOB-SPEC] Error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Failed to parse job specification',
    }, 500);
  }
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

  console.log(`[JOBS] Route: ${route}, Method: ${req.method}`);

  // parse-job-spec can work with or without auth for URL fetch mode
  if (route === 'parse-spec') {
    const contentType = req.headers.get('content-type') || '';
    const isUrlFetch = contentType.includes('application/json');
    
    if (isUrlFetch) {
      // URL fetch mode doesn't require auth
      return handleParseJobSpec(req, supabase, null);
    }
    
    // File upload mode requires auth
    const { user, error: authError } = await authenticateUser(req, supabase);
    if (authError) {
      return jsonResponse({ error: authError }, 401);
    }
    return handleParseJobSpec(req, supabase, user);
  }

  // All other routes require authentication
  const { user, error: authError } = await authenticateUser(req, supabase);
  if (authError) {
    return jsonResponse({ error: authError }, 401);
  }

  try {
    switch (route) {
      case '':
      case 'list':
        return handleListJobs(req, supabase, user);
      case 'submit':
        return handleSubmitJob(req, supabase, user);
      case 'get':
        return handleGetJob(req, supabase, user);
      case 'review-match':
        return handleReviewMatch(req, supabase, user);
      default:
        console.warn(`[JOBS] Unknown route: ${route}`);
        return jsonResponse({ error: `Route not found: /api/jobs/${route}` }, 404);
    }
  } catch (error) {
    console.error('[JOBS] Error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
