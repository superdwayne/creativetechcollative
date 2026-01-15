import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const config = {
  runtime: 'edge',
};

// Request schema for sending a message
const SendMessageRequest = z.object({
  matchId: z.string().uuid(),
  content: z.string().min(1, 'Message content is required'),
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
    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const { matchId, content } = SendMessageRequest.parse(body);

    console.log(`[MESSAGES/SEND] Sending message for match: ${matchId}`);

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
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      console.error('[MESSAGES/SEND] Match not found:', matchError);
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine sender type and validate authorization
    let senderType: 'company' | 'member';
    let senderId: string;

    // Check if user is the company for this match
    const jobSubmission = match.job_submissions as { id: string; company_id: string; companies: { id: string; user_id: string } };
    const companyUserId = jobSubmission.companies.user_id;
    const companyId = jobSubmission.companies.id;

    // Check if user is the member for this match
    const profile = match.network_profiles as { id: string; user_id: string };
    const memberUserId = profile.user_id;
    const profileId = profile.id;

    if (user.id === companyUserId) {
      senderType = 'company';
      senderId = companyId;
    } else if (user.id === memberUserId) {
      senderType = 'member';
      senderId = profileId;
    } else {
      // User is not a participant in this match
      console.error(`[MESSAGES/SEND] User ${user.id} not authorized for match ${matchId}`);
      return new Response(JSON.stringify({ error: 'Not authorized to send messages for this match' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[MESSAGES/SEND] Sender type: ${senderType}, sender ID: ${senderId}`);

    // Create the message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_type: senderType,
        sender_id: senderId,
        content: content,
      })
      .select()
      .single();

    if (insertError || !message) {
      console.error('[MESSAGES/SEND] Failed to create message:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Failed to send message',
          details: insertError?.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const messageResponse = rowToMessage(message);
    console.log(`[MESSAGES/SEND] Message sent successfully: ${message.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: messageResponse,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[MESSAGES/SEND] Error:', error);

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

    return new Response(JSON.stringify({ error: 'Failed to send message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
