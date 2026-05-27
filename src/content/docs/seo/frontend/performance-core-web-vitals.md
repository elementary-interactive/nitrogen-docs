---
title: Performance & Core Web Vitals
description: Speed metrics that affect ranking
sidebar:
  order: 8
---

# Performance & Core Web Vitals

Since 2021, Core Web Vitals are official Google ranking signals. Since
March 2024, **INP** (Interaction to Next Paint) replaced FID as the
responsiveness metric. These three metrics measure real user experience
and directly affect ranking.

## The three metrics

| Metric | What it measures | Good | Needs Improvement | Poor |
|---|---|---|---|---|
| **LCP** (Largest Contentful Paint) | When the largest visible element renders | <2.5s | 2.5–4.0s | >4.0s |
| **INP** (Interaction to Next Paint) | Responsiveness to user input | <200ms | 200–500ms | >500ms |
| **CLS** (Cumulative Layout Shift) | Visual stability | <0.1 | 0.1–0.25 | >0.25 |

To be classified as "Good" in Search Console's Core Web Vitals report, **75%
of page visits** must hit the "Good" threshold for all three metrics.

## LCP — Largest Contentful Paint

LCP measures when the largest content element (image, video poster, or
text block) becomes visible in the viewport.

### What counts as the LCP element

The candidates Google considers:

- `<img>` elements
- `<image>` inside `<svg>`
- `<video>` elements (poster image)
- Background images via CSS
- Text blocks (block-level elements containing text)

The "largest" is measured by viewport area covered.

### Optimization techniques

**Preload critical resources** (the most impactful single optimization for LCP):

```html
<head>
    <link rel="preload" as="image"
          href="/hero-image.webp"
          fetchpriority="high"
          imagesrcset="/hero-480.webp 480w, /hero-1200.webp 1200w"
          imagesizes="100vw">
</head>
```

**Responsive images with srcset:**

```html
<img
    src="/hero-1200.webp"
    srcset="/hero-480.webp 480w, /hero-768.webp 768w, /hero-1200.webp 1200w"
    sizes="(max-width: 768px) 100vw, 1200px"
    alt="..."
    fetchpriority="high"
    loading="eager"
    width="1200"
    height="630"
>
```

`fetchpriority="high"` tells the browser to prioritize this image over
other resources.

**Server-side rendering:** for SSR'd pages, the LCP element is in the
initial HTML, eliminating the wait for JS hydration. SvelteKit's default
SSR mode (no `csr: false`) accomplishes this.

**Critical CSS inline:**

```html
<head>
    <style>
        /* Critical above-the-fold styles inlined */
        .hero { height: 100vh; background: #0ea5e9; }
        .hero-title { font-size: 4rem; color: white; }
    </style>
    <link rel="stylesheet" href="/styles/main.css" media="print" onload="this.media='all'">
</head>
```

The non-critical CSS is loaded with `media="print"` (which doesn't block
rendering), then promoted to `media="all"` once loaded.

**Reduce server response time** (TTFB):

LCP includes server response time. A 500ms TTFB plus 1500ms of frontend
rendering equals 2000ms LCP. See [Caching Strategies](/seo/backend/caching-strategies/)
for backend optimization.

**Self-host fonts:**

```html
<link rel="preload"
      href="/fonts/inter-var.woff2"
      as="font"
      type="font/woff2"
      crossorigin>
```

Google Fonts adds an HTTP roundtrip to fonts.googleapis.com before the font
file. Self-hosting eliminates this. Use `font-display: swap` to render text
immediately with fallback fonts, swapping to the custom font when loaded.

## INP — Interaction to Next Paint

INP measures the **slowest interaction** the user experiences during their
session. Specifically, the time from input event (click, tap, key press) to
the next paint that reflects the response.

INP replaced FID in March 2024 because FID measured only the **first**
interaction (often before JS heavy work). INP captures the full user
experience.

### Optimization techniques

**Break up long JavaScript tasks:**

Long tasks (>50ms) block the main thread and degrade INP. Identify them in
Chrome DevTools → Performance panel (gray bars are long tasks).

Split with `setTimeout(0)` or `requestIdleCallback()`:

```javascript
// BAD: blocks main thread for 200ms
function processItems(items) {
    items.forEach(item => doExpensiveWork(item));
}

// GOOD: yields to the browser between items
async function processItems(items) {
    for (const item of items) {
        doExpensiveWork(item);
        await new Promise(resolve => setTimeout(resolve, 0));
    }
}
```

**Batch state updates:**

In Svelte 5, multiple state updates inside the same synchronous code path
batch automatically. Avoid forcing premature reactivity.

**Delay non-critical scripts:**

```html
<!-- Load analytics after main content is interactive -->
<script>
    if (document.readyState === 'complete') {
        loadAnalytics();
    } else {
        window.addEventListener('load', loadAnalytics);
    }
</script>
```

Or use `requestIdleCallback`:

```javascript
requestIdleCallback(() => {
    loadAnalytics();
}, { timeout: 2000 });
```

