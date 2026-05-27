---
title: Google Search Console
description: Complete guide to Search Console
sidebar:
  order: 1
---

# Google Search Console

The single most important SEO tool. Free, official, comprehensive. This page
is the deep guide; for setup basics see [Search Engine Integration](/seo/backend/search-engine-integration/).

## What it provides

- **Coverage data**: which URLs are indexed, which excluded, why
- **Performance**: search queries, clicks, impressions, average position
- **Core Web Vitals**: 28-day field data from real Chrome users
- **Mobile usability**: device-specific issues
- **Manual actions**: penalties (rare but critical to monitor)
- **Security issues**: hack alerts, malware warnings
- **Enhancements**: rich result coverage (Article, Breadcrumb, FAQ, etc.)
- **Sitemaps**: submission status and discovery stats
- **Links**: top external and internal linking pages
- **URL Inspection**: per-URL index status and real-time crawl test

## Setup

### Property types

Two types — add **both** for the same site:

1. **Domain property** (DNS verification)
   - Covers all subdomains and all protocols (HTTP + HTTPS)
   - Single property for `example.com`, `www.example.com`, `blog.example.com`, etc.

2. **URL prefix property**
   - Covers only the exact prefix (e.g., `https://www.example.com/`)
   - Need separate properties for each subdomain/protocol combination

Both are recommended because:

- Domain property shows aggregate data
- URL prefix properties show segmented data
- Some reports differ between them

### Verification methods

In order of stability:

