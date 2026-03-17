# PRD-Lite: Multiple Projects & Creative Spectrum Slider

**Date:** 2026-02-13  
**Status:** Draft  
**Author:** AI-assisted  

---

## 1. Problem Statement

### Multiple Projects
CTC Network members currently have a **hard cap of 5 projects** on their profile. Creative technologists often have extensive portfolios spanning dozens of projects across different disciplines. The current limit forces users to cherry-pick, which poorly represents the breadth of their work — especially for senior practitioners.

### Creative Spectrum Slider
The CTC community sits at the **intersection of design and development**, but there's no way for members to signal *where* on that spectrum they fall. A visitor browsing the directory can't quickly tell if someone is a hands-on coder, a visual designer, or a true hybrid. This matters for:
- Companies looking for the right type of creative technologist
- Members seeking collaborators with complementary strengths
- Community self-identity and culture

---

## 2. Goals

| Goal | Metric |
|------|--------|
| Allow members to showcase more of their work | Increase average projects per profile from ~2 to 5+ |
| Let members express their designer/developer identity | >70% of profiles have a spectrum value set within 30 days |
| Improve directory browsability and matching | Qualitative feedback from members and companies |
| Zero disruption to existing profiles | All current data preserved, no forced re-entry |

---

## 3. Feature: Expanded Projects

### 3.1 Current State

| Aspect | Current |
|--------|---------|
| Storage | JSONB array in `network_profiles.projects` column |
| Limit | Hard-coded to **5** in `NetworkCreateProfilePage` and `NetworkEditProfilePage` |
| Fields per project | `id`, `title`, `imageUrl`, `description` (500 char), `link` |
| Display | 2-column grid on profile page, no pagination |

### 3.2 Proposed Changes

**Raise the project limit to 10.**

Rationale: 10 is generous enough to showcase breadth without creating UI bloat. JSONB storage can handle this easily; even at 10 projects the column stays well under PostgreSQL's practical JSONB limits.

#### Schema
No database migration needed. The JSONB column already accepts any number of projects. The limit is purely frontend.

#### Frontend Changes

**Create Profile Page** (`NetworkCreateProfilePage.tsx`)
- Change cap from `5` → `10` in `addProject()` and the "Add Project" button conditional
- Update helper text: *"Add up to 10 projects to showcase your work"*
- Keep default starting state at 2 empty projects (unchanged)

**Edit Profile Page** (`NetworkEditProfilePage.tsx`)
- Same cap change `5` → `10`
- Same helper text update

**Profile View Page** (`NetworkProfilePage.tsx`)
- If > 6 projects: show first 6, then a "Show all projects" expand button
- Collapsed state: 2-column grid (unchanged)
- Expanded state: same 2-column grid, all projects visible
- Smooth expand animation using CSS `max-height` transition or similar

**Directory Page** (`NetworkDirectoryPage.tsx`)
- No changes needed — cards already show project count or a summary

**Dashboard Page** (`NetworkDashboardPage.tsx`)
- Project list in enrichment preview: allow up to 10 (currently limited by enrichment API response, but the UI should support it)

#### Validation
- Title: required, max 100 chars (unchanged)
- Description: required, max 500 chars (unchanged)
- Link: optional, basic URL validation (unchanged)
- Image: optional (unchanged)
- At least 1 project with a title required to pass step validation

---

## 4. Feature: Creative Spectrum Slider

### 4.1 Concept

A single-axis slider that lets a member place themselves on a spectrum:

```
Designer ◄━━━━━━━━━━━━━━━━━━━━━► Developer
    0                50               100
```

- **0** = Pure designer (visual, UX, art direction)
- **50** = True hybrid / creative technologist (default)
- **100** = Pure developer (engineering, systems, infrastructure)

The value is stored as an integer 0–100. Members can leave it at the default (50) or adjust.

### 4.2 Why a Slider (Not Discrete Options)

- Creative technology is inherently a **spectrum**, not a category
- Avoids the "I'm both" problem with radio buttons
- Visually interesting and on-brand for a creative tech community
- Creates a natural conversation starter on profiles

### 4.3 Schema

**Migration: `023_add_creative_spectrum.sql`**

```sql
-- Add creative spectrum field to network_profiles
-- 0 = designer, 50 = hybrid (default), 100 = developer
ALTER TABLE network_profiles
  ADD COLUMN IF NOT EXISTS creative_spectrum INTEGER DEFAULT 50
  CHECK (creative_spectrum >= 0 AND creative_spectrum <= 100);
```

### 4.4 Type Changes

**`src/types/network-profile.ts`**

```typescript
// Add to NetworkProfile interface:
creativeSpectrum: number; // 0-100: 0=designer, 50=hybrid, 100=developer

// Add to ProfileFormData interface:
creativeSpectrum: number;
```

