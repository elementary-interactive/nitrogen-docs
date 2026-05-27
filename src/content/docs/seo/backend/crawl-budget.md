---
title: Crawl Budget
description: Managing how often crawlers visit large sites
sidebar:
  order: 11
---

# Crawl Budget

For sites with more than a few thousand URLs, Google doesn't crawl every
page daily. The "crawl budget" is the number of URLs crawled per day on
your site. Wasting it on low-value URLs means high-value content isn't
discovered or refreshed.

Crawl budget matters for:

- Large sites (10,000+ URLs)
- Sites with frequent content updates
- E-commerce with faceted navigation
- Sites with significant parameter-based URLs

For smaller sites (<1,000 URLs), Google generally crawls everything.
Crawl budget is rarely a problem.

## What wastes crawl budget

### Filtered / faceted URLs

E-commerce filter pages create combinatorial explosions:

```
/products?color=red
/products?color=red&size=M
/products?color=red&size=M&material=cotton
/products?color=red&size=M&material=cotton&price=10-50
```

If 10 filters with 5 options each = 5^10 = 9,765,625 URL combinations. Even
a fraction crawled wastes budget on near-duplicate pages.

### Search result pages

Internal search:

```
/search?q=widget
/search?q=widget+blue
/search?q=widgets
```

Infinite combinations, low value.

### Session IDs in URL

```
/page?session=abc123
/page?session=def456
```

Same content, different URL per user.

### UTM tracking parameters

```
/page?utm_source=email
/page?utm_source=twitter&utm_campaign=launch
```

Same content, different URL per traffic source.

### Pagination on small lists

```
/blog/page/2
/blog/page/3
```

For sites with 5 blog posts, pagination beyond page 1 is wasteful.

### Sort orders

```
/products?sort=price-asc
/products?sort=price-desc
/products?sort=name
```

Same products, different orders.

## Crawl budget optimization techniques

### 1. robots.txt for unimportant URLs

```
User-agent: *
Allow: /

# Block filter parameters
Disallow: /*?sort=*
Disallow: /*?filter=*
Disallow: /*?color=*
Disallow: /*?size=*

# Block UTM tracking
Disallow: /*?utm_*

# Block session IDs
Disallow: /*?session=*

# Block internal search
Disallow: /search
Disallow: /search?*

# Block admin
Disallow: /admin/
Disallow: /api/
```

`Disallow` blocks crawling. Note that disallowed URLs **may still be indexed**
if linked externally (with no snippet). To prevent indexing reliably, the
URL must be crawlable AND have `noindex` meta tag.

### 2. canonical to base URL

For filtered/sorted URLs that you want crawled (rare):

```html
<!-- On /products?color=red -->
<link rel="canonical" href="https://example.com/products">
```

Google then crawls the variant but doesn't index it; equity consolidates
onto `/products`.

**Don't combine** with robots.txt disallow (crawler can't see the canonical
if it can't crawl).

### 3. noindex meta tag

For URLs that must be crawlable (e.g., needed for JavaScript fallback) but
shouldn't be indexed:

```html
<meta name="robots" content="noindex">
```

Use this for low-value pages, admin areas, etc. The URL is crawled (and
the noindex is discovered), then removed from index.

### 4. nofollow on filter links

```html
<a href="/products?color=red" rel="nofollow">Red</a>
```

