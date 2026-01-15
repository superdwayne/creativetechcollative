import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Schema for match IDs
const requestSchema = z.object({
  matchIds: z.array(z.string().uuid()),
});

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get auth token from header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.split(' ')[1];

  // Create Supabase client with user token for auth
  const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Verify the user
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parseResult = requestSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid request data', details: parseResult.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { matchIds } = parseResult.data;

  if (matchIds.length === 0) {
    return new Response(JSON.stringify({ success: true, unreadStatus: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create service role client for queries
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Determine if user is a company or member
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const { data: profile } = await supabase
    .from('network_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // Determine sender type for unread (messages FROM the other party)
  // If user is member, unread = company messages. If user is company, unread = member messages.
  const senderType = profile ? 'company' : company ? 'member' : null;

  if (!senderType) {
    return new Response(JSON.stringify({ success: true, unreadStatus: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // For each match, count unread messages
  const unreadStatus: Record<string, boolean> = {};

  for (const matchId of matchIds) {
    // Check if there are unread messages from the other party
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('sender_type', senderType)
      .is('read_at', null);

    if (!error) {
      unreadStatus[matchId] = (count ?? 0) > 0;
    } else {
      console.error('Error checking unread status for match:', matchId, error);
      unreadStatus[matchId] = false;
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      unreadStatus,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
