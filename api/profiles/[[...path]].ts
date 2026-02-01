import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { newProfilePendingAdminEmail, EMAIL_FROM_DOMAIN, PUBLIC_URL } from '../lib/email-templates';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // Allow time for AI processing and browser automation
};

// ============================================================================
// HELPERS
// ============================================================================

function getPathSegments(req: Request): string[] {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/profiles/', '').replace(/^\/+|\/+$/g, '');
  return path ? path.split('/') : [];
}

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function authenticateUser(
  req: Request,
  supabase: SupabaseClient
): Promise<{ user: any; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Authentication required' };
  }

  const accessToken = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return { user: null, error: 'Invalid authentication token' };
  }

  return { user };
}

// ============================================================================
// ENRICH PROFILE HANDLER
// ============================================================================

async function handleEnrichProfile(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return jsonResponse({ error: 'OpenAI API key not configured' }, 500);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { profileId } = body;

    if (!profileId) {
      return jsonResponse({ error: 'profileId is required' }, 400);
    }

    const { data: profile, error: fetchError } = await supabase
      .from('network_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (fetchError || !profile) {
      return jsonResponse({ error: 'Profile not found' }, 404);
    }

    if (profile.user_id !== user.id) {
      return jsonResponse({ error: 'Not authorized to enrich this profile' }, 403);
    }

    // Build embedding text from profile data
    const embeddingParts: string[] = [];
    if (profile.full_name) embeddingParts.push(`Name: ${profile.full_name}`);
    if (profile.bio) embeddingParts.push(`Bio: ${profile.bio}`);
    if (profile.skills?.length) embeddingParts.push(`Skills: ${profile.skills.join(', ')}`);
    if (profile.focus_areas?.length) embeddingParts.push(`Focus Areas: ${profile.focus_areas.join(', ')}`);
    if (profile.projects?.length) {
      const projectDescriptions = profile.projects
        .map((p: { title: string; description: string }) => `${p.title}: ${p.description}`)
        .join('; ');
      embeddingParts.push(`Projects: ${projectDescriptions}`);
    }
    if (profile.location) embeddingParts.push(`Location: ${profile.location}`);
    if (profile.enriched_content) embeddingParts.push(`Portfolio Content: ${profile.enriched_content}`);

    const embeddingText = embeddingParts.join('\n\n');

    if (!embeddingText.trim()) {
      return jsonResponse({ error: 'No content to embed' }, 400);
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
      return jsonResponse({
        error: 'Failed to generate AI embedding',
        details: errorData.error?.message || embeddingResponse.statusText
      }, 500);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      return jsonResponse({ error: 'Invalid embedding response from OpenAI' }, 500);
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
      return jsonResponse({ error: 'Failed to save embedding', details: updateError.message }, 500);
    }

    return jsonResponse({
      success: true,
      profileId,
      message: 'Profile enriched successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: 'Invalid request data', details: error.issues }, 400);
    }
    return jsonResponse({ error: 'Profile enrichment failed' }, 500);
  }
}

// ============================================================================
// UPDATE PROFILE ENRICHMENT HANDLER
// ============================================================================

