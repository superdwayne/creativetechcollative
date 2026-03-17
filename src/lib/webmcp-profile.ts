/**
 * WebMCP integration for profile creation/editing.
 *
 * Registers tools that allow MCP clients (e.g. Claude Desktop) to:
 *   - search the web for a person's professional work
 *   - read the current profile form state
 *   - update individual form fields (bio, skills, projects, etc.)
 *
 * This complements the "Auto-fill with AI" button by enabling
 * interactive, conversational profile enrichment via MCP.
 */

import type { ProfileFormData, Project } from '@/types/network-profile';

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

export interface ProfileFormCallbacks {
  getFormData: () => ProfileFormData;
  updateField: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  triggerEnrich: () => Promise<void>;
}

let mcpInstance: WebMCPInstance | null = null;

function registerProfileTools(mcp: WebMCPInstance, callbacks: ProfileFormCallbacks) {
  mcp.registerTool(
    'enrich_profile',
    'Search the internet for a person\'s professional work, projects, and skills, then pre-populate their profile. Requires the person\'s name to be filled in first. Optionally provide their LinkedIn or portfolio URL for better results.',
    {
      linkedinUrl: { type: 'string', description: 'LinkedIn profile URL (optional, improves results)' },
      portfolioUrl: { type: 'string', description: 'Portfolio/website URL (optional, improves results)' },
    },
    async (args: { linkedinUrl?: string; portfolioUrl?: string }) => {
      const form = callbacks.getFormData();

      if (!form.fullName?.trim()) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'Please enter the person\'s full name first.' }) }],
        };
      }

      if (args.linkedinUrl) {
        callbacks.updateField('linkedinUrl', args.linkedinUrl);
      }
      if (args.portfolioUrl) {
        callbacks.updateField('portfolioUrl', args.portfolioUrl);
      }

      try {
        const response = await fetch('/api/enrich-profile-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            currentSkills: form.skills,
            currentBio: form.bio,
            linkedinUrl: args.linkedinUrl || form.linkedinUrl?.trim() || '',
            portfolioUrl: args.portfolioUrl || form.portfolioUrl?.trim() || '',
            location: form.location?.trim() || '',
            focusAreas: form.focusAreas || [],
            existingProjects: form.projects.filter(p => p.title.trim()),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: data.error || 'Enrichment failed' }) }],
          };
        }

        if (data.success) {
          if (data.additionalSkills?.length > 0) {
            const merged = [...new Set([...form.skills, ...data.additionalSkills])].slice(0, 20);
            callbacks.updateField('skills', merged);
          }

          if (data.enrichedBio && (!form.bio || form.bio.length < 50)) {
            callbacks.updateField('bio', data.enrichedBio.substring(0, 300));
          }

          if (data.discoveredProjects?.length > 0) {
            for (const p of data.discoveredProjects.slice(0, 8)) {
              callbacks.addProject({
                title: p.title || 'Untitled Project',
                description: p.description || '',
                link: p.url || '',
                imageUrl: '',
              });
            }
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                summary: data.summary || 'Profile enriched.',
                projectsFound: data.discoveredProjects?.length || 0,
                skillsFound: data.additionalSkills?.length || 0,
                workHistory: data.workHistory || [],
                timing: data.timing,
              }, null, 2),
            }],
          };
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({ error: data.error || 'No data found' }) }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err instanceof Error ? err.message : 'Enrichment failed' }) }],
        };
      }
    }
  );

  mcp.registerTool(
    'get_profile_form',
    'Get the current state of the profile form including name, bio, skills, projects, and all other fields.',
    {},
    () => {
      const form = callbacks.getFormData();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            fullName: form.fullName,
            location: form.location,
            email: form.email,
            bio: form.bio,
            bioLength: `${form.bio.length}/300`,
            skills: form.skills,
            focusAreas: form.focusAreas,
            portfolioUrl: form.portfolioUrl,
            linkedinUrl: form.linkedinUrl,
            availability: form.availability,
            creativeSpectrum: form.creativeSpectrum,
            projects: form.projects
              .filter(p => p.title.trim())
              .map(p => ({ title: p.title, description: p.description, link: p.link })),
            emptyProjectSlots: form.projects.filter(p => !p.title.trim()).length,
          }, null, 2),
        }],
      };
    }
  );

  mcp.registerTool(
    'update_profile_field',
    'Update a single field on the profile form. Supported fields: fullName, location, bio, portfolioUrl, linkedinUrl, availability, creativeSpectrum.',
    {
      field: { type: 'string', description: 'Field name to update' },
      value: { type: 'string', description: 'New value for the field' },
    },
    (args: { field: string; value: string }) => {
      const allowedFields = ['fullName', 'location', 'bio', 'portfolioUrl', 'linkedinUrl', 'availability', 'creativeSpectrum', 'otherSocialLinks'];

      if (!allowedFields.includes(args.field)) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Field "${args.field}" not allowed. Use: ${allowedFields.join(', ')}` }) }],
        };
      }

      const field = args.field as keyof ProfileFormData;

      if (field === 'bio' && args.value.length > 300) {
        callbacks.updateField('bio', args.value.substring(0, 300));
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, note: 'Bio truncated to 300 characters' }) }],
        };
      }

      if (field === 'creativeSpectrum') {
        const num = parseInt(args.value, 10);
        if (isNaN(num) || num < 0 || num > 100) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'creativeSpectrum must be 0-100' }) }],
          };
        }
        callbacks.updateField('creativeSpectrum', num);
      } else {
        callbacks.updateField(field, args.value as any);
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, field: args.field }) }],
      };
    }
  );

  mcp.registerTool(
    'add_skills',
    'Add skills to the profile. Merges with existing skills, avoiding duplicates.',
    {
      skills: { type: 'string', description: 'Comma-separated list of skills to add (e.g. "Three.js, React, Unity")' },
    },
    (args: { skills: string }) => {
      const form = callbacks.getFormData();
      const newSkills = args.skills.split(',').map(s => s.trim()).filter(Boolean);
      const merged = [...new Set([...form.skills, ...newSkills])].slice(0, 20);
      callbacks.updateField('skills', merged);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            totalSkills: merged.length,
            added: newSkills.filter(s => !form.skills.includes(s)),
          }, null, 2),
        }],
      };
    }
  );

  mcp.registerTool(
    'set_focus_areas',
    'Set the focus areas for the profile. Replaces existing focus areas.',
    {
      focusAreas: { type: 'string', description: 'Comma-separated list of focus areas (e.g. "Creative Coding, Interactive Web Development")' },
    },
    (args: { focusAreas: string }) => {
      const areas = args.focusAreas.split(',').map(s => s.trim()).filter(Boolean);
      callbacks.updateField('focusAreas', areas);

      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, focusAreas: areas }) }],
      };
    }
  );

  mcp.registerTool(
    'add_project',
    'Add a project to the profile. Maximum 10 projects total.',
    {
      title: { type: 'string', description: 'Project title' },
      description: { type: 'string', description: 'Project description (max 500 chars)' },
      link: { type: 'string', description: 'Project URL (optional)' },
    },
    (args: { title: string; description: string; link?: string }) => {
      const form = callbacks.getFormData();
      const filledProjects = form.projects.filter(p => p.title.trim());

      if (filledProjects.length >= 10) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'Maximum 10 projects reached' }) }],
        };
      }

      callbacks.addProject({
        title: args.title,
        description: (args.description || '').substring(0, 500),
        link: args.link || '',
        imageUrl: '',
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            project: { title: args.title },
            totalProjects: filledProjects.length + 1,
          }),
        }],
      };
    }
  );

  mcp.registerResource(
    'profile-form-state',
    'Current state of the profile creation/editing form',
    {
      uri: 'ctc://profile/form-state',
      mimeType: 'application/json',
    },
    () => {
      const form = callbacks.getFormData();
      return {
        contents: [{
          uri: 'ctc://profile/form-state',
          mimeType: 'application/json',
          text: JSON.stringify(form, null, 2),
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

    const timeoutId = setTimeout(() => {
      reject(new Error('WebMCP script load timed out'));
    }, 5000);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/webmcp@latest/dist/webmcp.min.js';
    script.async = true;
    script.onload = () => { clearTimeout(timeoutId); resolve(); };
    script.onerror = () => {
      const fallback = document.createElement('script');
      fallback.src = 'https://unpkg.com/@anthropic-ai/webmcp@latest/dist/webmcp.min.js';
      fallback.async = true;
      fallback.onload = () => { clearTimeout(timeoutId); resolve(); };
      fallback.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('WebMCP library unavailable'));
      };
      document.head.appendChild(fallback);
    };
    document.head.appendChild(script);
  });
}

/**
 * Initialize WebMCP on a profile create/edit page.
 * Pass callbacks that let registered tools interact with React state.
 */
export async function initializeProfileWebMCP(callbacks: ProfileFormCallbacks): Promise<void> {
  if (mcpInstance) return;

  try {
    await loadWebMCPScript();

    if (!window.WebMCP) {
      // WebMCP not available — this is expected in most environments
      return;
    }

    mcpInstance = new window.WebMCP({
      color: '#a855f7',
      position: 'bottom-right',
      size: '36px',
      padding: '16px',
    });

    registerProfileTools(mcpInstance, callbacks);
    console.log('[WebMCP-Profile] Profile enrichment tools registered');
  } catch {
    // WebMCP is optional — silently skip if unavailable
  }
}

export function cleanupProfileWebMCP(): void {
  mcpInstance = null;
}
