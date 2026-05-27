---
title: Sitemap (Frontend)
description: Build-time sitemap generation in SvelteKit
sidebar:
  order: 6
---

# Sitemap (Frontend)

For static or build-time-generated content (marketing pages, blog posts that
are prerendered), the sitemap can be generated at build time on the frontend.
For database-driven content, generation happens server-side — see
[Sitemap (Backend)](/seo/backend/sitemap-backend/).

This page covers the frontend-side patterns.

## When frontend-generated sitemaps fit

Use frontend (build-time) sitemap generation when:

- All content is in the codebase (markdown files, static data)
- The site is fully prerendered (`adapter-static` or extensive `prerender = true`)
- New content goes through a build/deploy cycle, not direct CMS publication

Don't use it when:

- Content is in a database that updates without rebuilds
- Users can publish content (CMS, user-generated content)

## SvelteKit endpoint approach

Create a `+server.ts` that returns the sitemap XML:

```typescript
// src/routes/sitemap.xml/+server.ts
import { pages } from '$lib/pages';
import { posts } from '$lib/posts';

export const prerender = true;

const SITE_URL = 'https://elementary-interactive.com';

export async function GET() {
    const allRoutes = [
        { path: '/', changefreq: 'weekly', priority: 1.0 },
        { path: '/about', changefreq: 'monthly', priority: 0.8 },
        { path: '/services', changefreq: 'monthly', priority: 0.9 },
        ...pages.map(p => ({
            path: p.path,
            changefreq: 'monthly',
            priority: 0.7,
            lastmod: p.updatedAt
        })),
        ...posts.map(p => ({
            path: `/blog/${p.slug}`,
            changefreq: 'yearly',
            priority: 0.6,
            lastmod: p.publishedAt
        }))
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `    <url>
        <loc>${SITE_URL}${route.path}</loc>
        ${route.lastmod ? `<lastmod>${route.lastmod}</lastmod>` : ''}
        <changefreq>${route.changefreq}</changefreq>
        <priority>${route.priority}</priority>
    </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
```

The `prerender = true` directive causes SvelteKit to render this endpoint at
build time, producing `sitemap.xml` as a static asset.

## Crawler-based sitemap generation

For larger sites where listing routes manually is impractical, use a
build-time crawler:

```typescript
// scripts/generate-sitemap.ts
import { glob } from 'glob';
import { writeFileSync } from 'fs';

const SITE_URL = 'https://example.com';

async function generate() {
    const routes = await glob('src/routes/**/+page.svelte');

    const urls = routes
        .map(route => {
            // Convert "src/routes/about/+page.svelte" to "/about"
            const path = route
                .replace('src/routes', '')
                .replace('/+page.svelte', '')
                .replace('+page.svelte', '/');
            return path;
        })
        .filter(path => !path.includes('['))  // exclude dynamic routes
        .filter(path => !path.includes('(')); // exclude grouped routes

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `    <url><loc>${SITE_URL}${url}</loc></url>`).join('\n')}
</urlset>`;

    writeFileSync('static/sitemap.xml', xml);
    console.log(`Generated sitemap with ${urls.length} URLs`);
}

generate();
```

Run before build:

```json
{
    "scripts": {
        "prebuild": "tsx scripts/generate-sitemap.ts",
        "build": "vite build"
    }
}
```

## Using the `@nitrogen/frontend-seo` package

```typescript
// src/routes/sitemap.xml/+server.ts
import { generateSitemap } from '@nitrogen/frontend-seo/utils';
import { pages, posts } from '$lib/content';

export const prerender = true;

export async function GET() {
    const sitemap = generateSitemap({
        baseUrl: 'https://elementary-interactive.com',
        routes: [
            { path: '/', priority: 1.0, changefreq: 'weekly' },
            { path: '/about', priority: 0.8, changefreq: 'monthly' },
            ...pages.map(p => ({
                path: p.path,
                priority: 0.7,
                changefreq: 'monthly',
                lastmod: p.updatedAt
            })),
            ...posts.map(p => ({
                path: `/blog/${p.slug}`,
                priority: 0.6,
                changefreq: 'yearly',
                lastmod: p.publishedAt
            }))
        ]
    });

    return new Response(sitemap, {
        headers: { 'Content-Type': 'application/xml' }
    });
}
```

The utility handles XML escaping, proper formatting, and lastmod ISO 8601
conversion.

## Hreflang in frontend-generated sitemaps

For multilingual sites where translations are in code:

```typescript
const routes = [
    {
        path: '/about',
        alternates: [
            { lang: 'en', url: 'https://example.com/about' },
            { lang: 'hu', url: 'https://example.com/hu/about' }
        ]
    }
];

// XML output includes xhtml:link entries
```

The Nitrogen `generateSitemap` utility supports this via an `alternates` array
on route entries.

## Sitemap index for large sites

When approaching 50,000 URLs or 50MB file size, split into multiple sitemaps:

```typescript
// src/routes/sitemap.xml/+server.ts
export const prerender = true;

export async function GET() {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>https://example.com/sitemap-pages.xml</loc>
        <lastmod>2026-05-27</lastmod>
    </sitemap>
    <sitemap>
        <loc>https://example.com/sitemap-blog.xml</loc>
        <lastmod>2026-05-27</lastmod>
    </sitemap>
</sitemapindex>`;

    return new Response(xml, {
        headers: { 'Content-Type': 'application/xml' }
    });
}
```

Then separate endpoints for each:

- `src/routes/sitemap-pages.xml/+server.ts`
- `src/routes/sitemap-blog.xml/+server.ts`

## What NOT to include in sitemap

- URLs with `noindex` meta tag (contradictory signal)
- URLs that redirect (waste of crawl budget; include the destination instead)
- Pagination pages on small sites (debatable; include them on large sites where they're worth crawling)
- Admin URLs, search results, filter combinations
- URLs blocked by `robots.txt`

## Verification

- Visit `/sitemap.xml` in browser — should display the XML
- Submit to [Search Console → Sitemaps](https://search.google.com/search-console)
- Search Console reports validation errors and indexed URL counts after submission
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html) — third-party tool

## Cross-references

- [Sitemap (Backend)](/seo/backend/sitemap-backend/) — for CMS-driven sites
- [Robots.txt](/seo/frontend/robots-txt/) — referencing the sitemap from robots.txt
- [Crawl Budget](/seo/backend/crawl-budget/) — sitemap's role in crawler guidance
