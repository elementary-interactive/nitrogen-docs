---
title: OpenGraph & Twitter Card
description: Rich previews for social media sharing
sidebar:
  order: 2
---

# OpenGraph & Twitter Card

When a URL is shared on LinkedIn, Facebook, Slack, Discord, Microsoft Teams,
WhatsApp, or Twitter, these platforms generate a rich preview using the
OpenGraph protocol. For **B2B contexts, LinkedIn previews are critical** —
shared content in LinkedIn posts drives the majority of B2B referral traffic.

## OpenGraph (universal protocol)

OpenGraph was created by Facebook in 2010 and has since become the de facto
standard. Almost every platform supports it: LinkedIn, Slack, Discord, Twitter
(as fallback when Twitter Card is missing), iMessage, Skype, Telegram, etc.

### Required tags

```html
<meta property="og:type" content="website">
<meta property="og:url" content="https://example.com/page">
<meta property="og:title" content="Page Title">
<meta property="og:description" content="...">
<meta property="og:image" content="https://example.com/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="627">
<meta property="og:image:alt" content="...">
<meta property="og:site_name" content="Brand Name">
<meta property="og:locale" content="en_US">
```

Note the syntax: `property=`, not `name=` like other meta tags. This is a
quirk of the OpenGraph spec.

### OpenGraph types

The `og:type` value tells parsers how to interpret the content:

- `website` — generic page (default for most landing/marketing pages)
- `article` — blog post, news article, editorial content
- `product` — e-commerce product detail page
- `profile` — person profile (team member, author bio)
- `video.movie`, `video.episode`, `music.song` — media-specific types

For most Nitrogen B2B sites, `website` is used everywhere except blog posts
(which use `article`).

### Type-specific extensions

When `og:type` is `article`, additional tags are valid:

```html
<meta property="og:type" content="article">
<meta property="article:published_time" content="2026-05-27T08:00:00Z">
<meta property="article:modified_time" content="2026-05-27T10:00:00Z">
<meta property="article:author" content="https://example.com/team/balazs">
<meta property="article:section" content="Engineering">
<meta property="article:tag" content="SEO">
<meta property="article:tag" content="Performance">
```

LinkedIn and Slack both display the published date in their preview cards
when these are present.

## OpenGraph image best practices

The `og:image` is the most important visual element and the most error-prone.

### Dimensions

- **1200 × 630 pixels** is the universal sweet spot. Works for LinkedIn,
  Facebook, Twitter, Slack, Discord, and Teams.
- Aspect ratio **1.91:1** (close to 2:1). Don't use square (1:1) — it gets
  awkwardly cropped on most platforms.
- Minimum **600 × 315** (LinkedIn requires at least this for "large" cards).

### File specifications

- **JPEG or PNG.** WebP is technically supported by Facebook now, but many
  scrapers and link unfurlers (including Slack until recently) don't render
  WebP previews. Stick with JPEG.
- **Under 5 MB.** Ideally under 1 MB for fast unfurling. Slow images cause
  blank previews (the scraper times out).
- **Under 8000 × 8000 pixels** absolute maximum. Realistically, 1200×630 is
  the only size you should ever ship.

### Design guidelines

- **Brand-consistent.** Use brand colors, fonts, logo placement.
- **Minimal text on the image.** The platform overlays the title and description
  in its own UI; redundant text on the image looks cluttered.
- **Safe zone for text:** keep the central 600×315 area free of critical text
  (mobile previews crop to this area).
- **Logo placement:** usually top-left or center, sized at ~15% of image width.
- **Per-page unique is ideal** but a single brand default is acceptable for
  smaller sites.

### Generating OG images at scale

For sites with many pages (blogs, product catalogs), per-page unique OG images
are SEO-valuable. Common approaches:

1. **Manual creation in Figma**: high quality but doesn't scale beyond ~20 pages
2. **Build-time programmatic generation**: Satori, Vercel OG, or `@vercel/og` —
   generates JSX-templated images at build time
