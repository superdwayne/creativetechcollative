import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
  maxDuration: 120,
};

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CTFinderRequest {
  messages: Message[];
  attachmentText?: string;
  companyId: string;
}

interface ProfileResult {
  id: string;
  full_name: string;
  location: string;
  bio: string;
  skills: string[];
  focus_areas: string[];
  availability: string;
  portfolio_url: string | null;
  linkedin_url: string | null;
  profile_picture_url: string | null;
  slug: string;
  creative_spectrum: number;
  projects: any[];
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const TOOLS = [
  {
    name: 'search_directory',
    description:
      'Search the CTC creative technology directory by keywords. Matches against names, bios, skills, locations, and focus areas. Use SHORT, focused queries of 1-3 words for best results. For complex requirements, make multiple targeted searches rather than one long query.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Short search keywords (1-3 words). E.g. "React", "machine learning", "London". Avoid long phrases.',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (default 15, max 30)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'filter_by_skills',
    description:
      'Find directory members who have specific skills. Useful for matching technical requirements.',
    input_schema: {
      type: 'object' as const,
      properties: {
        skills: {
          type: 'array',
          items: { type: 'string' },
          description: 'Skills to search for (e.g. ["Three.js", "React", "Unity"])',
        },
        match_all: {
          type: 'boolean',
          description: 'If true, member must have ALL listed skills. If false (default), any match counts.',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 15)',
        },
      },
      required: ['skills'],
    },
  },
  {
    name: 'filter_by_focus_areas',
    description:
      'Find members by their creative technology focus areas (e.g. "Immersive Experiences (AR/VR/XR)", "Creative Coding", "AI & Machine Learning").',
    input_schema: {
      type: 'object' as const,
      properties: {
        focus_areas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Focus areas to filter by',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 15)',
        },
      },
      required: ['focus_areas'],
    },
  },
  {
    name: 'filter_available_members',
    description:
      'Find members who are currently available for work or collaborations.',
    input_schema: {
      type: 'object' as const,
      properties: {
        availability: {
          type: 'string',
          enum: ['open-to-work', 'open-to-collaborations'],
          description: 'Availability status to filter by',
        },
        location: {
          type: 'string',
          description: 'Optional location filter (e.g. "London", "Amsterdam")',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 15)',
        },
      },
      required: ['availability'],
    },
  },
  {
    name: 'get_member_profile',
    description:
      'Get the full profile details for a specific directory member by their ID. Use this to get deeper info about a candidate.',
    input_schema: {
      type: 'object' as const,
      properties: {
        profile_id: {
          type: 'string',
          description: 'The profile UUID',
        },
      },
      required: ['profile_id'],
    },
  },
  {
    name: 'list_directory_skills',
    description:
      'Get a list of all unique skills present across the directory. Useful for understanding what talent is available before searching.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'list_directory_focus_areas',
    description:
      'Get all focus areas represented in the directory. Useful for mapping requirements to available expertise.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_directory_stats',
    description:
      'Get overall statistics about the directory: total members, availability breakdown, top skills, locations.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

// ============================================================================
// TOOL EXECUTION
// ============================================================================

function formatProfile(p: ProfileResult, compact = false): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: p.id,
    name: p.full_name,
    location: p.location,
    skills: (p.skills || []).slice(0, 10),
    focus_areas: p.focus_areas || [],
    availability: p.availability,
    slug: p.slug,
  };

  if (!compact) {
    base.bio = p.bio?.substring(0, 200) || '';
    base.portfolio = p.portfolio_url;
    base.linkedin = p.linkedin_url;
    base.creative_spectrum = p.creative_spectrum;
    base.project_count = p.projects?.length || 0;
    base.projects = (p.projects || []).slice(0, 2).map((proj: any) => ({
      title: proj.title,
      description: proj.description?.substring(0, 100),
    }));
  }

  return base;
}

