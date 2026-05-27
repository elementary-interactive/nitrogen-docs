---
title: Meta Tags
description: The HTML meta tags that crawlers rely on
sidebar:
  order: 1
---

# Meta Tags

The foundation of every SEO-optimized page is correct `<head>` content. Crawlers
read these tags first; they determine how a page appears in search results and
how it is parsed by social media platforms.

## The required minimum

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Page Title — Brand Name</title>
    <meta name="description" content="Page description, 150-160 chars">

    <link rel="canonical" href="https://example.com/current-page">
</head>
```

Everything else (OpenGraph, JSON-LD, Twitter Card, etc.) builds on this foundation.

## The title tag

The `<title>` is one of the strongest on-page ranking signals and the most
visible element in search results.

**Rules:**

- **Length: 50–60 characters.** Google's display width is ~580 pixels in desktop search results; longer titles get truncated with an ellipsis. The exact character count varies because Google uses a proportional font (wide letters like W take more space than narrow letters like i).
- **Unique on every page.** Duplicates trigger Search Console "Duplicate title" warnings and signal poor information architecture.
- **Keywords first, brand last.** `"Custom Web Development for Enterprise — Elementary Interactive"` rather than `"Elementary Interactive — Custom Web Development for Enterprise"`. The first words carry more weight.
- **Consistent separator.** Pick one of `—` (em dash), `|` (pipe), or `·` (middle dot) and use it throughout the site.
- **Stable format.** Either `[page] — [brand]` or `[brand] — [page]` on every page. Don't mix.

**Anti-patterns:**

- `HOME PAGE` — all caps reads as spam
- `Page · Page · Page` — repetition
- `Untitled` or empty — Google generates from h1 (often badly)
- Brand-only on landing pages (no keywords)
- Truncated mid-word due to length overrun

## The description tag

The `<meta name="description">` does NOT directly influence ranking. It DOES
influence click-through rate (CTR) from search results, which Google measures
as a quality signal. So it indirectly matters.

**Rules:**

- **Length: 150–160 characters.** Google truncates at ~158 on desktop, less on mobile (~130). Test with the [SERP Snippet Preview Tool](https://app.sistrix.com/en/serp-snippet-generator) before publishing.
- **Unique per page.** Duplicates are flagged in Search Console.
- **Action-oriented.** "Learn how to..." or "Discover our..." converts better than passive descriptions.
- **Include the primary keyword.** Google bolds matching query terms in the snippet, drawing the eye.
- **Mention USP / brand value.** What's special about this page or company.

**If you leave the description empty**, Google generates a snippet from the
page body. This is often suboptimal — Google picks whatever paragraph contains
the query terms, which may be context-free or awkward.

**Anti-patterns:**

- "Click here for more information" — wastes characters, lacks value
- Keyword stuffing (`web development, custom web, web design, professional web...`)
- Identical to the title (provides no additional information)
- Lorem ipsum or placeholder text left in production

## Robots meta tag

The robots meta tag controls how crawlers index and follow the page.

```html
<!-- These two are equivalent — default behavior, DON'T write them -->
<meta name="robots" content="index, follow">

<!-- Specific overrides -->
<meta name="robots" content="noindex, follow">     <!-- exclude from index, follow links -->
<meta name="robots" content="noindex, nofollow">   <!-- admin, account, private pages -->
<meta name="robots" content="noindex, follow, max-snippet:160">

<!-- Crawler-specific -->
<meta name="googlebot" content="noindex">
<meta name="bingbot" content="noindex">
```

**Common combinations and when to use them:**

- `index, follow` (default): published content pages
- `noindex, follow`: thank-you pages, internal landing pages with paid traffic, low-value tag/category pages on small blogs
- `noindex, nofollow`: admin panels, authentication pages, internal tooling — anything not for public discovery
- `index, nofollow`: rare and rarely correct — almost never use

**Important nuance:** `noindex` only works if Google can actually crawl the
page. If `robots.txt` disallows it, Google can't see the `noindex` meta tag
and may index the URL anyway (just with no content snippet). To exclude from
index reliably: allow crawling AND use `noindex`.

## Viewport meta tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

This is **mandatory** for mobile-friendly designation, which is a ranking signal
since the mobile-first indexing rollout. Without it, Google's Mobile-Friendly
Test fails, and rankings on mobile drop.

Variations rarely needed:

```html
<!-- Allow user zoom (accessibility) -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">

<!-- Lock zoom (rarely correct, accessibility issue) -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

Default to allowing user zoom unless you have a specific reason not to.

## Language attribute on `<html>`

```html
<html lang="en">          <!-- single-language site -->
<html lang="en-US">        <!-- specific dialect -->
<html lang="hu">           <!-- Hungarian -->
```

This is read by:

- Screen readers (pronunciation selection)
- Translation services (browser's "Translate to English" feature)
- Search engines (alongside hreflang)

For multilingual sites, the `lang` attribute changes per page based on the
page's language.

## Keywords meta tag (deprecated)

```html
<meta name="keywords" content="...">
```

**Don't write this.** Google has officially ignored the keywords meta since
2009. Yandex and Baidu still read it, but for EU B2B projects neither matters.

## Charset

```html
<meta charset="UTF-8">
```

Always UTF-8. Must be in the first 1024 bytes of the document, ideally the
first element inside `<head>`. Other encodings break special characters and
emoji.

## Theme color (mobile browser chrome)

```html
<meta name="theme-color" content="#0ea5e9">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f172a">
```

This sets the color of the mobile browser's address bar to match your brand.
Not an SEO ranking factor, but improves user perception and brand consistency.

## Using the `@nitrogen/frontend-seo` package

```svelte
<script>
    import { SeoMeta } from '@nitrogen/frontend-seo';
</script>

<SeoMeta
    title="Custom Web Development for Enterprise"
    description="Bespoke web applications and integrations for enterprise clients. 20 years of Laravel and modern frontend expertise."
    robots="index, follow"
    language="en"
    canonical="https://elementary-interactive.com/services/web-development"
/>
```

The `SeoMeta` component renders the four core tags (`<title>`, `description`,
`robots`, `canonical`) with proper SvelteKit `<svelte:head>` integration so
they appear in SSR output (not client-side hydration).

See the [package documentation](/packages/frontend-seo/overview/) for the full
component API.

## Validation

- **View page source (Ctrl+U)** — confirm tags are present in the initial HTML, not client-rendered
- **Lighthouse SEO audit** — flags missing or duplicate tags
- **Screaming Frog SEO Spider** — site-wide audit at scale; finds duplicate titles, missing descriptions, length overruns
- **Search Console → Enhancement reports** — Google's own findings on indexable pages
