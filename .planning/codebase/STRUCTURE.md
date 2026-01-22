# Codebase Structure

**Analysis Date:** 2026-01-22

## Directory Layout

```
ctc-collective-new/
├── api/                           # Vercel serverless functions (backend)
│   ├── admin/                     # Admin portal endpoints
│   │   ├── profiles.ts           # List pending profiles
│   │   ├── companies.ts          # List companies
│   │   ├── jobs.ts               # List jobs
│   │   ├── matches.ts            # View matches
│   │   ├── pending-matches.ts    # Pending matches queue
│   │   ├── profiles/             # Batch profile operations
│   │   ├── jobs/                 # Batch job operations
│   │   ├── companies/            # Company verification
│   │   └── *.ts                  # Credit/admin utilities
│   ├── company/                  # Company endpoints (checkout, credits)
│   ├── messages/                 # Messaging system endpoints
│   ├── webhooks/                 # Incoming webhook handlers
│   ├── enrich-*.ts              # Profile enrichment endpoints
│   ├── *-job.ts                 # Job analysis/matching endpoints
│   └── register-*.ts            # Registration endpoints
├── src/                           # React frontend source
│   ├── pages/                    # Page components (one per route)
│   │   ├── AdminDashboardPage.tsx       # Admin portal (126KB)
│   │   ├── CompanyAuthPage.tsx          # Company authentication
│   │   ├── CompanyRegisterPage.tsx      # Company registration
│   │   ├── CompanyDashboardPage.tsx     # Company job/credit management
│   │   ├── NetworkAuthPage.tsx          # Talent authentication
│   │   ├── NetworkCreateProfilePage.tsx # Profile creation (multi-step)
│   │   ├── NetworkDashboardPage.tsx     # Talent profile management
│   │   ├── HirePage.tsx                 # Job posting & matching
│   │   ├── JobsPage.tsx                 # Browse jobs (hidden route)
│   │   ├── HeroPage.tsx                 # Landing page
│   │   └── [others].tsx                 # Team, resources, contact, etc.
│   ├── components/                # Reusable React components
│   │   ├── ui/                   # Radix UI + custom component library
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── tag-input.tsx
│   │   │   ├── image-upload.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── background-*.tsx  # Animated backgrounds
│   │   │   └── *.tsx             # Other UI primitives
│   │   ├── blocks/               # Complex UI blocks/sections
│   │   ├── Members*.tsx          # Different member display variants
│   │   ├── Discovery*.tsx        # Discovery/search UI
│   │   ├── Navigation.tsx        # Global nav bar
│   │   └── [others].tsx          # Feature components
│   ├── lib/                       # Shared utilities & business logic
│   │   ├── supabase.ts           # Supabase client + all DB functions
│   │   ├── embeddings.ts         # Vector embedding generation (OpenAI)
│   │   ├── matching-engine.ts    # Profile-to-job matching algorithm
│   │   ├── profile-enrichment.ts # Auto-fill profile from web sources
│   │   ├── scraper.ts            # Web page scraping
│   │   ├── web-search.ts         # Web search integration
│   │   ├── claude-ranking.ts     # AI-powered result ranking
│   │   └── utils.ts              # Helper functions
│   ├── contexts/                 # React Context providers
│   │   └── AuthContext.tsx       # Authentication state (user, session, methods)
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Get auth context
│   │   ├── useJobAnalysis.ts     # Job analysis hook
│   │   └── usePageTracking.ts    # Google Analytics
│   ├── types/                    # TypeScript type definitions
│   │   ├── network-profile.ts    # Profile form + types
│   │   ├── job-matching.ts       # Job/company/match types
│   │   └── member.ts             # Member display types
│   ├── data/                     # Static data
│   │   ├── articles.ts           # Articles data
│   │   └── jobs.ts               # Sample jobs data
│   ├── utils/                    # Utility functions
│   │   ├── webhookUtils.ts       # N8N webhook helpers
│   │   └── featureFlags.ts       # Feature flag checks
│   ├── App.tsx                   # Main app component (routing)
│   └── main.tsx                  # React entry point
├── supabase/                      # Supabase migrations & config
│   ├── migrations/               # SQL migration files
│   │   ├── 001_*.sql            # Initial schema
│   │   ├── 008_create_similarity_search_function.sql
│   │   └── 011_*.sql            # Recent migrations
│   └── config.toml              # Supabase project config
├── public/                        # Static assets
│   ├── members/                 # Member profile images
│   ├── sponsors/                # Sponsor logos
│   ├── collaborations/          # Partner/collab content
│   ├── playgrounds/             # Playground demos
│   ├── email-images/            # Email templates
│   ├── thumbnails/              # Preview images
│   └── favicon/                 # Branding assets
├── scripts/                       # Build/utility scripts
│   └── seed-ctc-members.ts      # Database seeding
├── configs/                       # Configuration files
│   └── claude/                  # Claude/AI config
├── .planning/                     # Planning documents (GSD system)
│   └── codebase/                # This directory
├── vite.config.ts               # Vite build config + API proxy
├── vercel.json                  # Vercel deployment config
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind CSS config
├── eslint.config.js             # ESLint rules
└── .env.example                 # Environment variables template
```

