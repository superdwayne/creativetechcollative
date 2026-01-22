# Coding Conventions

**Analysis Date:** 2026-01-22

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `Navigation.tsx`, `MembersPage.tsx`)
- Utility/library files: lowercase with hyphens (e.g., `profile-enrichment.ts`, `featureFlags.ts`)
- Pages: PascalCase with "Page" suffix (e.g., `CompanyDashboardPage.tsx`, `NetworkAuthPage.tsx`)
- UI components: lowercase with hyphens (e.g., `button.tsx`, `background-beams.tsx`)
- API routes: lowercase with hyphens (e.g., `admin/profiles.ts`, `messages/send.ts`)

**Functions:**
- Async functions: camelCase with descriptive verbs (e.g., `createProfile()`, `getProfileBySlug()`, `enrichProfile()`)
- Helper functions: camelCase prefixed with meaningful action (e.g., `rowToProfile()`, `generateSlug()`)
- Hooks: camelCase with "use" prefix (e.g., `useAuth()`, `useJobAnalysis()`)
- Interfaces/types with handlers: prefixed with domain (e.g., `isAdmin()`, `isJobOwner()`)

**Variables:**
- Const declarations: camelCase for values/instances (e.g., `supabaseUrl`, `adminUserIds`, `matchScore`)
- Component props: PascalCase for interface names (e.g., `NavigationProps`, `JobToAnalyze`)
- State variables: camelCase (e.g., `mobileMenuOpen`, `isAnalyzing`, `creditsRemaining`)
- Arrays of items: plural camelCase (e.g., `leftNavItems`, `adminIds`, `jobMatches`)

**Types:**
- Interfaces: PascalCase (e.g., `NavigationProps`, `AuthContextType`, `JobSubmission`)
- Type unions: PascalCase (e.g., `AnalysisError`, `MemberResponse`)
- Database-mapped types: descriptive names with domain prefix (e.g., `PendingProfile`, `JobMatchWithDetails`)

## Code Style

**Formatting:**
- Enforced by ESLint (configured in `eslint.config.js`)
- Uses Prettier-compatible rules
- 2-space indentation (per TypeScript standards)
- Line length: no hard limit enforced, but generally kept under 100 characters for readability

**Linting:**
- Tool: ESLint 9.9.1 with TypeScript ESLint 8.3.0
- Configuration: `eslint.config.js` (flat config format)
- Enabled plugins:
  - `react-hooks` - enforces Rules of Hooks
  - `react-refresh` - warns if non-component files export components
- Key rules:
  - Recommended ESLint rules from `@eslint/js`
  - TypeScript-recommended rules from `typescript-eslint`
  - React Hooks rules enforced strictly
  - React Refresh export checks with `allowConstantExport: true`

**Strict Type Checking:**
- `strict: true` - all strict type checking options enabled in `tsconfig.app.json`
- `noUnusedLocals: true` - flags unused variables
- `noUnusedParameters: true` - flags unused function parameters
- `noFallthroughCasesInSwitch: true` - prevents switch fall-throughs
- `skipLibCheck: true` - skips type checking in node_modules for speed

## Import Organization

**Order:**
1. React/Framework imports (React, hooks, context)
2. External library imports (zod, @supabase/supabase-js, lucide-react, framer-motion, etc.)
3. Internal absolute path imports using `@/` alias
4. Type-only imports (use `import type` syntax)

**Pattern Examples:**
```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { NetworkProfile } from '@/types/network-profile';

// api/match-job.ts
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
```

**Path Aliases:**
- `@/*` → `./src/*` - all source code uses this alias
- Configured in `tsconfig.json` and `tsconfig.app.json`
- Used consistently across all imports in src/ and api/

## Error Handling

**Patterns:**
- Async functions return objects with `{ success: boolean; data?: T; error?: string }`
- Try-catch blocks with `console.error()` logging before returning error state
- No thrown errors in public API functions - always return error objects
- Guard clauses for null/undefined checks (e.g., `if (!supabase) return null`)

