---
title: SEO Knowledge Base
description: Comprehensive frontend and backend SEO documentation for Nitrogen-based enterprise web projects
sidebar:
  order: 1
---

# SEO for Nitrogen Projects

This knowledge base is the canonical reference for delivering enterprise-grade SEO
on Nitrogen-based web projects. It documents both the **frontend** (what crawlers
see in the HTML output) and the **backend** (how the server delivers content,
manages URLs, handles redirects, and integrates with search engines).

## Why two layers?

SEO is a cross-stack discipline. The frontend determines what crawlers parse;
the backend determines whether crawlers can find content, whether duplicates exist,
whether old URLs redirect correctly, and how content lifecycle interacts with
the search index.

A typical case: a perfectly meta-tagged SvelteKit page that returns 200 status
on the wrong URL parameter combination, generating thousands of duplicate-content
entries in the index. The frontend is correct. The backend is wrong. Both must
work together.

This is also why this knowledge base is part of the **Nitrogen Frontend Ecosystem**
documentation rather than a separate backend project — SEO architecture decisions
made on the frontend (URL structure, canonical strategy, hreflang) constrain the
backend, and vice versa.

## How to use this knowledge base

For a new Nitrogen-based project SEO setup, follow this sequence:

1. **Architecture decisions first**: read [Server-Side Rendering](/seo/backend/server-side-rendering/),
   [URL Structure](/seo/frontend/url-structure/), and [Multilingual Routing](/seo/backend/multilingual-routing/)
   to make the architectural choices that will constrain everything else.
2. **Frontend implementation**: [Meta Tags](/seo/frontend/meta-tags/),
   [OpenGraph](/seo/frontend/opengraph-twitter/), [Canonical URLs](/seo/frontend/canonical-urls/),
   [Structured Data](/seo/frontend/structured-data-jsonld/).
3. **Backend infrastructure**: [Sitemap](/seo/backend/sitemap-backend/),
   [Redirects](/seo/backend/redirects-301-302/), [Caching](/seo/backend/caching-strategies/),
   [Security Headers](/seo/backend/security-headers/).
4. **Search engine integration**: [Google Search Console](/seo/cross-cutting/google-search-console/),
   [IndexNow](/seo/backend/indexnow-instant-indexing/).
5. **Quarterly audit**: [SEO Audit Checklist](/seo/cross-cutting/seo-audit-checklist/).

## Frontend SEO scope

Topics covered in [Frontend SEO](/seo/frontend/meta-tags/):

- Meta tags (title, description, robots, viewport)
- OpenGraph and Twitter Card protocols
- Canonical URLs
- Hreflang for multilingual sites
- Structured data (JSON-LD with Schema.org)
- Build-time sitemap generation
- robots.txt patterns
- Core Web Vitals and performance
- Accessibility as an SEO factor
- Internal linking strategies
- URL structure rules

Related package: `@nitrogen/frontend-seo`.

## Backend SEO scope

Topics covered in [Backend SEO](/seo/backend/server-side-rendering/):

- Server-side rendering strategies (SSR, SSG, ISR, CSR)
- HTTP status codes and their SEO implications
- Redirect management (301, 302, 307, 308)
- Server-side sitemap generation
- CMS content workflow and SEO interaction
- Slug history and automated redirects
- Image optimization pipeline
- Caching strategies across layers
- Multilingual routing and translation management
- Search engine integration (Google Search Console, Bing Webmaster Tools)
- IndexNow protocol for instant indexing
- Crawl budget management
- HTTP security headers

The backend stack assumes **Laravel 12 + Filament 4** as the Nitrogen platform default.

## Cross-references

This knowledge base interconnects with other parts of the documentation:

- [@nitrogen/frontend-seo package docs](/packages/frontend-seo/overview/) — code reference for the SEO components
- [@nitrogen/frontend-tracking package docs](/packages/frontend-tracking/overview/) — analytics integration
- [Skill: Consent Mode v2 Debug](/skills/consent-mode-v2-debug/) — debugging tracking which affects analytics-driven SEO insights
- [Skill: CSP allow-list](/skills/csp-allow-list/) — Content Security Policy without breaking SEO-relevant tracking
- [Skill: GTM Consent-aware Tags](/skills/gtm-consent-aware-tags/) — search-relevant analytics setup

## What's NOT covered

- **E-commerce-specific SEO**: product schema, review aggregation, shopping feeds. Add when the first e-commerce Nitrogen project arrives.
- **Local SEO**: Google Business Profile, LocalBusiness schema in depth. Covered briefly in Structured Data, expanded later if needed.
- **News SEO**: Google News inclusion. Niche topic; not in MVP.
- **AI search optimization**: ChatGPT search, Perplexity, etc. Field is evolving too fast for stable guidance.
- **Voice search**: another evolving area; covered when patterns stabilize.
- **AMP**: deprecated by Google; not relevant.
- **Magyar nyelvű fordítás**: en-only in MVP. Translation plan is a separate ADR.
