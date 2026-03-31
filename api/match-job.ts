import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit, RateLimitError, rateLimitResponse, getClientIp } from './_lib/rate-limit.js';
import { isAdmin } from './_lib/admin.js';

export const config = {
  runtime: 'edge',
};

// Request schema for job matching
const MatchJobRequest = z.object({
  jobId: z.string().uuid(),
});

// Types for the matching engine response
interface SkillMatch {
  skill: string;
  fromProfile: boolean;
  fromPortfolio: boolean;
}

interface JobMatch {
  id: string;
  jobId: string;
  profileId: string;
  matchScore: number;
  matchReasoning: string;
  skillMatches: SkillMatch[] | null;
  vectorSimilarity: number | null;
  adminApproved: boolean | null;
  memberNotified: boolean;
  memberResponse: string | null;
  createdAt: string;
}

interface MatchingResult {
  success: boolean;
  matches?: JobMatch[];
  error?: string;
  vectorCandidatesCount?: number;
  claudeAnalyzedCount?: number;
  overallAnalysis?: string;
}

// Admin check imported from ./_lib/admin.ts

/**
 * Check if a user owns the company that submitted the job
 */
async function isJobOwner(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  jobId: string
): Promise<boolean> {
  // First get the job to find its company_id
  const { data: job, error: jobError } = await supabase
    .from('job_submissions')
    .select('company_id')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    return false;
  }

  // Then check if the user owns that company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('id', job.company_id)
    .eq('user_id', userId)
    .single();

  return !companyError && !!company;
}

/**
 * Run the job matching pipeline
 * This is implemented inline to work in Edge Function context
 */
