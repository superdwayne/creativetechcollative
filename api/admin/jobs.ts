import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const config = {
  runtime: 'edge',
};

// Query parameters schema for filtering and pagination
const QueryParamsSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'matched', 'closed', 'rejected']).optional(),
  sortBy: z.enum(['created_at', 'status']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Response type for job submission with company info and match count
interface JobSubmissionWithDetails {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  requirements: string | null;
  preferredSkills: string[] | null;
  focusAreas: string[] | null;
  budgetRange: string | null;
  projectType: string;
  remotePreference: string;
  location: string | null;
  timeline: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  matchCount: number;
}

interface PaginatedResponse {
  jobs: JobSubmissionWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Check if a user is an admin based on ADMIN_USER_IDS env var
 */
function isAdmin(userId: string): boolean {
  const adminUserIds = process.env.ADMIN_USER_IDS || '';
  const adminIds = adminUserIds.split(',').map((id) => id.trim()).filter(Boolean);
  return adminIds.includes(userId);
}

/**
 * Convert database row to response format
 */
function rowToJobSubmission(
  row: Record<string, unknown>,
  companyName: string,
  matchCount: number
): JobSubmissionWithDetails {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    companyName,
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
    matchCount,
  };
}

export default async function handler(req: Request) {
  // Only allow GET requests
  if (req.method !== 'GET') {
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

  // Create Supabase client with service role key for admin operations
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

  // Check if user is admin
  if (!isAdmin(user.id)) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = {
      status: url.searchParams.get('status') || undefined,
      sortBy: url.searchParams.get('sortBy') || undefined,
      sortOrder: url.searchParams.get('sortOrder') || undefined,
      page: url.searchParams.get('page') || undefined,
      limit: url.searchParams.get('limit') || undefined,
    };

    const { status, sortBy, sortOrder, page, limit } = QueryParamsSchema.parse(queryParams);

    console.log(`[ADMIN-JOBS] Fetching jobs with params:`, { status, sortBy, sortOrder, page, limit });

    // Build query for job submissions
    let query = supabase.from('job_submissions').select('*', { count: 'exact' });

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: jobs, error: jobsError, count } = await query;

    if (jobsError) {
      console.error('[ADMIN-JOBS] Failed to fetch jobs:', jobsError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch job submissions',
          details: jobsError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!jobs || jobs.length === 0) {
      const emptyResponse: PaginatedResponse = {
        jobs: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
      return new Response(JSON.stringify(emptyResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get company IDs from jobs
    const companyIds = [...new Set(jobs.map((job) => job.company_id))];

    // Fetch company names
    const { data: companies } = await supabase
      .from('companies')
      .select('id, company_name')
      .in('id', companyIds);

    const companyMap = new Map<string, string>();
    if (companies) {
      companies.forEach((company) => {
        companyMap.set(company.id, company.company_name);
      });
    }

    // Get job IDs for match count query
    const jobIds = jobs.map((job) => job.id);

    // Fetch match counts for each job
    const { data: matchCounts } = await supabase
      .from('job_matches')
      .select('job_id')
      .in('job_id', jobIds);

    const matchCountMap = new Map<string, number>();
    if (matchCounts) {
      matchCounts.forEach((match) => {
        const currentCount = matchCountMap.get(match.job_id) || 0;
        matchCountMap.set(match.job_id, currentCount + 1);
      });
    }

    // Transform jobs to response format
    const jobsWithDetails: JobSubmissionWithDetails[] = jobs.map((job) =>
      rowToJobSubmission(
        job,
        companyMap.get(job.company_id) || 'Unknown Company',
        matchCountMap.get(job.id) || 0
      )
    );

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse = {
      jobs: jobsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    console.log(`[ADMIN-JOBS] Successfully fetched ${jobs.length} jobs`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ADMIN-JOBS] Error:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid query parameters',
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

    return new Response(JSON.stringify({ error: 'Failed to fetch jobs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