## Directory Purposes

**`api/`:**
- Purpose: Serverless backend functions (Vercel Functions)
- Runtime: Node.js edge runtime for all endpoints
- Deployment: Automatic via Vercel from `/api` directory
- Auth: Service role key for database access, Bearer tokens for user operations

**`src/pages/`:**
- Purpose: One-to-one mapping with routes in App.tsx
- Pattern: Filename doesn't match route (manual routing in App.tsx)
- Naming: [Feature]Page.tsx (e.g., AdminDashboardPage.tsx)
- Size: Large pages (AdminDashboardPage 126KB); pages handle complex UI state

**`src/components/`:**
- Purpose: Reusable UI components
- Substructure: `ui/` for design system, `blocks/` for feature sections, root for page-specific
- Dependencies: Radix UI for accessible primitives, Framer Motion for animations

**`src/lib/`:**
- Purpose: Non-UI business logic and utilities
- Scope: Data fetching, AI/ML operations, matching algorithms, external integrations
- Size: Large files (supabase.ts 38KB); consolidates all DB access

**`src/contexts/`:**
- Purpose: Global state providers
- Current: Only AuthContext (single context for app-wide auth state)

**`src/hooks/`:**
- Purpose: Custom React hooks
- Pattern: useAuth wraps AuthContext.useAuth(); other hooks isolate complex logic

**`src/types/`:**
- Purpose: TypeScript interfaces and types
- Scope: Data models (NetworkProfile, Job, Company), API request/response types
- Pattern: Exported from types files; re-exported in lib/supabase.ts

**`src/data/`:**
- Purpose: Static data (not fetched from API)
- Contains: Articles list, sample jobs (for playground pages)

**`supabase/`:**
- Purpose: Database schema and configuration
- Migrations: Numbered SQL files run in order (001_*, 008_*, 011_*)
- Latest: similarity_search_function for vector queries

**`public/`:**
- Purpose: Static files served by web server
- Structure: Organized by feature/purpose (members, sponsors, collaborations)

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React DOM render, wraps App with AuthProvider
- `src/App.tsx`: All route definitions, global nav and footer
- `api/[name].ts`: Individual serverless functions (auto-routed as `/api/[name]`)

**Configuration:**
- `vite.config.ts`: Build config, Vite proxy to `/api` routes
- `vercel.json`: Function timeouts, URL rewrites
- `package.json`: Dependencies, build/dev commands
- `.env.example`: Template for env vars (SUPABASE_URL, STRIPE_KEY, etc.)

**Core Logic:**
- `src/lib/supabase.ts`: All data access (queries, mutations, subscriptions)
- `src/lib/matching-engine.ts`: Profile-to-job semantic matching
- `src/lib/embeddings.ts`: Vector generation for profiles/jobs
- `api/enrich-profile.ts`: Single profile enrichment (called after creation)
- `api/match-job.ts`: Job matching engine (returns ranked matches)

**Testing:**
- `src/**/*.test.ts`: Not detected; no test files found

**Styles:**
- `src/`: Inline Tailwind CSS (className approach)
- `tailwind.config.js`: Tailwind configuration

## Naming Conventions

