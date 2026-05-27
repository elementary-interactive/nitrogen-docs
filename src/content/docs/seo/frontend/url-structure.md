---
title: URL Structure
description: URL design rules for SEO
sidebar:
  order: 11
---

# URL Structure

URLs are a ranking factor and a critical UX element. Once published and
linked-to, changing a URL has cost: must 301-redirect, may lose equity, may
break inbound backlinks. Get the structure right at launch.

## The rules

- **Lowercase only** (`/about`, not `/About`)
- **Hyphen** for word separation (`/web-development`), NOT underscore (`/web_development`)
- **Short, descriptive** — `/services/web-development`, not `/services/category/web-stuff-12345`
- **Hierarchical** — reflects site structure (`/services/web-development`, not `/web-development-services`)
- **HTTPS** on every URL
- **Trailing slash consistent** — pick one convention site-wide
- **No file extensions** (no `.html`, `.php`, `.aspx` in URLs)
- **No unnecessary parameters** — clean URLs over `?id=123&category=4`

## Good vs bad examples

```
✓ https://example.com/services/web-development
✓ https://example.com/blog/seo-best-practices-2026
✓ https://example.com/about
✓ https://example.com/case-studies/4ig-erp-modernization

✗ https://example.com/p?id=123&cat=4              # parameter-based
✗ https://example.com/services/WebDevelopment     # camelCase
✗ https://example.com/services/web_development    # underscore
✗ https://example.com/Services/web-development    # capital
✗ https://example.com/serv-web-dev                # over-abbreviated
✗ https://example.com/blog/12345-some-post        # numeric prefix
✗ https://example.com/blog/post.html              # file extension
✗ https://example.com/2026/05/27/post-title       # dated URL for evergreen content
```

## Why these rules

### Lowercase

URLs are case-sensitive in HTTP. `/About` and `/about` are different URLs to
crawlers, leading to potential duplicate content. Standardize on lowercase
and 301-redirect uppercase variants.

### Hyphens vs underscores

Google treats hyphens as word separators (`web-development` = "web development").
Underscores are treated as part of a single word (`web_development` = "webdevelopment").
This affects keyword matching.

This is the **only** technical reason — hyphens have been standard since 2008.

### Short and descriptive

Long URLs:

- Look spammy in search results
- Are harder to share verbally
- May get truncated in social media previews
- Don't add SEO value beyond the first ~5 words

Aim for under 75 characters total URL length, ideally under 50.

### Hierarchical

URLs that reflect site structure help users understand context and help
crawlers map the site:

```
/services
/services/web-development
/services/web-development/laravel
```

Better than flat:

```
/services
/web-development-services
/laravel-development-services
```

The hierarchical version signals that Laravel is a subset of web development,
which is a service.

### No file extensions

Modern web frameworks don't need `.php` or `.html` in URLs. Removing them:

- Makes URLs cleaner and more share-able
- Decouples URLs from implementation (you can change from PHP to Node and URLs stay the same)
- Easier to remember and type

### Clean URLs over parameters

`?id=123` URLs:

- Get treated as duplicate content if multiple parameter combinations exist
- Waste crawl budget on infinite variations
- Look untrustworthy to users

Use parameters only when truly necessary (search results, sorting). Even
then, mark with canonical or noindex.

## Trailing slash convention

Pick one and stick with it site-wide:

### With trailing slash

```
https://example.com/about/
https://example.com/services/web-development/
```

Convention from old static-site days where `/about/` mapped to `/about/index.html`.
Common in Jekyll, Hugo, many static site generators.

### Without trailing slash

```
https://example.com/about
https://example.com/services/web-development
```

Convention from REST APIs and modern SPAs.

### Whichever you pick

- **Be consistent** — every internal link uses the same convention
- **301 redirect the non-canonical version** server-side (so both `/about` and `/about/` work, but one redirects to the other)
- **Canonical tag** matches the chosen convention

There's no SEO advantage to either choice — only consistency matters.

## URL hierarchy depth

How deep should URLs go?

```
/services                                    # 1 level
/services/web-development                    # 2 levels — typical
/services/web-development/laravel            # 3 levels — okay
/services/web-development/laravel/saas       # 4 levels — getting deep
/services/web-development/laravel/saas/erp   # 5+ levels — too deep
```

Beyond 3-4 levels:

- Click depth from homepage becomes problematic
- URLs get long and unwieldy
- Crawl priority drops

If your content naturally requires deep hierarchies, consider whether the
information architecture can be flattened (use tags or facets instead of nesting).

## Localized URLs

For multilingual sites, two approaches:

### Translated paths

```
https://example.com/en/services/web-development
https://example.com/hu/szolgaltatasok/webfejlesztes
https://example.com/de/dienstleistungen/webentwicklung
```

**Pros:** Localized URLs rank better in local searches; users see meaningful URLs in their language.
**Cons:** Complex to manage; requires translated slug per page per language.

### Same paths

```
https://example.com/en/services/web-development
https://example.com/hu/services/web-development
https://example.com/de/services/web-development
```

**Pros:** Simpler infrastructure; consistent URLs across languages.
**Cons:** Hungarian users see English URL terms; small SEO penalty in local search.

For Nitrogen B2B sites, **same paths is the default recommendation** —
simpler management outweighs the marginal SEO benefit of translated slugs.

## Pagination URLs

Different patterns, all acceptable:

```
✓ https://example.com/blog/page/2
✓ https://example.com/blog?page=2
✓ https://example.com/blog/2

✗ https://example.com/blog/p/2     # less clear
```

Best practices for paginated URLs:

- Self-canonical (NOT canonical to page 1)
- Include in sitemap (even paginated pages)
- Include `rel="prev"` and `rel="next"` if possible

## Slug rules

The "slug" is the URL-safe identifier for a piece of content (the part after
the last `/`):

```
/blog/server-side-gtm-for-b2b-sites
       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
       This is the slug
```

Slug generation rules:

- **Lowercase, ASCII-only** — accented characters (`é`, `ő`, `ß`) should be transliterated (`e`, `o`, `ss`)
- **Hyphen-separated** — no spaces, no underscores
- **Strip stop words sparingly** — "the", "a", "an" can be removed but only if it stays readable
- **Unique site-wide** — enforce DB constraint
- **Stable** — see [Slug Management](/seo/backend/slug-management/) for handling changes

Example transformations:

```
"How To Set Up Server-Side GTM In 2026!"
→ "how-to-set-up-server-side-gtm-in-2026"

"Új termékünk, az ŐKO 2026"
→ "uj-termekunk-az-oko-2026"

"What's new in v2.5?"
→ "whats-new-in-v25"  (note: no special chars)
```

## URL design checklist for new sites

Before launch:

- [ ] All URLs lowercase
- [ ] Hyphens for separators (no underscores)
- [ ] Hierarchical structure reflecting site IA
- [ ] No file extensions
- [ ] No unnecessary parameters
- [ ] Trailing slash convention chosen and consistent
- [ ] HTTPS on every URL
- [ ] 301 redirects from common variations (uppercase, with/without slash)
- [ ] Slug format defined for CMS-managed content
- [ ] Stop-word handling defined (keep or strip)
- [ ] Transliteration map for non-ASCII characters

## Cross-references

- [Canonical URLs](/seo/frontend/canonical-urls/) — canonical's role in URL normalization
- [Redirects](/seo/backend/redirects-301-302/) — server-side enforcement of URL rules
- [Slug Management](/seo/backend/slug-management/) — when slugs change
- [Multilingual Routing](/seo/backend/multilingual-routing/) — URL structure for multilingual sites
