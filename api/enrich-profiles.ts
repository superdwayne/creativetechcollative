import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit, RateLimitError, rateLimitResponse, getClientIp } from './_lib/rate-limit.js';
import { isAdmin } from './_lib/admin.js';

export const config = {
  runtime: 'edge',
};

// Request schema for profile enrichment
const EnrichProfilesRequest = z.object({
  profileIds: z.array(z.string().uuid()).optional(),
});

// Response types
interface EnrichmentResult {
  profileId: string;
  success: boolean;
  error?: string;
}

interface EnrichmentProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  results: EnrichmentResult[];
}

// Maximum concurrent profile enrichments to avoid rate limits
const MAX_CONCURRENT = 10;

// Admin check imported from ./_lib/admin.ts

/**
 * Get profiles that need enrichment (no embedding or outdated)
 */
async function getProfilesToEnrich(
  supabase: ReturnType<typeof createClient>,
  profileIds?: string[]
): Promise<{ id: string; portfolioUrl: string | null; linkedinUrl: string | null; otherSocialLinks: string[] | null }[]> {
  let query = supabase
    .from('network_profiles')
    .select('id, portfolio_url, linkedin_url, other_social_links, embedding, embedding_updated_at, updated_at')
    .eq('approved', true);

  if (profileIds && profileIds.length > 0) {
    query = query.in('id', profileIds);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  // Filter profiles that need enrichment:
  // - No embedding, OR
  // - embedding_updated_at is older than updated_at (profile was modified after embedding was generated)
  return data
    .filter((profile) => {
      if (!profile.embedding) return true;
      if (!profile.embedding_updated_at) return true;
      if (profile.updated_at && new Date(profile.embedding_updated_at) < new Date(profile.updated_at)) {
        return true;
      }
      return false;
    })
    .map((profile) => ({
      id: profile.id,
      portfolioUrl: profile.portfolio_url,
      linkedinUrl: profile.linkedin_url,
      otherSocialLinks: profile.other_social_links,
    }));
}

/**
 * Enriches a single profile - fetches, scrapes, generates embedding, and saves
 * This is a simplified version that runs in the edge function context
 */
async function enrichSingleProfile(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  openaiApiKey: string
): Promise<EnrichmentResult> {
  try {
    // Fetch full profile
    const { data: profile, error: fetchError } = await supabase
      .from('network_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (fetchError || !profile) {
      return { profileId, success: false, error: 'Profile not found' };
    }

    // Build embedding text from profile data
    const embeddingParts: string[] = [];

    if (profile.full_name) {
      embeddingParts.push(`Name: ${profile.full_name}`);
    }
    if (profile.bio) {
      embeddingParts.push(`Bio: ${profile.bio}`);
    }
    if (profile.skills && profile.skills.length > 0) {
      embeddingParts.push(`Skills: ${profile.skills.join(', ')}`);
    }
    if (profile.focus_areas && profile.focus_areas.length > 0) {
      embeddingParts.push(`Focus Areas: ${profile.focus_areas.join(', ')}`);
    }
    if (profile.projects && profile.projects.length > 0) {
      const projectDescriptions = profile.projects
        .map((p: { title: string; description: string }) => `${p.title}: ${p.description}`)
        .join('; ');
      embeddingParts.push(`Projects: ${projectDescriptions}`);
    }
    if (profile.location) {
      embeddingParts.push(`Location: ${profile.location}`);
    }
    if (profile.enriched_content) {
      embeddingParts.push(`Portfolio Content: ${profile.enriched_content}`);
    }

    const embeddingText = embeddingParts.join('\n\n');

    if (!embeddingText.trim()) {
      return { profileId, success: false, error: 'No content to embed' };
    }

    // Generate embedding using OpenAI API
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: embeddingText,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.json().catch(() => ({}));
      return {
        profileId,
        success: false,
        error: `OpenAI API error: ${errorData.error?.message || embeddingResponse.statusText}`,
      };
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      return { profileId, success: false, error: 'Invalid embedding response from OpenAI' };
    }

    // Save embedding to database
    const embeddingString = `[${embedding.join(',')}]`;
    const { error: updateError } = await supabase
      .from('network_profiles')
      .update({
        embedding: embeddingString,
        embedding_updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (updateError) {
      return { profileId, success: false, error: `Database update failed: ${updateError.message}` };
    }

    return { profileId, success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { profileId, success: false, error: errorMessage };
  }
}

/**
 * Process profiles in batches with concurrency control
 */
async function processProfilesInBatches(
  supabase: ReturnType<typeof createClient>,
  profileIds: string[],
  openaiApiKey: string
): Promise<EnrichmentProgress> {
  const progress: EnrichmentProgress = {
    total: profileIds.length,
    processed: 0,
    successful: 0,
    failed: 0,
    results: [],
  };

  // Process in batches of MAX_CONCURRENT
  for (let i = 0; i < profileIds.length; i += MAX_CONCURRENT) {
    const batch = profileIds.slice(i, i + MAX_CONCURRENT);

    // Process batch concurrently
    const batchResults = await Promise.all(
      batch.map((profileId) => enrichSingleProfile(supabase, profileId, openaiApiKey))
    );

    // Update progress
    for (const result of batchResults) {
      progress.processed++;
      if (result.success) {
        progress.successful++;
      } else {
        progress.failed++;
      }
      progress.results.push(result);
    }

    // Add small delay between batches to avoid rate limiting
    if (i + MAX_CONCURRENT < profileIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return progress;
}

export default async function handler(req: Request) {
  // Rate limit: 5 requests per minute per IP (batch OpenAI calls)
  try {
    checkRateLimit(`enrich:${getClientIp(req)}`, 5, 60_000);
  } catch (err) {
    if (err instanceof RateLimitError) return rateLimitResponse(err);
    throw err;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for required environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!openaiApiKey) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create Supabase client with service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify admin authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accessToken = authHeader.replace('Bearer ', '');

  // Verify the token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if user is admin
  if (!(await isAdmin(user.id, supabase))) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const { profileIds } = EnrichProfilesRequest.parse(body);

    console.log(`[ENRICH-PROFILES] Starting enrichment. Requested profile IDs: ${profileIds?.length || 'all'}`);

    // Get profiles that need enrichment
    const profilesToEnrich = await getProfilesToEnrich(supabase, profileIds);

    if (profilesToEnrich.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No profiles need enrichment',
          total: 0,
          processed: 0,
          successful: 0,
          failed: 0,
          results: [],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[ENRICH-PROFILES] Found ${profilesToEnrich.length} profiles to enrich`);

    // Process profiles in batches
    const profileIdsToProcess = profilesToEnrich.map((p) => p.id);
    const progress = await processProfilesInBatches(supabase, profileIdsToProcess, openaiApiKey);

    console.log(
      `[ENRICH-PROFILES] Completed. Processed: ${progress.processed}, ` +
        `Successful: ${progress.successful}, Failed: ${progress.failed}`
    );

    return new Response(JSON.stringify(progress), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ENRICH-PROFILES] Error:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data', details: error.issues }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Profile enrichment failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
