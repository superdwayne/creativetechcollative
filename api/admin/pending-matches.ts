import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Profile details included with match
interface ProfileDetails {
  id: string;
  fullName: string;
  email: string;
  location: string;
  bio: string;
  skills: string[];
  focusAreas: string[];
  availability: string;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  profilePictureUrl: string | null;
}

// Job details included with matches
interface JobDetails {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  projectType: string;
  remotePreference: string;
  createdAt: string;
}

// Skill match info from JSONB
interface SkillMatchInfo {
  skill: string;
  relevance?: string;
  fromProfile?: boolean;
  fromPortfolio?: boolean;
}

// Match with profile details
interface MatchWithProfile {
  id: string;
  jobId: string;
  profileId: string;
  matchScore: number;
  matchReasoning: string;
  skillMatches: SkillMatchInfo[] | null;
  vectorSimilarity: number | null;
  adminApproved: boolean | null;
  memberNotified: boolean;
  memberResponse: string | null;
  createdAt: string;
  profile: ProfileDetails;
}

// Matches grouped by job
interface PendingMatchGroup {
  job: JobDetails;
  matches: MatchWithProfile[];
}

interface PendingMatchesResponse {
  groups: PendingMatchGroup[];
  totalMatches: number;
  totalJobs: number;
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
 * Convert database profile row to ProfileDetails format
 */
function rowToProfileDetails(row: Record<string, unknown>): ProfileDetails {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    email: row.email as string,
    location: row.location as string,
    bio: row.bio as string,
    skills: row.skills as string[],
    focusAreas: row.focus_areas as string[],
    availability: row.availability as string,
    portfolioUrl: row.portfolio_url as string | null,
    linkedinUrl: row.linkedin_url as string | null,
    profilePictureUrl: row.profile_picture_url as string | null,
  };
}

/**
 * Convert database match row to MatchWithProfile format (without profile)
 */
function rowToMatch(row: Record<string, unknown>): Omit<MatchWithProfile, 'profile'> {
  return {
    id: row.id as string,
    jobId: row.job_id as string,
    profileId: row.profile_id as string,
    matchScore: row.match_score as number,
    matchReasoning: row.match_reasoning as string,
    skillMatches: row.skill_matches as SkillMatchInfo[] | null,
    vectorSimilarity: row.vector_similarity as number | null,
    adminApproved: row.admin_approved as boolean | null,
    memberNotified: row.member_notified as boolean,
    memberResponse: row.member_response as string | null,
    createdAt: row.created_at as string,
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
    console.log('[ADMIN-PENDING-MATCHES] Fetching pending matches');

    // Fetch all pending matches (admin_approved IS NULL)
    const { data: pendingMatches, error: matchesError } = await supabase
      .from('job_matches')
      .select('*')
      .is('admin_approved', null)
      .order('created_at', { ascending: true });

    if (matchesError) {
      console.error('[ADMIN-PENDING-MATCHES] Failed to fetch matches:', matchesError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch pending matches',
          details: matchesError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Return empty if no pending matches
    if (!pendingMatches || pendingMatches.length === 0) {
      const emptyResponse: PendingMatchesResponse = {
        groups: [],
        totalMatches: 0,
        totalJobs: 0,
      };
      return new Response(JSON.stringify(emptyResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get unique job IDs and profile IDs
    const jobIds = [...new Set(pendingMatches.map((match) => match.job_id))];
    const profileIds = [...new Set(pendingMatches.map((match) => match.profile_id))];

    // Fetch job details with company info
    const { data: jobs, error: jobsError } = await supabase
      .from('job_submissions')
      .select('id, title, company_id, project_type, remote_preference, created_at')
      .in('id', jobIds);

    if (jobsError) {
      console.error('[ADMIN-PENDING-MATCHES] Failed to fetch jobs:', jobsError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch job details',
          details: jobsError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch company names
    const companyIds = [...new Set((jobs || []).map((job) => job.company_id))];
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name')
      .in('id', companyIds);

    if (companiesError) {
      console.error('[ADMIN-PENDING-MATCHES] Failed to fetch companies:', companiesError);
    }

    // Create company lookup map
    const companyMap = new Map<string, string>();
    if (companies) {
      companies.forEach((company) => {
        companyMap.set(company.id, company.company_name);
      });
    }

    // Create job lookup map
    const jobMap = new Map<string, JobDetails>();
    if (jobs) {
      jobs.forEach((job) => {
        jobMap.set(job.id, {
          id: job.id,
          title: job.title,
          companyId: job.company_id,
          companyName: companyMap.get(job.company_id) || 'Unknown Company',
          projectType: job.project_type,
          remotePreference: job.remote_preference,
          createdAt: job.created_at,
        });
      });
    }

    // Fetch profile details
    const { data: profiles, error: profilesError } = await supabase
      .from('network_profiles')
      .select('id, full_name, email, location, bio, skills, focus_areas, availability, portfolio_url, linkedin_url, profile_picture_url')
      .in('id', profileIds);

    if (profilesError) {
      console.error('[ADMIN-PENDING-MATCHES] Failed to fetch profiles:', profilesError);
    }

    // Create profile lookup map
    const profileMap = new Map<string, ProfileDetails>();
    if (profiles) {
      profiles.forEach((profile) => {
        profileMap.set(profile.id, rowToProfileDetails(profile));
      });
    }

    // Group matches by job
    const groupedMatches = new Map<string, MatchWithProfile[]>();
    pendingMatches.forEach((match) => {
      const matchData = rowToMatch(match);
      const profile = profileMap.get(match.profile_id) || {
        id: match.profile_id,
        fullName: 'Unknown',
        email: '',
        location: '',
        bio: '',
        skills: [],
        focusAreas: [],
        availability: 'not-available',
        portfolioUrl: null,
        linkedinUrl: null,
        profilePictureUrl: null,
      };

      const matchWithProfile: MatchWithProfile = {
        ...matchData,
        profile,
      };

      const existing = groupedMatches.get(match.job_id) || [];
      existing.push(matchWithProfile);
      groupedMatches.set(match.job_id, existing);
    });

    // Build response groups, sorted by job creation date (oldest first)
    const groups: PendingMatchGroup[] = [];
    for (const [jobId, jobMatches] of groupedMatches) {
      const job = jobMap.get(jobId);
      if (job) {
        // Sort matches by match_score descending
        jobMatches.sort((a, b) => b.matchScore - a.matchScore);
        groups.push({ job, matches: jobMatches });
      }
    }

    // Sort groups by job creation date (oldest first for FIFO review)
    groups.sort((a, b) => new Date(a.job.createdAt).getTime() - new Date(b.job.createdAt).getTime());

    const response: PendingMatchesResponse = {
      groups,
      totalMatches: pendingMatches.length,
      totalJobs: groups.length,
    };

    console.log(`[ADMIN-PENDING-MATCHES] Found ${response.totalMatches} pending matches across ${response.totalJobs} jobs`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ADMIN-PENDING-MATCHES] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch pending matches' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
