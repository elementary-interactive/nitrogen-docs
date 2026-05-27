---
title: Hreflang for Multilingual Sites
description: Targeting users by language and region
sidebar:
  order: 4
---

# Hreflang

The `hreflang` annotation tells Google (and Yandex) which language and region
a piece of content targets. For multilingual sites — Nitrogen projects in
Hungary often serve EN + HU, Hopelandic serves IS + EN, Team Passion serves
HU + EN — correct hreflang setup is essential.

## Implementation

```html
<head>
    <link rel="alternate" hreflang="en" href="https://example.com/about">
    <link rel="alternate" hreflang="hu" href="https://example.com/hu/about">
    <link rel="alternate" hreflang="de-AT" href="https://example.com/de-at/about">
    <link rel="alternate" hreflang="x-default" href="https://example.com/about">
</head>
```

Every page that has translations should include the **full set** of language
alternatives — including itself.

## The rules

### 1. Bidirectional

If the English page references the Hungarian version, the Hungarian page
must reference back to English. Google validates this and warns about
one-way hreflang in Search Console.

```html
<!-- On https://example.com/about (English) -->
<link rel="alternate" hreflang="en" href="https://example.com/about">
<link rel="alternate" hreflang="hu" href="https://example.com/hu/about">

<!-- On https://example.com/hu/about (Hungarian) — MUST mirror -->
<link rel="alternate" hreflang="en" href="https://example.com/about">
<link rel="alternate" hreflang="hu" href="https://example.com/hu/about">
```

### 2. Self-reference

Every page includes itself in its hreflang set. Many sites omit this and
break the bidirectional check.

### 3. Language code format

Use **ISO 639-1** two-letter codes: `en`, `hu`, `de`, `fr`, `es`, `it`.
Three-letter codes (`eng`, `hun`) are not valid in hreflang.

### 4. Region code (optional)

If you target a specific region within a language, append the **ISO 3166-1
alpha-2** country code with a hyphen:

- `en-US` — American English
- `en-GB` — British English
- `de-AT` — Austrian German
- `de-DE` — German German
- `es-MX` — Mexican Spanish

**Important:** the separator is a hyphen (`-`), not an underscore (`_`).
`en_US` is invalid; `en-US` is correct.

Only use region codes when content actually differs by region. If your
German content is the same for Germany, Austria, and Switzerland, just use
`de` — don't split into `de-DE`, `de-AT`, `de-CH`.

### 5. x-default

`x-default` indicates the page shown to users whose language matches none
of the explicit alternatives.

```html
<link rel="alternate" hreflang="x-default" href="https://example.com/about">
```

Common patterns:

- Set `x-default` to the English version (most likely to be understood by international users)
- Set `x-default` to a country/language selector page (`/welcome` or `/`)

### 6. Trailing slash consistency

All hreflang URLs should follow the same trailing slash convention.

```html
<!-- All with trailing slash -->
<link rel="alternate" hreflang="en" href="https://example.com/about/">
<link rel="alternate" hreflang="hu" href="https://example.com/hu/about/">

<!-- OR all without — but don't mix -->
```

## Where to place hreflang annotations

Three options, in order of preference:

### Option 1: HTML `<head>` (most common)

```html
<head>
    <link rel="alternate" hreflang="en" href="https://example.com/about">
    <link rel="alternate" hreflang="hu" href="https://example.com/hu/about">
</head>
```

Preferred for SSR-rendered sites because crawlers see it immediately.

### Option 2: HTTP Link header

```
HTTP/1.1 200 OK
Link: <https://example.com/about>; rel="alternate"; hreflang="en",
      <https://example.com/hu/about>; rel="alternate"; hreflang="hu"
```

Useful for non-HTML resources (rare in practice).

### Option 3: XML sitemap

```xml
<url>
    <loc>https://example.com/about</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/about"/>
    <xhtml:link rel="alternate" hreflang="hu" href="https://example.com/hu/about"/>
</url>
```

Useful for very large multilingual sites where HTML annotations would
bloat every page. Combine with the `xmlns:xhtml="http://www.w3.org/1999/xhtml"`
namespace declaration.

