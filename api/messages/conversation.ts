import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const config = {
  runtime: 'edge',
};

// Query parameter schema
const ConversationRequest = z.object({
  matchId: z.string().uuid(),
});

// Response type for message
interface MessageResponse {
  id: string;
  matchId: string;
  senderType: 'company' | 'member';
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

/**
 * Convert database row to response format
 */
function rowToMessage(row: Record<string, unknown>): MessageResponse {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    senderType: row.sender_type as 'company' | 'member',
    senderId: row.sender_id as string,
    content: row.content as string,
    createdAt: row.created_at as string,
    readAt: row.read_at as string | null,
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
    // Parse match_id from query parameters
    const url = new URL(req.url);
    const matchId = url.searchParams.get('matchId');

    const { matchId: validatedMatchId } = ConversationRequest.parse({ matchId });

    console.log(`[MESSAGES/CONVERSATION] Fetching conversation for match: ${validatedMatchId}`);

    // Fetch the match with related data to validate participant
    const { data: match, error: matchError } = await supabase
      .from('job_matches')
      .select(`
        id,
        profile_id,
        job_id,
        job_submissions!inner (
          id,
          company_id,
          companies!inner (
            id,
            user_id
          )
        ),
        network_profiles!inner (
          id,
          user_id
        )
      `)
      .eq('id', validatedMatchId)
      .single();

    if (matchError || !match) {
      console.error('[MESSAGES/CONVERSATION] Match not found:', matchError);
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate authorization - user must be company or member for this match
    const jobSubmission = match.job_submissions as { id: string; company_id: string; companies: { id: string; user_id: string } };
    const companyUserId = jobSubmission.companies.user_id;

    const profile = match.network_profiles as { id: string; user_id: string };
    const memberUserId = profile.user_id;

    // Determine the requester's role
    let requesterType: 'company' | 'member';

    if (user.id === companyUserId) {
      requesterType = 'company';
    } else if (user.id === memberUserId) {
      requesterType = 'member';
    } else {
      // User is not a participant in this match
      console.error(`[MESSAGES/CONVERSATION] User ${user.id} not authorized for match ${validatedMatchId}`);
      return new Response(JSON.stringify({ error: 'Not authorized to view messages for this match' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[MESSAGES/CONVERSATION] Requester type: ${requesterType}`);

    // Fetch all messages for this match, sorted by created_at ascending
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', validatedMatchId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[MESSAGES/CONVERSATION] Failed to fetch messages:', messagesError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch conversation',
          details: messagesError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Mark unread messages as read for the requester
    // Messages are unread if:
    // - read_at is null
    // - sender_type is the OTHER party (not the requester)
    const otherSenderType = requesterType === 'company' ? 'member' : 'company';
    const unreadMessageIds = (messages || [])
      .filter((msg) => msg.read_at === null && msg.sender_type === otherSenderType)
      .map((msg) => msg.id);

    if (unreadMessageIds.length > 0) {
      console.log(`[MESSAGES/CONVERSATION] Marking ${unreadMessageIds.length} messages as read`);

      const { error: updateError } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadMessageIds);

      if (updateError) {
        // Log error but don't fail the request
        console.error('[MESSAGES/CONVERSATION] Failed to mark messages as read:', updateError);
      }
    }

    // Convert messages to response format
    const messageResponses = (messages || []).map(rowToMessage);

    console.log(`[MESSAGES/CONVERSATION] Returning ${messageResponses.length} messages`);

    return new Response(
      JSON.stringify({
        success: true,
        messages: messageResponses,
        markedAsRead: unreadMessageIds.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[MESSAGES/CONVERSATION] Error:', error);

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

    return new Response(JSON.stringify({ error: 'Failed to fetch conversation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
