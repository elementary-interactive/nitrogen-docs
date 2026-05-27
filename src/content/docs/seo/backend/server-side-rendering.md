---
title: Server-Side Rendering
description: SSR, SSG, ISR, and CSR for SEO
sidebar:
  order: 1
---

# Server-Side Rendering

The single biggest SEO architecture decision: how is HTML delivered to the
crawler?

## Four strategies

| Strategy | When to use | SEO impact |
|---|---|---|
| **SSR** (Server-Side Rendering) | Dynamic, user-specific content | Excellent — crawler gets ready HTML |
| **SSG** (Static Site Generation) | Rarely-changing content (blog, marketing) | Excellent + fastest LCP |
| **ISR** (Incremental Static Regeneration) | Many pages, occasionally updated | SSG with auto-refresh |
| **CSR** (Client-Side Rendering) | App-like SPAs | **SEO-hostile** — only when necessary |
| **Hybrid** | Mixed (marketing SSG, app CSR) | OK if done right |

## How crawlers actually see content

Modern Googlebot uses Chromium and CAN render JavaScript — but with delay
and cost:

1. **First-pass crawl**: HTML only, ranked initially based on what's in the
   initial HTML response
2. **Second-pass crawl (rendering queue)**: JavaScript is executed, additional
   content discovered, possibly weeks later

This means:

- **CSR-only sites have delayed indexing** of dynamic content
- **Server-rendered content ranks faster** than client-rendered content
- **Bing and other crawlers** are less sophisticated than Google; CSR is more
  hostile to them

For SEO-critical pages (landing pages, blog posts, product pages), SSR or
SSG is strongly preferred over CSR.

## SvelteKit adapter choice

### `@sveltejs/adapter-node`

Node.js server runtime, supports SSR + ISR. **Default for Nitrogen sites.**

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';

export default {
    kit: {
        adapter: adapter({
            out: 'build',
            precompress: true  // gzip + brotli at build
        })
    }
};
```

Pairs with Docker deployment, reverse proxy (Traefik/Nginx), HTTPS via
Let's Encrypt.

### `@sveltejs/adapter-static`

Pure SSG, no Node runtime needed. **For small marketing sites with no
dynamic content.**

```javascript
import adapter from '@sveltejs/adapter-static';

