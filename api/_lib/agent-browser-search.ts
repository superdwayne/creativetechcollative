/**
 * Agent Browser Content Extraction Utility
 *
 * Uses agent-browser (Vercel Labs) for extracting content from JavaScript-heavy
 * portfolio websites and social profiles.
 *
 * Key features:
 * - Renders JavaScript-heavy sites (Behance, Dribbble, WebGL portfolios, etc.)
 * - Extracts structured data via accessibility tree
 * - Works locally without cloud browser providers
 *
 * Note: For web searching, use Jina/SerpAPI/Google Custom Search APIs instead.
 * Local browsers hit CAPTCHAs on search engines.
 *
 * @see https://github.com/vercel-labs/agent-browser
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Content extracted from a page
 */
export interface ExtractedContent {
  url: string;
  title: string;
  content: string;
  snapshot: string;
  links: { text: string; href: string }[];
  structuredData?: Record<string, unknown>;
}

/**
 * Options for agent-browser
 */
export interface AgentBrowserOptions {
  session?: string;
  headed?: boolean;
  timeout?: number;
}

/**
 * Execute an agent-browser command and return the result
 * Uses local Chromium browser (no cloud providers)
 */
async function runAgentBrowser(
  command: string,
  args: string[] = [],
  options: AgentBrowserOptions = {}
): Promise<string> {
  const baseArgs: string[] = [];

  // Add session for isolated browser instances
  if (options.session) {
    baseArgs.push('--session', options.session);
  }

  // Show browser window for debugging (default: headless)
  if (options.headed) {
    baseArgs.push('--headed');
  }

  // Always use JSON output for parsing
  baseArgs.push('--json');

  const allArgs = ['agent-browser', ...baseArgs, command, ...args];

  console.log(`[AGENT-BROWSER] Running: npx ${allArgs.join(' ')}`);

  try {
    const { stdout, stderr } = await execFileAsync('npx', allArgs, {
      timeout: options.timeout || 30000,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large snapshots
    });

    if (stderr && !stderr.includes('warn')) {
      console.error(`[AGENT-BROWSER] stderr: ${stderr}`);
    }

    return stdout;
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    console.error(`[AGENT-BROWSER] Error:`, execError.message);
    // Return stdout even on error (may have partial results)
    return execError.stdout || '';
  }
}

/**
 * Parse JSON output from agent-browser
 */
function parseAgentOutput(output: string): unknown {
  try {
    // Find JSON in output (may have other text before/after)
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('[AGENT-BROWSER] JSON parse error:', error);
  }
  return null;
}

/**
 * Navigate to a URL
 */
export async function navigateTo(
  url: string,
  sessionId: string,
  options: AgentBrowserOptions = {}
): Promise<boolean> {
  const result = await runAgentBrowser('open', [url], { ...options, session: sessionId });
  const parsed = parseAgentOutput(result) as { success?: boolean } | null;
  return parsed?.success ?? result.includes('success') ?? !result.includes('error');
}

/**
 * Get page snapshot (accessibility tree with refs)
 */
export async function getSnapshot(
  sessionId: string,
  options: AgentBrowserOptions & { interactive?: boolean; compact?: boolean } = {}
): Promise<string> {
  const args: string[] = [];
  if (options.interactive) args.push('-i');
  if (options.compact) args.push('-c');

  const result = await runAgentBrowser('snapshot', args, { ...options, session: sessionId });
  const parsed = parseAgentOutput(result) as { data?: { snapshot?: string } } | null;
  return parsed?.data?.snapshot || result;
}

/**
 * Extract text content from the current page
 */
export async function extractText(
  selector: string,
  sessionId: string,
  options: AgentBrowserOptions = {}
): Promise<string> {
  const result = await runAgentBrowser('get', ['text', selector], { ...options, session: sessionId });
  const parsed = parseAgentOutput(result) as { data?: string } | null;
  return parsed?.data || result;
}

/**
 * Get page title
 */
export async function getTitle(sessionId: string, options: AgentBrowserOptions = {}): Promise<string> {
  const result = await runAgentBrowser('get', ['title'], { ...options, session: sessionId });
  const parsed = parseAgentOutput(result) as { data?: string } | null;
  return parsed?.data || '';
}

/**
 * Wait for a condition (time in ms or selector)
 */
export async function waitFor(
  condition: string,
  sessionId: string,
  options: AgentBrowserOptions = {}
): Promise<boolean> {
  const result = await runAgentBrowser('wait', [condition], { ...options, session: sessionId });
  return !result.includes('error') && !result.includes('timeout');
}

