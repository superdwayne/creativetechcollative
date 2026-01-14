import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const config = {
  runtime: 'edge',
};

// Request schema for match review
const ReviewMatchRequest = z.object({
  matchId: z.string().uuid(),
  approved: z.boolean(),
  adminNotes: z.string().optional(),
});

// Response type for job match
interface JobMatchResponse {
  id: string;
  jobId: string;
  profileId: string;
  matchScore: number;
  matchReasoning: string;
  skillMatches: { skill: string; fromProfile: boolean; fromPortfolio: boolean }[] | null;
  vectorSimilarity: number | null;
  adminApproved: boolean | null;
  memberNotified: boolean;
  memberResponse: string | null;
  createdAt: string;
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
 * Get the webhook URL based on environment
 * Uses test endpoint in test mode, production endpoint otherwise
 */
function getWebhookUrl(): string {
  const isTest = process.env.VITE_TEST === 'TRUE';
  const baseUrl = isTest
    ? 'https://n8n.creativetechnologists.nl/webhook-test'
    : 'https://n8n.creativetechnologists.nl/webhook';
  return `${baseUrl}/match-approved`;
}

/**
 * Send notification to member when their match is approved
 */
async function notifyMemberOfMatch(
  matchId: string,
  memberName: string,
  memberEmail: string,
  jobTitle: string,
  companyName: string,
  matchReasoning: string
): Promise<void> {
  try {
    const webhookUrl = getWebhookUrl();
    const username = process.env.VITE_N8N_BASIC_AUTH_USERNAME;
    const password = process.env.VITE_N8N_BASIC_AUTH_PASSWORD;

    if (!username || !password) {
      console.warn('[REVIEW-MATCH] Webhook credentials not configured. Member notification not sent.');
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
        type: 'match_approved',
        matchId,
        member: {
          name: memberName,
          email: memberEmail,
        },
        job: {
          title: jobTitle,
        },
        company: {
          name: companyName,
        },
        matchReasoning,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(`[REVIEW-MATCH] Webhook returned status ${response.status}`);
    } else {
      console.log('[REVIEW-MATCH] Member notification sent successfully');
    }
  } catch (error) {
    console.error('[REVIEW-MATCH] Failed to send member notification:', error);
    // Don't throw - match review should succeed even if notification fails
  }
}

/**
 * Convert database row to response format
 */
function rowToJobMatch(row: Record<string, unknown>): JobMatchResponse {
  return {
    id: row.id as string,
    jobId: row.job_id as string,
    profileId: row.profile_id as string,
    matchScore: row.match_score as number,
    matchReasoning: row.match_reasoning as string,
    skillMatches: row.skill_matches as { skill: string; fromProfile: boolean; fromPortfolio: boolean }[] | null,
    vectorSimilarity: row.vector_similarity as number | null,
    adminApproved: row.admin_approved as boolean | null,
    memberNotified: row.member_notified as boolean,
    memberResponse: row.member_response as string | null,
    createdAt: row.created_at as string,
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
    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const { matchId, approved, adminNotes } = ReviewMatchRequest.parse(body);

    console.log(`[REVIEW-MATCH] Processing match review: ${matchId}, approved: ${approved}`);

    // Fetch the match to verify it exists and get related data
    const { data: match, error: matchError } = await supabase
      .from('job_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update the match with approval status
    const updateData: Record<string, unknown> = {
      admin_approved: approved,
    };

    // If admin notes provided, update them on the related job submission
    if (adminNotes !== undefined) {
      // Update admin_notes on the job_submissions table
      await supabase
        .from('job_submissions')
        .update({ admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .eq('id', match.job_id);
    }

    const { data: updatedMatch, error: updateError } = await supabase
      .from('job_matches')
      .update(updateData)
      .eq('id', matchId)
      .select()
      .single();

    if (updateError || !updatedMatch) {
      console.error('[REVIEW-MATCH] Failed to update match:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to update match',
          details: updateError?.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const matchResponse = rowToJobMatch(updatedMatch);
    console.log(`[REVIEW-MATCH] Match updated successfully: ${matchId}`);

    // If approved, optionally trigger member notification
    if (approved) {
      // Fetch profile and job details for notification
      const { data: profile } = await supabase
        .from('network_profiles')
        .select('full_name, email')
        .eq('id', match.profile_id)
        .single();

      const { data: job } = await supabase
        .from('job_submissions')
        .select('title, company_id')
        .eq('id', match.job_id)
        .single();

      if (profile && job) {
        // Fetch company name
        const { data: company } = await supabase
          .from('companies')
          .select('company_name')
          .eq('id', job.company_id)
          .single();

        if (company) {
          // Send notification (non-blocking)
          await notifyMemberOfMatch(
            matchId,
            profile.full_name,
            profile.email,
            job.title,
            company.company_name,
            match.match_reasoning
          );

          // Update member_notified flag
          await supabase
            .from('job_matches')
            .update({ member_notified: true })
            .eq('id', matchId);

          matchResponse.memberNotified = true;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        match: matchResponse,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[REVIEW-MATCH] Error:', error);

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

    return new Response(JSON.stringify({ error: 'Match review failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
