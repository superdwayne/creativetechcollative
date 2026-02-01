export const config = {
  runtime: 'edge',
  maxDuration: 60, // Optimized for parallel operations
};

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface DiscoveredProject {
  title: string;
  description: string;
  url?: string;
  client?: string;
  technologies?: string[];
}

interface WorkExperience {
  company: string;
  role: string;
  duration?: string;
  description?: string;
}

/**
 * Helper to run a promise with timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Search using Jina AI Search API (requires API key) or DuckDuckGo fallback
 */
async function searchWithJina(query: string): Promise<WebSearchResult[]> {
  const jinaApiKey = process.env.JINA_API_KEY;
  
  // Try Jina if API key is configured
  if (jinaApiKey) {
    try {
      const jinaSearchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
      console.log(`[ENRICH-SEARCH] Jina search: ${query}`);

      const response = await fetch(jinaSearchUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${jinaApiKey}`,
          'User-Agent': 'Mozilla/5.0 (compatible; ProfileEnricher/1.0)',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const text = await response.text();
        const results: WebSearchResult[] = [];
        const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
        let match;

        while ((match = linkRegex.exec(text)) !== null && results.length < 8) {
          const title = match[1];
          const url = match[2];
          const snippetStart = match.index + match[0].length;
          const nextLinkMatch = text.substring(snippetStart).search(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
          const snippetEnd = nextLinkMatch > 0 ? snippetStart + nextLinkMatch : snippetStart + 300;
          const snippet = text.substring(snippetStart, Math.min(snippetEnd, snippetStart + 200)).trim();

          if (url && title && !url.includes('jina.ai')) {
            results.push({ title, url, snippet });
          }
        }

        if (results.length > 0) {
          console.log(`[ENRICH-SEARCH] Jina found ${results.length} results`);
          return results;
        }
      } else {
        console.log(`[ENRICH-SEARCH] Jina returned ${response.status}`);
      }
    } catch (error) {
      console.error('[ENRICH-SEARCH] Jina search failed:', error);
    }
  }

  // Fallback to DuckDuckGo HTML scraping
  return searchWithDuckDuckGo(query);
}

/**
 * Search using DuckDuckGo HTML scraping (no API key needed)
 */
async function searchWithDuckDuckGo(query: string): Promise<WebSearchResult[]> {
  try {
    console.log(`[ENRICH-SEARCH] DuckDuckGo search: ${query}`);
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      console.log(`[ENRICH-SEARCH] DuckDuckGo returned ${response.status}`);
      return [];
    }

    const html = await response.text();
    const results: WebSearchResult[] = [];

    // Extract results using href pattern
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
      
      // Skip DuckDuckGo internal links
      if (!url || url.includes('duckduckgo.com') || !title) continue;
      
      // Fix URL format
      if (url.startsWith('//')) url = 'https:' + url;
      
      results.push({
        url,
        title,
        snippet: snippets[snippetIndex] || '',
      });
      snippetIndex++;
    }

    console.log(`[ENRICH-SEARCH] DuckDuckGo found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('[ENRICH-SEARCH] DuckDuckGo search failed:', error);
    return [];
  }
}

/**
 * Fallback search using Google or DuckDuckGo
 */
async function searchWebFallback(query: string, googleApiKey?: string, googleCx?: string): Promise<WebSearchResult[]> {
  // Try Google Custom Search first
  if (googleApiKey && googleCx) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&num=8`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();
        return (data.items || []).slice(0, 8).map((item: any) => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
        }));
      }
    } catch (error) {
      console.error('[ENRICH-SEARCH] Google search failed:', error);
    }
  }

  // Try SerpAPI
  const serpApiKey = process.env.SERPAPI_KEY;
  if (serpApiKey) {
    try {
      const response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&engine=google&num=8`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();
        return (data.organic_results || []).slice(0, 8).map((item: any) => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
        }));
      }
    } catch (error) {
      console.error('[ENRICH-SEARCH] SerpAPI failed:', error);
    }
  }

  return [];
}

/**
 * Fetch URL content using Jina Reader (handles JS-rendered pages) or simple fetch fallback
 */