export default {
    kit: {
        adapter: adapter({
            pages: 'build',
            assets: 'build',
            fallback: undefined,
            precompress: true
        })
    }
};
```

Generates `dist/` directory with static HTML files, deployable to any
static host (Cloudflare Pages, GitHub Pages, Netlify, S3).

### `@sveltejs/adapter-auto`

Auto-detects deploy platform (Vercel, Netlify, Cloudflare). **NOT recommended
for self-hosted Nitrogen projects** — use explicit `adapter-node`.

## Per-page rendering directives

SvelteKit lets you control rendering per page:

```javascript
// +page.js or +page.server.js
export const prerender = true;   // generate HTML at build time
export const ssr = true;         // runtime SSR enabled (default)
export const csr = true;         // client-side hydration enabled (default)
```

Common combinations:

### SSG (prerender)

```javascript
export const prerender = true;
```

Page is rendered at build time, written as a static HTML file. **Fastest
possible delivery.** Use for: landing pages, blog posts, marketing pages.

### SSR (default)

```javascript
// no directives — default is ssr: true, csr: true
```

Page is rendered on each request. **Required for dynamic data** (user-specific
content, real-time data).

### Static + interactive

```javascript
export const prerender = true;   // HTML at build time
// csr: true is default — page hydrates client-side
```

Page is prerendered but JavaScript hydrates for interactivity. Best of both
worlds for marketing pages with interactive elements (carousels, forms).

### No-JS pages

```javascript
export const prerender = true;
export const csr = false;
```

Page is prerendered AND has no client-side JavaScript. **Pure HTML/CSS.**
Use for documentation pages, blog posts where interactivity isn't needed.

Benefits:

- Zero JavaScript download (smallest payload)
- Perfect LCP (no JS parse/execute time)
- Perfect INP (no event handlers to optimize)
- Works without JavaScript enabled (accessibility benefit)

### Dynamic SSR

```javascript
export const ssr = true;
export const csr = true;
// no prerender — rendered on each request
```

Used when content varies per request (user-specific dashboards, search
results, real-time data).

## Testing what crawlers see

### View HTML without JavaScript

The simplest test:

```bash
# Chrome DevTools → Cmd+Shift+P → "Disable JavaScript" → reload
```

Then view source. If the content you care about is there → SSR/SSG is
working. If not, you're shipping CSR-dependent content.

### Search Console URL Inspection

```
Search Console → URL Inspection → enter URL → "Test live URL" → View
"Crawled page" rendered HTML
```

Shows exactly what Googlebot sees after JavaScript execution (the second-pass
crawl result).

### Quick curl test

```bash
curl -A "Googlebot" -L https://example.com/page > rendered.html
```

The `-A` flag sends Googlebot user-agent (useful if your server delivers
different content per user-agent, which is now an anti-pattern but still
exists).

## Content visibility timing

Different SSR patterns produce different "time-to-content" for crawlers:

| Pattern | First-pass HTML | Time to indexable |
|---|---|---|
| SSG (prerender) | Full content | Immediate on crawl |
| SSR | Full content | Immediate on crawl |
| SSR + hydration | Full content | Immediate on crawl |
| CSR (SPA) | Empty shell + JS | Wait for render queue (days/weeks) |

The "render queue" delay matters because content that gets indexed faster
also accumulates link equity faster, ranks better, etc. SSR's advantage is
real.

## SSR-related SEO patterns

### Lazy-loaded content

Content loaded after page interaction (infinite scroll, "show more" buttons)
is NOT in the initial HTML. Crawlers may or may not discover it.

**Best practice:** lazy-load content from a server-rendered "shell" — the
first batch of items is in initial HTML, more loads on interaction. Crawlers
see the first batch (which has the SEO value); users see the lazy-loaded
extras.

### Conditional rendering

```svelte
{#if mounted}
    <!-- This won't be in SSR output! -->
    <div>Client-only content</div>
{/if}
```

If `mounted` is set in `onMount`, the SSR HTML doesn't include this content.
Crawlers see only the SSR'd portion. Use this knowledge to deliberately keep
content out of the SSR HTML (e.g., personalization widgets).

### Dynamic imports

```javascript
const Component = await import('./Heavy.svelte');
```

Dynamic imports happen at runtime. The imported component's content is NOT
in the initial HTML. Use only for genuinely large, deferrable components.

## Common pitfalls

### "It looks like client rendering, but it's SSR"

If your `+page.svelte` uses `onMount` to fetch data:

```svelte
<script>
    let data = $state(null);

    onMount(async () => {
        data = await fetch('/api/data').then(r => r.json());
    });
</script>

{#if data}
    <h1>{data.title}</h1>
{/if}
```

This **runs client-side only**. The SSR HTML contains no `<h1>` content.
Crawlers see nothing.

**Fix:** use `+page.server.js` or `+page.js` `load` function:

```javascript
// +page.server.js
export async function load() {
    const data = await fetchFromDB();
    return { data };
}
```

```svelte
<script>
    let { data } = $props();
</script>

<h1>{data.title}</h1>  <!-- now SSR'd -->
```

### Personalization breaks caching

```svelte
<p>Hello, {user.name}!</p>
```

If the page is SSR'd per request with user-specific content, you can't cache
it on CDN. This kills performance.

**Solutions:**

1. Move personalization to client-side after initial render (gives up some UX)
2. Use edge personalization with cache key including user segment
3. Render generic page server-side, personalize parts client-side

### Hydration mismatch warnings

If SSR output differs from client render, Svelte warns about hydration mismatch.
Common cause: server-side rendering with current time, client-side rendering
with different time.

**Fix:** ensure SSR and CSR use the same data. For time-dependent content,
either show server time consistently or wait until after hydration to show
client time.

## Cross-references

- [Performance & CWV](/seo/frontend/performance-core-web-vitals/) — SSR's role in LCP
- [Crawl Budget](/seo/backend/crawl-budget/) — server-side rendering reduces crawl cost
- [Caching Strategies](/seo/backend/caching-strategies/) — caching SSR'd output
