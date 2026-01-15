import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

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

  // Create Supabase client with service role key
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
    console.log(`[MESSAGES/UNREAD-COUNT] Fetching unread count for user: ${user.id}`);

    // Check if user is a company owner
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (company && !companyError) {
      // User is a company - count unread messages from members in their job matches
      console.log(`[MESSAGES/UNREAD-COUNT] User is company: ${company.id}`);

      // Get all match IDs for this company's jobs
      const { data: matches, error: matchesError } = await supabase
        .from('job_matches')
        .select(`
          id,
          job_submissions!inner (
            company_id
          )
        `)
        .eq('job_submissions.company_id', company.id);

      if (matchesError) {
        console.error('[MESSAGES/UNREAD-COUNT] Failed to fetch company matches:', matchesError);
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

      const matchIds = (matches || []).map((m) => m.id);

      if (matchIds.length === 0) {
        console.log('[MESSAGES/UNREAD-COUNT] Company has no matches, returning count: 0');
        return new Response(JSON.stringify({ count: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Count unread messages from members (sender_type = 'member', read_at is null)
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('match_id', matchIds)
        .eq('sender_type', 'member')
        .is('read_at', null);

      if (countError) {
        console.error('[MESSAGES/UNREAD-COUNT] Failed to count messages:', countError);
        return new Response(
          JSON.stringify({
            error: 'Failed to count unread messages',
            details: countError.message,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      console.log(`[MESSAGES/UNREAD-COUNT] Company unread count: ${count}`);
      return new Response(JSON.stringify({ count: count || 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is a member (has a network profile)
    const { data: profile, error: profileError } = await supabase
      .from('network_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profile && !profileError) {
      // User is a member - count unread messages from companies in their matches
      console.log(`[MESSAGES/UNREAD-COUNT] User is member: ${profile.id}`);

      // Get all match IDs for this member
      const { data: matches, error: matchesError } = await supabase
        .from('job_matches')
        .select('id')
        .eq('profile_id', profile.id);

      if (matchesError) {
        console.error('[MESSAGES/UNREAD-COUNT] Failed to fetch member matches:', matchesError);
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

      const matchIds = (matches || []).map((m) => m.id);

      if (matchIds.length === 0) {
        console.log('[MESSAGES/UNREAD-COUNT] Member has no matches, returning count: 0');
        return new Response(JSON.stringify({ count: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Count unread messages from companies (sender_type = 'company', read_at is null)
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('match_id', matchIds)
        .eq('sender_type', 'company')
        .is('read_at', null);

      if (countError) {
        console.error('[MESSAGES/UNREAD-COUNT] Failed to count messages:', countError);
        return new Response(
          JSON.stringify({
            error: 'Failed to count unread messages',
            details: countError.message,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      console.log(`[MESSAGES/UNREAD-COUNT] Member unread count: ${count}`);
      return new Response(JSON.stringify({ count: count || 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // User is neither a company nor a member
    console.log('[MESSAGES/UNREAD-COUNT] User has no company or profile');
    return new Response(JSON.stringify({ count: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[MESSAGES/UNREAD-COUNT] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch unread count' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
