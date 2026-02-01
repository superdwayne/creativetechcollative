import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
  maxDuration: 300, // 5 minutes for batch processing
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    return new Response(JSON.stringify({ error: 'Missing configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check if force regeneration is requested
    const url = new URL(req.url);
    const forceRegenerate = url.searchParams.get('force') === 'true';
    const profileId = url.searchParams.get('profileId'); // Optional: regenerate specific profile

    // Get profiles to process
    let query = supabase
      .from('network_profiles')
      .select('id, full_name, location, bio, focus_areas, skills, projects, enriched_content');

    if (profileId) {
      // Regenerate specific profile
      query = query.eq('id', profileId);
    } else if (!forceRegenerate) {
      // Only profiles without embeddings
      query = query.is('embedding', null);
    }

    const { data: profiles, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: forceRegenerate ? 'No profiles found' : 'All profiles already have embeddings',
        processed: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[EMBEDDINGS] Processing ${profiles.length} profiles (force=${forceRegenerate})...`);

    let processed = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        // Build embedding text - include ALL profile data
        const parts: string[] = [];
        parts.push(`Name: ${profile.full_name}`);
        if (profile.location) parts.push(`Location: ${profile.location}`);
        if (profile.bio) parts.push(`Bio: ${profile.bio}`);
        if (profile.focus_areas?.length) parts.push(`Focus Areas: ${profile.focus_areas.join(', ')}`);
        if (profile.skills?.length) parts.push(`Skills: ${profile.skills.join(', ')}`);

        // Include projects with full details
        if (profile.projects?.length) {
          const projectText = profile.projects
            .map((p: any) => {
              const parts = [p.title];
              if (p.description) parts.push(p.description);
              if (p.tools?.length) parts.push(`Tools: ${p.tools.join(', ')}`);
              return parts.join(' - ');
            })
            .filter(Boolean)
            .join(' | ');
          if (projectText) parts.push(`Projects: ${projectText}`);
        }

        // Include enriched content from web search
        if (profile.enriched_content) {
          try {
            const enriched = typeof profile.enriched_content === 'string'
              ? JSON.parse(profile.enriched_content)
              : profile.enriched_content;

            if (enriched.summary) parts.push(`Summary: ${enriched.summary}`);
            if (enriched.workHistory?.length) {
              const workText = enriched.workHistory
                .map((w: any) => `${w.role} at ${w.company}${w.description ? ': ' + w.description : ''}`)
                .join(' | ');
              parts.push(`Work History: ${workText}`);
            }
            if (enriched.additionalSkills?.length) {
              parts.push(`Additional Skills: ${enriched.additionalSkills.join(', ')}`);
            }
            if (enriched.notableProjects?.length) {
              parts.push(`Notable Projects: ${enriched.notableProjects.join(', ')}`);
            }
          } catch {
            // If enriched_content is plain text, include it directly
            if (typeof profile.enriched_content === 'string') {
              parts.push(`Additional Info: ${profile.enriched_content}`);
            }
          }
        }

        const text = parts.join('\n\n');

        console.log(`[EMBEDDINGS] ${profile.full_name}: ${text.length} chars of content`);

        if (text.trim().length < 10) {
          errors.push(`${profile.full_name}: Not enough content`);
          continue;
        }

        // Generate embedding via OpenAI
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text,
          }),
        });

        if (!embeddingResponse.ok) {
          const err = await embeddingResponse.json().catch(() => ({}));
          errors.push(`${profile.full_name}: OpenAI error - ${err.error?.message || 'Unknown'}`);
          continue;
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data?.[0]?.embedding;

        if (!embedding) {
          errors.push(`${profile.full_name}: No embedding returned`);
          continue;
        }

        // Update profile with embedding
        const { error: updateError } = await supabase
          .from('network_profiles')
          .update({
            embedding: `[${embedding.join(',')}]`,
            embedding_updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (updateError) {
          errors.push(`${profile.full_name}: DB update failed - ${updateError.message}`);
          continue;
        }

        processed++;
        console.log(`[EMBEDDINGS] Processed: ${profile.full_name}`);

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 200));

      } catch (err) {
        errors.push(`${profile.full_name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Generated embeddings for ${processed} profiles`,
      processed,
      total: profiles.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[EMBEDDINGS] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate embeddings',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
