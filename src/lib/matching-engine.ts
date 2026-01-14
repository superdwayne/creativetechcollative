/**
 * Main Job Matching Engine
 *
 * Orchestrates the full matching pipeline:
 * 1. Fetches job submission from database
 * 2. Generates embedding for job spec
 * 3. Performs vector similarity search (top 20 candidates)
 * 4. Calls Claude ranking for detailed analysis (top 10)
 * 5. Creates job_matches records in database
 * 6. Updates job status to 'matched'
 */

import { generateJobEmbedding } from './embeddings';
import { rankMatchesWithClaude } from './claude-ranking';
import {
  getJobSubmissionById,
  updateJobSubmissionStatus,
  findSimilarProfiles,
  createJobMatches,
} from './supabase';
import type { JobMatch, JobMatchCreateData } from '@/types/job-matching';

/**
 * Number of candidates to retrieve from vector search
 */
const VECTOR_SEARCH_LIMIT = 20;

/**
 * Number of top candidates to send to Claude for detailed analysis
 */
const CLAUDE_ANALYSIS_LIMIT = 10;

/**
 * Minimum similarity threshold for vector search (0-1)
 * Lower threshold to ensure we get enough candidates
 */
const SIMILARITY_THRESHOLD = 0.3;

/**
 * Result of the matching engine operation
 */
export interface MatchingResult {
  success: boolean;
  matches?: JobMatch[];
  error?: string;
  /** Number of candidates found via vector search */
  vectorCandidatesCount?: number;
  /** Number of candidates analyzed by Claude */
  claudeAnalyzedCount?: number;
  /** Overall analysis from Claude */
  overallAnalysis?: string;
}

/**
 * Runs the full job matching pipeline for a job submission.
 *
 * Pipeline steps:
 * 1. Fetch job submission from database
 * 2. Generate embedding for job specification
 * 3. Perform vector similarity search to find top 20 candidates
 * 4. Send top 10 candidates to Claude for detailed analysis and ranking
 * 5. Create job_matches records in database
 * 6. Update job status to 'matched'
 *
 * @param jobId - The UUID of the job submission to match
 * @returns MatchingResult with created matches or error information
 *
 * @example
 * ```typescript
 * const result = await runJobMatching('job-uuid-here');
 * if (result.success) {
 *   console.log(`Found ${result.matches.length} matches`);
 *   console.log('Analysis:', result.overallAnalysis);
 * } else {
 *   console.error('Matching failed:', result.error);
 * }
 * ```
 */
export async function runJobMatching(jobId: string): Promise<MatchingResult> {
  try {
    // Step 1: Fetch job submission from database
    console.log(`[MatchingEngine] Fetching job submission: ${jobId}`);
    const job = await getJobSubmissionById(jobId);

    if (!job) {
      return {
        success: false,
        error: `Job submission not found: ${jobId}`,
      };
    }

    // Step 2: Generate embedding for job specification
    console.log(`[MatchingEngine] Generating embedding for job: ${job.title}`);
    let jobEmbedding: number[];
    try {
      jobEmbedding = await generateJobEmbedding(job);
    } catch (embeddingError) {
      return {
        success: false,
        error: `Failed to generate job embedding: ${embeddingError instanceof Error ? embeddingError.message : String(embeddingError)}`,
      };
    }

    // Step 3: Perform vector similarity search (top 20 candidates)
    console.log(`[MatchingEngine] Performing vector similarity search...`);
    const vectorCandidates = await findSimilarProfiles(
      jobEmbedding,
      VECTOR_SEARCH_LIMIT,
      SIMILARITY_THRESHOLD
    );

    console.log(`[MatchingEngine] Found ${vectorCandidates.length} vector candidates`);

    if (vectorCandidates.length === 0) {
      // No candidates found - update status and return empty result
      await updateJobSubmissionStatus(jobId, 'matched');
      return {
        success: true,
        matches: [],
        vectorCandidatesCount: 0,
        claudeAnalyzedCount: 0,
        overallAnalysis: 'No candidates found with sufficient similarity to the job requirements.',
      };
    }

    // Step 4: Send top candidates to Claude for detailed analysis
    const candidatesForClaude = vectorCandidates.slice(0, CLAUDE_ANALYSIS_LIMIT);
    console.log(`[MatchingEngine] Sending ${candidatesForClaude.length} candidates to Claude for analysis...`);

    let rankingResult;
    try {
      rankingResult = await rankMatchesWithClaude(job, candidatesForClaude);
    } catch (claudeError) {
      return {
        success: false,
        error: `Failed to rank candidates with Claude: ${claudeError instanceof Error ? claudeError.message : String(claudeError)}`,
        vectorCandidatesCount: vectorCandidates.length,
      };
    }

    console.log(`[MatchingEngine] Claude ranked ${rankingResult.rankedCandidates.length} candidates`);

    // Step 5: Create job_matches records in database
    // Build match records with both Claude scores and vector similarity scores
    const matchDataList: JobMatchCreateData[] = rankingResult.rankedCandidates.map((ranked) => {
      // Find the vector similarity score for this candidate
      const vectorCandidate = vectorCandidates.find((c) => c.id === ranked.profileId);
      const vectorSimilarity = vectorCandidate?.similarityScore ?? null;

      return {
        jobId,
        profileId: ranked.profileId,
        matchScore: ranked.matchScore,
        matchReasoning: ranked.matchReasoning,
        skillMatches: ranked.skillMatches,
        vectorSimilarity: vectorSimilarity ?? undefined,
      };
    });

    console.log(`[MatchingEngine] Creating ${matchDataList.length} match records...`);
    const createResult = await createJobMatches(jobId, matchDataList);

    if (!createResult.success) {
      return {
        success: false,
        error: `Failed to create match records: ${createResult.error}`,
        vectorCandidatesCount: vectorCandidates.length,
        claudeAnalyzedCount: rankingResult.rankedCandidates.length,
      };
    }

    // Step 6: Update job status to 'matched'
    console.log(`[MatchingEngine] Updating job status to 'matched'...`);
    const statusResult = await updateJobSubmissionStatus(jobId, 'matched');

    if (!statusResult.success) {
      // Matches were created but status update failed - log warning but don't fail
      console.warn(`[MatchingEngine] Warning: Failed to update job status: ${statusResult.error}`);
    }

    console.log(`[MatchingEngine] Matching complete. Created ${createResult.jobMatches?.length ?? 0} matches.`);

    return {
      success: true,
      matches: createResult.jobMatches,
      vectorCandidatesCount: vectorCandidates.length,
      claudeAnalyzedCount: rankingResult.rankedCandidates.length,
      overallAnalysis: rankingResult.overallAnalysis,
    };
  } catch (error) {
    console.error('[MatchingEngine] Unexpected error:', error);
    return {
      success: false,
      error: `Unexpected error during matching: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
