import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { newProfilePendingAdminEmail, EMAIL_FROM_DOMAIN, PUBLIC_URL } from '../_lib/email-templates.js';

// ============================================================================
// HELPERS
// ============================================================================

function getRoute(req: VercelRequest): string {
  // Try query.path first (Vercel catch-all), fallback to URL parsing
  let pathSegments = (req.query.path as string[]) || [];

  if (pathSegments.length === 0 && req.url) {
    const urlPath = req.url.split('?')[0];
    const match = urlPath.match(/\/api\/profiles\/(.+)/);
    if (match && match[1]) {
      pathSegments = match[1].split('/');
    }
  }

  return pathSegments.join('/');
}

async function authenticateUser(
  req: VercelRequest,
  supabase: SupabaseClient
): Promise<{ user: any; error?: string }> {
  const authHeader = req.headers.authorization;
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
// ENRICH PROFILE HANDLER (generate embedding)
// ============================================================================

async function handleEnrichProfile(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { profileId } = req.body || {};

    if (!profileId) {
      return res.status(400).json({ error: 'profileId is required' });
    }

    const { data: profile, error: fetchError } = await supabase
      .from('network_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (fetchError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.user_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized to enrich this profile' });
    }

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
      return res.status(400).json({ error: 'No content to embed' });
    }

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
      return res.status(500).json({
        error: 'Failed to generate AI embedding',
        details: errorData.error?.message || embeddingResponse.statusText,
      });
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      return res.status(500).json({ error: 'Invalid embedding response from OpenAI' });
    }

    const embeddingString = `[${embedding.join(',')}]`;
    const { error: updateError } = await supabase
      .from('network_profiles')
      .update({
        embedding: embeddingString,
        embedding_updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to save embedding', details: updateError.message });
    }

    return res.status(200).json({
      success: true,
      profileId,
      message: 'Profile enriched successfully',
    });
  } catch (error) {
    console.error('[ENRICH] Error:', error);
    return res.status(500).json({ error: 'Profile enrichment failed' });
  }
}

// ============================================================================
// UPDATE PROFILE ENRICHMENT HANDLER (apply AI suggestions)
// ============================================================================

async function handleUpdateEnrichment(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profileId, updates } = req.body || {};

    if (!profileId) {
      return res.status(400).json({ error: 'profileId is required' });
    }

    const { data: profile, error: fetchError } = await supabase
      .from('network_profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (fetchError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.user_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    const allowedFields = ['skills', 'projects', 'bio', 'enriched_content'];
    const sanitizedUpdates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (updates?.[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    const { error: updateError } = await supabase
      .from('network_profiles')
      .update(sanitizedUpdates)
      .eq('id', profileId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // Embedding regeneration is handled separately by the client
    // calling /api/generate-embeddings after this returns
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[UPDATE-ENRICHMENT] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Update failed',
    });
  }
}

// ============================================================================
// NOTIFY PROFILE CREATED HANDLER
// ============================================================================

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || `admin@${EMAIL_FROM_DOMAIN}`;

async function handleNotifyProfileCreated(
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  user: any
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profileId, profileName, profileEmail, profileSlug, profileLocation, profileBio, focusAreas } = req.body || {};

    if (!profileId || !profileName || !profileEmail || !profileSlug) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('network_profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.user_id !== user.id) {
      return res.status(403).json({ error: 'You can only notify for your own profile' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    let sent = false;

    console.log(`[NOTIFY-PROFILE-CREATED] Config check:`, {
      hasResendKey: !!resendApiKey,
      resendKeyPrefix: resendApiKey ? resendApiKey.substring(0, 8) + '...' : 'MISSING',
      adminEmail: ADMIN_NOTIFICATION_EMAIL,
      fromDomain: EMAIL_FROM_DOMAIN,
      publicUrl: PUBLIC_URL,
    });

    if (!resendApiKey) {
      console.error('[NOTIFY-PROFILE-CREATED] RESEND_API_KEY is not set — cannot send email');
    } else {
      try {
        const fromAddress = `Creative Technology Collective <noreply@${EMAIL_FROM_DOMAIN}>`;
        const subject = `New Profile Pending Approval: ${profileName}`;

        console.log(`[NOTIFY-PROFILE-CREATED] Sending email:`, {
          from: fromAddress,
          to: ADMIN_NOTIFICATION_EMAIL,
          subject,
        });

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
            from: fromAddress,
            to: [ADMIN_NOTIFICATION_EMAIL],
            subject,
            html: htmlContent,
          }),
        });

        const responseBody = await response.json().catch(() => ({}));

        if (response.ok) {
          sent = true;
          console.log(`[NOTIFY-PROFILE-CREATED] Email sent successfully:`, responseBody);
        } else {
          console.error(`[NOTIFY-PROFILE-CREATED] Resend API error ${response.status}:`, responseBody);
        }
      } catch (error) {
        console.error('[NOTIFY-PROFILE-CREATED] Email send exception:', error);
      }
    }

    return res.status(200).json({
      success: true,
      notificationSent: sent,
      message: sent
        ? 'Admin has been notified about your new profile'
        : 'Profile created but admin notification could not be sent',
    });
  } catch (error) {
    console.error('[NOTIFY-CREATED] Error:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
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
  const jinaApiKey = process.env.JINA_API_KEY;

  try {
    const jinaSearchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; ProfileEnricher/1.0)',
    };
    if (jinaApiKey) {
      headers['Authorization'] = `Bearer ${jinaApiKey}`;
    }

    const response = await fetch(jinaSearchUrl, {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.log(`[profiles/search] Jina returned ${response.status}, trying DuckDuckGo`);
      return searchWithDuckDuckGoFallback(query);
    }

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

    if (results.length === 0) {
      return searchWithDuckDuckGoFallback(query);
    }

    return results;
  } catch {
    return searchWithDuckDuckGoFallback(query);
  }
}