3. **Runtime generation**: cached endpoint that renders OG images on demand
   (e.g., Laravel route with the [Spatie image generator](https://github.com/spatie/browsershot))

The Nitrogen Frontend Ecosystem will add a programmatic OG generator in a future
package version (currently roadmap item for `@nitrogen/frontend-seo` v0.3.0).

## LinkedIn-specific quirks

LinkedIn is the platform where these tags matter most for B2B but also where
quirks bite hardest.

### Cache behavior

LinkedIn caches OG metadata for **7 days**. If you update the OG image or
description, LinkedIn will show the old version for up to a week unless you
manually refresh via [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).

This is especially painful for:

- Newly published content with placeholder OG images that were updated later
- Brand refreshes where OG image style changed
- A/B testing OG image variants

**Workflow recommendation:** for important content (campaign launches, key
landing pages), test the OG preview in Post Inspector BEFORE the first share.
Once a URL is cached with a broken or placeholder image, the first share
will display badly.

### Character limits

- **Title:** ~95 characters before truncation in LinkedIn's preview card
- **Description:** ~200 characters
- LinkedIn doesn't show the URL on its preview card (just the domain), so
  branding within the OG title is more important than for Twitter

### Compatibility with Twitter Card

LinkedIn **completely ignores** Twitter Card tags. If you only set `twitter:image`
and not `og:image`, LinkedIn shows no image. Always set OG tags as the baseline.

## Twitter Card

Twitter's own meta tag protocol. Falls back to OpenGraph if missing, but
explicit Twitter Card tags allow more control over Twitter-specific rendering.

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@brandhandle">
<meta name="twitter:creator" content="@authorhandle">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="https://example.com/twitter.jpg">
<meta name="twitter:image:alt" content="...">
```

### Card types

- **`summary`** — small square thumbnail on the left, text on the right (legacy, rarely best)
- **`summary_large_image`** — large hero image on top, text below (recommended for B2B)
- **`app`** — promotes mobile app download
- **`player`** — embeds an audio or video player

For Nitrogen B2B sites, always `summary_large_image`.

### Site vs creator

- `twitter:site` is the **publisher's** handle (the company's Twitter account)
- `twitter:creator` is the **author's** handle (per-article, when applicable)

Both are optional but useful. Without `twitter:site`, Twitter Card validator
warnings appear.

### Twitter Card image specs

- **Aspect ratio:** same as OG (1.91:1)
- **Minimum dimensions:** 300×157 (smaller than OG minimum; safe to use the
  same 1200×630 image)
- **Maximum file size:** 5MB

In practice, ship the same image for OG and Twitter (`og:image` and
`twitter:image` point to the same URL).

## Implementation pattern

For static images, the OG and Twitter Card tags are typically rendered together
in the layout:

```svelte
<script>
    import { OpenGraph, TwitterCard } from '@nitrogen/frontend-seo';
    import { page } from '$app/stores';

    let { title, description, image } = $props();

    const url = `https://elementary-interactive.com${$page.url.pathname}`;
    const fullImage = image.startsWith('http')
        ? image
        : `https://elementary-interactive.com${image}`;
</script>

<svelte:head>
    <OpenGraph
        type="website"
        url={url}
        title={title}
        description={description}
        image={fullImage}
        siteName="Elementary Interactive"
        locale="en_US"
    />

    <TwitterCard
        card="summary_large_image"
        site="@elementaryint"
        title={title}
        description={description}
        image={fullImage}
    />
</svelte:head>
```

Note the **absolute URLs** for `og:image`. Relative URLs (`/og-image.jpg`)
don't work — scrapers can't resolve them.

## Testing tools

Always test before publishing important content:

- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) — most
  important for B2B. Shows exactly what will appear when shared.
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) —
  forces a fresh fetch (clearing Facebook's cache).
- [Twitter Card Validator](https://cards-dev.twitter.com/validator) —
  Twitter's own tool (occasionally has access issues; alternative tools below).
- [opengraph.xyz](https://www.opengraph.xyz/) — third-party tool that checks
  all platforms in one view.
- [Slack's link unfurling preview](https://api.slack.com/robots) — read the
  documentation; Slack uses Facebook-style OG parsing.

For high-impact pages, test in all four before sharing publicly.

## Cross-references

- [Meta tags](/seo/frontend/meta-tags/) — the core tags that OG and Twitter build on
- [Structured Data](/seo/frontend/structured-data-jsonld/) — JSON-LD provides
  additional context to search engines (separate from social previews)
- [@nitrogen/frontend-seo package docs](/packages/frontend-seo/overview/)