This discourages (but doesn't prevent) crawlers from following the link.
Combined with disallow or noindex on filter URLs, gives crawlers a clear
"low priority" signal.

### 5. Pagination strategy

For paginated content:

- Self-canonical on each pagination URL (NOT canonical to page 1)
- Include `rel="prev"` and `rel="next"` (deprecated by Google but still
  respected by Bing)
- Include paginated URLs in sitemap (helps with discovery)

```html
<!-- /blog/page/2 -->
<link rel="canonical" href="https://example.com/blog/page/2">
<link rel="prev" href="https://example.com/blog/page/1">
<link rel="next" href="https://example.com/blog/page/3">
```

### 6. Sitemap prioritization

Include high-priority URLs in sitemap. Low-priority URLs (old archives,
deep paginations) can be omitted from sitemap (they're still discoverable
via internal linking but receive less crawler attention).

### 7. Eliminate duplicate content

Common sources of duplicates:

- HTTP and HTTPS versions both reachable (fix: 301 HTTP → HTTPS)
- www and non-www both reachable (fix: 301 one to the other)
- Trailing slash variants (fix: 301 to canonical version)
- Print versions, mobile versions (fix: canonical to main version)
- URLs with and without query parameters (fix: canonical to clean URL)

Each duplicate doubles the crawl budget waste.

### 8. Soft 404 prevention

Every 404 must actually return 404 status:

```php
// BAD: returns 200
if (!$page) {
    return view('errors.not-found');
}

// GOOD: returns 404
if (!$page) {
    abort(404);
}
```

Soft 404s are flagged in Search Console → Coverage report.

## Search Console crawl stats

Monitor in Search Console → Settings → Crawl Stats:

- **Total crawl requests** (daily) — see trend
- **Average response time** — high response time reduces crawl rate
- **Crawl response breakdown**:
  - 200 OK
  - 404 (should be low)
  - 5xx errors (sustained 5xx → reduced crawl rate)
  - 301/302 redirects
- **By Googlebot type** (Smartphone vs Desktop)
- **By file type** (HTML, JavaScript, CSS, images)

### Healthy patterns

- >95% of crawl requests return 200
- <2% return 4xx (404, etc.)
- <0.5% return 5xx
- Average response time <500ms
- Steady or growing crawl request count

### Warning patterns

- Spike in 5xx → investigate immediately
- Sudden drop in crawl requests → Google may have detected issues
- High percentage of crawl on filter/parameter URLs → robots.txt cleanup needed

## Faceted navigation deep dive

For e-commerce or any site with filter UI, the strategy:

### Decision tree

For each filter combination URL, decide:

1. **Should this URL exist?** If no value to users, don't generate the link in the UI.
2. **Should crawlers crawl it?** If yes, allow in robots.txt. If no, disallow.
3. **Should crawlers index it?** If yes, ensure crawlable + indexable. If no, noindex.
4. **Should it consolidate equity?** Set canonical to the appropriate URL.

Common strategy for typical e-commerce:

| Filter | Crawl? | Index? | Canonical |
|---|---|---|---|
| Single primary filter (color, size) | Allow | Yes | self |
| Multi-filter combinations | Disallow in robots.txt | No (irrelevant due to disallow) | — |
| Sort orders | Disallow | No | — |
| Page 2+ pagination | Allow | Yes | self |
| Search results | Disallow | — | — |

### Search Console URL parameters tool (deprecated)

Google previously had a "URL Parameters" tool to manage parameter handling.
**Deprecated in April 2022.** Now Google figures out parameters
automatically. Use canonical and robots.txt for explicit control.

## Improving crawl rate

If your crawl rate is too low (large site, slow indexing of new content):

1. **Speed up the server**: reduce TTFB. Google's crawl rate is partly
   determined by your server's response time.
2. **Fix 5xx errors**: sustained errors reduce crawl rate.
3. **Submit updated sitemaps**: Google checks sitemaps before deciding to crawl.
4. **Use IndexNow**: instantly notify Bing of changes (Google doesn't support
   IndexNow but Bing's crawl complements Google's).
5. **Promote in Search Console**: URL Inspection → Request Indexing (limited
   daily quota, ~10/day per property).
6. **Reduce parameter URL waste**: more budget for important pages.

## Cross-references

- [Robots.txt](/seo/frontend/robots-txt/) — primary tool for crawl control
- [Canonical URLs](/seo/frontend/canonical-urls/) — duplicate content prevention
- [Sitemap (Backend)](/seo/backend/sitemap-backend/) — guiding crawlers
- [HTTP Status Codes](/seo/backend/http-status-codes/) — soft 404 prevention
