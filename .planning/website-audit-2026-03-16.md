# Website Audit: creativetechnologists.nl
**Date:** 2026-03-16
**Auditor:** Claude Code (CLI-based, no DevTools MCP)

---

## Infrastructure Overview

| Item | Value |
|------|-------|
| Host | Vercel (Frankfurt region) |
| IP | 216.198.79.1 |
| Protocol | HTTP/2 |
| HSTS | max-age=63072000 (~2 years) |
| SSL | Valid (verify: 0 = success) |
| Apex redirect | creativetechnologists.nl -> www.creativetechnologists.nl (307) |
| HTML Size | 5,616 bytes (SPA shell) |
| JS Bundle | **2,019,432 bytes (~1.97 MB)** - single file |
| CSS Bundle | 134,932 bytes (~132 KB) - single file |
| TTFB | 65ms |
| Total Load (HTML) | 65ms |

---

## CRITICAL ISSUES

### 1. Domain Mismatch (SEO Disaster)
**Severity: CRITICAL**

The site is deployed at `creativetechnologists.nl` but ALL meta tags reference `creativetechcollective.com`:
- `<link rel="canonical" href="https://creativetechcollective.com/">`
- `<meta property="og:url" content="https://creativetechcollective.com/">`
- `<meta property="og:image" content="https://creativetechcollective.com/og-image.jpg">`
- `<meta property="twitter:url" content="https://creativetechcollective.com/">`

`creativetechcollective.com` **does not resolve** — curl returns empty. This means:
- Google treats the canonical as a different (non-existent) domain
- Social sharing previews (OG/Twitter) reference broken image URLs
- Search ranking is being actively harmed

**Fix:** Update all meta URLs to `https://www.creativetechnologists.nl/`

### 2. No robots.txt
**Severity: HIGH**

`/robots.txt` returns the SPA's `index.html` instead of a proper robots.txt file. Search engine crawlers cannot parse this.

**Fix:** Add a `public/robots.txt` file:
```
User-agent: *
Allow: /
Sitemap: https://www.creativetechnologists.nl/sitemap.xml
```

### 3. No sitemap.xml
**Severity: HIGH**

`/sitemap.xml` returns `index.html` (SPA fallback). Search engines have no way to discover pages.

**Fix:** Generate a `public/sitemap.xml` listing all public routes.

### 4. N8N Automation Server Publicly Exposed
**Severity: HIGH (Security)**

`n8n.creativetechnologists.nl` returns HTTP 200 with a full 15KB HTML page. n8n is a workflow automation tool that may contain:
- API keys and credentials in workflows
- Internal business logic
- Access to connected services

Additionally, the main site `<link rel="preconnect">` tags reference this n8n instance, exposing it to all visitors.

**Fix:** Restrict n8n access via IP allowlist, VPN, or authentication. Remove the preconnect tag from index.html.

---

## SECURITY ISSUES

### 5. Missing Security Headers
**Severity: HIGH**

| Header | Status |
|--------|--------|
| Content-Security-Policy | MISSING |
| X-Frame-Options | MISSING |
| X-Content-Type-Options | MISSING |
| Referrer-Policy | MISSING |
| Permissions-Policy | MISSING |
| X-XSS-Protection | MISSING |

Only present: `strict-transport-security` and `cache-control`.

**Fix:** Add to `vercel.json` headers config:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.cdnfonts.com https://fonts.googleapis.com; font-src https://fonts.gstatic.com https://fonts.cdnfonts.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://www.google-analytics.com" }
      ]
    }
  ]
}
```

### 6. Overly Permissive CORS
**Severity: MEDIUM**

`access-control-allow-origin: *` on the HTML document. This is Vercel's default but allows any origin to fetch the page content.

**Fix:** This is acceptable for a public static site but should be restricted on API routes.

---

## PERFORMANCE ISSUES

### 7. Massive Uncompressed JS Bundle (~2 MB)
**Severity: HIGH**

A single 2MB JavaScript bundle (`index-CLb4H6Y4.js`) with no code splitting. This means:
- Every visitor downloads the entire app regardless of which page they visit
- First meaningful paint is delayed until 2MB is parsed
- Mobile users on slow connections are severely impacted

**Fix:**
- Enable code splitting with React.lazy() and dynamic imports
- Route-based splitting for admin, beta, company, and network sections
- Tree-shake unused dependencies

### 8. No Gzip/Brotli Content-Encoding on Assets
**Severity: MEDIUM**

Response headers for JS/CSS bundles don't show `content-encoding: gzip` or `br`. Vercel typically handles this automatically, but the 2MB figure may represent uncompressed size.

**Verify:** Check actual transfer size with `curl --compressed`.

### 9. Client-Side Only Rendering (SPA)
**Severity: MEDIUM (SEO)**

The 5.6KB HTML shell contains no pre-rendered content. All page content is rendered via JavaScript. Search engines that don't execute JS will see an empty page.

**Fix:** Consider SSR/SSG for key landing pages, or at minimum use a pre-rendering service.

---

## SEO ISSUES

### 10. Comprehensive Meta Tags (Positive)
The site has thorough meta tags including:
- Title, description, keywords
- Open Graph (type, title, description, image, site_name, locale)
- Twitter Card (summary_large_image)
- LinkedIn owner tag
- Theme color
- Application name

**However**, all URLs in these tags point to the wrong domain (see issue #1).

---

## ACCESSIBILITY

### 11. Minimal Static Accessibility
**Severity: LOW** (may be fine in JS-rendered content)

Only 1 ARIA-related attribute found in static HTML (`lang="en"`). Since this is a SPA, accessibility attributes likely exist in the JS-rendered DOM but can't be verified without browser execution.

**Recommendation:** Test with axe DevTools or Lighthouse in a real browser.

---

## MINOR ISSUES

### 12. Webmanifest Incomplete
`name` and `short_name` are empty strings in `site.webmanifest`. This affects PWA install prompts.

### 13. Inline Google Analytics Script
The gtag.js script is loaded inline. Without CSP nonces, adding a CSP later will require adjusting this.

### 14. Cache-Control: max-age=0
HTML is served with `cache-control: public, max-age=0, must-revalidate`. This is correct for a SPA shell (always check for updates) but the hashed asset files (JS/CSS) should have long cache lifetimes.

---

## SUMMARY SCORECARD

| Category | Score | Notes |
|----------|-------|-------|
| **Security** | 3/10 | Missing all security headers, exposed n8n, wildcard CORS |
| **SEO** | 2/10 | Wrong canonical domain, no robots.txt, no sitemap, SPA-only |
| **Performance** | 4/10 | Fast TTFB but 2MB JS bundle with no code splitting |
| **Accessibility** | 5/10 | Cannot fully assess without JS execution; HTML lang is set |
| **Best Practices** | 4/10 | Good HSTS, Vercel cache, but webmanifest/meta issues |

**Overall: 3.6/10** — The site loads fast from Vercel's CDN but has critical SEO and security gaps that need immediate attention.

---

## TOP 5 PRIORITY FIXES

1. **Fix domain mismatch** in all meta tags (canonical, OG, Twitter) — currently pointing to non-existent `creativetechcollective.com`
2. **Add security headers** in `vercel.json` (CSP, X-Frame-Options, etc.)
3. **Add robots.txt and sitemap.xml** to `public/` directory
4. **Restrict n8n instance** access and remove preconnect tag
5. **Implement code splitting** to reduce the 2MB JS bundle
