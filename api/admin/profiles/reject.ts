import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

/**
 * Check if a user is an admin based on ADMIN_USER_IDS env var
 */
function isAdmin(userId: string): boolean {
  const adminUserIds = process.env.ADMIN_USER_IDS || '';
  const adminIds = adminUserIds.split(',').map((id) => id.trim()).filter(Boolean);
  return adminIds.includes(userId);
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
    // Parse request body
    const body = await req.json();
    const { profileId, reason } = body;

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ADMIN-REJECT] Rejecting profile: ${profileId}, reason: ${reason || 'none'}`);

    // First, get the profile to return info about it
    const { data: profile, error: fetchError } = await supabase
      .from('network_profiles')
      .select('id, full_name, email')
      .eq('id', profileId)
      .single();

    if (fetchError || !profile) {
      console.error('[ADMIN-REJECT] Profile not found:', fetchError);
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete the profile record
    const { error: deleteError } = await supabase
      .from('network_profiles')
      .delete()
      .eq('id', profileId);

    if (deleteError) {
      console.error('[ADMIN-REJECT] Failed to delete profile:', deleteError);
      return new Response(
        JSON.stringify({
          error: 'Failed to reject profile',
          details: deleteError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[ADMIN-REJECT] Successfully rejected and deleted profile: ${profileId}`);

    return new Response(
      JSON.stringify({
        success: true,
        profile: {
          id: profile.id,
          fullName: profile.full_name,
          email: profile.email,
        },
        reason: reason || null,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ADMIN-REJECT] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to reject profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
