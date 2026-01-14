/**
 * Profile Enrichment Utility
 *
 * Orchestrates the enrichment of network profiles with scraped portfolio content
 * and generates vector embeddings for semantic search.
 */

import { supabase } from './supabase';
import { scrapePortfolioContent } from './scraper';
import { generateProfileEmbedding } from './embeddings';
import type { NetworkProfile } from '@/types/network-profile';

/**
 * Result of profile enrichment operation
 */
export interface EnrichProfileResult {
  success: boolean;
  profileId: string;
  enrichedContent?: string;
  embeddingGenerated?: boolean;
  error?: string;
}

/**
 * Fetches a profile from the database by ID
 */
async function fetchProfileById(profileId: string): Promise<NetworkProfile | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('network_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      location: data.location,
      email: data.email,
      portfolioUrl: data.portfolio_url,
      linkedinUrl: data.linkedin_url,
      otherSocialLinks: data.other_social_links,
      bio: data.bio,
      focusAreas: data.focus_areas,
      skills: data.skills,
      projects: data.projects,
      availability: data.availability,
      isCtcMember: data.is_ctc_member,
      profilePictureUrl: data.profile_picture_url,
      approved: data.approved || false,
      approvedAt: data.approved_at,
      approvedBy: data.approved_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      slug: data.slug,
      embedding: data.embedding,
      embeddingUpdatedAt: data.embedding_updated_at,
      enrichedContent: data.enriched_content,
    };
  } catch (error) {
    console.error('Error fetching profile by ID:', error);
    return null;
  }
}

/**
 * Updates a profile's enriched content and embedding in the database
 */
async function updateProfileEnrichment(
  profileId: string,
  enrichedContent: string | null,
  embedding: number[]
): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Format embedding as PostgreSQL vector array
    const embeddingString = `[${embedding.join(',')}]`;

    const { error } = await supabase
      .from('network_profiles')
      .update({
        enriched_content: enrichedContent,
        embedding: embeddingString,
        embedding_updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (error) {
      console.error('Error updating profile enrichment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating profile enrichment:', error);
    return false;
  }
}

/**
 * Enriches a profile with scraped portfolio content and generates its embedding.
 *
 * This function:
 * 1. Fetches the profile from the database
 * 2. Scrapes content from the profile's portfolio URLs
 * 3. Stores the enriched content in the profile record
 * 4. Generates an embedding from the profile + enriched content
 * 5. Updates the embedding and embedding_updated_at in the database
 *
 * @param profileId - The UUID of the profile to enrich
 * @returns Result indicating success/failure and details of the operation
 *
 * @example
 * ```typescript
 * const result = await enrichProfile('123e4567-e89b-12d3-a456-426614174000');
 * if (result.success) {
 *   console.log('Profile enriched successfully');
 * } else {
 *   console.error('Enrichment failed:', result.error);
 * }
 * ```
 */
export async function enrichProfile(profileId: string): Promise<EnrichProfileResult> {
  // Validate input
  if (!profileId) {
    return {
      success: false,
      profileId: profileId || '',
      error: 'Profile ID is required',
    };
  }

  // Check Supabase is configured
  if (!supabase) {
    return {
      success: false,
      profileId,
      error: 'Database not configured',
    };
  }

  // Step 1: Fetch profile from database
  const profile = await fetchProfileById(profileId);
  if (!profile) {
    return {
      success: false,
      profileId,
      error: 'Profile not found',
    };
  }

  // Step 2: Collect URLs to scrape
  const urls: string[] = [];
  if (profile.portfolioUrl) urls.push(profile.portfolioUrl);
  if (profile.linkedinUrl) urls.push(profile.linkedinUrl);
  if (profile.otherSocialLinks) {
    urls.push(...profile.otherSocialLinks);
  }

  // Step 3: Scrape portfolio content
  let enrichedContent: string | null = null;
  if (urls.length > 0) {
    try {
      const scrapeResult = await scrapePortfolioContent(urls);
      if (scrapeResult.combinedContent && scrapeResult.combinedContent.length > 0) {
        enrichedContent = scrapeResult.combinedContent;
        console.log(
          `Scraped ${scrapeResult.successCount} URL(s) for profile ${profileId}, ` +
          `${enrichedContent.length} characters of content`
        );
      }
    } catch (error) {
      // Log but don't fail - we can still generate embedding from base profile
      console.warn(`Failed to scrape URLs for profile ${profileId}:`, error);
    }
  }

  // Step 4: Create profile with enriched content for embedding generation
  const profileForEmbedding: NetworkProfile = {
    ...profile,
    enrichedContent,
  };

  // Step 5: Generate embedding
  let embedding: number[];
  try {
    embedding = await generateProfileEmbedding(profileForEmbedding);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      profileId,
      enrichedContent: enrichedContent || undefined,
      error: `Failed to generate embedding: ${errorMessage}`,
    };
  }

  // Step 6: Update database with enriched content and embedding
  const updated = await updateProfileEnrichment(profileId, enrichedContent, embedding);
  if (!updated) {
    return {
      success: false,
      profileId,
      enrichedContent: enrichedContent || undefined,
      embeddingGenerated: true,
      error: 'Failed to save enrichment to database',
    };
  }

  return {
    success: true,
    profileId,
    enrichedContent: enrichedContent || undefined,
    embeddingGenerated: true,
  };
}
