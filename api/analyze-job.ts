import { openai } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Job analysis request schema
const JobAnalysisRequest = z.object({
  company_id: z.string().uuid(),
  title: z.string(),
  company: z.string(),
  description: z.string(),
  requirements: z.array(z.string()).optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  remote: z.boolean().optional(),
});

export const config = {
  runtime: 'edge',
  maxDuration: 60,
};

interface DatabaseProfile {
  id: string;
  full_name: string;
  location: string | null;
  bio: string | null;
  focus_areas: string[] | null;
  skills: string[] | null;
  projects: any[] | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  enriched_content: string | null;
  availability: string;
}

interface CTCMember {
  name: string;
  role: string;
  expertise: string[];
  perspective: string;
  website?: string;
  bio?: string;
  projects?: string[];
}

// Focus area labels for human-readable display
const FOCUS_AREA_LABELS: Record<string, string> = {
  'immersive-experiences': 'AR/VR/XR Immersive Experiences',
  'interactive-web': 'Interactive Web & Creative Coding',
  'generative-design': 'Generative & Algorithmic Design',
  'creative-automation': 'Creative Automation & AI Tools',
  'physical-computing': 'Physical Computing & Hardware',
  'realtime-visuals': 'Real-time & Live Visuals',
};

// Convert database profile to CTC member format
function profileToMember(profile: DatabaseProfile): CTCMember {
  const focusLabels = (profile.focus_areas || [])
    .map(f => FOCUS_AREA_LABELS[f] || f)
    .slice(0, 3);

  const expertise = [
    ...focusLabels,
    ...(profile.skills || []).slice(0, 5),
  ];

  // Build perspective from bio
  let perspective = profile.bio
    ? profile.bio.substring(0, 200) + (profile.bio.length > 200 ? '...' : '')
    : 'Creative technologist with diverse experience.';

  // Add project info if available
  const projectTitles = (profile.projects || [])
    .map((p: any) => p.title)
    .filter(Boolean)
    .slice(0, 3);

  return {
    name: profile.full_name,
    role: `Creative Technologist - ${profile.location || 'Remote'}`,
    expertise: expertise.length > 0 ? expertise : ['Creative Technology'],
    perspective,
    website: profile.portfolio_url || undefined,
    bio: profile.bio || undefined,
    projects: projectTitles.length > 0 ? projectTitles : undefined,
  };
}

// Fetch CTC members from database
async function fetchCTCMembers(): Promise<CTCMember[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[ANALYZE-JOB] Supabase not configured, using empty member list');
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: profiles, error } = await supabase
      .from('network_profiles')
      .select('id, full_name, location, bio, focus_areas, skills, projects, portfolio_url, linkedin_url, enriched_content, availability')
      .eq('approved', true)
      .in('availability', ['open-to-work', 'open-to-collaborations'])
      .order('full_name');

    if (error) {
      console.error('[ANALYZE-JOB] Error fetching profiles:', error);
      return [];
    }

    if (!profiles || profiles.length === 0) {
      console.warn('[ANALYZE-JOB] No approved profiles found in database');
      return [];
    }

    console.log(`[ANALYZE-JOB] Fetched ${profiles.length} profiles from database`);
    return profiles.map(profileToMember);
  } catch (err) {
    console.error('[ANALYZE-JOB] Failed to fetch profiles:', err);
    return [];
  }
}