async function handleUpdateEnrichment(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const { profileId, updates } = body;

    if (!profileId) {
      return jsonResponse({ error: 'profileId is required' }, 400);
    }

    const { data: profile, error: fetchError } = await supabase
      .from('network_profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (fetchError || !profile) {
      return jsonResponse({ error: 'Profile not found' }, 404);
    }

    if (profile.user_id !== user.id) {
      return jsonResponse({ error: 'Not authorized to update this profile' }, 403);
    }

    const allowedFields = ['skills', 'projects', 'bio', 'enriched_content'];
    const sanitizedUpdates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return jsonResponse({ error: 'No valid updates provided' }, 400);
    }

    const { error: updateError } = await supabase
      .from('network_profiles')
      .update(sanitizedUpdates)
      .eq('id', profileId);

    if (updateError) {
      return jsonResponse({ error: 'Failed to update profile' }, 500);
    }

    // Regenerate embedding with updated profile data
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      try {
        const { data: updatedProfile } = await supabase
          .from('network_profiles')
          .select('id, full_name, location, bio, focus_areas, skills, projects, enriched_content')
          .eq('id', profileId)
          .single();

        if (updatedProfile) {
          const parts: string[] = [];
          parts.push(`Name: ${updatedProfile.full_name}`);
          if (updatedProfile.location) parts.push(`Location: ${updatedProfile.location}`);
          if (updatedProfile.bio) parts.push(`Bio: ${updatedProfile.bio}`);
          if (updatedProfile.focus_areas?.length) parts.push(`Focus Areas: ${updatedProfile.focus_areas.join(', ')}`);
          if (updatedProfile.skills?.length) parts.push(`Skills: ${updatedProfile.skills.join(', ')}`);

          if (updatedProfile.projects?.length) {
            const projectText = updatedProfile.projects
              .map((p: any) => {
                const projectParts = [p.title];
                if (p.description) projectParts.push(p.description);
                if (p.tools?.length) projectParts.push(`Tools: ${p.tools.join(', ')}`);
                return projectParts.join(' - ');
              })
              .filter(Boolean)
              .join(' | ');
            if (projectText) parts.push(`Projects: ${projectText}`);
          }

          const text = parts.join('\n\n');

          if (text.trim().length >= 10) {
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

            if (embeddingResponse.ok) {
              const embeddingData = await embeddingResponse.json();
              const embedding = embeddingData.data?.[0]?.embedding;

              if (embedding) {
                await supabase
                  .from('network_profiles')
                  .update({
                    embedding: `[${embedding.join(',')}]`,
                    embedding_updated_at: new Date().toISOString()
                  })
                  .eq('id', profileId);
              }
            }
          }
        }
      } catch (embeddingError) {
        console.error('[UPDATE-ENRICHMENT] Embedding generation error:', embeddingError);
      }
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Update failed',
    }, 500);
  }
}

// ============================================================================
// NOTIFY PROFILE CREATED HANDLER
// ============================================================================

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || `admin@${EMAIL_FROM_DOMAIN}`;

async function handleNotifyProfileCreated(
  req: Request,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const { profileId, profileName, profileEmail, profileSlug, profileLocation, profileBio, focusAreas } = body;

    if (!profileId || !profileName || !profileEmail || !profileSlug) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    const { data: profile, error: profileError } = await supabase
      .from('network_profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return jsonResponse({ error: 'Profile not found' }, 404);
    }

    if (profile.user_id !== user.id) {
      return jsonResponse({ error: 'You can only notify for your own profile' }, 403);
    }

    // Send admin notification
    const resendApiKey = process.env.RESEND_API_KEY;
    let sent = false;

    if (resendApiKey) {
      try {
        const htmlContent = newProfilePendingAdminEmail({
          profileName,
          profileEmail,
          profileLocation,
          profileBio,
          focusAreas,
          profileUrl: `${PUBLIC_URL}/directory/profile/${profileSlug}`,
          adminDashboardUrl: `${PUBLIC_URL}/admin`,
        });

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `Creative Technology Collective <noreply@${EMAIL_FROM_DOMAIN}>`,
            to: [ADMIN_NOTIFICATION_EMAIL],
            subject: `New Profile Pending Approval: ${profileName}`,
            html: htmlContent,
          }),
        });

        sent = response.ok;
      } catch (error) {
        console.error('[NOTIFY-PROFILE-CREATED] Email error:', error);
      }
    }

    return jsonResponse({
      success: true,
      notificationSent: sent,
      message: sent
        ? 'Admin has been notified about your new profile'
        : 'Profile created but admin notification could not be sent',
    });
  } catch (error) {
    return jsonResponse({ error: 'Failed to send notification' }, 500);
  }
}

