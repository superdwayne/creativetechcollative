# Feature Flags Documentation

This project includes a feature flag system that allows for dynamic feature toggling without requiring code deployments.

## Highlighted Resource Feature

The highlighted resource feature allows you to highlight a specific resource on the Resources page with custom styling and content.

### Configuration

#### Environment Variable
Set the `VITE_FEATURE_FLAGS` environment variable with a JSON string:

```bash
VITE_FEATURE_FLAGS='{"highlightedResource":{"enabled":true,"resourceId":"your-resource-id","title":"Custom Title","description":"Custom description","backgroundColor":"bg-gradient-to-r from-blue-500/10 to-cyan-500/10","borderColor":"border-blue-500/50"}}'
```

#### Local Storage Override
You can also override feature flags via localStorage for testing:

```javascript
localStorage.setItem('feature-flags', JSON.stringify({
  highlightedResource: {
    enabled: true,
    resourceId: "your-resource-id",
    title: "Custom Title",
    description: "Custom description",
    backgroundColor: "bg-gradient-to-r from-green-500/10 to-emerald-500/10",
    borderColor: "border-green-500/50"
  }
}));
```

### Feature Flag Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `enabled` | boolean | Whether the highlighted resource feature is active | `false` |
| `useFeaturedProperty` | boolean | Use `property_featured: false` from data instead of resourceId | `true` |
| `resourceId` | string | The ID of the resource to highlight (when not using featured property) | `undefined` |
| `title` | string | Custom title to display (optional) | `undefined` |
| `description` | string | Custom description to display (optional) | `undefined` |
| `backgroundColor` | string | Tailwind CSS class for background styling | `bg-gradient-to-r from-pink-500/10 to-purple-500/10` |
| `borderColor` | string | Tailwind CSS class for border styling | `border-pink-500/50` |

### Development Admin Panel

In development mode, a floating admin panel is available in the bottom-right corner of the Resources page. This panel allows you to:

- Enable/disable the highlighted resource feature
- Set the resource ID to highlight
- Configure custom title and description
- Customize background and border colors
- Save changes or reset to defaults

### Usage Examples

#### Basic Highlight (using property_featured)
```json
{
  "highlightedResource": {
    "enabled": true,
    "useFeaturedProperty": true
  }
}
```

#### Basic Highlight (using specific resource ID)
```json
{
  "highlightedResource": {
    "enabled": true,
    "useFeaturedProperty": false,
    "resourceId": "resource-123"
  }
}
```

#### Custom Styling (using property_featured)
```json
{
  "highlightedResource": {
    "enabled": true,
    "useFeaturedProperty": true,
    "backgroundColor": "bg-gradient-to-r from-yellow-500/10 to-orange-500/10",
    "borderColor": "border-yellow-500/50"
  }
}
```

#### Full Customization (using property_featured)
```json
{
  "highlightedResource": {
    "enabled": true,
    "useFeaturedProperty": true,
    "title": "🔥 Featured Resource",
    "description": "This is our top pick for this week!",
    "backgroundColor": "bg-gradient-to-r from-purple-500/10 to-pink-500/10",
    "borderColor": "border-purple-500/50"
  }
}
```

### Visual Indicators

When a resource is highlighted:
- A sparkles icon (✨) appears next to the title
- The card has a gradient background and colored border
- Custom title and description override the original content
- The card maintains all existing functionality (hover effects, external link, etc.)

### Technical Implementation

The feature flag system is implemented in `src/utils/featureFlags.ts` and includes:

- Type-safe configuration with TypeScript interfaces
- Environment variable support for production configuration
- Local storage support for development/testing
- Reactive updates using custom events
- React hook for easy integration

### Adding New Feature Flags

To add new feature flags:

1. Extend the `FeatureFlags` interface in `src/utils/featureFlags.ts`
2. Add default values to `defaultFeatureFlags`
3. Update the admin panel component if needed
4. Use the `useFeatureFlags` hook in your components

---

## Agent Browser Integration

The project includes integration with [agent-browser](https://github.com/vercel-labs/agent-browser) for extracting content from JavaScript-heavy portfolio websites.

### What is Agent Browser?

Agent-browser is a headless browser automation CLI from Vercel Labs designed for AI agents. It provides:

- **JavaScript rendering** - Handles JS-heavy sites like Behance, Dribbble, WebGL portfolios
- **Content extraction** - Uses accessibility tree snapshots for structured data
- **Local Chromium** - Runs locally without cloud dependencies

### Use Case

Agent-browser is used for **content extraction** from discovered portfolio URLs, NOT for web searching:

1. **Jina/SerpAPI/Google Custom Search** → Find portfolio URLs
2. **Agent-browser** → Extract content from JS-heavy sites that don't render with simple HTTP fetches

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `USE_AGENT_BROWSER` | Set to `"true"` to enable agent-browser for JS-heavy sites | No |

### API Endpoints

#### `/api/search-person`

Endpoint for extracting content from portfolio URLs using agent-browser.

**Request:**
```json
{
  "urls": [
    "https://lusion.co",
    "https://behance.net/johndoe"
  ],
  "analyze": true,
  "personName": "John Doe",
  "currentSkills": ["React", "Three.js"]
}
```

**Response:**
```json
{
  "success": true,
  "extracted": [
    {
      "url": "https://lusion.co",
      "title": "Lusion - Realise Your Creative Ideas",
      "contentLength": 5432,
      "contentPreview": "We help brands create digital experiences...",
      "linksCount": 28
    }
  ],
  "analysis": {
    "projects": [...],
    "skills": [...],
    "workHistory": [...],
    "bio": "...",
    "summary": "..."
  }
}
```

#### `/api/enrich-profile-search`

Profile enrichment endpoint. When `USE_AGENT_BROWSER=true`, uses agent-browser for JS-heavy sites like:
- behance.net
- dribbble.com
- linkedin.com
- webflow.io
- framer.website
- cargo.site
- lusion.co

### Local Development

```bash
# Install agent-browser (already done)
npm install agent-browser

# Install Chromium browser
npx agent-browser install

# Enable agent-browser in .env.local
echo "USE_AGENT_BROWSER=true" >> .env.local

# Test content extraction
curl -X POST http://localhost:3000/api/search-person \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://lusion.co"], "analyze": false}'
```

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Profile Enrichment                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Search APIs (Jina/SerpAPI/Google)                       │
│     └─→ Find portfolio URLs                                 │
│                                                              │
│  2. Content Extraction                                       │
│     ├─→ Simple HTTP fetch (static sites)                    │
│     └─→ Agent-browser (JS-heavy sites) ← NEW                │
│                                                              │
│  3. AI Analysis (Claude)                                     │
│     └─→ Extract projects, skills, work history              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Supported JS-Heavy Sites

Agent-browser automatically activates for these domains:
- behance.net, dribbble.com
- linkedin.com (public profiles)
- webflow.io, framer.website
- wix.com, squarespace.com
- cargo.site, notion.site
- readcv.com, bento.me, contra.com
- lusion.co, awwwards.com, thefwa.com

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Chromium not found | Run `npx agent-browser install` |
| Timeout errors | Increase timeout in options (default: 25s) |
| Empty content | Some sites block headless browsers; use Jina fallback |
| LinkedIn empty | LinkedIn requires login; use Jina Reader instead |

### Files

- `api/lib/agent-browser-search.ts` - Content extraction utilities
- `api/search-person.ts` - Content extraction API endpoint
- `api/enrich-profile-search.ts` - Enhanced with agent-browser fallback