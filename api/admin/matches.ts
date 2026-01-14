import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const config = {
  runtime: 'edge',
};

// Query parameters schema
const QueryParamsSchema = z.object({
  jobId: z.string().uuid('Invalid job ID format'),
});

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

// Skill match info from JSONB
interface SkillMatchInfo {
  skill: string;
  relevance: string;
  fromProfile?: boolean;
  fromPortfolio?: boolean;
}

// Match response type with full profile details
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

interface MatchesResponse {
  matches: MatchWithProfile[];
  jobId: string;
  total: number;
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
    // Parse query parameters
    const url = new URL(req.url);
    const jobIdParam = url.searchParams.get('jobId');

    if (!jobIdParam) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: jobId' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { jobId } = QueryParamsSchema.parse({ jobId: jobIdParam });

    console.log(`[ADMIN-MATCHES] Fetching matches for job: ${jobId}`);

    // Verify job exists
    const { data: job, error: jobError } = await supabase
      .from('job_submissions')
      .select('id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job submission not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch matches for the job, ordered by match_score descending
    const { data: matches, error: matchesError } = await supabase
      .from('job_matches')
      .select('*')
      .eq('job_id', jobId)
      .order('match_score', { ascending: false });

    if (matchesError) {
      console.error('[ADMIN-MATCHES] Failed to fetch matches:', matchesError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch matches',
          details: matchesError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Return empty array if no matches
    if (!matches || matches.length === 0) {
      const emptyResponse: MatchesResponse = {
        matches: [],
        jobId,
        total: 0,
      };
      return new Response(JSON.stringify(emptyResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all profile IDs from matches
    const profileIds = matches.map((match) => match.profile_id);

    // Fetch full profile details for all matched profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('network_profiles')
      .select('id, full_name, email, location, bio, skills, focus_areas, availability, portfolio_url, linkedin_url, profile_picture_url')
      .in('id', profileIds);

    if (profilesError) {
      console.error('[ADMIN-MATCHES] Failed to fetch profiles:', profilesError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch profile details',
          details: profilesError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create profile lookup map
    const profileMap = new Map<string, ProfileDetails>();
    if (profiles) {
      profiles.forEach((profile) => {
        profileMap.set(profile.id, rowToProfileDetails(profile));
      });
    }

    // Combine matches with profile details
    const matchesWithProfiles: MatchWithProfile[] = matches.map((match) => {
      const matchData = rowToMatch(match);
      const profile = profileMap.get(match.profile_id);

      return {
        ...matchData,
        profile: profile || {
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
        },
      };
    });

    const response: MatchesResponse = {
      matches: matchesWithProfiles,
      jobId,
      total: matchesWithProfiles.length,
    };

    console.log(`[ADMIN-MATCHES] Successfully fetched ${matchesWithProfiles.length} matches for job ${jobId}`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ADMIN-MATCHES] Error:', error);

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

    return new Response(JSON.stringify({ error: 'Failed to fetch matches' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
