# PRD: Lighthouse Audit Fixes & Performance Optimization

## Introduction

The Creative Technologists Collective website (creativetechnologists.nl) scored 92 across Accessibility, Best Practices, and SEO in Lighthouse audits, with 6 specific failures. This PRD addresses all 6 failures plus performance optimizations identified via a Chrome DevTools performance trace, targeting perfect 100 scores across all categories.

**Tech Stack:** React 19 + Vite + Tailwind CSS 3.4 + Supabase + Three.js, deployed on Vercel.

**Current Scores:** Accessibility 92 | Best Practices 92 | SEO 92
**Target Scores:** Accessibility 100 | Best Practices 100 | SEO 100

## Goals

- Achieve Lighthouse score of 100 for Accessibility
- Achieve Lighthouse score of 100 for Best Practices
- Achieve Lighthouse score of 100 for SEO
- Reduce critical path latency (currently 343ms) below 300ms
- Eliminate all console errors and warnings
- Maintain current CLS of 0.00 and LCP under 250ms

## User Stories

---

### US-001: Add `<main>` landmark to page layout

**Description:** As a screen reader user, I need a `<main>` landmark so I can skip directly to the primary content.

**Acceptance Criteria:**
- [ ] Wrap the primary content area in `src/App.tsx` with a `<main>` element
- [ ] The `<main>` element wraps the `<Routes>` section (not nav or footer)
- [ ] Existing flex layout and `pt-[72px]` styling is preserved
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

### US-002: Fix heading hierarchy (skip levels)

**Description:** As a screen reader user, I need headings in sequential order so I can navigate the page structure logically.

**Acceptance Criteria:**
- [ ] Audit all heading usage across components: `alert.tsx` (h5), `faq3.tsx`, `contact-2.tsx`, `AnalysisCreditsCard.tsx`, and page components
- [ ] Replace any `<h5>` elements that skip levels with the correct sequential heading (e.g., h3 or h4 depending on parent context)
- [ ] Ensure no heading level is skipped (h1 → h2 → h3, never h1 → h3 or h2 → h5)
- [ ] Visual appearance is preserved using Tailwind classes (e.g., `text-sm font-semibold` to maintain small heading style)
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

### US-003: Fix color contrast for zinc text classes

**Description:** As a visually impaired user, I need sufficient contrast between text and background so I can read all content.

