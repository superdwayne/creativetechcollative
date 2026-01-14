import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const config = {
  runtime: 'edge',
};

// Request schema for job submission
const SubmitJobRequest = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
  requirements: z.string().optional(),
  preferredSkills: z.array(z.string()).optional(),
  focusAreas: z.array(z.string()).optional(),
  budgetRange: z.string().max(100).optional(),
  projectType: z.enum(['freelance', 'contract', 'full-time', 'project-based']),
  remotePreference: z.enum(['remote', 'hybrid', 'onsite', 'flexible']),
  location: z.string().max(255).optional(),
  timeline: z.string().max(255).optional(),
});

// Response type for job submission
interface JobSubmissionResponse {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements?: string | null;
  preferredSkills?: string[] | null;
  focusAreas?: string[] | null;
  budgetRange?: string | null;
  projectType: string;
  remotePreference: string;
  location?: string | null;
  timeline?: string | null;
  status: string;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the webhook URL based on environment
 * Uses test endpoint in test mode, production endpoint otherwise
 */
function getWebhookUrl(): string {
  const isTest = process.env.VITE_TEST === 'TRUE';
  const baseUrl = isTest
    ? 'https://n8n.creativetechnologists.nl/webhook-test'
    : 'https://n8n.creativetechnologists.nl/webhook';
  return `${baseUrl}/job-submission`;
}

/**
 * Send job submission notification to admin via webhook
 */
async function sendJobSubmissionNotification(
  job: JobSubmissionResponse,
  companyName: string,
  contactName: string,
  contactEmail: string
): Promise<void> {
  try {
    const webhookUrl = getWebhookUrl();
    const username = process.env.VITE_N8N_BASIC_AUTH_USERNAME;
    const password = process.env.VITE_N8N_BASIC_AUTH_PASSWORD;

    if (!username || !password) {
      console.warn('[SUBMIT-JOB] Webhook credentials not configured. Admin notification not sent.');
      return;
    }

    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        type: 'job_submission',
        job: {
          id: job.id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          preferredSkills: job.preferredSkills,
          focusAreas: job.focusAreas,
          budgetRange: job.budgetRange,
          projectType: job.projectType,
          remotePreference: job.remotePreference,
          location: job.location,
          timeline: job.timeline,
        },
        company: {
          name: companyName,
          contactName,
          contactEmail,
        },
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(`[SUBMIT-JOB] Webhook returned status ${response.status}`);
    } else {
      console.log('[SUBMIT-JOB] Admin notification sent successfully');
    }
  } catch (error) {
    console.error('[SUBMIT-JOB] Failed to send admin notification:', error);
    // Don't throw - job submission should succeed even if notification fails
  }
}

/**
 * Convert database row to response format
 */
function rowToJobSubmission(row: Record<string, unknown>): JobSubmissionResponse {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    title: row.title as string,
    description: row.description as string,
    requirements: row.requirements as string | null,
    preferredSkills: row.preferred_skills as string[] | null,
    focusAreas: row.focus_areas as string[] | null,
    budgetRange: row.budget_range as string | null,
    projectType: row.project_type as string,
    remotePreference: row.remote_preference as string,
    location: row.location as string | null,
    timeline: row.timeline as string | null,
    status: row.status as string,
    adminNotes: row.admin_notes as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for required environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create Supabase client with service role key for operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accessToken = authHeader.replace('Bearer ', '');

  // Verify the token and get user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const validatedData = SubmitJobRequest.parse(body);

    console.log(`[SUBMIT-JOB] Processing job submission for user: ${user.id}`);

    // Get the company for this user
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name, contact_name, contact_email, verified')
      .eq('user_id', user.id)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({
          error: 'No company found for this user. Please register your company first.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[SUBMIT-JOB] Company found: ${company.company_name} (ID: ${company.id})`);

    // Create the job submission record
    const { data: createdJob, error: insertError } = await supabase
      .from('job_submissions')
      .insert({
        company_id: company.id,
        title: validatedData.title,
        description: validatedData.description,
        requirements: validatedData.requirements || null,
        preferred_skills: validatedData.preferredSkills || null,
        focus_areas: validatedData.focusAreas || null,
        budget_range: validatedData.budgetRange || null,
        project_type: validatedData.projectType,
        remote_preference: validatedData.remotePreference,
        location: validatedData.location || null,
        timeline: validatedData.timeline || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !createdJob) {
      console.error('[SUBMIT-JOB] Database insert error:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create job submission',
          details: insertError?.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const jobResponse = rowToJobSubmission(createdJob);

    console.log(`[SUBMIT-JOB] Job created successfully: ${jobResponse.id}`);

    // Send notification to admin (non-blocking)
    await sendJobSubmissionNotification(
      jobResponse,
      company.company_name,
      company.contact_name,
      company.contact_email
    );

    return new Response(
      JSON.stringify({
        success: true,
        job: jobResponse,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[SUBMIT-JOB] Error:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Job submission failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