**Files:**
- Pages: `[Feature]Page.tsx` (e.g., AdminDashboardPage.tsx)
- Components: `[ComponentName].tsx` (PascalCase)
- Utilities: `[feature].ts` (camelCase) or `[feature]-*.ts` (kebab-case for variants)
- API endpoints: `/api/[operation]-[resource].ts` or `/api/[category]/[operation].ts`
  - Examples: `/api/enrich-profile.ts`, `/api/admin/profiles.ts`, `/api/company/checkout.ts`

**Directories:**
- Functional: `src/pages/`, `src/components/`, `src/lib/` (group by concern)
- Feature-based subdirs: `api/admin/`, `api/company/`, `src/components/ui/`, `src/components/blocks/`
- Database: `supabase/migrations/` (numbered: 001_*.sql, 008_*.sql)

**TypeScript:**
- Interfaces: `I[Name]` or just `[Name]` (inconsistent; both used)
- Types: `[Name]Type` or `[Name]` suffix (e.g., `AuthContextType`, `PendingProfile`)
- Enums: Not heavily used; prefer union types

**Variables:**
- camelCase for functions and variables
- UPPER_SNAKE_CASE for constants (e.g., ADMIN_USER_IDS, BUNDLES)
- `is[Condition]` for boolean checks (e.g., isAdmin, isGenerating)

## Where to Add New Code

**New Feature (end-to-end):**
- Backend: Create `api/[operation]-[resource].ts` using Vercel Functions pattern
  - Use edge runtime: `export const config = { runtime: 'edge' }`
  - Use Zod for request validation
  - Verify auth before processing
  - Return JSON responses with appropriate status codes
- Frontend: Create `src/pages/[Feature]Page.tsx`
  - Use React Router hooks (useNavigate, useParams)
  - Import and use AuthContext for auth state
  - Import data functions from `src/lib/supabase.ts`
- Types: Add interfaces to `src/types/[domain].ts` or create new file
- Route: Add route in `src/App.tsx` Routes section

**New Component/Module:**
- Reusable UI: `src/components/[ComponentName].tsx`
- Design system: `src/components/ui/[component].tsx`
- Feature section: `src/components/blocks/[Block].tsx`
- Shared logic: `src/lib/[feature].ts`

**Utilities:**
- Shared helpers: `src/lib/utils.ts` or create `src/lib/[feature].ts`
- Feature utilities: `src/utils/[feature].ts`
- API utilities: Create in `api/` or `src/lib/` depending on usage

**Database:**
- New tables/migrations: `supabase/migrations/[NNN]_[description].sql`
  - Number sequentially after latest migration
  - Use Supabase migration naming: `supabase/migrations/[TIMESTAMP]_[description].sql`
  - Or follow existing pattern: `supabase/migrations/NNN_description.sql`

**API Operations:**
- Follows Vercel Functions convention: `api/[path].ts` maps to `GET/POST /api/[path]`
- Subdirectories work: `api/admin/profiles.ts` → `POST /api/admin/profiles`

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD (Goals, Structure, Development) documentation
- Generated: Manually; updated by `/gsd:map-codebase` orchestrator
- Committed: Yes (version controlled)
- Files: ARCHITECTURE.md, STRUCTURE.md, STACK.md, INTEGRATIONS.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

**`dist/`:**
- Purpose: Built frontend (compiled Vite output)
- Generated: Yes (by `yarn build`)
- Committed: No (in .gitignore)
- Deployment: Deployed to Vercel; served as static files

**`.vercel/`:**
- Purpose: Vercel CI/CD cache and build artifacts
- Generated: Yes (by Vercel deployment)
- Committed: No (local only)

**`node_modules/`:**
- Purpose: Installed npm dependencies
- Generated: Yes (by `yarn install`)
- Committed: No (in .gitignore)

**`public/`:**
- Purpose: Static assets served by web server
- Generated: No (manual content)
- Committed: Yes
- Deployment: Copied to CDN via Vercel

**`.claude/`:**
- Purpose: Claude.com workspace artifacts
- Generated: Unknown (appears to be external tool)
- Committed: No (in .gitignore)

**`supabase/.temp/`:**
- Purpose: Supabase CLI temporary files
- Generated: Yes (by Supabase CLI)
- Committed: No

---

*Structure analysis: 2026-01-22*