// ============================================================================
// ENRICH BY NAME HANDLER (Web Search)
// ============================================================================

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function searchWithJina(query: string): Promise<WebSearchResult[]> {
  try {
    const jinaSearchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
    const response = await fetch(jinaSearchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ProfileEnricher/1.0)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return [];

    const text = await response.text();
    const results: WebSearchResult[] = [];
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(text)) !== null && results.length < 10) {
      const title = match[1];
      const url = match[2];
      const snippetStart = match.index + match[0].length;
      const nextLinkMatch = text.substring(snippetStart).search(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
      const snippetEnd = nextLinkMatch > 0 ? snippetStart + nextLinkMatch : snippetStart + 500;
      const snippet = text.substring(snippetStart, Math.min(snippetEnd, snippetStart + 300)).trim();

      if (url && title && !url.includes('jina.ai')) {
        results.push({ title, url, snippet });
      }
    }

    return results;
  } catch {
    return [];
  }
}

async function fetchUrlWithJina(url: string): Promise<string> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (compatible; ProfileEnricher/1.0)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return '';
    const text = await response.text();
    return text.substring(0, 12000);
  } catch {
    return '';
  }
}

async function handleEnrichByName(req: Request) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    return jsonResponse({ error: 'AI service not configured' }, 500);
  }

  try {
    const body = await req.json();
    const { fullName, currentSkills = [], currentBio = '', linkedinUrl = '', portfolioUrl = '' } = body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return jsonResponse({ error: 'Full name is required' }, 400);
    }

    const name = fullName.trim();
    const directContents: { url: string; content: string }[] = [];
    const allResults: WebSearchResult[] = [];

    // Fetch from provided URLs
    if (portfolioUrl?.trim()) {
      const content = await fetchUrlWithJina(portfolioUrl);
      if (content.length > 100) {
        directContents.push({ url: portfolioUrl, content });
        allResults.push({ url: portfolioUrl, title: `${name}'s Portfolio`, snippet: 'Provided portfolio URL' });
      }
    }

    if (linkedinUrl?.trim()) {
      const content = await fetchUrlWithJina(linkedinUrl);
      if (content.length > 100) {
        directContents.push({ url: linkedinUrl, content });
        allResults.push({ url: linkedinUrl, title: `${name}'s LinkedIn`, snippet: 'Provided LinkedIn profile' });
      }
    }

    // Web search
    const queries = [`"${name}" portfolio`, `"${name}" creative technologist`];
    for (const query of queries) {
      const results = await searchWithJina(query);
      if (results.length > 0) {
        allResults.push(...results);
        if (results.length >= 3) break;
      }
    }

    const uniqueResults = allResults.filter(
      (r, i, arr) => r.url && arr.findIndex(x => x.url === r.url) === i
    ).slice(0, 10);

    if (directContents.length === 0 && uniqueResults.length === 0) {
      return jsonResponse({
        success: true,
        discoveredProjects: [],
        additionalSkills: [],
        workHistory: [],
        enrichedBio: '',
        summary: '',
        note: 'No web results found for this name.',
      });
    }

    // Fetch more content if needed
    if (directContents.length < 3) {
      const resultsToFetch = uniqueResults
        .filter(r => !directContents.find(d => d.url === r.url))
        .slice(0, 5 - directContents.length);
      
      for (const result of resultsToFetch) {
        const content = await fetchUrlWithJina(result.url);
        if (content.length > 200) {
          directContents.push({ url: result.url, content });
        }
      }
    }

    // Analyze with AI
    const prompt = `You are analyzing web search results to help auto-fill a creative technologist's profile.

Profile Name: ${name}
Current Bio: ${currentBio || 'Not provided'}
Current Skills: ${currentSkills.join(', ') || 'None listed'}

Search Results:
${uniqueResults.map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet}`).join('\n\n')}

Page Contents:
${directContents.map((c, i) => `--- Page ${i + 1} ---\n${c.content.substring(0, 2500)}`).join('\n\n')}

Extract:
1. PROJECTS: All projects with title, description, url, client, technologies
2. WORK HISTORY: Companies, roles, duration, description
3. ADDITIONAL SKILLS: Technical skills not already listed
4. ENRICHED BIO: Professional bio (3-4 sentences)
5. SUMMARY: Overview of their background

