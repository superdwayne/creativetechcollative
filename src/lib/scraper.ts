/**
 * Portfolio Content Scraping Utility
 *
 * Scrapes and extracts relevant text content from member portfolio URLs
 * for use in generating richer embeddings.
 */

// Configuration
const SCRAPE_TIMEOUT_MS = 10000; // 10 second timeout per URL
const DELAY_BETWEEN_REQUESTS_MS = 500; // Rate limiting delay
const MAX_CONTENT_LENGTH = 10000; // Max characters to extract per URL
const USER_AGENT = 'CTC-NetworkBot/1.0 (Creative Technologists Collective; job matching service)';

/**
 * Result of scraping a single URL
 */
export interface ScrapeResult {
  url: string;
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Combined result of scraping multiple URLs
 */
export interface ScrapeBatchResult {
  results: ScrapeResult[];
  combinedContent: string;
  successCount: number;
  failureCount: number;
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clean and normalize extracted text content
 */
function cleanContent(text: string): string {
  return text
    // Remove extra whitespace and newlines
    .replace(/\s+/g, ' ')
    // Remove common noise patterns
    .replace(/Cookie Policy|Privacy Policy|Terms of Service|All Rights Reserved/gi, '')
    .replace(/©\s*\d{4}/g, '')
    .replace(/Sign up|Log in|Subscribe/gi, '')
    // Trim and limit length
    .trim()
    .slice(0, MAX_CONTENT_LENGTH);
}

/**
 * Extract text content from HTML
 * Focuses on meaningful content: paragraphs, headings, list items
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style tags with their content
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // Remove navigation, header, footer, and sidebar elements
  cleaned = cleaned
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

  // Extract text from main content areas (article, main, section) first
  const mainContent = cleaned.match(/<(article|main|section)[^>]*>([\s\S]*?)<\/\1>/gi) || [];

  // Also get text from paragraphs, headings, and list items
  const contentPatterns = [
    /<p[^>]*>([\s\S]*?)<\/p>/gi,
    /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi,
    /<li[^>]*>([\s\S]*?)<\/li>/gi,
  ];

  let textParts: string[] = [];

  // Add main content first
  for (const section of mainContent) {
    const sectionText = section.replace(/<[^>]+>/g, ' ');
    textParts.push(sectionText);
  }

  // Add individual content elements
  for (const pattern of contentPatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex
    while ((match = pattern.exec(cleaned)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, ' ');
      if (text.trim().length > 20) { // Only keep meaningful content
        textParts.push(text);
      }
    }
  }

  // Deduplicate and join
  const uniqueParts = [...new Set(textParts.map((t) => t.trim()).filter(Boolean))];
  return cleanContent(uniqueParts.join(' '));
}

/**
 * Scrape content from a single URL
 */
async function scrapeUrl(url: string): Promise<ScrapeResult> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);

    // Skip URLs that are likely not useful
    if (parsedUrl.hostname.includes('linkedin.com')) {
      // LinkedIn requires authentication and blocks scraping
      return {
        url,
        success: false,
        error: 'LinkedIn requires authentication for scraping',
      };
    }

    // Fetch the URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        url,
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return {
        url,
        success: false,
        error: `Unsupported content type: ${contentType}`,
      };
    }

    const html = await response.text();
    const content = extractTextFromHtml(html);

    if (!content || content.length < 50) {
      return {
        url,
        success: false,
        error: 'No meaningful content extracted',
      };
    }

    return {
      url,
      success: true,
      content,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle specific error types
    if (errorMessage.includes('abort')) {
      return {
        url,
        success: false,
        error: 'Request timed out',
      };
    }

    return {
      url,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Scrape content from multiple URLs
 *
 * @param urls - Array of URLs to scrape (portfolio_url, linkedin_url, other_social_links)
 * @returns Combined scraped content and individual results
 *
 * @example
 * ```typescript
 * const urls = [profile.portfolioUrl, profile.linkedinUrl, ...(profile.otherSocialLinks || [])];
 * const result = await scrapePortfolioContent(urls.filter(Boolean) as string[]);
 * console.log(result.combinedContent);
 * ```
 */
export async function scrapePortfolioContent(urls: string[]): Promise<ScrapeBatchResult> {
  // Filter out empty/invalid URLs
  const validUrls = urls.filter((url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    return {
      results: [],
      combinedContent: '',
      successCount: 0,
      failureCount: 0,
    };
  }

  const results: ScrapeResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Process URLs sequentially with rate limiting
  for (let i = 0; i < validUrls.length; i++) {
    const url = validUrls[i];

    // Add delay between requests (except for first one)
    if (i > 0) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }

    const result = await scrapeUrl(url);
    results.push(result);

    if (result.success) {
      successCount++;
    } else {
      failureCount++;
      console.warn(`Failed to scrape ${url}: ${result.error}`);
    }
  }

  // Combine successful content
  const combinedContent = results
    .filter((r) => r.success && r.content)
    .map((r) => r.content!)
    .join('\n\n')
    .slice(0, MAX_CONTENT_LENGTH * 2); // Allow slightly more for combined

  return {
    results,
    combinedContent,
    successCount,
    failureCount,
  };
}
