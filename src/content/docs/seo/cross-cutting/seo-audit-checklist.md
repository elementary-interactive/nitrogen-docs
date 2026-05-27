---
title: SEO Audit Checklist
description: Quarterly review for production sites
sidebar:
  order: 4
---

# SEO Audit Checklist

A quarterly review to catch regressions and ensure best practices. Schedule
quarterly in calendar; expect 4-6 hours for a thorough audit on a Nitrogen-sized
site.

## Section 1: Technical SEO

### Crawlability

- [ ] **robots.txt** valid and accessible at `/robots.txt`
- [ ] **robots.txt** doesn't block important pages (test in Search Console robots tester)
- [ ] **Sitemap.xml** valid, accessible, submitted to Search Console
- [ ] **Sitemap referenced in robots.txt**
- [ ] **Sitemap "Last read"** in Search Console is recent (within last 7 days)
- [ ] **Indexed URL count** in Search Console roughly matches expected count
- [ ] **All important pages indexed** (spot-check 20 critical URLs via URL Inspection)
- [ ] **No orphaned pages** (Screaming Frog crawl → "Orphan Pages" report empty)
- [ ] **HTTPS** on every URL, no mixed content warnings
- [ ] **Trailing slash convention** consistent site-wide
- [ ] **Canonical URL** on every page (self-referential)
- [ ] **404 page** custom, returns proper 404 status (NOT soft 404 — test with curl)
- [ ] **No redirect chains** (max 1 hop — audit with curl bulk script)
- [ ] **No redirect loops**

### Status codes

- [ ] **Search Console Crawl Stats** shows >95% 200 responses
- [ ] **5xx rate** <0.5%
- [ ] **404 rate** <2%, and remaining 404s are mostly bot probes (not legitimate user traffic)
- [ ] **No soft 404s** (Search Console Coverage)

### On-page SEO

- [ ] **Unique title** on every page (Screaming Frog: filter duplicates)
- [ ] **Title length** 50-60 chars (Screaming Frog: filter outside range)
- [ ] **Unique meta description** on every page
- [ ] **Description length** 150-160 chars
- [ ] **Exactly one H1** per page (Screaming Frog: H1 audit)
- [ ] **Heading hierarchy** logical (no skipped levels)
- [ ] **Alt text** on all content images (Screaming Frog: Images → "Missing Alt Text")
- [ ] **Internal linking** from new content to related pages
- [ ] **Anchor text** descriptive (no "click here", "read more")

### Structured data

- [ ] **Organization schema** on every page (in layout)
- [ ] **BreadcrumbList** on deep pages
- [ ] **Article schema** on blog posts
- [ ] **FAQPage schema** on FAQ pages
- [ ] **Rich Results Test passes** for all schema types
- [ ] **Schema Markup Validator passes** for all schema types
- [ ] **Search Console Enhancements** show valid coverage, no errors

### Performance (Core Web Vitals)

- [ ] **Core Web Vitals: "Good"** for 75%+ of pages (Search Console field data)
- [ ] **PageSpeed Insights** score >=90 for key landing pages (mobile)
- [ ] **LCP** <2.5s for 75%+ of pages
- [ ] **INP** <200ms for 75%+ of pages
- [ ] **CLS** <0.1 for 75%+ of pages
- [ ] **Lighthouse SEO** >=95
- [ ] **Lighthouse Accessibility** >=95

### Mobile

- [ ] **Search Console Mobile Usability** clean (no errors)
- [ ] **Touch targets** >=48×48px (Lighthouse audit)
- [ ] **No horizontal scroll** on mobile viewports
- [ ] **Font size** readable (16px+ body)
- [ ] **Mobile-first indexing** confirmed in Search Console URL Inspection (crawled-as: Smartphone)

## Section 2: International / Multilingual

(Skip if site is single-language)

- [ ] **hreflang annotations** on all multilingual pages
- [ ] **hreflang bidirectional** (every page references back)
- [ ] **hreflang self-reference** included
- [ ] **x-default** for unmatched locales
- [ ] **No broken hreflang** (all destinations return 200)
- [ ] **URL structure consistent** (subdirectory, ccTLD, or subdomain — same throughout)
- [ ] **Search Console International Targeting** report clean
- [ ] **No Accept-Language auto-redirect** (test with various Accept-Language headers)

## Section 3: Social

