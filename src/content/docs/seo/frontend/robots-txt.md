---
title: robots.txt
description: Controlling crawler access at site level
sidebar:
  order: 7
---

# robots.txt

The `robots.txt` file at the site root tells crawlers what they may and may
not access. It's the first file most crawlers fetch when they visit a domain.

## Location and format

The file must be at the **exact path** `/robots.txt` (e.g., `https://example.com/robots.txt`).
Subdirectories don't work — `/blog/robots.txt` is ignored.

```
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/
Disallow: /*?utm_*
Disallow: /search
Disallow: /preview/

Sitemap: https://example.com/sitemap.xml
```

## Directives

### User-agent

Specifies which crawler the following rules apply to:

```
User-agent: *           # applies to all crawlers
User-agent: Googlebot   # only Google
User-agent: Bingbot     # only Bing
```

You can chain multiple user-agent declarations:

```
User-agent: Googlebot
User-agent: Bingbot
Disallow: /private/     # applies to both
```

### Allow and Disallow

```
Allow: /                # allow everything
Disallow: /admin/       # block /admin/ and everything under it
Disallow: /             # block everything
Disallow: /*.pdf$       # block all PDFs (note the $ anchor)
Disallow: /*?utm_*      # block URLs with utm parameters
```

**Allow vs Disallow precedence:** the more specific rule wins. To allow one
file in an otherwise-disallowed directory:

```
Disallow: /assets/
Allow: /assets/public-file.pdf
```

### Sitemap

Lists sitemap URLs (one per line, absolute URLs):

```
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-blog.xml
```

Sitemap declarations are global — they apply regardless of user-agent.

### Crawl-delay (limited support)

```
Crawl-delay: 10        # wait 10 seconds between requests
```

Google ignores `Crawl-delay`. Bing and Yandex respect it. Generally don't
use it — Search Console has explicit crawl rate controls that work better.

## What robots.txt does NOT do

### Doesn't prevent indexing

`Disallow` blocks **crawling**, not **indexing**. If Google discovers a URL
via a backlink, it may still index the URL (just without content snippet)
even if `robots.txt` disallows crawling.

**To prevent indexing reliably:** allow crawling AND use `<meta name="robots" content="noindex">`.

This is counterintuitive but important. The mental model is:

- `robots.txt` = "should the crawler visit this URL"
- `<meta robots noindex>` = "should this URL appear in search results"

These are independent. To exclude something from search, the meta tag is
authoritative.

### Doesn't secure content

robots.txt is publicly readable (`https://yoursite.com/robots.txt`). Sensitive
URLs listed in `Disallow` are essentially **advertised** to anyone reading the
file. Don't put admin URLs in robots.txt; rely on authentication.

### Doesn't apply to subdomains

`https://example.com/robots.txt` doesn't affect `https://blog.example.com/`.
Each subdomain needs its own robots.txt.

## Common patterns

### Marketing site with admin

```
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/
Disallow: /login

Sitemap: https://example.com/sitemap.xml
```

### Site with internal search

```
User-agent: *
Allow: /

Disallow: /search
Disallow: /search?*

Sitemap: https://example.com/sitemap.xml
```

### Site with faceted navigation (e-commerce)

```
User-agent: *
Allow: /

# Block filter combinations
Disallow: /*?sort=*
Disallow: /*?filter=*
Disallow: /*?color=*
Disallow: /*?size=*

# Block UTM tracking
Disallow: /*?utm_*

# Block session IDs
Disallow: /*?session=*

Sitemap: https://example.com/sitemap.xml
```

### Block specific crawlers

```
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml
```

Useful to block aggressive SEO tools that don't add value. Note that
respectful crawlers honor robots.txt, but malicious bots will ignore it.

### Block AI training crawlers (2024+)

```
User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: ClaudeBot
Disallow: /
```

These specific user-agents (OpenAI's GPTBot, Common Crawl's CCBot, Google's
Bard/Gemini training crawler, Anthropic's various crawlers) honor robots.txt.
Decline if you don't want your content used for AI training.

**Note:** blocking AI crawlers may have unforeseen consequences for AI search
visibility (Bing Chat, Perplexity, etc., source from these crawls). Strategic
decision per site.

## Implementation in SvelteKit

```typescript
// src/routes/robots.txt/+server.ts
export const prerender = true;

export async function GET() {
    const content = `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/

Sitemap: https://elementary-interactive.com/sitemap.xml`;

    return new Response(content, {
        headers: { 'Content-Type': 'text/plain' }
    });
}
```

## Implementation in Laravel

```php
// routes/web.php
Route::get('/robots.txt', function () {
    return response()
        ->view('robots')
        ->header('Content-Type', 'text/plain');
});
```

```blade
{{-- resources/views/robots.blade.php --}}
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/

Sitemap: {{ url('sitemap.xml') }}
```

Or as a static file at `public/robots.txt` if it doesn't need to be
dynamically generated.

## Using the `@nitrogen/frontend-seo` package

```typescript
import { generateRobots } from '@nitrogen/frontend-seo/utils';

const content = generateRobots({
    rules: [
        {
            userAgent: '*',
            allow: ['/'],
            disallow: ['/admin/', '/api/', '/*?utm_*']
        }
    ],
    sitemap: 'https://example.com/sitemap.xml'
});
```

## Validation

- **Google's robots.txt Tester** (in Search Console legacy tools) — tests specific URLs against your rules
- **[robots.txt validator](https://technicalseo.com/tools/robots-txt/)** — syntax check
- **Search Console → Settings → Crawl stats** — shows how Google actually treats your robots.txt over time

## Cross-references

- [Sitemap (Frontend)](/seo/frontend/sitemap-frontend/) — sitemap declared in robots.txt
- [Crawl Budget](/seo/backend/crawl-budget/) — robots.txt's role in budget management
- [Meta Tags](/seo/frontend/meta-tags/) — the `noindex` meta tag that pairs with robots.txt