1. **DNS TXT record** (Domain property — most stable, can't be accidentally removed by frontend changes)
2. **Google Analytics integration** (uses existing GA verification — if you remove GA, you lose verification)
3. **Google Tag Manager** (uses GTM container ID — same caveat)
4. **HTML file upload** (file at `/google[code].html`)
5. **HTML meta tag** (`<meta name="google-site-verification">` in `<head>`)

For Nitrogen sites, **DNS TXT for Domain property** is the recommended primary
method. Add HTML meta as a secondary fallback.

## Coverage report

Located at: Coverage section in left sidebar.

### Categories

- **Valid** — Pages indexed in Google. Healthy state.
- **Excluded** — Pages NOT indexed, with various reasons:
  - "Excluded by noindex tag" (intentional — verify this is correct)
  - "Crawled, currently not indexed" (Google chose not to index — quality signal)
  - "Discovered, currently not indexed" (Google knows about it but hasn't crawled)
  - "Page with redirect" (it redirects, so not indexed itself)
  - "Duplicate without user-selected canonical" (Google sees duplicates, no canonical specified)
  - "Duplicate, Google chose different canonical than user" (you set a canonical, Google overrode)
  - "Alternate page with proper canonical tag" (correctly canonicalized to another URL)
- **Errors** — Genuinely broken pages:
  - "Submitted URL not found (404)"
  - "Submitted URL has crawl issue"
  - "Server error (5xx)"
  - "Redirect error"
  - "Soft 404"

### What to monitor

- **Sudden drops in Valid count** → investigate what changed (deployment? content removal? noindex accident?)
- **Spike in Errors** → fix immediately, may indicate site-wide regression
- **"Crawled, currently not indexed" trend** — if growing, suggests Google sees your content as low-value

### Healthy patterns

- 95%+ of submitted URLs are Valid
- Excluded category is mostly legitimate (redirects, noindex on admin)
- Errors near zero
- Trend over time is stable or growing

## Search Performance report

Located at: Performance → Search results.

### Metrics

- **Clicks**: actual visits from search results
- **Impressions**: times your URL appeared in search results
- **CTR**: clicks ÷ impressions (Click-Through Rate)
- **Position**: average ranking when shown

### Filters

You can slice by:

- **Query**: what people searched
- **Page**: which URL got impressions
- **Country**, **Device**, **Search appearance** (rich results vs regular)

### Optimization opportunities

**High impressions + low CTR + position 1-3**: title and description need work
(you rank well but the snippet isn't compelling)

**High impressions + medium position (5-10)**: content optimization opportunity
(could rank #1-3 with better content)

**Many queries you weren't targeting**: content gaps to fill (write more on
the topics where you're getting impressions)

**Sudden CTR drop**: usually a snippet preview change or competitor improvement.
Check the SERP for the query, see what's appearing now.

### Comparison views

Toggle "Compare" to see two date ranges side by side:

- Last 28 days vs previous 28 days
- This year vs last year
- After-deployment vs before

Look for queries/pages with significant changes (positive or negative).

## Core Web Vitals report

Located at: Core Web Vitals.

Shows field data (real users) from the last 28 days:

- **Good** (green): all metrics in good range
- **Needs Improvement** (orange): one or more in needs-improvement range
- **Poor** (red): one or more in poor range

Grouped by page-pattern: similar URLs cluster together (e.g., all blog
posts in one group), making it easier to identify template-level issues.

Drilling down shows:

- Specific URLs in the group
- Which metric is failing (LCP, INP, or CLS)
- Mobile vs Desktop breakdown

### Page experience

A separate section (Page Experience → Top issues) combines CWV with HTTPS,
mobile-friendliness, and intrusive interstitials into a single signal.

## URL Inspection tool

For any URL on your domain:

- **Coverage**: current index status, last crawl date, crawled-as device
- **Live test**: real-time re-fetch and re-analysis
- **View crawled page**: HTML preview (post-JavaScript), screenshot, resources blocked
- **Enhancements**: which rich results the URL qualifies for

### Use cases

**New page not appearing in search**:

1. URL Inspection → enter URL
2. If "URL is not on Google" → click "Request Indexing"
3. Google adds it to the indexing queue (~hours to days)

**Suspect rendering issue**:

1. URL Inspection → "View crawled page" → "Screenshot"
2. Compare with your expected appearance
3. Check for resources blocked (CSS/JS that didn't load)

**Verify content updates were seen**:

1. URL Inspection → "Test live URL"
2. View rendered HTML
3. Confirm new content is visible

### Daily quota

Limited to ~10 manual indexing requests per day per property. For larger
batches, use sitemaps and IndexNow.

## Sitemaps section

Located at: Sitemaps.

### Status indicators

- **Last read**: when Google last fetched the sitemap (should be recent)
- **Status**: Success / Has issues / Couldn't fetch
- **Discovered URLs**: total in sitemap
- **Indexed**: how many are in Google's index

### Resubmitting

After major content changes:

1. Sitemaps → click your sitemap → resubmit (or just wait, Google rechecks regularly)

If the sitemap shows "Couldn't fetch" status:

- Verify the URL returns valid XML
- Check Search Console's robots.txt isn't blocking it
- Verify it doesn't redirect

## Links report

Located at: Links.

### Internal Links

- **Top linked pages**: which of your pages have the most internal links
- Useful for identifying orphaned pages (URLs not in this list aren't internally linked)

### External Links

- **Top linking sites**: domains pointing to you
- **Top linking text**: anchor text patterns from external sites
- **Top linked pages**: your most-linked pages from external sources

### Anchor text patterns

Watch for suspicious patterns:

- Many links with identical commercial anchor text ("best laravel agency")
  → may indicate spammy link building or competitor sabotage
- Links from low-quality domains
- Sudden spike in backlinks (could be positive or negative)

For removal of toxic backlinks: use Search Console's Disavow Tool (legacy
URL inspection tool feature, now requires careful judgment).

## Manual Actions

Located at: Security & Manual Actions → Manual Actions.

Empty for most sites (no penalty applied). If a penalty is active:

- Notification email from Google
- Description of the violation
- Affected URLs or "site-wide"
- "Reconsideration" submission once fixed

Common violations:

- Unnatural link patterns (paid backlinks)
- Thin content
- Hidden text or cloaking
- User-generated spam (forum/comment SEO spam)

For Nitrogen-grade B2B sites, manual actions are extremely rare. Monitor
weekly just in case.

## Mobile Usability (Page Experience)

Located at: Mobile Usability.

Issues flagged:

- Text too small to read
- Clickable elements too close together
- Content wider than screen
- Viewport not set

For Nitrogen sites built mobile-first, this should be clean. Spot-check
after layout changes.

## Practical workflow

### Daily (5 minutes)

- Check Search Performance for any sudden trends
- Check Coverage for new errors
- Check Manual Actions and Security Issues (peace of mind)

### Weekly (20 minutes)

- Review Search Performance: top queries, pages, CTR
- Identify content gaps (queries getting impressions but you don't have targeted content)
- Review Core Web Vitals trends
- Check Sitemap status

### Monthly (1 hour)

- Compare to previous month: clicks, impressions, position trends
- Review Links report for new backlinks
- Audit Coverage exclusions: any unexpected categories growing?
- Plan content based on query data

### Quarterly

- Full audit using [SEO Audit Checklist](/seo/cross-cutting/seo-audit-checklist/)

## Cross-references

- [Search Engine Integration](/seo/backend/search-engine-integration/) — setup details
- [SEO Audit Checklist](/seo/cross-cutting/seo-audit-checklist/) — quarterly review
- [Analytics vs Search Console](/seo/cross-cutting/analytics-vs-search-console/) — when to use which tool
