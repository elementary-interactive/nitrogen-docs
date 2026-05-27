---
title: Canonical URLs
description: Telling search engines which URL is authoritative
sidebar:
  order: 3
---

# Canonical URLs

The `<link rel="canonical">` tag tells search engines which URL is the
**authoritative version** of a piece of content. It's the primary defense
against duplicate content issues — sites with parameter-based URLs, HTTPS
migration history, www-vs-non-www inconsistency, pagination, mobile/desktop
splits, and A/B testing variants all benefit from explicit canonicals.

## Implementation

```html
<link rel="canonical" href="https://example.com/products/widget">
```

Canonical placement: inside `<head>`. Absolute URL (including `https://` and domain).

## What canonical solves

### 1. HTTPS vs HTTP

Even with site-wide HTTPS redirects, search engines sometimes discover both
versions during transition. Canonical resolves it:

```html
<!-- On all pages -->
<link rel="canonical" href="https://example.com/page">
```

### 2. www vs non-www

Both `https://example.com` and `https://www.example.com` can technically
resolve to the same content. Pick one as canonical:

```html
<!-- If non-www is canonical -->
<link rel="canonical" href="https://example.com/page">
```

Combine with a server-side 301 redirect from www → non-www (or vice versa).
Search Console also lets you set a "preferred domain" but the canonical tag
is the primary signal.

### 3. Trailing slash inconsistency

`https://example.com/about/` and `https://example.com/about` are different URLs
to search engines. Pick one convention:

```html
<!-- Consistent site-wide -->
<link rel="canonical" href="https://example.com/about/">  <!-- with slash -->
<!-- OR -->
<link rel="canonical" href="https://example.com/about">    <!-- without slash -->
```

Whichever you pick, every link on the site should use the same convention,
and server-side rewrites should normalize incoming requests.

### 4. URL parameters

UTM parameters, session IDs, sort orders, filter values — these create
infinite URL variations that search engines see as duplicate content.

```html
<!-- The page might be loaded as: -->
<!-- /products/widget -->
<!-- /products/widget?utm_source=newsletter -->
<!-- /products/widget?ref=homepage -->
<!-- /products/widget?utm_source=twitter&utm_campaign=launch -->

<!-- But canonical always points to: -->
<link rel="canonical" href="https://example.com/products/widget">
```

This consolidates the link equity from all parameter variations onto the
clean URL.

### 5. Pagination

Each paginated page should self-canonical (point to itself), NOT to page 1.

```html
<!-- On /blog/page/2 -->
<link rel="canonical" href="https://example.com/blog/page/2">

<!-- NOT this -->
<link rel="canonical" href="https://example.com/blog">  <!-- WRONG -->
```

Google deprecated `rel="prev"` and `rel="next"` for pagination in 2019, but
they're still recommended for Bing and they don't hurt Google.

```html
<link rel="canonical" href="https://example.com/blog/page/2">
<link rel="prev" href="https://example.com/blog/page/1">
<link rel="next" href="https://example.com/blog/page/3">
```

### 6. Mobile vs desktop URLs

If you have separate mobile URLs (e.g., `m.example.com`), the desktop URL
should be canonical, and the mobile URL should have `rel="alternate"`:

```html
<!-- On desktop -->
<link rel="alternate" media="only screen and (max-width: 640px)"
      href="https://m.example.com/page">

<!-- On mobile -->
<link rel="canonical" href="https://example.com/page">
```

This pattern is **legacy**. Modern responsive design (single URL serving all
devices) is the recommended approach for new sites.

### 7. A/B testing variants

If you serve different content under different URLs for A/B testing:

```html
<!-- On variant URLs like /page-variant-a -->
<link rel="canonical" href="https://example.com/page">  <!-- the "main" URL -->
```

This prevents the variant URLs from competing in search results.

## Self-referential canonical

**Best practice:** every page has a canonical pointing to itself, with the
clean absolute URL. This is a "safety net" if you ever land on the page with
unexpected query parameters or path variants.

```svelte
<script>
    import { page } from '$app/stores';
    import { SeoMeta } from '@nitrogen/frontend-seo';

    const canonical = `https://elementary-interactive.com${$page.url.pathname}`;
</script>

<svelte:head>
    <SeoMeta canonical={canonical} />
</svelte:head>
```

In SvelteKit, `$page.url.pathname` returns the path without query parameters
or hash fragments — exactly what you want as canonical.

## Anti-patterns

### Canonical to a 404

If the canonical destination returns 404, the original page also drops out
of index. Always verify destination URLs.

### Canonical to a redirect

`Page A` canonical to `Page B` which 301-redirects to `Page C`. Google
follows the chain but loses some signal. Canonical directly to the final
destination.

### Cross-domain canonical without reason

```html
<!-- On example.com -->
<link rel="canonical" href="https://other-site.com/page">
```

This signals "the version on `other-site.com` is the master copy." Google
treats this with suspicion — only set cross-domain canonical when you have
explicit syndication agreements and want the other site to "win" the ranking.

### Multiple canonical tags

```html
<link rel="canonical" href="https://example.com/page-a">
<link rel="canonical" href="https://example.com/page-b">  <!-- WRONG -->
```

If multiple canonicals exist, search engines pick one (usually the first)
or ignore both. Either way: undefined behavior. Always exactly one canonical
per page.

### Canonical combined with noindex

```html
<meta name="robots" content="noindex">
<link rel="canonical" href="https://example.com/another-page">
```

Contradictory signals: "don't index this, but the master version is over
there." Google ignores the `noindex` in this case and follows the canonical.
For pages you actually want excluded, use `noindex` alone without canonical.

### Self-canonical to a different case

```html
<!-- On /About -->
<link rel="canonical" href="https://example.com/about">
```

This signals "the lowercase version is canonical" which is good for normalization,
BUT you should also 301-redirect `/About` → `/about` server-side so the
non-canonical URL never serves content.

## HTTP Link header alternative

Canonical can also be sent as an HTTP header (useful for non-HTML resources
like PDFs):

```
HTTP/1.1 200 OK
Content-Type: application/pdf
Link: <https://example.com/whitepaper>; rel="canonical"
```

This is rare in practice but the only way to canonical PDFs and other
non-HTML resources.

## Verification

- **View page source** (Ctrl+U) — confirm canonical is in the initial HTML
- **Search Console → URL Inspection** — Google shows the canonical it has selected (may differ from your declared canonical if Google's algorithm overrides)
- **Screaming Frog** — site-wide canonical audit (find missing or chained canonicals)
- **curl -I** to verify HTTP Link headers when used

## Cross-references

- [URL Structure](/seo/frontend/url-structure/) — designing URLs that minimize canonical conflicts
- [Redirects](/seo/backend/redirects-301-302/) — server-side normalization paired with canonical
- [Crawl Budget](/seo/backend/crawl-budget/) — canonical's role in reducing duplicate crawling
