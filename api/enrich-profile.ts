import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const config = {
  runtime: 'edge',
};

// Request schema for single profile enrichment
const EnrichProfileRequest = z.object({
  profileId: z.string().uuid(),
});

/**
 * Enriches a single profile - generates embedding from profile data
 * This endpoint is called after profile creation to generate AI embeddings
 */
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

  // Create Supabase client with service role key for database operations
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
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const { profileId } = EnrichProfileRequest.parse(body);

    console.log(`[ENRICH-PROFILE] Starting enrichment for profile: ${profileId}`);

    // Fetch full profile
    const { data: profile, error: fetchError } = await supabase
      .from('network_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (fetchError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify the user owns this profile
    if (profile.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not authorized to enrich this profile' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: 'No content to embed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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
      console.error('[ENRICH-PROFILE] OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({
          error: 'Failed to generate AI embedding',
          details: errorData.error?.message || embeddingResponse.statusText
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      return new Response(JSON.stringify({ error: 'Invalid embedding response from OpenAI' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
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
      console.error('[ENRICH-PROFILE] Database update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save embedding', details: updateError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[ENRICH-PROFILE] Successfully enriched profile: ${profileId}`);

    return new Response(
      JSON.stringify({
        success: true,
        profileId,
        message: 'Profile enriched successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ENRICH-PROFILE] Error:', error);

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