/**
 * Close the browser session
 */
export async function closeSession(sessionId: string, options: AgentBrowserOptions = {}): Promise<void> {
  await runAgentBrowser('close', [], { ...options, session: sessionId });
}

/**
 * Extract content from a portfolio/website URL
 * This is the main function for extracting JS-rendered content
 */
export async function extractPortfolioContent(
  url: string,
  sessionId: string,
  options: AgentBrowserOptions = {}
): Promise<ExtractedContent> {
  const content: ExtractedContent = {
    url,
    title: '',
    content: '',
    snapshot: '',
    links: [],
  };

  try {
    // Navigate to the URL
    const navSuccess = await navigateTo(url, sessionId, options);
    if (!navSuccess) {
      console.warn(`[AGENT-BROWSER] Navigation failed for ${url}`);
      return content;
    }

    // Wait for page to load (JS rendering)
    await waitFor('3000', sessionId, options);

    // Get page title
    content.title = await getTitle(sessionId, options);

    // Get snapshot for structured data
    content.snapshot = await getSnapshot(sessionId, { ...options, interactive: true, compact: true });

    // Get full text content
    content.content = await extractText('body', sessionId, options);

    // Extract links from snapshot
    const linkRegex = /link "([^"]+)".*?/g;
    let match;
    while ((match = linkRegex.exec(content.snapshot)) !== null) {
      content.links.push({
        text: match[1],
        href: '', // URLs are in separate attributes
      });
    }

    // Try to extract structured data (JSON-LD)
    try {
      const jsonLdResult = await runAgentBrowser(
        'eval',
        [
          'Array.from(document.querySelectorAll(\'script[type="application/ld+json"]\')).map(s => JSON.parse(s.textContent)).filter(Boolean)',
        ],
        { ...options, session: sessionId }
      );
      const jsonLdParsed = parseAgentOutput(jsonLdResult) as { data?: Record<string, unknown>[] } | null;
      if (jsonLdParsed?.data && jsonLdParsed.data.length > 0) {
        content.structuredData = jsonLdParsed.data[0];
      }
    } catch {
      // Ignore JSON-LD extraction errors
    }

    console.log(
      `[AGENT-BROWSER] Extracted from ${url}: ${content.content.length} chars, ${content.links.length} links`
    );
  } catch (error) {
    console.error(`[AGENT-BROWSER] Error extracting from ${url}:`, error);
  }

  return content;
}

/**
 * Extract content from multiple URLs
 */
export async function extractFromMultipleUrls(
  urls: string[],
  options: AgentBrowserOptions = {}
): Promise<ExtractedContent[]> {
  const sessionId = `extract-${Date.now()}`;
  const results: ExtractedContent[] = [];

  try {
    for (const url of urls) {
      console.log(`[AGENT-BROWSER] Extracting from: ${url}`);
      const content = await extractPortfolioContent(url, sessionId, options);
      if (content.content.length > 100) {
        results.push(content);
      }
    }
  } finally {
    // Clean up session
    try {
      await closeSession(sessionId, options);
    } catch {
      // Ignore cleanup errors
    }
  }

  return results;
}

/**
 * Check if a URL is likely a JavaScript-heavy site that benefits from agent-browser
 */
export function isJsHeavySite(url: string): boolean {
  const jsHeavySites = [
    'linkedin.com',
    'behance.net',
    'dribbble.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'facebook.com',
    'webflow.io',
    'framer.website',
    'wix.com',
    'squarespace.com',
    'notion.site',
    'readcv.com',
    'bento.me',
    'contra.com',
    'cargo.site',
    'lusion.co',
    'awwwards.com',
    'thefwa.com',
  ];

  const urlLower = url.toLowerCase();
  return jsHeavySites.some((site) => urlLower.includes(site));
}

/**
 * Smart content extraction - uses agent-browser for JS-heavy sites, falls back to simple fetch
 */
export async function smartExtract(
  url: string,
  options: AgentBrowserOptions = {}
): Promise<{ content: string; method: 'agent-browser' | 'fetch' }> {
  // Check if this is a JS-heavy site
  if (isJsHeavySite(url)) {
    const sessionId = `smart-${Date.now()}`;
    try {
      const extracted = await extractPortfolioContent(url, sessionId, options);
      if (extracted.content.length > 200) {
        return { content: extracted.content, method: 'agent-browser' };
      }
    } finally {
      try {
        await closeSession(sessionId, options);
      } catch {
        // Ignore
      }
    }
  }

  // Fallback to simple fetch (handled by caller)
  return { content: '', method: 'fetch' };
}