**Acceptance Criteria:**
- [ ] Identify all instances of `text-zinc-500` and `text-zinc-400` used on dark backgrounds (`bg-black`, `bg-zinc-900`, etc.)
- [ ] Replace `text-zinc-500` (#71717a) with `text-zinc-400` (#a1a1aa) or lighter where contrast ratio is below 4.5:1
- [ ] Replace `text-zinc-400` with `text-zinc-300` (#d4d4d8) where contrast ratio is below 4.5:1
- [ ] Affected files include: `image-upload.tsx`, `creative-spectrum-slider.tsx`, `MessageNotification.tsx`, `faq3.tsx`, and any other files using these classes on dark backgrounds
- [ ] All text meets WCAG AA contrast ratio of 4.5:1 for normal text, 3:1 for large text
- [ ] Typecheck passes
- [ ] Verify changes work in browser — visual style remains consistent (subtle secondary text, not jarring)

---

### US-004: Defer notification permission to user gesture

**Description:** As a user, I don't want to be asked for notification permission before I've interacted with the site, as this is intrusive and violates best practices.

**Acceptance Criteria:**
- [ ] Remove the `useEffect` auto-trigger of `requestNotificationPermission()` in `src/components/MessageNotification.tsx`
- [ ] Add a UI element (e.g., bell icon button or inline prompt) that the user can click to enable notifications
- [ ] Only call `Notification.requestPermission()` in response to that user click
- [ ] Existing notification functionality (sound, auto-close, desktop notifications) continues to work after permission is granted
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

### US-005: Fix console errors and warnings

**Description:** As a developer, I need to eliminate console errors so the site passes Lighthouse Best Practices and underlying issues are resolved.

**Acceptance Criteria:**
- [ ] Fix the 401 error — identify the failing network request (likely a Supabase or API call made without auth) and add proper error handling or conditional fetching
- [ ] Fix Canvas2D `willReadFrequently` warnings — locate the canvas/Three.js component and add `willReadFrequently: true` to the canvas context options
- [ ] Fix form field elements missing `id` or `name` attributes — add `id` and `name` to all `<input>`, `<select>`, and `<textarea>` elements
- [ ] No errors or warnings appear in the console on a fresh page load (excluding third-party scripts outside our control)
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

### US-006: Create valid robots.txt

**Description:** As a search engine crawler, I need a valid robots.txt so I can correctly index the site.

**Acceptance Criteria:**
- [ ] Create `public/robots.txt` with valid syntax
- [ ] Allow all crawlers to index the site: `User-agent: *` with `Allow: /`
- [ ] Disallow sensitive paths: `/api/`, `/admin/`
- [ ] Include sitemap reference: `Sitemap: https://www.creativetechnologists.nl/sitemap.xml`
- [ ] Verify the file is accessible at `https://www.creativetechnologists.nl/robots.txt` after deploy
- [ ] Lighthouse SEO audit passes with no robots.txt errors

---

### US-007: Optimize render-blocking resources and fonts

**Description:** As a user, I want the page to render as fast as possible without being blocked by non-critical CSS or duplicate font downloads.

**Acceptance Criteria:**
- [ ] Add `font-display: swap` to all @font-face declarations (verify cdnfonts behavior)
- [ ] Remove unused preconnect to `https://fonts.gstatic.com/` (flagged as unused in trace)
- [ ] Eliminate duplicate PP Neue Montreal font downloads — currently 6 requests for 3 fonts (bold, medium, book each downloaded twice)
- [ ] Verify the main CSS bundle is loaded efficiently
- [ ] Typecheck passes
- [ ] Verify changes work in browser — fonts render without FOUT/FOIT issues

---

### US-008: Optimize third-party script loading

**Description:** As a user, I want third-party scripts to not delay my interaction with the page.

**Acceptance Criteria:**
- [ ] Defer Google Tag Manager loading using `async` or load it after initial render
- [ ] Lazy-load images from external CDNs (imagekit.io, letsgetdigital.com, leonardo.ai) — use `loading="lazy"` on all below-the-fold `<img>` tags
- [ ] Total third-party transfer currently ~2MB (imagekit 639KB, letsgetdigital 519KB, GTM 459KB, cdnfonts 388KB) — defer non-critical assets
- [ ] LCP remains under 250ms
- [ ] CLS remains at 0.00
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

### US-009: Optimize critical API path

**Description:** As a developer, I want to reduce the critical path latency by optimizing the n8n webhook fetch which sits on the longest dependency chain (343ms).

**Acceptance Criteria:**
- [ ] Verify `<link rel="preconnect" href="https://n8n.creativetechnologists.nl">` exists in `index.html`
- [ ] If the `/webhook/cases` data is not needed for above-the-fold content, defer the fetch to after initial render
- [ ] If needed for initial render, consider prefetching the endpoint
- [ ] Critical path latency is reduced below 300ms
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

## Non-Goals

- No visual redesign or layout changes beyond contrast adjustments
- No migration away from current tech stack (Vite, React, Tailwind)
- No SEO content strategy (meta descriptions, structured data, etc.) — only robots.txt fix
- No mobile-specific performance optimizations beyond what benefits both platforms
- No changes to Supabase backend or API logic
- No sitemap XML generation (referenced in robots.txt but creation is a separate effort)

## Technical Considerations

- **Vite build:** CSS is bundled into a single file (`index-*.css`); Tailwind class changes are picked up automatically
- **Vercel deployment:** `robots.txt` in `/public/` will be served at root automatically
- **Three.js canvas:** The `willReadFrequently` fix may need to be applied at the React Three Fiber `<Canvas>` component level via the `gl` prop or canvas context
- **Font loading:** PP Neue Montreal is loaded from cdnfonts.com — we don't control their CSS, so `font-display` may need to be overridden locally
- **Notification API:** Feature-detect `'Notification' in window` before showing the enable button
- **Existing preconnects** in `index.html`: `fonts.cdnfonts.com`, `fonts.googleapis.com`, `fonts.gstatic.com` (unused — remove), `n8n.creativetechnologists.nl`
- **Console errors found:** 401 resource error, Canvas2D willReadFrequently (x3), form field missing id/name (x2)