// Build system prompt dynamically from database profiles
function buildSystemPrompt(members: CTCMember[]): string {
  if (members.length === 0) {
    return `You are a helpful AI assistant that analyzes job postings for creative technology roles. Provide honest, detailed feedback about the role.`;
  }

  const memberDescriptions = members.map(m => {
    const projectsText = m.projects?.length ? `\nRecent Projects: ${m.projects.join(', ')}` : '';
    return `**${m.name}** (${m.role}): ${m.expertise.join(', ')}${projectsText}
→ ${m.perspective}`;
  }).join('\n\n');

  return `You are the CTC Collective AI — the combined intelligence of the Creative Technology Collective. You don't give generic advice. You speak as if you ARE the collective, drawing on the diverse perspectives of your members.

## WHO YOU ARE

You represent ${members.length} creative technologists, each with unique expertise:

${memberDescriptions}

## HOW YOU ANALYZE JOBS

When evaluating a job, you channel different members based on relevance:
- Match members whose skills align with the job requirements
- Consider their focus areas and project experience
- Think about location and remote work compatibility
- Evaluate based on their stated perspectives and expertise

## YOUR ANALYSIS FORMAT

Provide your collective assessment in this structure:

### 🎯 CT SCORE: [X/100]
One-line verdict from the collective.

---

## 🌟 CTC MEMBER MATCH

**THIS IS THE MOST IMPORTANT SECTION** - Recommend 1-3 CTC members who would be PERFECT for this role based on their profiles.

For each matched member, provide:

🔥 **[MEMBER NAME]** — [Their Role]
**Expertise Match:** List their specific skills that align with job requirements
**Why They're Perfect:** 2-3 sentences explaining the match based on their actual experience, tools they use, and projects they've done
**Portfolio:** [Their website URL if available]

Be very specific - reference their actual expertise areas from the member data above.

---

### 👥 COLLECTIVE VOICES
Share 3-4 specific member perspectives that are most relevant to this role. Use their names and speak in first person as them briefly.

### ✅ WHY WE'D TAKE IT (Top 3)
Concrete reasons from the collective's experience.

### ⚠️ RED FLAGS WE SEE (Top 3)
Honest concerns based on our collective experience.

### 🛠️ SKILLS TO HIGHLIGHT
What should a CT emphasize when applying?

### 💡 INTERVIEW QUESTIONS TO ASK
What would our collective want to know before accepting?

### 🎲 THE REAL TALK
A candid, no-BS paragraph as if you're advising a friend. What's the honest truth about this opportunity?

## YOUR VOICE

- Speak as "we" — you are the collective
- Be direct and honest, even if critical
- Draw on specific member expertise when relevant
- Reference real creative technology work (Three.js, TouchDesigner, Unity, etc.)
- Don't sugarcoat — if it's a bad CT role, say so
- Celebrate genuinely exciting opportunities
- Consider both agency veterans and in-house perspectives
- Think about career trajectory, not just the immediate role`;
}