async function searchWithDuckDuckGoFallback(query: string): Promise<WebSearchResult[]> {
  try {
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) return [];

    const html = await response.text();
    const results: WebSearchResult[] = [];

    const hrefPattern = /class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)</g;
    const snippetPattern = /class="result__snippet"[^>]*>([^<]*)</g;

    const snippets: string[] = [];
    let match;
    while ((match = snippetPattern.exec(html)) !== null) {
      snippets.push(match[1].trim());
    }

    let snippetIndex = 0;
    while ((match = hrefPattern.exec(html)) !== null && results.length < 8) {
      let url = match[1];
      const title = match[2].trim();
      if (!url || url.includes('duckduckgo.com') || !title) continue;
      if (url.startsWith('//')) url = 'https:' + url;

      results.push({ url, title, snippet: snippets[snippetIndex] || '' });
      snippetIndex++;
    }

    return results;
  } catch {
    return [];
  }
}

async function fetchUrlWithJina(url: string): Promise<string> {
  const jinaApiKey = process.env.JINA_API_KEY;

  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const headers: Record<string, string> = {
      Accept: 'text/plain',
      'User-Agent': 'Mozilla/5.0 (compatible; ProfileEnricher/1.0)',
    };
    if (jinaApiKey) {
      headers['Authorization'] = `Bearer ${jinaApiKey}`;
    }

    const response = await fetch(jinaUrl, {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return '';
    const text = await response.text();
    return text.substring(0, 12000);
  } catch {
    return '';
  }
}

async function handleEnrichByName(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const { fullName, currentSkills = [], currentBio = '', linkedinUrl = '', portfolioUrl = '' } = req.body || {};

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const name = fullName.trim();
    const directContents: { url: string; content: string }[] = [];
    const allResults: WebSearchResult[] = [];

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

    const queries = [`"${name}" portfolio`, `"${name}" creative technologist`];
    for (const query of queries) {
      const results = await searchWithJina(query);
      if (results.length > 0) {
        allResults.push(...results);
        if (results.length >= 3) break;
      }
    }

    const uniqueResults = allResults
      .filter((r, i, arr) => r.url && arr.findIndex((x) => x.url === r.url) === i)
      .slice(0, 10);

    if (directContents.length === 0 && uniqueResults.length === 0) {
      return res.status(200).json({
        success: true,
        discoveredProjects: [],
        additionalSkills: [],
        workHistory: [],
        enrichedBio: '',
        summary: 'No public information found. Try adding a LinkedIn or portfolio URL for better results.',
      });
    }

    if (directContents.length < 3) {
      const resultsToFetch = uniqueResults
        .filter((r) => !directContents.find((d) => d.url === r.url))
        .slice(0, 5 - directContents.length);

      for (const result of resultsToFetch) {
        const content = await fetchUrlWithJina(result.url);
        if (content.length > 200) {
          directContents.push({ url: result.url, content });
        }
      }
    }

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

    return res.status(200).json({
      success: true,
      discoveredProjects: analysis.projects || [],
      additionalSkills: analysis.additionalSkills || [],
      workHistory: analysis.workHistory || [],
      enrichedBio: analysis.enrichedBio || '',
      summary: analysis.summary || '',
    });
  } catch (error) {
    console.error('[ENRICH-BY-NAME] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Enrichment failed',
    });
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

async function handleSearchPerson(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (process.env.USE_AGENT_BROWSER !== 'true') {
    return res.status(400).json({
      error: 'Agent-browser is not enabled',
      hint: 'Set USE_AGENT_BROWSER=true in your environment',
    });
  }

  try {
    const input = ExtractContentRequest.parse(req.body);

    const { extractFromMultipleUrls } = await import('../_lib/agent-browser-search.js');
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

    return res.status(200).json({
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
      return res.status(400).json({ success: false, error: 'Invalid request', details: error.issues });
    }
    console.error('[SEARCH-PERSON] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Extraction failed',
    });
  }
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[PROFILES] Supabase not configured');
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const route = getRoute(req);

    console.log(`[PROFILES] Route: "${route}", Method: ${req.method}`);

    // Routes that don't require auth
    if (route === 'enrich-by-name') {
      return handleEnrichByName(req, res);
    }

    if (route === 'search-person') {
      return handleSearchPerson(req, res);
    }

    // All other routes require authentication
    const { user, error: authError } = await authenticateUser(req, supabase);
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    switch (route) {
      case 'enrich':
        return handleEnrichProfile(req, res, supabase, user);
      case 'update-enrichment':
        return handleUpdateEnrichment(req, res, supabase, user);
      case 'notify-created':
        return handleNotifyProfileCreated(req, res, supabase, user);
      default:
        console.warn(`[PROFILES] Unknown route: "${route}"`);
        return res.status(404).json({ error: `Route not found: /api/profiles/${route}` });
    }
  } catch (error) {
    console.error('[PROFILES] Unhandled error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
