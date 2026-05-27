---
title: SEO Glossary
description: Common SEO terms and definitions
sidebar:
  order: 1
---

# SEO Glossary

## A

**Above the fold** — Content visible without scrolling on initial page load. Critical for LCP.

**Alt text** — Description of an image for screen readers and image search. Required on all content images.

**Anchor text** — The clickable text in a hyperlink. Strong on-page SEO signal.

**Anonymized queries** — Search Console hides query data for very low-volume searches (privacy protection).

## B

**Backlink** — A link from another site to yours. Major ranking factor.

**BERT** — Google's language model used in search query understanding (since 2019).

**Breadcrumb** — Navigation showing the page's location in site hierarchy. Often marked up with BreadcrumbList JSON-LD.

## C

**Canonical URL** — The authoritative version of a piece of content, declared via `<link rel="canonical">`.

**CCBot** — Common Crawl's bot, used to train AI models. Blockable via robots.txt.

**CLS** (Cumulative Layout Shift) — Core Web Vital measuring visual stability. <0.1 is "Good".

**Core Web Vitals** — Google's three performance metrics: LCP, INP, CLS.

**Crawl budget** — Number of URLs Googlebot crawls on your site per day.

**Crawler** (or **bot**) — Automated agent that reads web pages (Googlebot, Bingbot, etc.)

**CSP** (Content Security Policy) — HTTP header restricting which scripts/resources can load. Indirectly affects SEO.

**CTR** (Click-Through Rate) — Clicks ÷ impressions in search results.

## D

**DNS** (Domain Name System) — Maps domain names to IP addresses.

**Disavow** — Telling Google to ignore specific backlinks. Used for toxic links.

**Domain authority** — Third-party metric estimating SEO strength. NOT a Google ranking factor (just an estimate by tools like Moz/Ahrefs).

## E

**E-E-A-T** (Experience, Expertise, Authoritativeness, Trustworthiness) — Google's content quality framework, especially important for YMYL topics.

**EXIF data** — Metadata embedded in image files (GPS, camera). Strip on upload.

## F

**Featured snippet** — Highlighted answer box at the top of search results. Often the "position 0".

**FID** (First Input Delay) — Old responsiveness metric, replaced by INP in March 2024.

**FOIT** (Flash of Invisible Text) — Text temporarily invisible while custom font loads. Avoid with `font-display: swap`.

**FOUT** (Flash of Unstyled Text) — Text shown in fallback font, then swapped to custom. Better than FOIT for users.

## G

**Googlebot** — Google's web crawler.

**GSC** (Google Search Console) — Google's webmaster tool. Free.

## H

**Hreflang** — HTML annotation indicating language/region targeting.

**HSTS** (HTTP Strict Transport Security) — Header forcing HTTPS.

**HTTP status code** — Server response code (200, 301, 404, etc.). See [HTTP Status Codes Reference](/seo/reference/http-status-codes-reference/).

## I

**Impressions** — Number of times your URL appeared in search results (whether clicked or not).

**Indexable** — A page that crawlers can access AND that has no `noindex` directive.

**IndexNow** — Protocol for instantly notifying Bing/Yandex of URL changes. See [IndexNow guide](/seo/backend/indexnow-instant-indexing/).

**Indexing** — When a search engine adds your page to its database. Different from crawling.

**INP** (Interaction to Next Paint) — Core Web Vital replacing FID in March 2024. Measures responsiveness. <200ms is "Good".

**ISR** (Incremental Static Regeneration) — Static generation with auto-refresh after a defined interval.

## J

**JSON-LD** (JavaScript Object Notation for Linked Data) — Google's preferred format for structured data.

## K

**Keyword** — Word or phrase a user searches. (Not to be confused with the deprecated `<meta name="keywords">` tag.)

**Knowledge Graph** — Google's database of entities (people, places, organizations) and their relationships.

## L

**LCP** (Largest Contentful Paint) — Core Web Vital measuring loading speed. <2.5s is "Good".

**Link equity** (or **link juice**) — SEO value transferred through hyperlinks.

**Long-tail keyword** — Multi-word, specific search query. Usually lower volume but higher intent.

## M

**Manual action** — Penalty issued by Google's human reviewers. Reportable via Search Console.

**Meta description** — HTML meta tag with page summary. Appears as snippet in search results.

**Mobile-first indexing** — Google primarily indexes the mobile version of pages (since 2019).

## N

**noindex** — Meta tag value telling crawlers NOT to index a page.

**nofollow** — Link attribute discouraging crawler from following. Since 2020, treated as a hint by Google.

## O

**OpenGraph** — Meta tag protocol for social media previews. Originally from Facebook.

**Organic traffic** — Visitors from unpaid search results (vs paid ads).

## P

**PageRank** — Google's original algorithm for ranking pages by link structure. Still part of the modern algorithm (just one of many signals).

**Position** — Average ranking of your URL for a query. Lower is better (1 is best).

**Prerender** — Generate HTML at build time (SSG). Opposite of runtime rendering.

**PWA** (Progressive Web App) — Web app with app-like features (offline, push notifications, install).

## Q

**Query** — A user's search input.

## R

**Rich result** (or **Rich Snippet**) — Enhanced search result with extra info (stars, prices, FAQ accordions). Powered by structured data.

**robots.txt** — File at site root telling crawlers what to access. See [robots.txt guide](/seo/frontend/robots-txt/).

## S

**Schema.org** — Vocabulary for structured data. Owned consortium of Google, Bing, Yahoo, Yandex.

**SERP** (Search Engine Results Page) — The page of results for a query.

**Sitemap** — XML file listing site URLs for crawlers. See [Sitemap (Backend)](/seo/backend/sitemap-backend/).

**Soft 404** — Page returning 200 status but appearing empty/not-found. Anti-pattern.

**SSL/TLS** — Encryption protocols. HTTPS uses TLS.

**SSG** (Static Site Generation) — Pre-render HTML at build time.

**SSR** (Server-Side Rendering) — Render HTML on request.

## T

**TBT** (Total Blocking Time) — Lab metric for main-thread blocking. Lab proxy for INP.

**TTFB** (Time to First Byte) — Server response time. Affects LCP.

**TTI** (Time to Interactive) — When the page is fully interactive. Mostly replaced by INP.

## U

**URL** (Uniform Resource Locator) — Address of a web resource.

**UTM parameters** — Query string parameters for campaign tracking. Should canonical to clean URL.

## W

**WCAG** (Web Content Accessibility Guidelines) — Accessibility standards. AA is the practical target.

**WebP / AVIF** — Modern image formats with better compression than JPG/PNG.

## X

**x-default** — Hreflang value for users whose language matches no explicit alternative.

**XML sitemap** — Standard sitemap format. See [Sitemap (Backend)](/seo/backend/sitemap-backend/).

## Y

**YMYL** (Your Money or Your Life) — Google's term for content that could affect a user's health, finances, safety. Held to higher E-E-A-T standards.