async function runJobMatching(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  openaiApiKey: string,
  anthropicApiKey: string
): Promise<MatchingResult> {
  // Reduced limits to save API costs
  const VECTOR_SEARCH_LIMIT = 15;  // Was 20
  const CLAUDE_ANALYSIS_LIMIT = 8;  // Was 10
  const SIMILARITY_THRESHOLD = 0.35; // Was 0.3 - slightly higher to filter out weaker matches

  try {
    // Step 1: Fetch job submission from database
    console.log(`[MatchJob] Fetching job submission: ${jobId}`);
    const { data: job, error: jobError } = await supabase
      .from('job_submissions')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return {
        success: false,
        error: `Job submission not found: ${jobId}`,
      };
    }

    // Step 2: Generate embedding for job specification
    console.log(`[MatchJob] Generating embedding for job: ${job.title}`);

    // Build embedding text from job data
    const embeddingParts: string[] = [];
    embeddingParts.push(`Job Title: ${job.title}`);
    embeddingParts.push(`Description: ${job.description}`);
    if (job.requirements) embeddingParts.push(`Requirements: ${job.requirements}`);
    if (job.preferred_skills?.length) embeddingParts.push(`Preferred Skills: ${job.preferred_skills.join(', ')}`);
    if (job.focus_areas?.length) embeddingParts.push(`Focus Areas: ${job.focus_areas.join(', ')}`);
    if (job.project_type) embeddingParts.push(`Project Type: ${job.project_type}`);
    if (job.remote_preference) embeddingParts.push(`Remote Preference: ${job.remote_preference}`);
    if (job.location) embeddingParts.push(`Location: ${job.location}`);
    if (job.timeline) embeddingParts.push(`Timeline: ${job.timeline}`);

    const embeddingText = embeddingParts.join('\n\n');

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
      return {
        success: false,
        error: `OpenAI API error: ${errorData.error?.message || embeddingResponse.statusText}`,
      };
    }

    const embeddingData = await embeddingResponse.json();
    const jobEmbedding = embeddingData.data?.[0]?.embedding;

    if (!jobEmbedding || !Array.isArray(jobEmbedding)) {
      return {
        success: false,
        error: 'Invalid embedding response from OpenAI',
      };
    }

    // Step 3: Perform vector similarity search
    console.log(`[MatchJob] Performing vector similarity search...`);
    const embeddingString = `[${jobEmbedding.join(',')}]`;

    const { data: vectorCandidates, error: searchError } = await supabase.rpc(
      'find_similar_profiles',
      {
        query_embedding: embeddingString,
        match_limit: VECTOR_SEARCH_LIMIT,
        similarity_threshold: SIMILARITY_THRESHOLD,
      }
    );

    if (searchError) {
      return {
        success: false,
        error: `Vector search failed: ${searchError.message}`,
      };
    }

    console.log(`[MatchJob] Found ${vectorCandidates?.length ?? 0} vector candidates`);

    if (!vectorCandidates || vectorCandidates.length === 0) {
      // No candidates found - update status and return empty result
      await supabase
        .from('job_submissions')
        .update({ status: 'matched', updated_at: new Date().toISOString() })
        .eq('id', jobId);

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
    console.log(`[MatchJob] Sending ${candidatesForClaude.length} candidates to Claude for analysis...`);

    // Build prompt for Claude
    const jobDescription = `
## Job: ${job.title}

**Description:** ${job.description}

**Requirements:** ${job.requirements || 'Not specified'}

**Preferred Skills:** ${job.preferred_skills?.join(', ') || 'Not specified'}

**Focus Areas:** ${job.focus_areas?.join(', ') || 'Not specified'}

**Project Type:** ${job.project_type}

**Remote Preference:** ${job.remote_preference}

**Location:** ${job.location || 'Not specified'}

**Timeline:** ${job.timeline || 'Not specified'}
`.trim();

    const candidateDescriptions = candidatesForClaude.map((candidate: Record<string, unknown>, index: number) => {
      const enrichedContent = candidate.enriched_content as string | null;
      const truncatedPortfolio = enrichedContent
        ? enrichedContent.substring(0, 2000) + (enrichedContent.length > 2000 ? '...' : '')
        : null;

      return `
### Candidate ${index + 1} (ID: ${candidate.id})
**Name:** ${candidate.full_name}
**Bio:** ${candidate.bio || 'Not provided'}
**Skills:** ${(candidate.skills as string[] | null)?.join(', ') || 'Not specified'}
**Focus Areas:** ${(candidate.focus_areas as string[] | null)?.join(', ') || 'Not specified'}
**Location:** ${candidate.location || 'Not specified'}
**Availability:** ${candidate.availability_status}
**Vector Similarity Score:** ${((candidate.similarity_score as number) * 100).toFixed(1)}%
${truncatedPortfolio ? `**Portfolio Content:**\n${truncatedPortfolio}` : ''}
`.trim();
    }).join('\n\n---\n\n');

    const claudePrompt = `You are an expert recruiter analyzing job candidates for a creative technology role. Your task is to rank candidates based on how well they match the job requirements.

${jobDescription}

## Candidates

${candidateDescriptions}

## Instructions

Analyze each candidate and provide:
1. A match score from 0-100 (100 = perfect match)
2. Detailed reasoning explaining why they're a good or poor fit
3. Specific skills that match the job requirements

Consider:
- Explicit skills listed in their profile
- Implicit skills inferred from their portfolio or project descriptions
- Experience level and focus areas
- Location and remote work compatibility

Return your analysis as a JSON object with this exact structure:
{
  "rankedCandidates": [
    {
      "profileId": "uuid",
      "matchScore": 85,
      "matchReasoning": "Detailed explanation...",
      "skillMatches": [
        {"skill": "React", "fromProfile": true, "fromPortfolio": false},
        {"skill": "3D Visualization", "fromProfile": false, "fromPortfolio": true}
      ]
    }
  ],
  "overallAnalysis": "Summary of the candidate pool quality and recommendations"
}

Order candidates by matchScore descending (best matches first). Include all candidates in your response.`;

    // Use Claude Haiku for cost efficiency (much cheaper than Sonnet)
    // Set USE_CLAUDE_SONNET=true in env for higher quality matching
    const useClaudeSonnet = process.env.USE_CLAUDE_SONNET === 'true';
    const claudeModel = useClaudeSonnet ? 'claude-sonnet-4-20250514' : 'claude-3-5-haiku-20241022';
    console.log(`[MatchJob] Using model: ${claudeModel}`);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: claudeModel,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: claudePrompt,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.json().catch(() => ({}));
      return {
        success: false,
        error: `Claude API error: ${errorData.error?.message || claudeResponse.statusText}`,
        vectorCandidatesCount: vectorCandidates.length,
      };
    }

    const claudeData = await claudeResponse.json();
    const claudeText = claudeData.content?.[0]?.text;

    if (!claudeText) {
      return {
        success: false,
        error: 'Invalid response from Claude API',
        vectorCandidatesCount: vectorCandidates.length,
      };
    }

    // Parse Claude's JSON response
    let rankingResult;
    try {
      // Extract JSON from the response (Claude might wrap it in markdown code blocks)
      const jsonMatch = claudeText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      rankingResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      return {
        success: false,
        error: `Failed to parse Claude response: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        vectorCandidatesCount: vectorCandidates.length,
      };
    }

    console.log(`[MatchJob] Claude ranked ${rankingResult.rankedCandidates?.length ?? 0} candidates`);

    // Step 5: Create job_matches records in database
    const matchRecords = (rankingResult.rankedCandidates || []).map((ranked: {
      profileId: string;
      matchScore: number;
      matchReasoning: string;
      skillMatches?: SkillMatch[];
    }) => {
      // Find the vector similarity score for this candidate
      const vectorCandidate = vectorCandidates.find((c: Record<string, unknown>) => c.id === ranked.profileId);
      const vectorSimilarity = vectorCandidate?.similarity_score ?? null;

      return {
        job_id: jobId,
        profile_id: ranked.profileId,
        match_score: ranked.matchScore,
        match_reasoning: ranked.matchReasoning,
        skill_matches: ranked.skillMatches || null,
        vector_similarity: vectorSimilarity,
      };
    });

    console.log(`[MatchJob] Creating ${matchRecords.length} match records...`);

    const { data: createdMatches, error: insertError } = await supabase
      .from('job_matches')
      .insert(matchRecords)
      .select();

    if (insertError) {
      return {
        success: false,
        error: `Failed to create match records: ${insertError.message}`,
        vectorCandidatesCount: vectorCandidates.length,
        claudeAnalyzedCount: rankingResult.rankedCandidates?.length ?? 0,
      };
    }

    // Step 6: Update job status to 'matched'
    console.log(`[MatchJob] Updating job status to 'matched'...`);
    const { error: statusError } = await supabase
      .from('job_submissions')
      .update({ status: 'matched', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    if (statusError) {
      console.warn(`[MatchJob] Warning: Failed to update job status: ${statusError.message}`);
    }

    // Convert database records to response format
    const matches: JobMatch[] = (createdMatches || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      jobId: row.job_id as string,
      profileId: row.profile_id as string,
      matchScore: row.match_score as number,
      matchReasoning: row.match_reasoning as string,
      skillMatches: row.skill_matches as SkillMatch[] | null,
      vectorSimilarity: row.vector_similarity as number | null,
      adminApproved: row.admin_approved as boolean | null,
      memberNotified: row.member_notified as boolean,
      memberResponse: row.member_response as string | null,
      createdAt: row.created_at as string,
    }));

    console.log(`[MatchJob] Matching complete. Created ${matches.length} matches.`);

    return {
      success: true,
      matches,
      vectorCandidatesCount: vectorCandidates.length,
      claudeAnalyzedCount: rankingResult.rankedCandidates?.length ?? 0,
      overallAnalysis: rankingResult.overallAnalysis,
    };
  } catch (error) {
    console.error('[MatchJob] Unexpected error:', error);
    return {
      success: false,
      error: `Unexpected error during matching: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export default async function handler(req: Request) {
  // Rate limit: 10 requests per minute per IP (expensive AI calls)
  try {
    checkRateLimit(`match-job:${getClientIp(req)}`, 10, 60_000);
  } catch (err) {
    if (err instanceof RateLimitError) return rateLimitResponse(err);
    throw err;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for required environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!openaiApiKey) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!anthropicApiKey) {
    return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create Supabase client with service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accessToken = authHeader.replace('Bearer ', '');

  // Verify the token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const { jobId } = MatchJobRequest.parse(body);

    console.log(`[MATCH-JOB] Starting matching for job: ${jobId}, user: ${user.id}`);

    // Check if job exists and get its status
    const { data: job, error: jobError } = await supabase
      .from('job_submissions')
      .select('id, status, company_id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Job submission not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate job status - must be 'pending' or 'reviewed'
    if (job.status !== 'pending' && job.status !== 'reviewed') {
      return new Response(
        JSON.stringify({
          error: `Job cannot be matched in current status: ${job.status}. Only jobs with status 'pending' or 'reviewed' can be matched.`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check authorization: must be admin or the company that owns the job
    const userIsAdmin = await isAdmin(user.id, supabase);
    const userIsOwner = await isJobOwner(supabase, user.id, jobId);

    if (!userIsAdmin && !userIsOwner) {
      return new Response(JSON.stringify({ error: 'Not authorized to match this job' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[MATCH-JOB] Authorization passed. Admin: ${userIsAdmin}, Owner: ${userIsOwner}`);

    // Run the matching engine
    const result = await runJobMatching(supabase, jobId, openaiApiKey, anthropicApiKey);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(
      `[MATCH-JOB] Matching completed. Vector candidates: ${result.vectorCandidatesCount}, ` +
      `Claude analyzed: ${result.claudeAnalyzedCount}, Matches created: ${result.matches?.length ?? 0}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        matches: result.matches,
        vectorCandidatesCount: result.vectorCandidatesCount,
        claudeAnalyzedCount: result.claudeAnalyzedCount,
        overallAnalysis: result.overallAnalysis,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[MATCH-JOB] Error:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data', details: error.issues }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Job matching failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
