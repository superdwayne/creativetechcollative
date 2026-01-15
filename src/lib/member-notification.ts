/**
 * Member match notification utility
 *
 * Handles notifying members when they've been matched to a job opportunity.
 * Sends webhook to n8n and updates the member_notified flag.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Result of a notification attempt
 */
export interface NotificationResult {
  success: boolean;
  matchId: string;
  memberNotified: boolean;
  error?: string;
}

/**
 * Match details for notification
 */
interface MatchDetails {
  id: string;
  jobId: string;
  profileId: string;
  matchReasoning: string;
  matchScore: number;
}

/**
 * Profile details for notification
 */
interface ProfileDetails {
  fullName: string;
  email: string;
}

/**
 * Job details for notification
 */
interface JobDetails {
  title: string;
  companyId: string;
}

/**
 * Company details for notification
 */
interface CompanyDetails {
  companyName: string;
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
 * Send the webhook notification to n8n
 */
async function sendWebhookNotification(
  matchId: string,
  memberName: string,
  memberEmail: string,
  jobTitle: string,
  companyName: string,
  matchReasoning: string,
  matchScore: number
): Promise<boolean> {
  const webhookUrl = getWebhookUrl();
  const username = process.env.VITE_N8N_BASIC_AUTH_USERNAME;
  const password = process.env.VITE_N8N_BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    console.warn('[MEMBER-NOTIFICATION] Webhook credentials not configured');
    return false;
  }

  const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

  // Get the base URL for the dashboard link
  const baseUrl = process.env.VITE_BASE_URL || 'https://creativetechnologists.nl';
  const dashboardLink = `${baseUrl}/network/dashboard`;

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
      matchScore,
      matchReasoning,
      dashboardLink,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    console.warn(`[MEMBER-NOTIFICATION] Webhook returned status ${response.status}`);
    return false;
  }

  return true;
}

/**
 * Fetch match details from the database
 */
async function fetchMatchDetails(
  supabase: SupabaseClient,
  matchId: string
): Promise<MatchDetails | null> {
  const { data, error } = await supabase
    .from('job_matches')
    .select('id, job_id, profile_id, match_reasoning, match_score')
    .eq('id', matchId)
    .single();

  if (error || !data) {
    console.error('[MEMBER-NOTIFICATION] Failed to fetch match:', error);
    return null;
  }

  return {
    id: data.id,
    jobId: data.job_id,
    profileId: data.profile_id,
    matchReasoning: data.match_reasoning,
    matchScore: data.match_score,
  };
}

/**
 * Fetch profile details from the database
 */
async function fetchProfileDetails(
  supabase: SupabaseClient,
  profileId: string
): Promise<ProfileDetails | null> {
  const { data, error } = await supabase
    .from('network_profiles')
    .select('full_name, email')
    .eq('id', profileId)
    .single();

  if (error || !data) {
    console.error('[MEMBER-NOTIFICATION] Failed to fetch profile:', error);
    return null;
  }

  return {
    fullName: data.full_name,
    email: data.email,
  };
}

/**
 * Fetch job details from the database
 */
async function fetchJobDetails(
  supabase: SupabaseClient,
  jobId: string
): Promise<JobDetails | null> {
  const { data, error } = await supabase
    .from('job_submissions')
    .select('title, company_id')
    .eq('id', jobId)
    .single();

  if (error || !data) {
    console.error('[MEMBER-NOTIFICATION] Failed to fetch job:', error);
    return null;
  }

  return {
    title: data.title,
    companyId: data.company_id,
  };
}

/**
 * Fetch company details from the database
 */
async function fetchCompanyDetails(
  supabase: SupabaseClient,
  companyId: string
): Promise<CompanyDetails | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('company_name')
    .eq('id', companyId)
    .single();

  if (error || !data) {
    console.error('[MEMBER-NOTIFICATION] Failed to fetch company:', error);
    return null;
  }

  return {
    companyName: data.company_name,
  };
}

/**
 * Update the member_notified flag on the match record
 */
async function updateMemberNotifiedFlag(
  supabase: SupabaseClient,
  matchId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('job_matches')
    .update({ member_notified: true })
    .eq('id', matchId);

  if (error) {
    console.error('[MEMBER-NOTIFICATION] Failed to update member_notified flag:', error);
    return false;
  }

  return true;
}

/**
 * Notify a member that they've been matched to a job opportunity.
 *
 * This function:
 * 1. Fetches match, job, and profile details from the database
 * 2. Sends a webhook notification to n8n with match details
 * 3. Updates the member_notified flag on the match record
 *
 * @param matchId - The ID of the job match to notify about
 * @param supabaseClient - Optional Supabase client (creates one with service role key if not provided)
 * @returns NotificationResult with success status and any error details
 */
export async function notifyMemberOfMatch(
  matchId: string,
  supabaseClient?: SupabaseClient
): Promise<NotificationResult> {
  console.log(`[MEMBER-NOTIFICATION] Starting notification for match: ${matchId}`);

  // Create Supabase client if not provided
  let supabase: SupabaseClient;
  if (supabaseClient) {
    supabase = supabaseClient;
  } else {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        success: false,
        matchId,
        memberNotified: false,
        error: 'Supabase not configured',
      };
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  try {
    // Step 1: Fetch match details
    const match = await fetchMatchDetails(supabase, matchId);
    if (!match) {
      return {
        success: false,
        matchId,
        memberNotified: false,
        error: 'Match not found',
      };
    }

    // Step 2: Fetch profile details
    const profile = await fetchProfileDetails(supabase, match.profileId);
    if (!profile) {
      return {
        success: false,
        matchId,
        memberNotified: false,
        error: 'Profile not found',
      };
    }

    // Step 3: Fetch job details
    const job = await fetchJobDetails(supabase, match.jobId);
    if (!job) {
      return {
        success: false,
        matchId,
        memberNotified: false,
        error: 'Job not found',
      };
    }

    // Step 4: Fetch company details
    const company = await fetchCompanyDetails(supabase, job.companyId);
    if (!company) {
      return {
        success: false,
        matchId,
        memberNotified: false,
        error: 'Company not found',
      };
    }

    // Step 5: Send webhook notification
    console.log(`[MEMBER-NOTIFICATION] Sending notification to ${profile.email} for job "${job.title}"`);
    const webhookSent = await sendWebhookNotification(
      matchId,
      profile.fullName,
      profile.email,
      job.title,
      company.companyName,
      match.matchReasoning,
      match.matchScore
    );

    if (!webhookSent) {
      return {
        success: false,
        matchId,
        memberNotified: false,
        error: 'Failed to send webhook notification',
      };
    }

    // Step 6: Update member_notified flag
    const flagUpdated = await updateMemberNotifiedFlag(supabase, matchId);
    if (!flagUpdated) {
      // Notification was sent but flag wasn't updated
      console.warn('[MEMBER-NOTIFICATION] Webhook sent but failed to update member_notified flag');
      return {
        success: true,
        matchId,
        memberNotified: true,
        error: 'Notification sent but failed to update database flag',
      };
    }

    console.log(`[MEMBER-NOTIFICATION] Successfully notified member for match: ${matchId}`);
    return {
      success: true,
      matchId,
      memberNotified: true,
    };
  } catch (error) {
    console.error('[MEMBER-NOTIFICATION] Unexpected error:', error);
    return {
      success: false,
      matchId,
      memberNotified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