**Defer hydration of non-critical components:**

For SvelteKit, this means selective hydration. Components below the fold
can be `prerender: true` without `csr` for hero areas that need interactivity:

```javascript
// +page.js
export const prerender = true;
```

For per-component hydration delay, use `intersectionObserver`-based
hydration patterns.

**Avoid heavy synchronous work in event handlers:**

```svelte
<!-- BAD -->
<button onclick={() => {
    const result = processLargeDataset(data); // takes 300ms
    updateUI(result);
}}>Process</button>

<!-- GOOD -->
<button onclick={async () => {
    showLoadingState();
    await yieldToMainThread();
    const result = await processInChunks(data);
    updateUI(result);
}}>Process</button>
```

## CLS — Cumulative Layout Shift

CLS measures unexpected visual movement of page content. A high CLS means
content jumps around as the page loads — frustrating for users (they tap
the wrong button) and a ranking signal for Google.

### Optimization techniques

**Always set width and height on images and videos:**

```html
<img src="..." alt="..." width="1200" height="630">
```

Even with responsive CSS (`width: 100%; height: auto`), the `width` and
`height` attributes tell the browser the aspect ratio so it reserves
the correct space before the image loads.

For modern responsive images, use `aspect-ratio` CSS:

```css
img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
}
```

**Reserve space for ads, embeds, iframes:**

```css
.ad-container {
    min-height: 280px; /* matches typical ad slot */
}

.youtube-embed {
    aspect-ratio: 16 / 9;
}
```

**Font loading: prevent FOIT and reduce FOUT shift:**

```css
@font-face {
    font-family: 'Inter';
    src: url('/fonts/inter-var.woff2') format('woff2');
    font-display: swap;
    /* font-display: optional; — even better but slower font appearance */
}
```

Combine with `size-adjust`, `ascent-override`, `descent-override` CSS
properties to match fallback font metrics to the custom font, eliminating
shift on swap:

```css
@font-face {
    font-family: 'Inter Fallback';
    src: local('Arial');
    size-adjust: 107%;
    ascent-override: 90%;
    descent-override: 22.5%;
}

body {
    font-family: 'Inter', 'Inter Fallback', sans-serif;
}
```

**Avoid injecting content above existing content:**

Banner pop-ups, cookie notices that push content down, late-loading
hero images that resize — all are CLS-rontó.

If you must show a banner, use a fixed overlay that doesn't displace content:

```css
.cookie-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    /* This doesn't shift layout */
}
```

**CSS animations should use transform/opacity, not width/height:**

```css
/* BAD: causes layout shifts */
.menu-open { width: 300px; }

/* GOOD: composited animation, no shift */
.menu-open { transform: translateX(0); }
```

## Measuring

### Field data (real users)

This is what Google uses for ranking:

- **Search Console → Core Web Vitals report** — 28-day rolling data, grouped by page-pattern
- **Chrome User Experience Report (CrUX)** — the underlying dataset Google uses, accessible via API
- **[PageSpeed Insights](https://pagespeed.web.dev/)** — combines lab and field data

### Lab data (synthetic)

For development:

- **Chrome DevTools → Performance panel** — record a session, see metrics
- **Chrome DevTools → Lighthouse panel** — run an audit
- **[WebPageTest.org](https://www.webpagetest.org/)** — detailed waterfall analysis
- **Lighthouse CI** — automated audits in your CI pipeline

Field data is what counts for ranking, but lab data is faster to iterate on
during development.

## Common pitfalls

### Optimizing only for desktop

Mobile typically has worse network and CPU. Test on mobile profiles in
DevTools (3G throttling, 4x CPU slowdown) to match real conditions.

### Optimizing for landing pages only

Google measures CWV across the entire site. A fast homepage doesn't help
if blog posts are slow.

### Chasing lab scores while ignoring field data

Lighthouse scores can show "100" while real users experience slow loads.
Always cross-reference with Search Console's field data.

### Adding code "to fix" CWV that breaks other things

E.g., aggressively delaying script execution can hide important UI states
or break tracking. Measure user-facing UX, not just metrics.

## Performance budget

Set targets per page type:

| Page type | LCP target | INP target | CLS target | Total JS budget |
|---|---|---|---|---|
| Marketing landing | <1.5s | <100ms | <0.05 | <100kb |
| Blog post | <2.0s | <150ms | <0.1 | <150kb |
| App/dashboard | <2.5s | <200ms | <0.1 | <500kb |

Enforce in CI:

```yaml
# .github/workflows/lighthouse.yml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://staging.example.com/
      https://staging.example.com/blog/post
    budgetPath: ./lighthouse-budget.json
    runs: 3
```

## Cross-references

- [Server-Side Rendering](/seo/backend/server-side-rendering/) — SSR's role in LCP
- [Image Optimization](/seo/backend/image-optimization/) — image pipeline affecting LCP
- [Caching Strategies](/seo/backend/caching-strategies/) — TTFB optimization
- [Accessibility = SEO](/seo/frontend/accessibility-seo/) — accessibility correlates with performance