Respond in JSON:
{
  "projects": [{"title": "", "description": "", "url": "", "client": "", "technologies": []}],
  "workHistory": [{"company": "", "role": "", "duration": "", "description": ""}],
  "additionalSkills": [],
  "enrichedBio": "",
  "summary": ""
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return jsonResponse({
      success: true,
      discoveredProjects: analysis.projects || [],
      additionalSkills: analysis.additionalSkills || [],
      workHistory: analysis.workHistory || [],
      enrichedBio: analysis.enrichedBio || '',
      summary: analysis.summary || '',
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Enrichment failed',
    }, 500);
  }
}

// ============================================================================
// SEARCH PERSON HANDLER (Browser Automation)
// ============================================================================

const ExtractContentRequest = z.object({
  urls: z.array(z.string().url()).min(1).max(5),
  analyze: z.boolean().optional().default(false),
  personName: z.string().optional(),
  currentSkills: z.array(z.string()).optional(),
});

async function handleSearchPerson(req: Request) {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (process.env.USE_AGENT_BROWSER !== 'true') {
    return jsonResponse({
      error: 'Agent-browser is not enabled',
      hint: 'Set USE_AGENT_BROWSER=true in your environment',
    }, 400);
  }

  try {
    const body = await req.json();
    const input = ExtractContentRequest.parse(body);

    const { extractFromMultipleUrls } = await import('../lib/agent-browser-search.js');
    const extractedContent = await extractFromMultipleUrls(input.urls, { timeout: 25000 });

    let analysis = null;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (input.analyze && anthropicApiKey && extractedContent.length > 0) {
      try {
        const prompt = `Analyze the following web content to extract professional information about "${input.personName || 'Unknown'}".

Current known skills: ${input.currentSkills?.join(', ') || 'None listed'}

Web Content Found:
${extractedContent.map((c: any, i: number) => `--- Source ${i + 1}: ${c.url} ---\nTitle: ${c.title}\n${c.content.substring(0, 4000)}`).join('\n')}

Extract projects, skills, work history, bio, and summary. Respond in valid JSON.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 3000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.content?.[0]?.text || '{}';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (error) {
        console.error('[SEARCH-PERSON] AI analysis failed:', error);
      }
    }

    return jsonResponse({
      success: true,
      extracted: extractedContent.map((c: any) => ({
        url: c.url,
        title: c.title,
        contentLength: c.content.length,
        contentPreview: c.content.substring(0, 1000),
        linksCount: c.links?.length || 0,
        hasStructuredData: !!c.structuredData,
      })),
      fullContent: extractedContent.map((c: any) => ({
        url: c.url,
        content: c.content,
      })),
      analysis,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ success: false, error: 'Invalid request', details: error.issues }, 400);
    }
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Extraction failed',
    }, 500);
  }
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

export default async function handler(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: 'Supabase not configured' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const pathSegments = getPathSegments(req);
  const route = pathSegments.join('/');

  console.log(`[PROFILES] Route: ${route}, Method: ${req.method}`);

  // Routes that don't require auth
  if (route === 'enrich-by-name') {
    return handleEnrichByName(req);
  }

  if (route === 'search-person') {
    return handleSearchPerson(req);
  }

  // All other routes require authentication
  const { user, error: authError } = await authenticateUser(req, supabase);
  if (authError) {
    return jsonResponse({ error: authError }, 401);
  }

  try {
    switch (route) {
      case 'enrich':
        return handleEnrichProfile(req, supabase, user);
      case 'update-enrichment':
        return handleUpdateEnrichment(req, supabase, user);
      case 'notify-created':
        return handleNotifyProfileCreated(req, supabase, user);
      default:
        console.warn(`[PROFILES] Unknown route: ${route}`);
        return jsonResponse({ error: `Route not found: /api/profiles/${route}` }, 404);
    }
  } catch (error) {
    console.error('[PROFILES] Error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
