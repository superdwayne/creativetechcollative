/**
 * WebMCP integration for the CTC Directory.
 *
 * Loads the WebMCP library and registers tools that expose directory
 * member data to external MCP clients (e.g. Claude Desktop).
 *
 * Tools registered:
 *   - search_directory: keyword search across members
 *   - filter_by_skills: find members with specific skills
 *   - get_member_profile: full profile for a specific member
 *   - get_directory_stats: aggregate stats about the directory
 */

import type { NetworkProfile } from '@/types/network-profile';

interface WebMCPInstance {
  registerTool: (
    name: string,
    description: string,
    schema: Record<string, any>,
    handler: (args: any) => any
  ) => void;
  registerResource: (
    name: string,
    description: string,
    config: Record<string, any>,
    handler: (uri: string) => any
  ) => void;
}

declare global {
  interface Window {
    WebMCP: new (options?: Record<string, any>) => WebMCPInstance;
  }
}

let mcpInstance: WebMCPInstance | null = null;
let profilesCache: NetworkProfile[] = [];

function sanitizeProfile(p: NetworkProfile) {
  return {
    id: p.id,
    name: p.fullName,
    location: p.location,
    bio: p.bio?.substring(0, 500) || '',
    skills: p.skills || [],
    focusAreas: p.focusAreas || [],
    availability: p.availability,
    portfolio: p.portfolioUrl || null,
    linkedin: p.linkedinUrl || null,
    slug: p.slug,
    creativeSpectrum: p.creativeSpectrum,
    projectCount: p.projects?.length || 0,
    profileUrl: `/directory/profile/${p.slug}`,
  };
}

function registerDirectoryTools(mcp: WebMCPInstance) {
  mcp.registerTool(
    'search_directory',
    'Search the CTC Creative Technology directory by keyword. Searches names, bios, skills, and locations.',
    {
      query: { type: 'string', description: 'Search keyword or phrase' },
      limit: { type: 'number', description: 'Max results (default 10)' },
    },
    (args: { query: string; limit?: number }) => {
      const query = (args.query || '').toLowerCase();
      const limit = Math.min(args.limit || 10, 25);

      const results = profilesCache
        .filter(p => {
          const searchable = [
            p.fullName,
            p.location,
            p.bio,
            ...(p.skills || []),
            ...(p.focusAreas || []),
          ].join(' ').toLowerCase();
          return searchable.includes(query);
        })
        .slice(0, limit)
        .map(sanitizeProfile);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            count: results.length,
            query: args.query,
            members: results,
          }, null, 2),
        }],
      };
    }
  );

  mcp.registerTool(
    'filter_by_skills',
    'Find directory members who have specific skills. Returns members matching any of the provided skills.',
    {
      skills: { type: 'string', description: 'Comma-separated list of skills (e.g. "React, Three.js, Unity")' },
      match_all: { type: 'boolean', description: 'If true, member must have ALL listed skills' },
    },
    (args: { skills: string; match_all?: boolean }) => {
      const skills = args.skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const matchAll = args.match_all || false;

      const results = profilesCache
        .filter(p => {
          const memberSkills = (p.skills || []).map(s => s.toLowerCase());
          if (matchAll) {
            return skills.every(s => memberSkills.some(ms => ms.includes(s)));
          }
          return skills.some(s => memberSkills.some(ms => ms.includes(s)));
        })
        .slice(0, 15)
        .map(sanitizeProfile);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            count: results.length,
            searched_skills: skills,
            match_mode: matchAll ? 'all' : 'any',
            members: results,
          }, null, 2),
        }],
      };
    }
  );

  mcp.registerTool(
    'get_member_profile',
    'Get the full profile of a specific directory member by name or slug.',
    {
      identifier: { type: 'string', description: 'Member name or profile slug' },
    },
    (args: { identifier: string }) => {
      const id = (args.identifier || '').toLowerCase();

      const profile = profilesCache.find(p =>
        p.slug.toLowerCase() === id ||
        p.fullName.toLowerCase() === id ||
        p.fullName.toLowerCase().includes(id)
      );

      if (!profile) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'Member not found' }) }],
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...sanitizeProfile(profile),
            bio: profile.bio,
            projects: (profile.projects || []).map(proj => ({
              title: proj.title,
              description: proj.description,
              link: proj.link,
            })),
          }, null, 2),
        }],
      };
    }
  );

  mcp.registerTool(
    'get_directory_stats',
    'Get overall statistics about the CTC directory: total members, availability, top skills, locations.',
    {},
    () => {
      const total = profilesCache.length;
      const availabilityCounts: Record<string, number> = {};
      const skillCounts: Record<string, number> = {};
      const locationCounts: Record<string, number> = {};

      for (const p of profilesCache) {
        availabilityCounts[p.availability] = (availabilityCounts[p.availability] || 0) + 1;
        const loc = p.location?.split(',').pop()?.trim() || 'Unknown';
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        for (const s of p.skills || []) {
          skillCounts[s] = (skillCounts[s] || 0) + 1;
        }
      }

      const topSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([skill, count]) => ({ skill, count }));

      const topLocations = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([location, count]) => ({ location, count }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            total_members: total,
            availability: availabilityCounts,
            top_skills: topSkills,
            top_locations: topLocations,
          }, null, 2),
        }],
      };
    }
  );

  mcp.registerResource(
    'directory-overview',
    'Overview of the CTC Creative Technology directory',
    {
      uri: 'ctc://directory/overview',
      mimeType: 'application/json',
    },
    () => {
      return {
        contents: [{
          uri: 'ctc://directory/overview',
          mimeType: 'application/json',
          text: JSON.stringify({
            name: 'Creative Technology Collective Directory',
            description: 'A curated directory of creative technologists — developers, designers, and artists working at the intersection of creativity and technology.',
            total_members: profilesCache.length,
            available_tools: ['search_directory', 'filter_by_skills', 'get_member_profile', 'get_directory_stats'],
          }, null, 2),
        }],
      };
    }
  );
}

function loadWebMCPScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.WebMCP) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/webmcp@latest/dist/webmcp.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.warn('[WebMCP] Failed to load from CDN, trying npm fallback...');
      const fallback = document.createElement('script');
      fallback.src = 'https://unpkg.com/@anthropic-ai/webmcp@latest/dist/webmcp.min.js';
      fallback.async = true;
      fallback.onload = () => resolve();
      fallback.onerror = () => {
        console.warn('[WebMCP] Could not load WebMCP library. MCP tools will not be available.');
        reject(new Error('WebMCP library unavailable'));
      };
      document.head.appendChild(fallback);
    };
    document.head.appendChild(script);
  });
}

/**
 * Initialize WebMCP on the directory page.
 * Call this after profiles have been loaded.
 */
export async function initializeWebMCP(profiles: NetworkProfile[]): Promise<void> {
  profilesCache = profiles;

  if (mcpInstance) {
    return;
  }

  try {
    await loadWebMCPScript();

    if (!window.WebMCP) {
      console.warn('[WebMCP] WebMCP constructor not found after script load');
      return;
    }

    mcpInstance = new window.WebMCP({
      color: '#a855f7',
      position: 'bottom-right',
      size: '36px',
      padding: '16px',
    });

    registerDirectoryTools(mcpInstance);
    console.log('[WebMCP] Directory tools registered successfully');
  } catch (err) {
    console.warn('[WebMCP] Initialization skipped:', err);
  }
}

/**
 * Update the cached profiles (e.g. when new data is fetched).
 */
export function updateWebMCPProfiles(profiles: NetworkProfile[]): void {
  profilesCache = profiles;
}

/**
 * Clean up WebMCP on unmount.
 */
export function cleanupWebMCP(): void {
  mcpInstance = null;
  profilesCache = [];
}