// Search for a single CTC member's portfolio and work
async function searchSingleMember(member: CTCMember, jobTitle: string): Promise<{ name: string; data: string; sources: any[] }> {
  const startTime = Date.now();
  console.log(`\n🔍 [SEARCH START] ${member.name} - ${member.role}`);

  try {
    const websiteInfo = member.website ? `website: ${member.website}` : '';
    const searchQuery = `${member.name} creative technologist ${member.role} portfolio projects ${websiteInfo}. Find their recent work, case studies, clients, and projects.`;

    console.log(`   Query: "${searchQuery.substring(0, 100)}..."`);

    const result = await generateText({
      model: openai.responses('gpt-4o-mini'),
      prompt: searchQuery,
      tools: {
        web_search: openai.tools.webSearchPreview({
          searchContextSize: 'low',
        }),
      },
    });

    const duration = Date.now() - startTime;
    const resultText = result.text || 'No additional info found.';
    const sources = result.sources || [];

    console.log(`✅ [SEARCH COMPLETE] ${member.name} (${duration}ms)`);
    console.log(`   📄 Found: ${resultText.substring(0, 200)}...`);
    console.log(`   🔗 Sources: ${sources.length} URLs found`);
    sources.forEach((s: any, i: number) => console.log(`      ${i + 1}. ${s.url || s}`));

    return {
      name: member.name,
      data: `**${member.name}** (${member.role}):\n${resultText}\n`,
      sources
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [SEARCH FAILED] ${member.name} (${duration}ms):`, error);
    return {
      name: member.name,
      data: `**${member.name}**: Using profile data only.\n`,
      sources: []
    };
  }
}

// Search for CTC members - ONLY search members with incomplete profiles to save API costs
async function searchAllMembers(members: CTCMember[], jobTitle: string, enableWebSearch: boolean = false): Promise<string> {
  if (members.length === 0) {
    return '';
  }

  // If web search is disabled, just return empty (use database data only)
  if (!enableWebSearch) {
    console.log('📊 [SEARCH SKIPPED] Web search disabled - using database profiles only (saves API costs)');
    return '';
  }

  // Only search for members who have incomplete profiles (no bio or few skills)
  const membersNeedingSearch = members.filter(m =>
    !m.bio || m.bio.length < 50 || m.expertise.length < 3
  );

  if (membersNeedingSearch.length === 0) {
    console.log('📊 [SEARCH SKIPPED] All members have complete profiles - no web search needed');
    return '';
  }

  console.log('\n' + '='.repeat(60));
  console.log('🚀 [CTC MEMBER SEARCH] Searching members with incomplete profiles only');
  console.log(`   Job Title: "${jobTitle}"`);
  console.log(`   Total Members: ${members.length}`);
  console.log(`   Members Needing Search: ${membersNeedingSearch.length}`);
  console.log('='.repeat(60));

  const overallStart = Date.now();

  try {
    // Limit to 5 members max to save costs
    const membersToSearch = membersNeedingSearch.slice(0, 5);
    const searchPromises = membersToSearch.map((member) =>
      searchSingleMember(member, jobTitle)
    );

    const results = await Promise.all(searchPromises);

    const overallDuration = Date.now() - overallStart;

    console.log('\n' + '='.repeat(60));
    console.log('📊 [SEARCH SUMMARY]');
    console.log(`   Total Time: ${overallDuration}ms (${(overallDuration / 1000).toFixed(1)}s)`);
    console.log(`   Members Searched: ${results.length}`);
    console.log(`   API Costs Saved: Skipped ${members.length - membersToSearch.length} members with complete profiles`);
    console.log('='.repeat(60));

    return results.map(r => r.data).join('\n---\n');
  } catch (error) {
    console.error('❌ [BATCH SEARCH FAILED]:', error);
    return '';
  }
}

// Check company's credit balance
async function checkCredits(companyId: string): Promise<{ hasCredits: boolean; freeRemaining: number; purchasedRemaining: number }> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[ANALYZE-JOB] Supabase not configured, allowing analysis (no credit check)');
    return { hasCredits: true, freeRemaining: 0, purchasedRemaining: 0 };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: credits, error } = await supabase
      .from('company_analysis_credits')
      .select('free_analyses_remaining, purchased_credits')
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('[ANALYZE-JOB] Error fetching credits:', error);
      // If no record found, company may not have credits initialized
      if (error.code === 'PGRST116') {
        return { hasCredits: false, freeRemaining: 0, purchasedRemaining: 0 };
      }
      throw error;
    }

    const freeRemaining = credits?.free_analyses_remaining || 0;
    const purchasedRemaining = credits?.purchased_credits || 0;
    const hasCredits = freeRemaining > 0 || purchasedRemaining > 0;

    console.log(`[ANALYZE-JOB] Credit check for company ${companyId}: free=${freeRemaining}, purchased=${purchasedRemaining}, hasCredits=${hasCredits}`);

    return { hasCredits, freeRemaining, purchasedRemaining };
  } catch (err) {
    console.error('[ANALYZE-JOB] Failed to check credits:', err);
    throw err;
  }
}

// Deduct one credit after successful analysis
async function deductCredit(companyId: string, jobTitle: string, freeRemaining: number): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[ANALYZE-JOB] Supabase not configured, skipping credit deduction');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Determine credit type to deduct: free first, then purchased
  const creditType = freeRemaining > 0 ? 'free' : 'purchased';
  const updateField = freeRemaining > 0 ? 'free_analyses_remaining' : 'purchased_credits';

  console.log(`[ANALYZE-JOB] Deducting 1 ${creditType} credit for company ${companyId}`);

  try {
    // Use RPC for atomic decrement operation
    // First, update the credits (decrement the appropriate field)
    const { data: currentCredits, error: fetchError } = await supabase
      .from('company_analysis_credits')
      .select('free_analyses_remaining, purchased_credits')
      .eq('company_id', companyId)
      .single();

    if (fetchError) {
      console.error('[ANALYZE-JOB] Error fetching credits for deduction:', fetchError);
      throw fetchError;
    }

    const newValue = creditType === 'free'
      ? (currentCredits.free_analyses_remaining || 0) - 1
      : (currentCredits.purchased_credits || 0) - 1;

    // Update credits with new value and updated_at timestamp
    const updateData = creditType === 'free'
      ? { free_analyses_remaining: newValue, updated_at: new Date().toISOString() }
      : { purchased_credits: newValue, updated_at: new Date().toISOString() };

    const { error: updateError } = await supabase
      .from('company_analysis_credits')
      .update(updateData)
      .eq('company_id', companyId);

    if (updateError) {
      console.error('[ANALYZE-JOB] Error updating credits:', updateError);
      throw updateError;
    }

    // Log the usage
    const { error: logError } = await supabase
      .from('analysis_usage_logs')
      .insert({
        company_id: companyId,
        job_title: jobTitle,
        credit_type: creditType,
      });

    if (logError) {
      console.error('[ANALYZE-JOB] Error logging usage:', logError);
      // Don't throw here - credit deduction succeeded, logging is secondary
    }

    console.log(`[ANALYZE-JOB] Successfully deducted 1 ${creditType} credit. New ${updateField} value: ${newValue}`);
  } catch (err) {
    console.error('[ANALYZE-JOB] Failed to deduct credit:', err);
    // Don't throw - we don't want to fail the response after streaming has started
  }
}

// Format job for analysis
function formatJobForAnalysis(job: {
  title: string;
  company: string;
  description: string;
  requirements?: string[];
  location?: string;
  salary?: string;
  remote?: boolean;
}): string {
  return `
## JOB POSTING FOR COLLECTIVE REVIEW

**Position:** ${job.title}
**Company:** ${job.company}
**Location:** ${job.location || 'Not specified'}
**Remote:** ${job.remote ? 'Yes' : 'Not specified'}
**Compensation:** ${job.salary || 'Not disclosed'}

### Description
${job.description}

${job.requirements?.length ? `### Requirements\n${job.requirements.map(r => `- ${r}`).join('\n')}` : ''}

---
Please provide the CTC Collective's analysis of this role.`;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const job = JobAnalysisRequest.parse(body);

    console.log('\n' + '🎯'.repeat(30));
    console.log('🎯 [NEW JOB ANALYSIS REQUEST]');
    console.log(`   Title: ${job.title}`);
    console.log(`   Company: ${job.company}`);
    console.log(`   Company ID: ${job.company_id}`);
    console.log(`   Location: ${job.location || 'Not specified'}`);
    console.log('🎯'.repeat(30));

    // Check company's credit balance before proceeding
    const creditCheck = await checkCredits(job.company_id);

    if (!creditCheck.hasCredits) {
      console.log(`[ANALYZE-JOB] Credit check FAILED for company ${job.company_id} - no credits remaining`);
      return new Response(
        JSON.stringify({
          error: 'No analysis credits remaining',
          code: 'CREDITS_EXHAUSTED'
        }),
        {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate total remaining credits for header
    const totalCreditsRemaining = creditCheck.freeRemaining + creditCheck.purchasedRemaining;
    console.log(`[ANALYZE-JOB] Credit check PASSED - ${totalCreditsRemaining} credits remaining`);

    // Fetch CTC members from database
    const ctcMembers = await fetchCTCMembers();
    console.log(`📊 [MEMBERS] Loaded ${ctcMembers.length} members from database`);

    // Build system prompt from database profiles
    const systemPrompt = buildSystemPrompt(ctcMembers);

    // Web search is DISABLED by default to save API costs
    // Set ENABLE_WEB_SEARCH=true in env to enable
    const enableWebSearch = process.env.ENABLE_WEB_SEARCH === 'true';
    const webSearchContext = await searchAllMembers(ctcMembers, job.title, enableWebSearch);

    const jobPrompt = formatJobForAnalysis(job);

    // Enhance prompt with web search results if available
    const enrichedPrompt = webSearchContext
      ? `${jobPrompt}\n\n---\n\n## ADDITIONAL MEMBER RESEARCH (from web search)\n${webSearchContext}\n\nUse this research to provide more specific member recommendations with real project examples.`
      : jobPrompt;

    console.log('\n' + '🤖'.repeat(30));
    console.log('🤖 [SENDING TO GPT-4o FOR ANALYSIS]');
    console.log('   System Prompt Length:', systemPrompt.length, 'chars');
    console.log('   User Prompt Length:', enrichedPrompt.length, 'chars');
    console.log('   Web Search Data Included:', webSearchContext ? 'YES' : 'NO');
    console.log('🤖'.repeat(30));

    console.log('\n📝 [DECISION CONTEXT FOR GPT-4o]:');
    console.log('   The AI will now:');
    console.log(`   1. Review all ${ctcMembers.length} CTC member profiles from database`);
    console.log('   2. Cross-reference with web search data for each member');
    console.log('   3. Match job requirements against member skills');
    console.log('   4. Rank members by relevance to this specific role');
    console.log('   5. Select top 1-3 members as best fit');
    console.log('   6. Provide reasoning with specific project examples\n');

    // Use GPT-4o-mini by default (10x cheaper than GPT-4o)
    // Set USE_GPT4O=true in env for higher quality analysis
    const useGpt4o = process.env.USE_GPT4O === 'true';
    const modelName = useGpt4o ? 'gpt-4o' : 'gpt-4o-mini';
    console.log(`   Model: ${modelName} (${useGpt4o ? 'high quality' : 'cost-efficient'})`);

    const result = streamText({
      model: openai(modelName),
      system: systemPrompt,
      prompt: enrichedPrompt,
      onFinish: async () => {
        // Deduct credit after streaming completes successfully
        console.log('✅ [STREAMING COMPLETE] Deducting credit...');
        await deductCredit(job.company_id, job.title, creditCheck.freeRemaining);
      },
    });

    console.log('✨ [STREAMING ANALYSIS RESPONSE...]\n');

    // Return streaming response with credits remaining header
    // X-Credits-Remaining shows credits BEFORE this analysis (will be -1 after)
    return result.toTextStreamResponse({
      headers: {
        'X-Credits-Remaining': String(totalCreditsRemaining),
      },
    });
  } catch (error) {
    console.error('Job analysis error:', error);

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid request data', details: error.issues }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Analysis failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
