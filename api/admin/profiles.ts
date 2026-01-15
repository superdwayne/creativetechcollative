import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Response type for pending profile
interface PendingProfile {
  id: string;
  userId: string;
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
  projects: Array<{
    title: string;
    description: string;
    url?: string;
    imageUrl?: string;
  }>;
  createdAt: string;
  slug: string;
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
function rowToProfile(row: Record<string, unknown>): PendingProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    fullName: row.full_name as string,
    email: row.email as string,
    location: row.location as string,
    bio: row.bio as string,
    skills: (row.skills as string[]) || [],
    focusAreas: (row.focus_areas as string[]) || [],
    availability: row.availability as string,
    portfolioUrl: row.portfolio_url as string | null,
    linkedinUrl: row.linkedin_url as string | null,
    profilePictureUrl: row.profile_picture_url as string | null,
    projects: (row.projects as PendingProfile['projects']) || [],
    createdAt: row.created_at as string,
    slug: row.slug as string,
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
    console.log('[ADMIN-PROFILES] Fetching pending profiles');

    // Fetch pending profiles (approved = false), sorted by oldest first (FIFO)
    const { data: profiles, error: profilesError } = await supabase
      .from('network_profiles')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: true });

    if (profilesError) {
      console.error('[ADMIN-PROFILES] Failed to fetch profiles:', profilesError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch pending profiles',
          details: profilesError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const pendingProfiles = (profiles || []).map(rowToProfile);

    console.log(`[ADMIN-PROFILES] Successfully fetched ${pendingProfiles.length} pending profiles`);

    return new Response(
      JSON.stringify({
        profiles: pendingProfiles,
        count: pendingProfiles.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ADMIN-PROFILES] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