For Nitrogen-sized sites (typically <1000 pages), HTML annotations are
simpler and recommended.

## Common pitfalls

### One-way hreflang

The EN page references HU, but HU doesn't reference EN back. Google flags
this in Search Console under "International Targeting" report.

### Wrong separator

`hreflang="en_US"` (underscore) is invalid. Must be `hreflang="en-US"` (hyphen).

### Hreflang to 404 or redirect

If the destination returns 404 or redirects, the hreflang signal is wasted.
Validate all hreflang URLs before publishing.

### Mixing region codes inconsistently

Some pages declare `de` (no region), others declare `de-DE` (with region).
Pick one convention per language.

### Country instead of language

`hreflang="us"` is invalid (US is not a language). It must be `hreflang="en-US"`.

## URL structure options for multilingual sites

The hreflang annotations work with any URL structure, but the structure
choice affects how SEO signals propagate.

### ccTLDs (country-code top-level domains)

```
example.de
example.hu
example.com
```

**Pros:** Strongest geo-targeting signal. Local SEO benefits in each country.
**Cons:** Multiple domains to maintain. SEO authority doesn't share across
domains. Expensive (multiple SSL, multiple DNS, multiple registrations).

**Use when:** You're a multi-national company with country-specific brand
presences and your local teams want autonomy.

### Subdomains

```
de.example.com
hu.example.com
www.example.com (English default)
```

**Pros:** Single root domain, easier infrastructure. Each subdomain can have
its own server location for performance.
**Cons:** Subdomains are sometimes treated as separate sites by Google,
weakening shared authority. Subtle but real.

**Use when:** Different language sites have different technical stacks or
content management teams.

### Subdirectories

```
example.com/         (English default)
example.com/de/
example.com/hu/
```

**Pros:** Strong single-domain authority benefits all languages. Simple
infrastructure. Single SSL cert.
**Cons:** Less explicit geo-targeting signal than ccTLDs.

**Use when:** Single team manages all languages, central content strategy.
**This is the default recommendation for Nitrogen B2B sites.**

### URL parameters

```
example.com?lang=de
example.com?lang=hu
```

**Anti-pattern.** Google's documentation explicitly recommends against this.
Parameter-based language switching creates crawl budget issues and conflicts
with canonical/hreflang semantics.

## Generation patterns

For sites with many translated pages, generating hreflang manually is error-prone.
Generate from data:

### Build-time generation (SvelteKit)

```typescript
// src/lib/hreflang.ts
import type { Page } from '$lib/types';

export function generateHreflang(currentPage: Page, allTranslations: Page[]) {
    return allTranslations.map(translation => ({
        lang: translation.locale,
        url: `https://example.com/${translation.locale}${translation.path}`,
    }));
}
```

In the layout:

```svelte
<script>
    import { page } from '$app/stores';
    const hreflangs = $page.data.hreflangs ?? [];
</script>

<svelte:head>
    {#each hreflangs as { lang, url }}
        <link rel="alternate" hreflang={lang} href={url} />
    {/each}
    <link rel="alternate" hreflang="x-default" href={hreflangs[0]?.url} />
</svelte:head>
```

### Server-side generation (Laravel)

See [Multilingual Routing](/seo/backend/multilingual-routing/) for the CMS-stored
translation data and hreflang generation pattern.

## Verification

- **Search Console → International Targeting** — Google's report on hreflang errors
- **[hreflang.org Tag Generator](https://hreflang.org/tag-generator/)** — generate and verify
- **[Merkle Hreflang Tags Testing Tool](https://technicalseo.com/tools/hreflang/)** — bulk validation
- **Screaming Frog Hreflang report** — site-wide audit

## Cross-references

- [Multilingual Routing](/seo/backend/multilingual-routing/) — server-side translation management
- [Canonical URLs](/seo/frontend/canonical-urls/) — canonical interaction with hreflang
- [Sitemap (Backend)](/seo/backend/sitemap-backend/) — sitemap-embedded hreflang
