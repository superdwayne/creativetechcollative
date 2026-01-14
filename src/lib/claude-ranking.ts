import { generateObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { JobSubmission, SkillMatchInfo } from '@/types/job-matching';
import type { NetworkProfile, FocusArea } from '@/types/network-profile';

// Initialize Anthropic client
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Focus area labels for human-readable display
const FOCUS_AREA_LABELS: Record<FocusArea, string> = {
  'immersive-experiences': 'Immersive Experiences (AR/VR/XR)',
  'interactive-web': 'Interactive Web/Creative Development',
  'generative-design': 'Generative/Algorithmic Design',
  'creative-automation': 'Creative Automation/AI',
  'physical-computing': 'Physical Computing',
  'realtime-visuals': 'Real-time/Live Visuals',
};

// Schema for a single ranked candidate
const RankedCandidateSchema = z.object({
  profileId: z.string().describe('The UUID of the candidate profile'),
  matchScore: z.number().min(0).max(100).describe('Overall match score from 0-100'),
  matchReasoning: z.string().describe('Detailed explanation of why this candidate matches the job, including specific strengths and potential concerns'),
  skillMatches: z.array(z.object({
    skill: z.string().describe('The skill name'),
    relevance: z.string().describe('How this skill relates to the job requirements'),
    fromProfile: z.boolean().optional().describe('Whether this skill was explicitly listed in the profile'),
    fromPortfolio: z.boolean().optional().describe('Whether this skill was inferred from portfolio/enriched content'),
  })).describe('Specific skills that match the job requirements'),
});

// Schema for the full ranking response
const RankingResponseSchema = z.object({
  rankedCandidates: z.array(RankedCandidateSchema).describe('Candidates ranked by match quality, best first'),
  overallAnalysis: z.string().optional().describe('Brief summary of the candidate pool quality for this job'),
});

/**
 * Result of ranking a single candidate
 */
export interface RankedCandidate {
  profileId: string;
  matchScore: number;
  matchReasoning: string;
  skillMatches: SkillMatchInfo[];
}

/**
 * Result of the ranking operation
 */
export interface RankingResult {
  rankedCandidates: RankedCandidate[];
  overallAnalysis?: string;
}

/**
 * Formats a job submission for Claude's analysis
 */
function formatJobForClaude(job: JobSubmission): string {
  const parts: string[] = [];

  parts.push(`## Job: ${job.title}`);
  parts.push(`\n### Description\n${job.description}`);

  if (job.requirements) {
    parts.push(`\n### Requirements\n${job.requirements}`);
  }

  if (job.preferredSkills && job.preferredSkills.length > 0) {
    parts.push(`\n### Preferred Skills\n${job.preferredSkills.join(', ')}`);
  }

  if (job.focusAreas && job.focusAreas.length > 0) {
    const focusLabels = job.focusAreas
      .map((area) => FOCUS_AREA_LABELS[area as FocusArea] || area)
      .join(', ');
    parts.push(`\n### Focus Areas\n${focusLabels}`);
  }

  parts.push(`\n### Project Type: ${job.projectType}`);
  parts.push(`### Remote Preference: ${job.remotePreference}`);

  if (job.location) {
    parts.push(`### Location: ${job.location}`);
  }

  if (job.timeline) {
    parts.push(`### Timeline: ${job.timeline}`);
  }

  if (job.budgetRange) {
    parts.push(`### Budget Range: ${job.budgetRange}`);
  }

  return parts.join('\n');
}

/**
 * Formats a candidate profile for Claude's analysis
 */
function formatCandidateForClaude(profile: NetworkProfile, index: number): string {
  const parts: string[] = [];

  parts.push(`\n---\n## Candidate ${index + 1}: ${profile.fullName}`);
  parts.push(`**Profile ID:** ${profile.id}`);
  parts.push(`**Location:** ${profile.location}`);
  parts.push(`**Availability:** ${profile.availability}`);

  if (profile.bio) {
    parts.push(`\n### Bio\n${profile.bio}`);
  }

  if (profile.focusAreas && profile.focusAreas.length > 0) {
    const focusLabels = profile.focusAreas
      .map((area) => FOCUS_AREA_LABELS[area] || area)
      .join(', ');
    parts.push(`\n### Focus Areas\n${focusLabels}`);
  }

  if (profile.skills && profile.skills.length > 0) {
    parts.push(`\n### Skills\n${profile.skills.join(', ')}`);
  }

  if (profile.projects && profile.projects.length > 0) {
    const projectDescriptions = profile.projects
      .map((project) => {
        const desc = project.description ? `: ${project.description}` : '';
        return `- **${project.title}**${desc}`;
      })
      .join('\n');
    parts.push(`\n### Projects\n${projectDescriptions}`);
  }

  if (profile.enrichedContent) {
    // Truncate enriched content if too long
    const truncatedContent = profile.enrichedContent.length > 2000
      ? profile.enrichedContent.substring(0, 2000) + '...'
      : profile.enrichedContent;
    parts.push(`\n### Portfolio Context (from website)\n${truncatedContent}`);
  }

  if (profile.portfolioUrl) {
    parts.push(`\n**Portfolio:** ${profile.portfolioUrl}`);
  }

  return parts.join('\n');
}

/**
 * Maximum number of retry attempts for Claude API calls
 */
const MAX_RETRIES = 3;

/**
 * Base delay in milliseconds for exponential backoff
 */
const BASE_RETRY_DELAY = 1000;

/**
 * Ranks candidate profiles against a job specification using Claude AI.
 *
 * Claude analyzes each candidate's fit based on:
 * - Explicit skills matching job requirements
 * - Inferred skills from portfolio and project descriptions
 * - Focus area alignment
 * - Location/remote preference compatibility
 * - Overall experience and project relevance
 *
 * @param job - The job submission to match against
 * @param candidates - Array of candidate profiles from vector search (recommended: top 10-20)
 * @returns Ranked candidates with scores (0-100) and detailed reasoning
 *
 * @example
 * ```typescript
 * const job = await getJobSubmissionById(jobId);
 * const vectorMatches = await findSimilarProfiles(jobEmbedding, 20);
 * const rankedMatches = await rankMatchesWithClaude(job, vectorMatches);
 * // rankedMatches.rankedCandidates[0] is the best match
 * ```
 */
export async function rankMatchesWithClaude(
  job: JobSubmission,
  candidates: NetworkProfile[]
): Promise<RankingResult> {
  if (candidates.length === 0) {
    return {
      rankedCandidates: [],
      overallAnalysis: 'No candidates provided for ranking.',
    };
  }

  // Format job and candidates for Claude
  const jobDescription = formatJobForClaude(job);
  const candidateDescriptions = candidates
    .map((candidate, index) => formatCandidateForClaude(candidate, index))
    .join('\n');

  const systemPrompt = `You are an expert talent matcher for a creative technologist collective. Your job is to analyze job requirements and rank candidates based on their fit.

When evaluating candidates, consider:
1. **Explicit Skills**: Skills directly listed in their profile that match job requirements
2. **Inferred Skills**: Skills that can be reasonably inferred from their projects, portfolio, or experience
3. **Focus Area Alignment**: How well their specializations match the job's needs
4. **Project Relevance**: Whether their past work demonstrates relevant experience
5. **Availability & Location**: Whether their availability and location preferences align with the job

Be thorough but fair. Look for both obvious and non-obvious matches. A candidate might be excellent for a role even if they don't list every required skill, if their portfolio demonstrates relevant capability.

Important:
- Match scores should reflect genuine fit, not just keyword matching
- Provide specific, actionable reasoning that explains WHY each candidate is a good/poor fit
- Identify skills from portfolio content that candidates may not have explicitly listed
- Be honest about weaknesses or potential concerns
- Rank candidates in order of best fit (highest score first)`;

  const userPrompt = `# Job Specification
${jobDescription}

# Candidates to Evaluate
${candidateDescriptions}

Please analyze each candidate's fit for this job and return a ranked list with detailed reasoning. Focus on:
- Specific skills that match (both explicit and inferred from their work)
- Relevant project experience
- Any concerns or potential mismatches
- A match score from 0-100 where:
  - 90-100: Exceptional fit, highly recommend
  - 70-89: Strong fit, good candidate
  - 50-69: Moderate fit, could work with some gaps
  - 30-49: Weak fit, significant gaps
  - 0-29: Poor fit, not recommended`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { object } = await generateObject({
        model: anthropic('claude-sonnet-4-20250514'),
        schema: RankingResponseSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });

      // Map the response to our return type
      return {
        rankedCandidates: object.rankedCandidates.map((candidate) => ({
          profileId: candidate.profileId,
          matchScore: candidate.matchScore,
          matchReasoning: candidate.matchReasoning,
          skillMatches: candidate.skillMatches.map((skill) => ({
            skill: skill.skill,
            relevance: skill.relevance,
            fromProfile: skill.fromProfile,
            fromPortfolio: skill.fromPortfolio,
          })),
        })),
        overallAnalysis: object.overallAnalysis,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation or auth errors
      if (
        lastError.message.includes('invalid') ||
        lastError.message.includes('API key') ||
        lastError.message.includes('authentication')
      ) {
        throw lastError;
      }

      // Log retry attempt
      console.warn(
        `Claude ranking attempt ${attempt}/${MAX_RETRIES} failed:`,
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
    `Failed to rank candidates with Claude after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}