async function executeTool(
  toolName: string,
  toolInput: Record<string, any>,
  supabase: SupabaseClient
): Promise<string> {
  switch (toolName) {
    case 'search_directory': {
      const { query, limit = 15 } = toolInput;
      const searchLimit = Math.min(limit, 30);

      const words = query
        .split(/\s+/)
        .map((w: string) => w.replace(/[^a-zA-Z0-9]/g, ''))
        .filter((w: string) => w.length > 2);

      let orConditions: string;
      if (words.length <= 1) {
        const q = words[0] || query;
        orConditions = `full_name.ilike.%${q}%,bio.ilike.%${q}%,location.ilike.%${q}%,skills.cs.{"${q}"},focus_areas.cs.{"${q}"}`;
      } else {
        const conditions: string[] = [];
        for (const word of words.slice(0, 6)) {
          conditions.push(`full_name.ilike.%${word}%`);
          conditions.push(`bio.ilike.%${word}%`);
          conditions.push(`skills.cs.{"${word}"}`);
        }
        orConditions = conditions.join(',');
      }

      const { data, error } = await supabase
        .from('network_profiles')
        .select('id, full_name, location, bio, skills, focus_areas, availability, portfolio_url, linkedin_url, profile_picture_url, slug, creative_spectrum, projects')
        .eq('approved', true)
        .neq('membership_type', 'company')
        .or(orConditions)
        .limit(searchLimit);

      if (error) return JSON.stringify({ error: error.message });

      const results = (data || []).map(formatProfile);
      return JSON.stringify({ count: results.length, query, members: results });
    }

    case 'filter_by_skills': {
      const { skills, match_all = false, limit = 15 } = toolInput;
      const searchLimit = Math.min(limit, 30);

      let query = supabase
        .from('network_profiles')
        .select('id, full_name, location, bio, skills, focus_areas, availability, portfolio_url, linkedin_url, profile_picture_url, slug, creative_spectrum, projects')
        .eq('approved', true)
        .neq('membership_type', 'company');

      if (match_all) {
        for (const skill of skills) {
          query = query.contains('skills', [skill]);
        }
      } else {
        const orConditions = skills.map((s: string) => `skills.cs.{"${s}"}`).join(',');
        query = query.or(orConditions);
      }

      const { data, error } = await query.limit(searchLimit);
      if (error) return JSON.stringify({ error: error.message });

      const results = (data || []).map(formatProfile);
      return JSON.stringify({
        count: results.length,
        searched_skills: skills,
        match_mode: match_all ? 'all' : 'any',
        members: results,
      });
    }

    case 'filter_by_focus_areas': {
      const { focus_areas, limit = 15 } = toolInput;
      const searchLimit = Math.min(limit, 30);

      const orConditions = focus_areas
        .map((fa: string) => `focus_areas.cs.{"${fa}"}`)
        .join(',');

      const { data, error } = await supabase
        .from('network_profiles')
        .select('id, full_name, location, bio, skills, focus_areas, availability, portfolio_url, linkedin_url, profile_picture_url, slug, creative_spectrum, projects')
        .eq('approved', true)
        .neq('membership_type', 'company')
        .or(orConditions)
        .limit(searchLimit);

      if (error) return JSON.stringify({ error: error.message });

      const results = (data || []).map(formatProfile);
      return JSON.stringify({
        count: results.length,
        searched_focus_areas: focus_areas,
        members: results,
      });
    }

    case 'filter_available_members': {
      const { availability, location, limit = 15 } = toolInput;
      const searchLimit = Math.min(limit, 30);

      let query = supabase
        .from('network_profiles')
        .select('id, full_name, location, bio, skills, focus_areas, availability, portfolio_url, linkedin_url, profile_picture_url, slug, creative_spectrum, projects')
        .eq('approved', true)
        .neq('membership_type', 'company')
        .eq('availability', availability);

      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      const { data, error } = await query.limit(searchLimit);
      if (error) return JSON.stringify({ error: error.message });

      const results = (data || []).map(formatProfile);
      return JSON.stringify({
        count: results.length,
        filters: { availability, location },
        members: results,
      });
    }

    case 'get_member_profile': {
      const { profile_id } = toolInput;

      const { data, error } = await supabase
        .from('network_profiles')
        .select('id, full_name, location, bio, skills, focus_areas, availability, portfolio_url, linkedin_url, other_social_links, profile_picture_url, slug, creative_spectrum, projects, enriched_content')
        .eq('id', profile_id)
        .eq('approved', true)
        .single();

      if (error || !data) return JSON.stringify({ error: 'Profile not found' });

      let enrichedSummary = null;
      if (data.enriched_content) {
        try {
          const enriched = typeof data.enriched_content === 'string'
            ? JSON.parse(data.enriched_content)
            : data.enriched_content;
          enrichedSummary = {
            summary: enriched.summary,
            workHistory: enriched.workHistory?.slice(0, 5),
            additionalSkills: enriched.additionalSkills,
            notableProjects: enriched.notableProjects,
          };
        } catch { /* ignore parse errors */ }
      }

      return JSON.stringify({
        id: data.id,
        name: data.full_name,
        location: data.location,
        bio: data.bio,
        skills: data.skills || [],
        focus_areas: data.focus_areas || [],
        availability: data.availability,
        portfolio: data.portfolio_url,
        linkedin: data.linkedin_url,
        other_links: data.other_social_links || [],
        slug: data.slug,
        creative_spectrum: data.creative_spectrum,
        projects: (data.projects || []).map((proj: any) => ({
          title: proj.title,
          description: proj.description,
          link: proj.link,
        })),
        enriched: enrichedSummary,
      });
    }

    case 'list_directory_skills': {
      const { data, error } = await supabase
        .from('network_profiles')
        .select('skills')
        .eq('approved', true)
        .neq('membership_type', 'company');

      if (error) return JSON.stringify({ error: error.message });

      const skillCounts: Record<string, number> = {};
      for (const row of data || []) {
        for (const skill of row.skills || []) {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        }
      }

      const sorted = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([skill, count]) => ({ skill, count }));

      return JSON.stringify({ total_unique_skills: sorted.length, skills: sorted });
    }

    case 'list_directory_focus_areas': {
      const { data, error } = await supabase
        .from('network_profiles')
        .select('focus_areas')
        .eq('approved', true)
        .neq('membership_type', 'company');

      if (error) return JSON.stringify({ error: error.message });

      const areaCounts: Record<string, number> = {};
      for (const row of data || []) {
        for (const area of row.focus_areas || []) {
          areaCounts[area] = (areaCounts[area] || 0) + 1;
        }
      }

      const sorted = Object.entries(areaCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([area, count]) => ({ area, count }));

      return JSON.stringify({ total_focus_areas: sorted.length, focus_areas: sorted });
    }

    case 'get_directory_stats': {
      const { data, error } = await supabase
        .from('network_profiles')
        .select('availability, location, skills')
        .eq('approved', true)
        .neq('membership_type', 'company');

      if (error) return JSON.stringify({ error: error.message });

      const profiles = data || [];
      const availabilityCounts: Record<string, number> = {};
      const locationCounts: Record<string, number> = {};
      const skillCounts: Record<string, number> = {};

      for (const p of profiles) {
        availabilityCounts[p.availability] = (availabilityCounts[p.availability] || 0) + 1;
        const loc = p.location?.split(',').pop()?.trim() || 'Unknown';
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        for (const s of p.skills || []) {
          skillCounts[s] = (skillCounts[s] || 0) + 1;
        }
      }

      const topSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([skill, count]) => ({ skill, count }));

      const topLocations = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([location, count]) => ({ location, count }));

      return JSON.stringify({
        total_members: profiles.length,
        availability: availabilityCounts,
        top_skills: topSkills,
        top_locations: topLocations,
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ============================================================================
// TOOL ACTIVITY SUMMARIES
// ============================================================================

function getToolSummary(name: string, input: any): string {
  switch (name) {
    case 'search_directory':
      return `Searching for "${input.query}"`;
    case 'filter_by_skills':
      return `Filtering by skills: ${(input.skills || []).join(', ')}`;
    case 'filter_by_focus_areas':
      return `Filtering by focus: ${(input.focus_areas || []).join(', ')}`;
    case 'filter_available_members':
      return `Finding ${input.availability} members${input.location ? ` in ${input.location}` : ''}`;
    case 'get_member_profile':
      return 'Reviewing member profile';
    case 'list_directory_skills':
      return 'Listing available skills';
    case 'list_directory_focus_areas':
      return 'Listing focus areas';
    case 'get_directory_stats':
      return 'Getting directory statistics';
    default:
      return name;
  }
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are CT Finder — an AI-powered search agent for the Creative Technology Collective (CTC). You help companies discover and connect with creative technologists from the CTC directory.

You have access to tools that search and explore the member directory. You can:
- Search by keywords across names, bios, skills, and locations
- Filter by specific skills, focus areas, or availability status
- Get detailed profiles of individual members
- View directory-wide statistics and trends

Be conversational, helpful, and proactive. When someone asks about talent:
1. Use your tools to search the directory from multiple angles
2. Present findings clearly with profile links
3. Offer to refine searches or explore different criteria

When presenting candidates, format them clearly with:
- Name and location
- Why they match (specific skills, experience, projects)
- Availability status
- Profile link: [Name](/directory/profile/{slug})

If the user provides a job specification or project brief:
1. Extract the 3-5 most important technical skills and search for those specifically
2. Use filter_by_skills and filter_by_focus_areas for precise matching
3. Use get_member_profile only for the top 2-3 most promising candidates
4. Keep search queries SHORT (1-3 words each) — the search tokenizes multi-word queries but shorter is better
5. Aim to complete your research in 3-4 tool calls, then present results

IMPORTANT: Never expose member email addresses. Only share publicly visible profile information.
IMPORTANT: Always finish with a text response summarizing your findings. Never leave the user without a response.`;

// ============================================================================
// STREAMING HANDLER
// ============================================================================

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!anthropicApiKey) {
    return new Response(JSON.stringify({ error: 'AI service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accessToken = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, verified')
    .eq('user_id', user.id)
    .single();

  if (companyError || !company) {
    return new Response(JSON.stringify({ error: 'Company account required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!company.verified) {
    return new Response(JSON.stringify({ error: 'Company account must be verified' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check message credits
  const { data: msgCredits } = await supabase
    .from('company_message_credits')
    .select('free_messages_remaining, purchased_credits')
    .eq('company_id', company.id)
    .single();

  const freeRemaining = msgCredits?.free_messages_remaining ?? 0;
  const purchasedRemaining = msgCredits?.purchased_credits ?? 0;

  if (freeRemaining + purchasedRemaining <= 0) {
    return new Response(JSON.stringify({
      error: 'No message credits remaining. Please contact the CTC team to top up your account.',
      code: 'NO_MESSAGE_CREDITS',
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: CTFinderRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, attachmentText } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Messages are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Deduct one message credit
  let creditType: 'free' | 'purchased' = 'free';
  if (freeRemaining > 0) {
    await supabase
      .from('company_message_credits')
      .update({ free_messages_remaining: freeRemaining - 1 })
      .eq('company_id', company.id);
  } else {
    creditType = 'purchased';
    await supabase
      .from('company_message_credits')
      .update({ purchased_credits: Math.max(0, purchasedRemaining - 1) })
      .eq('company_id', company.id);
  }

  // Log usage
  await supabase
    .from('message_usage_logs')
    .insert({
      company_id: company.id,
      credit_type: creditType,
    });

  console.log(`[CTFinder] Deducted 1 ${creditType} credit for company ${company.id} (${freeRemaining + purchasedRemaining - 1} remaining)`);

  // Build Claude messages — attach document text to the last user message if present
  const claudeMessages: { role: string; content: any }[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (i === messages.length - 1 && msg.role === 'user' && attachmentText) {
      claudeMessages.push({
        role: 'user',
        content: `${msg.content}\n\n---\nAttached document:\n${attachmentText}\n---`,
      });
    } else {
      claudeMessages.push({ role: msg.role, content: msg.content });
    }
  }

  console.log(`[CTFinder] Streaming agent loop for company ${company.id}, messages: ${claudeMessages.length}`);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        let currentMessages = [...claudeMessages];
        const maxIterations = 12;
        const startTime = Date.now();
        const maxAgentTimeMs = 90_000;
        let textSent = false;

        for (let i = 0; i < maxIterations; i++) {
          const elapsed = Date.now() - startTime;
          if (elapsed > maxAgentTimeMs) {
            console.log(`[CTFinder] Time limit approaching (${elapsed}ms), forcing summary`);
            break;
          }

          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicApiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4096,
              system: SYSTEM_PROMPT,
              tools: TOOLS,
              messages: currentMessages,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || response.statusText);
          }

          const result = await response.json();
          const toolUseBlocks = (result.content || []).filter((b: any) => b.type === 'tool_use');
          const textBlocks = (result.content || []).filter((b: any) => b.type === 'text');

          if (result.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
            const text = textBlocks.map((b: any) => b.text).join('\n');
            send({ type: 'text', content: text });
            textSent = true;
            break;
          }

          currentMessages.push({ role: 'assistant', content: result.content });

          const toolResults: any[] = [];
          for (const block of toolUseBlocks) {
            const summary = getToolSummary(block.name, block.input);
            console.log(`[CTFinder] Tool: ${block.name} — ${summary}`);
            send({ type: 'tool_activity', name: block.name, summary });

            const toolResult = await executeTool(block.name, block.input, supabase);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: toolResult,
            });
          }

          currentMessages.push({ role: 'user', content: toolResults });
        }

        if (!textSent) {
          console.log('[CTFinder] Iterations exhausted or time limit reached — forcing final summary');
          send({ type: 'tool_activity', name: 'search_directory', summary: 'Compiling results...' });

          currentMessages.push({
            role: 'user',
            content: 'Please summarize your findings now. Present the best matching candidates you found from the searches above, with profile links and why they match. Do not make any more tool calls.',
          });

          const finalResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicApiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4096,
              system: SYSTEM_PROMPT,
              messages: currentMessages,
            }),
          });

          if (finalResponse.ok) {
            const finalResult = await finalResponse.json();
            const text = (finalResult.content || [])
              .filter((b: any) => b.type === 'text')
              .map((b: any) => b.text)
              .join('\n');
            send({ type: 'text', content: text || 'I found some results but ran out of processing time. Please try a more specific query.' });
          } else {
            send({ type: 'text', content: 'I found some results but ran into a processing limit. Please try a more targeted query.' });
          }
        }

        send({ type: 'done' });
      } catch (error: any) {
        console.error('[CTFinder] Stream error:', error);
        send({ type: 'error', message: error.message || 'Agent error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