**Examples:**
```typescript
// Success/error return pattern
export async function createProfile(formData: ProfileFormData, userId: string): Promise<{ success: boolean; profile?: NetworkProfile; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    // ... operation ...
    if (error) throw error;
    return { success: true, profile };
  } catch (error: any) {
    console.error('Error creating profile:', error);
    return { success: false, error: error.message || 'Failed to create profile' };
  }
}

// Request validation with Zod
const MatchJobRequest = z.object({
  jobId: z.string().uuid(),
});
```

## Logging

**Framework:** `console` (native browser/Node.js)

**Patterns:**
- `console.log()` for informational messages (236 occurrences across codebase)
- `console.error()` for errors with context
- `console.warn()` for deprecation/warning conditions
- Logs prefixed with context tags: `[MatchJob]`, `[AuthContext]` in some functions

**When to Log:**
- Entry/exit of critical async operations
- Errors with full error object for debugging
- Environment variable issues and configuration warnings
- Database operation failures

**Example:**
```typescript
// api/match-job.ts
console.log(`[MatchJob] Fetching job submission: ${jobId}`);
console.error('Error in vector similarity search:', error);
```

## Comments

**When to Comment:**
- Complex business logic requiring explanation
- Why something is done (not what it does - code should be self-documenting)
- Workarounds and temporary solutions with context
- JSDoc comments for exported functions and complex signatures

**JSDoc/TSDoc:**
- Used for public APIs in utility libraries
- Parameter descriptions with types
- Return type documentation

**Example:**
```typescript
/**
 * Find similar profiles using vector similarity search (pgvector cosine similarity)
 * Only returns approved profiles that are available for work or collaborations
 *
 * @param embedding - The query embedding vector (1536 dimensions)
 * @param limit - Maximum number of results to return (default: 10)
 * @param threshold - Minimum similarity score (0-1, default: 0 = no threshold)
 * @returns Array of profiles with similarity scores, ordered by similarity descending
 */
export async function findSimilarProfiles(
  embedding: number[],
  limit: number = 10,
  threshold: number = 0
): Promise<ProfileWithSimilarity[]>
```

## Function Design

**Size:**
- Most functions stay under 100 lines
- Larger functions (100-300 lines) break complex operations into helper functions
- API routes sometimes longer to accommodate request handling and validation

**Parameters:**
- Maximum 3-4 direct parameters per function
- Use object/interface parameters for complex data
- Destructure props in React components

**Return Values:**
- Async functions return typed objects or interfaces
- Guard clauses return early with null or error objects
- Single responsibility: return one type of result

**Example:**
```typescript
// Good: Clear parameters and typed return
export async function updateCompany(
  companyId: string,
  data: CompanyUpdateData
): Promise<{ success: boolean; company?: Company; error?: string }>

// Good: Destructured props
const Navigation: React.FC<NavigationProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen
})
```

## Module Design

**Exports:**
- Named exports for functions and types (preferred)
- Default export only for React component pages/route components
- Barrel files use `export * from './module'` pattern for organizing exports

**Pattern Examples:**
```typescript
// src/lib/supabase.ts - multiple named exports
export const supabase = /* ... */;
export async function createProfile(/* ... */) { /* ... */ }
export async function getProfileBySlug(/* ... */) { /* ... */ }
export interface JobMatchWithDetails extends JobMatch { /* ... */ }

// src/components/Navigation.tsx - default export for route component
export default Navigation;
```

**Barrel Files:**
- Used in `src/components/ui/` for component exports
- Organized by feature in `src/lib/` and `src/utils/`
- No circular dependencies enforced through linting

## TypeScript-Specific Conventions

**Type Annotations:**
- Always annotate function parameters and return types
- Use `any` type cautiously (mostly for database row conversions with cast)
- Discriminated unions for error types: `type AnalysisError = CreditsExhaustedError | GenericError | null`

**Null Handling:**
- Nullable properties suffixed with `| null`
- Optional chaining: `session?.user ?? null`
- Nullish coalescing: `value ?? defaultValue`

---

*Convention analysis: 2026-01-22*
