# Technology Stack

**Analysis Date:** 2026-01-22

## Languages

**Primary:**
- TypeScript 5.5.3 - All application and API code
- JSX/TSX - React components with TypeScript

**Secondary:**
- SQL - Supabase migrations and stored procedures
- TOML - Supabase configuration

## Runtime

**Environment:**
- Node.js (inferred from package.json type: "module")

**Package Manager:**
- Yarn (lockfile present at `yarn.lock`)
- Node version not pinned (no .nvmrc file)

## Frameworks

**Core:**
- React 19.0.0 - Frontend UI framework
- Vite 5.4.2 - Build tool and dev server
- React Router DOM 6.8.1 - Client-side routing

**Backend/API:**
- Vercel Functions (Edge Runtime) - Serverless API endpoints
  - Entry points: `api/*.ts` files configured in `vercel.json`
  - Runtime: `edge` with maxDuration constraints (30-300 seconds per `vercel.json`)

**Testing:**
- Not detected

**Build/Dev:**
- TypeScript 5.5.3 - Type checking and compilation
- ESLint 9.9.1 with TypeScript plugin - Code linting
- TailwindCSS 3.4.1 - Utility-first CSS framework
- PostCSS 8.4.35 - CSS processing

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.90.1 - PostgreSQL database client and auth
- `ai` 6.0.24 - Vercel AI SDK for streaming LLM responses
- `@ai-sdk/anthropic` 3.0.13 - Claude API integration
- `@ai-sdk/openai` 3.0.7 - OpenAI API integration (GPT-4o, embeddings)
- `stripe` 20.2.0 - Payment processing and webhooks
- `zod` 4.3.5 - Runtime schema validation

**Visualization:**
- Three.js 0.170.0 - 3D graphics rendering
- D3 7.9.0, d3-geo 3.1.1 - Data visualization and maps
- Leaflet 1.9.4, react-leaflet 5.0.0 - Interactive maps
- GSAP 3.12.2 - Animation library
- Framer Motion 11.0.0 - React animation library
- OGL 1.0.11 - WebGL library

**UI Components:**
- Radix UI components:
  - `@radix-ui/react-accordion` 1.2.11
  - `@radix-ui/react-avatar` 1.1.10
  - `@radix-ui/react-slot` 1.2.3
- Lucide React 0.344.0 - Icon library
- class-variance-authority 0.7.1 - Variant pattern helper
- clsx 2.1.0, tailwind-merge 2.2.0 - Utility for combining CSS classes

**3D/Advanced:**
- `@react-three/fiber` 9.4.2 - React renderer for Three.js
- `@react-three/drei` 10.7.7 - Useful helpers for Three.js
- react-simple-maps 3.0.0 - Map visualization

**Utilities:**
- html2canvas 1.4.1 - Screenshot/canvas rendering
- @types packages for TypeScript definitions

## Configuration

**Environment:**
- Configured via environment variables (process.env and import.meta.env.VITE_*)
- Client-side vars use VITE_ prefix (e.g., VITE_SUPABASE_URL)
- Server-side vars without prefix (e.g., SUPABASE_SERVICE_ROLE_KEY)
- Config file: `.env.example` documents all required vars

**Build:**
- Vite config: `vite.config.ts`
  - React plugin enabled
  - Path alias: `@/*` → `./src/*`
  - Dev proxy configured for `/api/*` routes and webhooks
- Vercel config: `vercel.json`
  - Framework: Vite
  - Function timeout configurations for long-running jobs (5 minutes for batch embeddings)
  - Rewrites for SPA routing

**TypeScript:**
- `tsconfig.json` - Base config with path aliases
- `tsconfig.app.json` - App compilation target (ES2020, strict mode)
- `tsconfig.node.json` - Node tooling config

## Platform Requirements

**Development:**
- Node.js runtime
- Yarn package manager
- Vite dev server (runs on configured port via vercel dev)

**Production:**
- Vercel hosting for both frontend and serverless functions
- PostgreSQL database (Supabase)
- External API keys:
  - Supabase (Database, Auth, Storage)
  - OpenAI (Embeddings, GPT-4o analysis)
  - Anthropic (Claude for job matching and analysis)
  - Stripe (Payment processing)

---

*Stack analysis: 2026-01-22*