- [ ] **OpenGraph tags** on every page
- [ ] **og:image** 1200×630 px, <1MB, accessible URL
- [ ] **og:type** appropriate (`website` or `article`)
- [ ] **og:locale** correct for page language
- [ ] **Twitter Card tags** on every page
- [ ] **LinkedIn Post Inspector** preview correct for landing pages
- [ ] **Facebook Sharing Debugger** preview correct
- [ ] **OG image alt text** on all content with OG images

## Section 4: Analytics / Tracking

- [ ] **Google Analytics 4** tracking firing on all pages
- [ ] **Consent Mode v2** working (per [Skill: Consent Mode v2 Debug](/skills/consent-mode-v2-debug/))
- [ ] **GA4 Key Events** marked (form submissions, signups, downloads)
- [ ] **LinkedIn Insight Tag** Verified status in Campaign Manager (if used)
- [ ] **Search Console linked to GA4**
- [ ] **Spot-check tracking**: open page in browser, check Network tab for tracking pings

## Section 5: CMS / Backend

- [ ] **Slug change** auto-creates 301 redirect (test by changing a draft page's slug)
- [ ] **Archived content** properly 410-Gone or redirects (not soft 404)
- [ ] **Per-content SEO fields** editable in admin (title, description, OG image, robots)
- [ ] **Search Console connected** for ownership verification (DNS TXT primary)
- [ ] **IndexNow** notifying Bing on new/updated content (check Bing Webmaster IndexNow report)
- [ ] **Sitemap regenerated** on content publish (verify lastmod updates)
- [ ] **Editor SERP preview** widget working in CMS

## Section 6: Security & Headers

- [ ] **HSTS preload** enabled (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`)
- [ ] **Security headers A+** on [securityheaders.com](https://securityheaders.com/)
- [ ] **SSL Labs A+** on [ssllabs.com](https://www.ssllabs.com/ssltest/)
- [ ] **No exposed `.git`, `.env`, backup files** (curl test common paths)
- [ ] **CSP active and complete** (per [Skill: CSP allow-list](/skills/csp-allow-list/))
- [ ] **No mixed content warnings** in browser console on any page

## Section 7: Content Quality

- [ ] **No duplicate content** (Search Console "Duplicate without user-selected canonical" near zero)
- [ ] **No thin content** (<300 words on important pages) — Screaming Frog Content → Word Count
- [ ] **Outdated content** identified and refreshed or archived
- [ ] **404 pages from old links** redirected to relevant content
- [ ] **Search Console queries** match content (no mismatched targeting — e.g., ranking for queries unrelated to your business)
- [ ] **Top-traffic pages** have current data, relevant for searcher intent
- [ ] **Blog posts older than 1 year** reviewed: still accurate? Still relevant? Update or archive.

## Section 8: Backlinks

- [ ] **Search Console Links report** reviewed (Top linking sites, Top linking text)
- [ ] **No suspicious backlink patterns** (sudden spike from low-quality domains)
- [ ] **Broken inbound links** identified and 301-redirected to relevant content
- [ ] **No need for Disavow** (toxic backlinks not present in volume)

## Section 9: User Experience

- [ ] **Mobile site** matches desktop content (mobile-first indexing requirement)
- [ ] **No intrusive interstitials** (Google's Page Experience signal)
- [ ] **Cookie banner** doesn't block content above the fold significantly
- [ ] **Search Console "Page Experience"** shows mostly "Good" pages

## Tools to run

Bookmark these and use them for each audit:

- [Screaming Frog SEO Spider](https://www.screamingfrog.co.uk/seo-spider/) — full site crawl (free version up to 500 URLs)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) — page-level audit (built into Chrome DevTools)
- [PageSpeed Insights](https://pagespeed.web.dev/) — CWV check
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly) (now part of URL Inspection)
- [securityheaders.com](https://securityheaders.com/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Schema Markup Validator](https://validator.schema.org/)

## Audit deliverable

Document findings for each section:

- ✅ Items that passed
- ⚠️ Items with warnings (note them, plan for next quarter)
- ❌ Items that failed (create tickets for fixes)

Include:

- Search Console data snapshot (impressions, clicks, average position for the quarter)
- Top issues to address
- Action items with owners and deadlines
- Comparison to previous quarter (trends)

The audit document becomes the working plan for the next quarter's SEO work.

## Cross-references

- [Google Search Console](/seo/cross-cutting/google-search-console/) — primary tool
- [SEO Glossary](/seo/reference/seo-glossary/) — terms used in this checklist
- All Frontend and Backend SEO topics — each item links to the relevant deep-dive page
