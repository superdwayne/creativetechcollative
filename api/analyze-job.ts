import { openai } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { z } from 'zod';
import { CTC_COLLECTIVE_SYSTEM_PROMPT, CTC_MEMBERS, formatJobForAnalysis } from './ctc-collective-prompt';

// Job analysis request schema
const JobAnalysisRequest = z.object({
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
};

// Search for a single CTC member's portfolio and work
async function searchSingleMember(member: any, jobTitle: string): Promise<{ name: string; data: string; sources: any[] }> {
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

// Search for ALL CTC members in parallel
async function searchAllMembers(jobTitle: string): Promise<string> {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 [CTC MEMBER SEARCH] Starting parallel search for all members');
  console.log(`   Job Title: "${jobTitle}"`);
  console.log(`   Total Members: ${CTC_MEMBERS.length}`);
  console.log('='.repeat(60));
  
  const overallStart = Date.now();
  
  try {
    // Run all searches in parallel for speed
    const searchPromises = CTC_MEMBERS.map((member: any) => 
      searchSingleMember(member, jobTitle)
    );
    
    const results = await Promise.all(searchPromises);
    
    const overallDuration = Date.now() - overallStart;
    
    // Log summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 [SEARCH SUMMARY]');
    console.log(`   Total Time: ${overallDuration}ms (${(overallDuration / 1000).toFixed(1)}s)`);
    console.log(`   Members Searched: ${results.length}`);
    console.log(`   Members with Data: ${results.filter(r => !r.data.includes('Using profile data only')).length}`);
    console.log('='.repeat(60));
    
    // Log all member data found
    console.log('\n📋 [ALL MEMBER DATA FOUND]:');
    results.forEach((r, i) => {
      console.log(`\n--- Member ${i + 1}: ${r.name} ---`);
      console.log(r.data.substring(0, 500) + (r.data.length > 500 ? '...' : ''));
    });
    
    return results.map(r => r.data).join('\n---\n');
  } catch (error) {
    console.error('❌ [BATCH SEARCH FAILED]:', error);
    return ''; // Fail gracefully
  }
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
    console.log(`   Location: ${job.location || 'Not specified'}`);
    console.log('🎯'.repeat(30));

    // Search for ALL CTC members in parallel
    const webSearchContext = await searchAllMembers(job.title);
    
    const jobPrompt = formatJobForAnalysis(job);
    
    // Enhance prompt with web search results if available
    const enrichedPrompt = webSearchContext 
      ? `${jobPrompt}\n\n---\n\n## ADDITIONAL MEMBER RESEARCH (from web search)\n${webSearchContext}\n\nUse this research to provide more specific member recommendations with real project examples.`
      : jobPrompt;

    console.log('\n' + '🤖'.repeat(30));
    console.log('🤖 [SENDING TO GPT-4o FOR ANALYSIS]');
    console.log('   System Prompt Length:', CTC_COLLECTIVE_SYSTEM_PROMPT.length, 'chars');
    console.log('   User Prompt Length:', enrichedPrompt.length, 'chars');
    console.log('   Web Search Data Included:', webSearchContext ? 'YES' : 'NO');
    console.log('🤖'.repeat(30));
    
    console.log('\n📝 [DECISION CONTEXT FOR GPT-4o]:');
    console.log('   The AI will now:');
    console.log('   1. Review all 22 CTC member profiles (expertise, roles, perspectives)');
    console.log('   2. Cross-reference with web search data for each member');
    console.log('   3. Match job requirements against member skills');
    console.log('   4. Rank members by relevance to this specific role');
    console.log('   5. Select top 1-2 members as best fit');
    console.log('   6. Provide reasoning with specific project examples\n');

    const result = streamText({
      model: openai('gpt-4o'),
      system: CTC_COLLECTIVE_SYSTEM_PROMPT,
      prompt: enrichedPrompt,
    });

    console.log('✨ [STREAMING ANALYSIS RESPONSE...]\n');

    return result.toTextStreamResponse();
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
