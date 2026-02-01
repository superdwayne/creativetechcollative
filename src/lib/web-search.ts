/**
 * Web Search Utility
 *
 * Searches the web to find portfolio work and professional information
 * for network members with incomplete profiles.
 *
 * Uses OpenAI's GPT-4o with web search capabilities.
 */

/**
 * Result from a web search
 */
export interface WebSearchResult {
  url: string;
  title: string;
  snippet: string;
}

/**
 * Combined result of searching for a member's work
 */
export interface MemberSearchResult {
  query: string;
  results: WebSearchResult[];
  summary: string;
}

/**
 * Search the web for a member's professional work and portfolio.
 *
 * Uses OpenAI's GPT-4o with web search tool to find relevant URLs and content
 * about the member based on their name, skills, and focus areas.
 *
 * @param fullName - The member's full name
 * @param skills - Array of skills (e.g., ["Unity", "WebGL", "Three.js"])
 * @param focusAreas - Array of focus areas (e.g., ["immersive-experiences", "interactive-web"])
 * @param location - Optional location for more targeted results
 * @returns Search results with URLs, titles, and snippets
 */
export async function searchForMemberWork(
  fullName: string,
  skills: string[] = [],
  focusAreas: string[] = [],
  location?: string
): Promise<MemberSearchResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('OPENAI_API_KEY not configured');
    return {
      query: fullName,
      results: [],
      summary: 'Web search unavailable - API key not configured',
    };
  }

  // Build search context
  const skillsStr = skills.slice(0, 5).join(', ');
  const focusStr = focusAreas
    .slice(0, 3)
    .map((f) => f.replace(/-/g, ' '))
    .join(', ');

  const searchPrompt = `Search the web to find professional portfolio, work samples, and projects by "${fullName}".

They are a creative technologist with skills in: ${skillsStr || 'various technologies'}.
Focus areas: ${focusStr || 'creative technology'}.
${location ? `Location: ${location}` : ''}

Find and return:
1. Their portfolio website or personal site
2. Their GitHub, Behance, Dribbble, or similar profiles
3. Notable projects they've worked on
4. Articles, talks, or publications by them

For each result found, provide:
- The URL
- A brief description of what's at that URL

Format your response as a structured list of findings.`;

  try {
    // Use OpenAI's responses API with web search tool
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        tools: [{ type: 'web_search_preview' }],
        input: searchPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);

      // Fallback: return empty results rather than failing
      return {
        query: fullName,
        results: [],
        summary: `Web search API error: ${response.status}`,
      };
    }

    const data = await response.json();

    // Extract URLs and content from the response
    const results: WebSearchResult[] = [];
    let summary = '';

    // Parse the response output
    if (data.output) {
      for (const item of data.output) {
        if (item.type === 'message' && item.content) {
          for (const content of item.content) {
            if (content.type === 'text') {
              summary = content.text;

              // Extract URLs from the text using regex
              const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
              const urls = content.text.match(urlRegex) || [];

              for (const url of urls) {
                // Clean up the URL (remove trailing punctuation)
                const cleanUrl = url.replace(/[.,;:!?)]+$/, '');

                // Skip common non-portfolio URLs
                if (
                  cleanUrl.includes('google.com') ||
                  cleanUrl.includes('bing.com') ||
                  cleanUrl.includes('facebook.com/share') ||
                  cleanUrl.includes('twitter.com/intent') ||
                  cleanUrl.includes('openai.com')
                ) {
                  continue;
                }

                results.push({
                  url: cleanUrl,
                  title: extractDomainName(cleanUrl),
                  snippet: `Found via web search for ${fullName}`,
                });
              }
            }
          }
        }
      }
    }

    // Deduplicate results by URL
    const uniqueResults = results.filter(
      (result, index, self) => self.findIndex((r) => r.url === result.url) === index
    );

    return {
      query: fullName,
      results: uniqueResults.slice(0, 10), // Limit to top 10 results
      summary,
    };
  } catch (error) {
    console.error('Web search failed:', error);

    return {
      query: fullName,
      results: [],
      summary: `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Extract a readable domain name from a URL
 */
function extractDomainName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Check if a profile is considered incomplete and would benefit from web search enrichment.
 *
 * A profile is incomplete if ANY of:
 * - Bio is null or less than 50 characters
 * - Skills array is empty or has fewer than 3 items
 * - No portfolio URL AND no enriched content
 * - Projects array is null or empty
 */
export function isProfileIncomplete(profile: {
  bio?: string | null;
  skills?: string[] | null;
  portfolioUrl?: string | null;
  enrichedContent?: string | null;
  projects?: unknown[] | null;
}): boolean {
  const hasThinBio = !profile.bio || profile.bio.length < 50;
  const hasFewSkills = !profile.skills || profile.skills.length < 3;
  const hasNoPortfolio = !profile.portfolioUrl && !profile.enrichedContent;
  const hasNoProjects = !profile.projects || profile.projects.length === 0;

  return hasThinBio || hasFewSkills || hasNoPortfolio || hasNoProjects;
}

/**
 * Batch search for multiple members' work.
 * Includes rate limiting to avoid overwhelming the API.
 *
 * @param members - Array of members to search for
 * @param delayMs - Delay between searches in milliseconds (default: 1000ms)
 * @returns Map of member ID to search results
 */
export async function batchSearchForMembers(
  members: Array<{
    id: string;
    fullName: string;
    skills?: string[];
    focusAreas?: string[];
    location?: string;
  }>,
  delayMs: number = 1000
): Promise<Map<string, MemberSearchResult>> {
  const results = new Map<string, MemberSearchResult>();

  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    // Add delay between requests (except first)
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    try {
      const searchResult = await searchForMemberWork(
        member.fullName,
        member.skills || [],
        member.focusAreas || [],
        member.location
      );
      results.set(member.id, searchResult);
    } catch (error) {
      console.error(`Failed to search for member ${member.id}:`, error);
      results.set(member.id, {
        query: member.fullName,
        results: [],
        summary: 'Search failed',
      });
    }
  }

  return results;
}