### 4.5 Frontend: Slider Component

Create a reusable `CreativeSpectrumSlider` component:

**Behavior:**
- Range input (`<input type="range" min="0" max="100">`)
- Custom styled with gradient track: violet (designer) → hybrid middle → cyan (developer)
- Labels at each end: "Designer" / "Developer"
- Center label: "Hybrid"
- Snap points at 0, 25, 50, 75, 100 with subtle detents (optional, can just be free-form)
- Current value shown as contextual label that changes as you drag:
  - 0-15: "Designer"
  - 16-35: "Design-leaning"
  - 36-64: "Hybrid"
  - 65-84: "Dev-leaning"
  - 85-100: "Developer"

**Visual style:**
- Dark theme consistent with existing UI (zinc/black backgrounds)
- Track: gradient from `violet-500` → `zinc-500` → `cyan-500`
- Thumb: white circle with subtle glow matching the current position color
- Width: full container width on mobile, max ~400px on desktop

### 4.6 Frontend: Integration Points

**Create Profile Page** — Step 2 (Specialization)
- Add slider below focus areas / skills section
- Label: "Where do you fall on the creative spectrum?"
- Helper text: "This helps others understand your strengths at a glance"
- Default value: 50

**Edit Profile Page** — Step 2 (Specialization)
- Same placement and behavior
- Pre-populated from existing profile data

**Profile View Page**
- Display as a visual bar in the profile header area (below bio, above focus areas)
- Shows the gradient bar with a marker at the member's position
- Label text based on the value (e.g., "Design-leaning")
- Read-only — no interaction

**Directory Page / Profile Cards**
- Optional: small indicator dot or mini-bar on profile cards
- Could be used as a filter in the future (Phase 2)

**Dashboard Page**
- Show current spectrum value in profile summary section

### 4.7 Data Layer

**`src/lib/supabase.ts`**

`createProfile()` — include `creative_spectrum` in insert payload  
`updateProfile()` — include `creative_spectrum` in update payload  
`getProfileByUserId()` / `getProfileBySlug()` — already uses `SELECT *`, so no query changes needed  

Map `creative_spectrum` (snake_case DB) ↔ `creativeSpectrum` (camelCase TS) in the existing transform functions.

---

## 5. Implementation Plan

### Phase 1: Projects Expansion (Small — ~2 hours)
1. Update `addProject()` cap in both create/edit pages
2. Update "Add Project" button visibility conditionals
3. Add expand/collapse to `NetworkProfilePage` if > 6 projects
4. Test with existing profiles (no migration needed)

### Phase 2: Creative Spectrum (Medium — ~4 hours)
1. Create SQL migration `023_add_creative_spectrum.sql`
2. Update TypeScript types (`NetworkProfile`, `ProfileFormData`)
3. Build `CreativeSpectrumSlider` component
4. Integrate into Create Profile page (Step 2)
5. Integrate into Edit Profile page (Step 2)
6. Add read-only display to Profile View page
7. Update `createProfile` / `updateProfile` in `supabase.ts`
8. Test end-to-end

### Phase 3: Polish & Directory Integration (Optional — ~2 hours)
1. Add mini spectrum indicator to directory profile cards
2. Add spectrum as a filter option in directory
3. Animate the profile view spectrum bar on scroll-in

---

## 6. Edge Cases & Considerations

| Scenario | Handling |
|----------|----------|
| Existing profiles with no `creative_spectrum` | Default to 50 (hybrid) via DB default |
| User never touches the slider | Value stays at 50, displays as "Hybrid" |
| Enrichment API (auto-fill) | Don't auto-set spectrum — this is personal identity, not data |
| Embedding/AI matching | Include spectrum label in enriched content for better job matching |
| Mobile touch UX | Range input works natively on touch; ensure thumb is large enough (44px min) |
| Accessibility | ARIA label, keyboard controls (arrow keys), visible focus states |
| Projects with no image | Already handled — image is optional, card adjusts layout |
| Removing projects below current count | Already works — trash icon per project |

---

## 7. Out of Scope (Future)

- Project tags/categories (e.g., "AR", "Web", "Installation")
- Project collaboration — tagging other CTC members on shared projects
- Featured/pinned project (hero project at top)
- Spectrum-based matching algorithm for companies
- Spectrum distribution analytics for the community
- Project analytics (view counts, clicks)

---

## 8. Success Criteria

- [ ] Members can add up to 10 projects
- [ ] Profile page gracefully handles 10 projects with expand/collapse
- [ ] Creative spectrum slider renders and saves correctly
- [ ] Profile view page shows read-only spectrum visualization
- [ ] Existing profiles unaffected (backward compatible)
- [ ] Mobile-responsive on all new UI elements
- [ ] No new linter errors or type errors