async function fetchUrlContent(url: string, timeoutMs: number = 10000): Promise<string> {
  const jinaApiKey = process.env.JINA_API_KEY;
  
  // Try Jina Reader if API key is configured
  if (jinaApiKey) {
    try {
      const jinaUrl = `https://r.jina.ai/${url}`;
      console.log(`[ENRICH-SEARCH] Jina fetching: ${url}`);

      const response = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/plain',
          'Authorization': `Bearer ${jinaApiKey}`,
          'User-Agent': 'Mozilla/5.0 (compatible; ProfileEnricher/1.0)',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok) {
        const text = await response.text();
        console.log(`[ENRICH-SEARCH] Jina got ${text.length} chars from ${url}`);
        return text.substring(0, 10000);
      }
      console.log(`[ENRICH-SEARCH] Jina returned ${response.status} for ${url}`);
    } catch (error) {
      console.error(`[ENRICH-SEARCH] Jina fetch failed for ${url}:`, error);
    }
  }

  // Fallback to simple fetch
  return fetchUrlSimple(url, timeoutMs);
}

/**
 * Simple URL fetch with HTML parsing (fallback when Jina unavailable)
 */
async function fetchUrlSimple(url: string, timeoutMs: number = 8000): Promise<string> {
  try {
    console.log(`[ENRICH-SEARCH] Simple fetching: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      console.log(`[ENRICH-SEARCH] Simple fetch returned ${response.status} for ${url}`);
      return '';
    }

    const html = await response.text();
    
    // Extract text content from HTML
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`[ENRICH-SEARCH] Simple got ${text.length} chars from ${url}`);
    return text.substring(0, 8000);
  } catch (error) {
    console.error(`[ENRICH-SEARCH] Simple fetch failed for ${url}:`, error);
    return '';
  }
}

interface AIAnalysisResult {
  projects: DiscoveredProject[];
  additionalSkills: string[];
  workHistory: WorkExperience[];
  enrichedBio: string;
  summary: string;
}

/**
 * Build the AI prompt for profile enrichment
 */
function buildEnrichmentPrompt(
  profileName: string,
  currentBio: string,
  currentSkills: string[],
  searchResults: WebSearchResult[],
  pageContents: string[]
): string {
  const truncatedContents = pageContents.map(c => c.substring(0, 2500));
  
  return `You are analyzing web search results to help enrich a creative technologist's profile for job matching. Extract comprehensive, accurate information.

Profile Name: ${profileName}
Current Bio: ${currentBio || 'Not provided'}
Current Skills: ${currentSkills.join(', ') || 'None listed'}

Search Results:
${searchResults.slice(0, 6).map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet}`).join('\n\n')}

Page Contents:
${truncatedContents.slice(0, 3).map((c, i) => `--- Page ${i + 1} ---\n${c}`).join('\n\n')}

Extract ALL relevant information about ${profileName}:

1. PROJECTS: Notable work, campaigns, installations, case studies. Include:
   - title, description (2-3 sentences), url, client, technologies

2. WORK HISTORY: Companies/agencies they've worked at:
   - company, role, duration, description

3. ADDITIONAL SKILLS: Technical skills not in their current list:
   - Programming, creative tools, AI/ML, hardware, frameworks

4. ENRICHED BIO: Professional bio (3-4 sentences) highlighting specialty, clients, tech

5. SUMMARY: Brief overview for matching

CRITICAL:
- Only include information clearly about THIS person (${profileName})
- Be thorough - include brand/client names
- Technologies should be specific (e.g., "Three.js" not "JavaScript library")
- If unsure, don't include it

Respond in valid JSON:
{
  "projects": [{"title": "", "description": "", "url": "", "client": "", "technologies": []}],
  "workHistory": [{"company": "", "role": "", "duration": "", "description": ""}],
  "additionalSkills": [],
  "enrichedBio": "",
  "summary": ""
}`;
}

/**
 * Try Claude (Anthropic) for AI analysis
 */
async function analyzeWithClaude(prompt: string, apiKey: string): Promise<AIAnalysisResult> {
  console.log('[ENRICH-SEARCH] Trying Claude...');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.USE_CLAUDE_SONNET === 'true' ? 'claude-sonnet-4-20250514' : 'claude-3-5-haiku-20241022',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ENRICH-SEARCH] Claude failed:', response.status, errorText.substring(0, 200));
    throw new Error(`Claude failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '{}';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse Claude response');
  }

  console.log('[ENRICH-SEARCH] Claude succeeded');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Try GPT (OpenAI) for AI analysis - fallback
 */
async function analyzeWithGPT(prompt: string, apiKey: string): Promise<AIAnalysisResult> {
  console.log('[ENRICH-SEARCH] Trying GPT...');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o', // Latest GPT model
      max_tokens: 2500,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a helpful assistant that extracts professional information from web content. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ENRICH-SEARCH] GPT failed:', response.status, errorText.substring(0, 200));
    throw new Error(`GPT failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '{}';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse GPT response');
  }

  console.log('[ENRICH-SEARCH] GPT succeeded');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Analyze with AI - tries Claude first, falls back to GPT
 */
async function analyzeWithAI(
  profileName: string,
  currentBio: string,
  currentSkills: string[],
  searchResults: WebSearchResult[],
  pageContents: string[],
  anthropicApiKey: string | undefined,
  openaiApiKey: string | undefined
): Promise<AIAnalysisResult> {
  const prompt = buildEnrichmentPrompt(profileName, currentBio, currentSkills, searchResults, pageContents);

  // Try Claude first if API key is available
  if (anthropicApiKey) {
    try {
      return await analyzeWithClaude(prompt, anthropicApiKey);
    } catch (error) {
      console.log('[ENRICH-SEARCH] Claude failed, trying GPT fallback...');
    }
  }

  // Fallback to GPT if available
  if (openaiApiKey) {
    try {
      return await analyzeWithGPT(prompt, openaiApiKey);
    } catch (error) {
      console.error('[ENRICH-SEARCH] GPT also failed:', error);
      throw new Error('Both Claude and GPT failed');
    }
  }

  throw new Error('No AI API keys configured');
}

export default async function handler(req: Request) {
  const startTime = Date.now();
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const googleCx = process.env.GOOGLE_SEARCH_CX;

  if (!anthropicApiKey && !openaiApiKey) {
    return new Response(JSON.stringify({ error: 'AI service not configured (need ANTHROPIC_API_KEY or OPENAI_API_KEY)' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const {
      fullName,
      currentSkills = [],
      currentBio = '',
      linkedinUrl = '',
      portfolioUrl = '',
      location = '',
      focusAreas = [],
      existingProjects = [],
    } = body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Full name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const name = fullName.trim();
    console.log(`[ENRICH-SEARCH] Starting enrichment for: ${name}`);

    // ========================================
    // PHASE 1: PARALLEL URL FETCHING + SEARCH
    // ========================================
    
    // Build search queries
    const queries: string[] = [
      `"${name}" portfolio`,
      `"${name}" creative technologist`,
    ];
    
    if (location?.trim()) {
      queries.push(`"${name}" ${location} developer`);
    }

    // Prepare all parallel operations
    const parallelOps: Promise<any>[] = [];
    const opLabels: string[] = [];

    // Add portfolio fetch
    if (portfolioUrl?.trim()) {
      parallelOps.push(withTimeout(fetchUrlContent(portfolioUrl, 10000), 12000, ''));
      opLabels.push('portfolio');
      
      // Add one subpage fetch (most important one)
      try {
        const baseUrl = new URL(portfolioUrl);
        parallelOps.push(withTimeout(fetchUrlContent(`${baseUrl.origin}/about`, 8000), 10000, ''));
        opLabels.push('portfolio-about');
      } catch {}
    }

    // Add LinkedIn fetch
    if (linkedinUrl?.trim()) {
      parallelOps.push(withTimeout(fetchUrlContent(linkedinUrl, 10000), 12000, ''));
      opLabels.push('linkedin');
    }

    // Add parallel web searches (all queries at once)
    for (const query of queries.slice(0, 2)) {
      parallelOps.push(withTimeout(searchWithJina(query), 10000, []));
      opLabels.push(`search-${queries.indexOf(query)}`);
    }

    console.log(`[ENRICH-SEARCH] Starting ${parallelOps.length} parallel operations...`);
    
    // Execute all in parallel
    const results = await Promise.all(parallelOps);
    
    console.log(`[ENRICH-SEARCH] Phase 1 complete in ${Date.now() - startTime}ms`);

    // Process results
    const directContents: { url: string; content: string }[] = [];
    let allSearchResults: WebSearchResult[] = [];

    results.forEach((result, i) => {
      const label = opLabels[i];
      
      if (label.startsWith('search')) {
        // It's a search result
        if (Array.isArray(result) && result.length > 0) {
          allSearchResults.push(...result);
        }
      } else {
        // It's content from URL
        if (typeof result === 'string' && result.length > 100) {
          const url = label === 'portfolio' ? portfolioUrl :
                      label === 'linkedin' ? linkedinUrl :
                      label === 'portfolio-about' ? `${new URL(portfolioUrl).origin}/about` : '';
          if (url) {
            directContents.push({ url, content: result });
          }
        }
      }
    });

    // Deduplicate search results
    const uniqueResults = allSearchResults.filter(
      (r, i, arr) => r.url && arr.findIndex(x => x.url === r.url) === i
    ).slice(0, 6);

    console.log(`[ENRICH-SEARCH] Direct content: ${directContents.length}, Search results: ${uniqueResults.length}`);

    // ========================================
    // PHASE 2: FETCH TOP SEARCH RESULT URLs (PARALLEL)
    // ========================================
    
    // Only fetch 2 search result URLs to save time
    const urlsToFetch = uniqueResults
      .slice(0, 2)
      .filter(r => !directContents.find(d => d.url === r.url))
      .map(r => r.url);

    if (urlsToFetch.length > 0 && (Date.now() - startTime) < 30000) {
      console.log(`[ENRICH-SEARCH] Fetching ${urlsToFetch.length} search result URLs...`);
      
      const contentResults = await Promise.all(
        urlsToFetch.map(url => withTimeout(fetchUrlContent(url, 8000), 10000, ''))
      );

      contentResults.forEach((content, i) => {
        if (content.length > 200) {
          directContents.push({ url: urlsToFetch[i], content });
        }
      });
    }

    console.log(`[ENRICH-SEARCH] Phase 2 complete in ${Date.now() - startTime}ms`);

    // ========================================
    // PHASE 3: FALLBACK SEARCH IF NEEDED
    // ========================================
    
    if (uniqueResults.length < 2 && directContents.length < 2 && (Date.now() - startTime) < 35000) {
      console.log(`[ENRICH-SEARCH] Trying fallback search...`);
      const fallbackResults = await withTimeout(
        searchWebFallback(`${name} portfolio`, googleApiKey, googleCx),
        8000,
        []
      );
      if (fallbackResults.length > 0) {
        allSearchResults.push(...fallbackResults);
      }
    }

    // Re-deduplicate after fallback
    const finalResults = Array.from(new Map(allSearchResults.map(r => [r.url, r])).values()).slice(0, 8);

    console.log(`[ENRICH-SEARCH] Total: ${directContents.length} pages, ${finalResults.length} search results`);

    // ========================================
    // PHASE 4: AI ANALYSIS
    // ========================================

    // Build context for AI
    const contextForAI: string[] = directContents.map(d => d.content);

    // Add search snippets as context
    if (finalResults.length > 0) {
      const snippetContext = finalResults
        .map(r => `Source: ${r.title}\nURL: ${r.url}\nContent: ${r.snippet}`)
        .join('\n\n');
      contextForAI.push(snippetContext);
    }

    // Add profile context
    const profileContext = [
      `EXISTING PROFILE DATA:`,
      `Name: ${name}`,
      currentBio ? `Current Bio: ${currentBio}` : '',
      currentSkills.length > 0 ? `Current Skills: ${currentSkills.join(', ')}` : '',
      location ? `Location: ${location}` : '',
      portfolioUrl ? `Portfolio URL: ${portfolioUrl}` : '',
    ].filter(Boolean).join('\n');
    contextForAI.push(profileContext);

    // Return early if no data found
    if (directContents.length === 0 && finalResults.length === 0) {
      console.log(`[ENRICH-SEARCH] No data found, returning empty`);
      return new Response(JSON.stringify({
        success: true,
        discoveredProjects: [],
        additionalSkills: [],
        workHistory: [],
        enrichedBio: '',
        summary: 'No external information found. You can add custom skills and projects manually.',
        timing: `${Date.now() - startTime}ms`,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Analyze with AI
    console.log(`[ENRICH-SEARCH] Starting AI analysis (Claude → GPT fallback)...`);
    
    const analysis = await analyzeWithAI(
      name,
      currentBio,
      currentSkills,
      finalResults,
      contextForAI,
      anthropicApiKey,
      openaiApiKey
    );

    // Filter out existing projects and skills
    const existingTitles = new Set(existingProjects.map((p: any) => p.title?.toLowerCase()));
    const newProjects = (analysis.projects || []).filter(
      (p: any) => !existingTitles.has(p.title?.toLowerCase())
    );

    const existingSkillsLower = new Set(currentSkills.map((s: string) => s.toLowerCase()));
    const newSkills = (analysis.additionalSkills || []).filter(
      (s: string) => !existingSkillsLower.has(s.toLowerCase())
    );

    const totalTime = Date.now() - startTime;
    console.log(`[ENRICH-SEARCH] Complete in ${totalTime}ms: ${newProjects.length} projects, ${newSkills.length} skills`);

    return new Response(JSON.stringify({
      success: true,
      discoveredProjects: newProjects,
      additionalSkills: newSkills,
      workHistory: analysis.workHistory || [],
      enrichedBio: analysis.enrichedBio || '',
      summary: analysis.summary || '',
      timing: `${totalTime}ms`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ENRICH-SEARCH] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        timing: `${Date.now() - startTime}ms`,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
