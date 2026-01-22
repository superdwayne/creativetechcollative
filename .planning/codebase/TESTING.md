# Testing Patterns

**Analysis Date:** 2026-01-22

## Test Framework

**Runner:**
- None detected - No test framework currently configured
- No test dependencies in `package.json`
- No test configuration files (`vitest.config.ts`, `jest.config.js`)

**Assertion Library:**
- Not applicable (no testing framework installed)

**Run Commands:**
- No test scripts configured in `package.json`
- Package.json scripts: `dev`, `start`, `build`, `lint`, `preview`

## Test File Organization

**Current State:**
- No test files in source directories (`src/`, `api/`)
- Search results: 0 `.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx` files in codebase

**Recommended Location (if testing were added):**
- Co-located pattern: `src/components/Navigation.test.tsx` next to `src/components/Navigation.tsx`
- Library functions: `src/lib/supabase.test.ts` next to `src/lib/supabase.ts`
- Hooks: `src/hooks/useJobAnalysis.test.ts` next to `src/hooks/useJobAnalysis.ts`
- API routes: `api/match-job.test.ts` next to `api/match-job.ts`

**Naming Convention (if testing were added):**
- Pattern: `[module-name].test.ts` or `[module-name].spec.ts`
- Examples: `supabase.test.ts`, `useAuth.test.ts`, `Navigation.test.tsx`

## Test Structure

**No Current Testing Framework - Recommended Setup:**

If testing were implemented, based on codebase patterns, the structure would likely be:

```typescript
// Example: src/lib/supabase.test.ts
describe('Supabase Operations', () => {
  describe('Profile Management', () => {
    test('creates profile with valid data', async () => {
      // Arrange
      const formData = { /* test data */ };

      // Act
      const result = await createProfile(formData, 'test-user-id');

      // Assert
      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
    });

    test('returns error when database not configured', async () => {
      // Arrange - mock supabase as null

      // Act
      const result = await createProfile(mockData, 'user-id');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

**Patterns Observed (for replication):**
- All async functions use Promise-based returns with `{ success, data, error }` objects
- This pattern is testable and should drive test structure
- Error handling is explicit, making error cases easy to test

## Mocking

**Framework:**
- None currently - would likely use Vitest or Jest built-in mocking

**Recommended Mocking Patterns:**

For the observed patterns in codebase, mocking would focus on:

```typescript
// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signUp: vi.fn(),
      signIn: vi.fn(),
    },
    rpc: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}));

// Mock API responses
fetch = vi.fn(() =>
  Promise.resolve(
    new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  )
);

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('ADMIN_USER_IDS', 'admin-id-1,admin-id-2');
```

**What to Mock:**
- Supabase client and all its methods (database, auth, storage)
- Fetch API calls for external services
- Environment variables for configuration
- Date/Time functions if time-dependent logic exists

**What NOT to Mock:**
- Pure utility functions (e.g., `cn()` in `src/lib/utils.ts`)
- Type/interface definitions
- Helper functions like `generateSlug()`, `rowToProfile()`
- React hooks built-ins (React will handle these)

## Fixtures and Factories

**No Current Test Fixtures - Recommended Approach:**

Based on data structures in codebase:

```typescript
// tests/fixtures/profiles.ts
export const mockNetworkProfile = {
  id: 'profile-123',
  userId: 'user-456',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  location: 'Amsterdam',
  bio: 'Creative technologist',
  skills: ['TypeScript', 'React', 'Design'],
  focusAreas: ['Web', 'AI'],
  availability: 'available',
  portfolioUrl: 'https://jane.example.com',
  linkedinUrl: 'https://linkedin.com/in/jane',
  projects: [
    {
      title: 'Project A',
      description: 'A web project',
      url: 'https://project-a.example.com',
      imageUrl: 'https://image.example.com/project-a.png',
    },
  ],
  approved: true,
  createdAt: '2024-01-01T00:00:00Z',
  slug: 'jane-doe',
};

export const mockJobSubmission = {
  id: 'job-789',
  companyId: 'company-123',
  title: 'Senior Frontend Developer',
  description: 'We are looking for...',
  requirements: ['5+ years React', 'TypeScript'],
  focusAreas: ['Web', 'Performance'],
  status: 'pending',
  createdAt: '2024-01-15T00:00:00Z',
};

