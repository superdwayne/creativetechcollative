import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { NetworkProfile, FocusArea, FOCUS_AREAS } from '@/types/network-profile';
import type { JobSubmission } from '@/types/job-matching';

// Focus area labels for human-readable embedding text
const FOCUS_AREA_LABELS: Record<FocusArea, string> = {
  'immersive-experiences': 'Immersive Experiences (AR/VR/XR)',
  'interactive-web': 'Interactive Web/Creative Development (WebGL, Creative Coding)',
  'generative-design': 'Generative/Algorithmic Design (Procedural Art)',
  'creative-automation': 'Creative Automation/AI (AI Tools, Automation)',
  'physical-computing': 'Physical Computing (Hardware, IoT)',
  'realtime-visuals': 'Real-time/Live Visuals (VJing, Live Performance)',
};

/**
 * Combines profile data into a single text string optimized for embedding generation.
 * Includes bio, skills, focus areas, and project descriptions.
 */
export function buildProfileEmbeddingText(profile: NetworkProfile): string {
  const parts: string[] = [];

  // Add name and location for context
  parts.push(`Name: ${profile.fullName}`);
  if (profile.location) {
    parts.push(`Location: ${profile.location}`);
  }

  // Add bio (main content)
  if (profile.bio) {
    parts.push(`Bio: ${profile.bio}`);
  }

  // Add focus areas with human-readable labels
  if (profile.focusAreas && profile.focusAreas.length > 0) {
    const focusLabels = profile.focusAreas
      .map((area) => FOCUS_AREA_LABELS[area] || area)
      .join(', ');
    parts.push(`Focus Areas: ${focusLabels}`);
  }

  // Add skills
  if (profile.skills && profile.skills.length > 0) {
    parts.push(`Skills: ${profile.skills.join(', ')}`);
  }

  // Add project descriptions
  if (profile.projects && profile.projects.length > 0) {
    const projectDescriptions = profile.projects
      .map((project) => {
        const title = project.title || 'Untitled Project';
        const description = project.description || '';
        return description ? `${title}: ${description}` : title;
      })
      .join(' | ');
    parts.push(`Projects: ${projectDescriptions}`);
  }

  // Add enriched content if available (scraped portfolio data)
  if (profile.enrichedContent) {
    parts.push(`Additional Context: ${profile.enrichedContent}`);
  }

  return parts.join('\n\n');
}

/**
 * Maximum number of retry attempts for embedding generation
 */
const MAX_RETRIES = 3;

/**
 * Base delay in milliseconds for exponential backoff
 */
const BASE_RETRY_DELAY = 1000;

/**
 * Generates an embedding vector for a network profile using OpenAI's text-embedding-3-small model.
 *
 * @param profile - The network profile to generate an embedding for
 * @returns The embedding vector as an array of numbers (1536 dimensions)
 * @throws Error if embedding generation fails after retries
 *
 * @example
 * ```typescript
 * const profile = await getProfileById(profileId);
 * const embedding = await generateProfileEmbedding(profile);
 * // embedding is number[] with 1536 dimensions
 * ```
 */
export async function generateProfileEmbedding(
  profile: NetworkProfile
): Promise<number[]> {
  const text = buildProfileEmbeddingText(profile);

  // Validate we have content to embed
  if (!text || text.trim().length === 0) {
    throw new Error('Profile has no content to generate embedding from');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: text,
      });

      return embedding;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation errors
      if (lastError.message.includes('invalid') || lastError.message.includes('API key')) {
        throw lastError;
      }

      // Log retry attempt
      console.warn(
        `Embedding generation attempt ${attempt}/${MAX_RETRIES} failed:`,
        lastError.message
      );

      // Wait before retry with exponential backoff
      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to generate embedding after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

// =============================================================================
// JOB SUBMISSION EMBEDDINGS
// =============================================================================

/**
 * Combines job submission data into a single text string optimized for embedding generation.
 * Includes title, description, requirements, preferred skills, and focus areas.
 */
export function buildJobEmbeddingText(job: JobSubmission): string {
  const parts: string[] = [];

  // Add job title
  parts.push(`Job Title: ${job.title}`);

  // Add job description (main content)
  parts.push(`Description: ${job.description}`);

  // Add requirements
  if (job.requirements) {
    parts.push(`Requirements: ${job.requirements}`);
  }

  // Add preferred skills
  if (job.preferredSkills && job.preferredSkills.length > 0) {
    parts.push(`Preferred Skills: ${job.preferredSkills.join(', ')}`);
  }

  // Add focus areas with human-readable labels
  if (job.focusAreas && job.focusAreas.length > 0) {
    const focusLabels = job.focusAreas
      .map((area) => FOCUS_AREA_LABELS[area as FocusArea] || area)
      .join(', ');
    parts.push(`Focus Areas: ${focusLabels}`);
  }

  // Add project type and remote preference for context
  parts.push(`Project Type: ${job.projectType}`);
  parts.push(`Remote Preference: ${job.remotePreference}`);

  // Add location if specified
  if (job.location) {
    parts.push(`Location: ${job.location}`);
  }

  // Add timeline if specified
  if (job.timeline) {
    parts.push(`Timeline: ${job.timeline}`);
  }

  return parts.join('\n\n');
}

/**
 * Generates an embedding vector for a job submission using OpenAI's text-embedding-3-small model.
 *
 * @param job - The job submission to generate an embedding for
 * @returns The embedding vector as an array of numbers (1536 dimensions)
 * @throws Error if embedding generation fails after retries
 *
 * @example
 * ```typescript
 * const job = await getJobSubmissionById(jobId);
 * const embedding = await generateJobEmbedding(job);
 * // embedding is number[] with 1536 dimensions
 * ```
 */
export async function generateJobEmbedding(
  job: JobSubmission
): Promise<number[]> {
  const text = buildJobEmbeddingText(job);

  // Validate we have content to embed
  if (!text || text.trim().length === 0) {
    throw new Error('Job submission has no content to generate embedding from');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: text,
      });

      return embedding;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation errors
      if (lastError.message.includes('invalid') || lastError.message.includes('API key')) {
        throw lastError;
      }

      // Log retry attempt
      console.warn(
        `Job embedding generation attempt ${attempt}/${MAX_RETRIES} failed:`,
        lastError.message
      );

      // Wait before retry with exponential backoff
      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to generate job embedding after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}