export const mockJobMatch = {
  id: 'match-101',
  jobId: 'job-789',
  profileId: 'profile-123',
  matchScore: 0.92,
  matchReasoning: 'Strong alignment in skills and focus areas',
  adminApproved: true,
  memberResponse: null,
  createdAt: '2024-01-16T00:00:00Z',
};
```

**Location:**
- Create `tests/fixtures/` directory with domain-based files
- Co-located option: `src/__mocks__/` for module mocks
- Factory pattern for generating variations: `createMockProfile(overrides)`

## Coverage

**Requirements:**
- Not enforced - No coverage configuration detected
- No coverage thresholds in CI/build process

**View Coverage (if implemented):**
```bash
# Vitest
vitest coverage

# Jest
jest --coverage
```

**Recommended Coverage Goals (if testing framework added):**
- Utilities and libraries: 80%+ coverage (core logic)
- Components: 60%+ coverage (UI is harder to test thoroughly)
- API routes: 90%+ coverage (critical path logic)
- Hooks: 70%+ coverage (state management is important)

## Test Types

**Unit Tests:**
- Scope: Individual functions and utilities
- Approach: Test pure functions and business logic in isolation
- Examples to test:
  - `src/lib/supabase.ts` - database operation helpers
  - `src/lib/embeddings.ts` - embedding generation
  - `src/utils/featureFlags.ts` - feature flag logic
  - Utility functions like `generateSlug()`, `cn()`

**Integration Tests:**
- Scope: Multiple modules working together
- Approach: Test Supabase operations with mocked client, component + hook interactions
- Examples to test:
  - Profile creation flow (form → validation → API call → state update)
  - Job matching pipeline (fetch job → generate embeddings → find matches)
  - Authentication context with API calls

**E2E Tests:**
- Framework: Not currently used (would require Playwright, Cypress, or similar)
- Recommended if implemented: Playwright for modern browsers
- Coverage: Critical user journeys only (auth, profile creation, job browsing)

## Common Patterns

**Async Testing:**
```typescript
// Pattern from codebase: async functions with Promise returns
test('creates profile successfully', async () => {
  const result = await createProfile(formData, userId);

  // Check the { success, data, error } pattern
  expect(result.success).toBe(true);
  expect(result.profile).toBeDefined();
  expect(result.error).toBeUndefined();
});

// Async hook testing
test('useAuth manages session state', async () => {
  const { result } = renderHook(() => useAuth());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.user).toBeDefined();
});
```

**Error Testing:**
```typescript
// Pattern: test error conditions and error messages
test('returns error when database not configured', async () => {
  // Mock supabase as null
  vi.mocked(supabase).mockReturnValue(null);

  const result = await createProfile(formData, userId);

  expect(result.success).toBe(false);
  expect(result.error).toBe('Database not configured');
});

// Test specific error types
test('handles validation errors', async () => {
  const invalidData = { /* invalid form data */ };

  const result = await createProfile(invalidData, userId);

  expect(result.success).toBe(false);
  expect(result.error).toContain('validation');
});

// Test HTTP error codes
test('handles 402 credits exhausted error', async () => {
  fetch.mockResolvedValue(
    new Response(JSON.stringify({ code: 'CREDITS_EXHAUSTED' }), {
      status: 402,
    })
  );

  const { result } = renderHook(() => useJobAnalysis());
  await act(async () => {
    await result.current.analyze(jobData);
  });

  expect(result.current.error?.type).toBe('credits_exhausted');
});
```

## Test Execution Strategy

**Quick Start (if framework added):**
```bash
# Install Vitest (recommended for Vite projects)
npm install -D vitest @vitest/ui

# Run tests in watch mode during development
npm run test:watch

# Run tests once with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/lib/supabase.test.ts
```

**CI/CD Integration:**
- Add to `package.json` scripts: `"test": "vitest run"`
- Pre-commit hook to run tests on changed files
- Fail build if tests don't pass

---

*Testing analysis: 2026-01-22*
