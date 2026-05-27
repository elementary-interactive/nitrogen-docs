---
title: HTTP Status Codes
description: How status codes drive crawler behavior
sidebar:
  order: 2
---

# HTTP Status Codes

HTTP status codes drive crawler behavior. Wrong status = wrong indexing
behavior. The "correct" status code matters more than most developers realize.

## SEO-relevant status codes

| Code | Meaning | SEO interpretation |
|---|---|---|
| **200** | OK | Normal indexable page |
| **301** | Moved Permanently | Link equity transfers to new URL |
| **302** | Found (Temporary) | Link equity stays at OLD URL — rarely correct |
| **307** | Temporary Redirect | Like 302 but preserves HTTP method |
| **308** | Permanent Redirect | Like 301 but preserves HTTP method |
| **403** | Forbidden | Crawler treats as inaccessible; usually not indexed |
| **404** | Not Found | Crawler learns URL is gone; eventually de-indexed |
| **410** | Gone | Like 404 but **intentional**; faster de-indexing |
| **429** | Too Many Requests | Rate limited; crawler retries later |
| **451** | Unavailable for Legal Reasons | GDPR-compliant geo-blocking |
| **500** | Internal Server Error | Crawler retries; sustained 5xx hurts rankings |
| **502** | Bad Gateway | Upstream server error |
| **503** | Service Unavailable | Temporary; crawler returns later |
| **504** | Gateway Timeout | Upstream timeout |

## The 200 trap: soft 404

The most common SEO bug related to status codes: returning **200 OK** with
a "page not found" body.

```php
// BAD: returns 200 with "not found" content
public function show($slug) {
    $page = Page::where('slug', $slug)->first();
    if (!$page) {
        return view('not-found');  // HTTP 200!
    }
    return view('page', compact('page'));
}
```

Google calls this a "soft 404." It:

- Wastes crawl budget (Googlebot keeps visiting URLs that look real but have no content)
- May get indexed (an empty "Page Not Found" page in search results)
- Eventually gets de-indexed, but slowly (much slower than a real 404)

**Fix:**

```php
public function show($slug) {
    $page = Page::where('slug', $slug)->first();
    if (!$page) {
        abort(404);  // proper HTTP 404
    }
    return view('page', compact('page'));
}
```

In SvelteKit:

```javascript
// +page.server.js
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    const page = await getPage(params.slug);
    if (!page) {
        throw error(404, 'Page not found');
    }
    return { page };
}
```

Search Console reports soft 404s in the Coverage report under "Excluded —
Soft 404."

## 301 vs 302

- **301 (Permanent)**: link equity transfers from old URL to new URL. Use
  for **permanent moves** — slug changes, URL restructuring, domain migration.
- **302 (Temporary)**: link equity stays at the OLD URL. Crawler keeps the
  old URL in its index. Use only for **truly temporary** redirects —
  promotional pages, A/B test variants.

Mistakes:

- Using 302 for permanent moves → link equity is lost
- Using 301 for temporary redirects → old URL is removed from index, hard to revert

### When to use 302 (rare cases)

- Promotional landing page that's only active for a campaign
- A/B testing where you want both URLs to retain their position
- Geographic redirect during specific events (e.g., Black Friday landing in a region)
- Login-required redirect (`/dashboard` → `/login` if not authenticated)

Practically, 301 is correct in 95%+ of redirect scenarios. Default to 301
unless you have a specific reason for 302.

## 307 and 308

The differences from 301/302:

- **301**: permanent redirect; browser MAY change request method (e.g., POST → GET)
- **302**: temporary redirect; browser MAY change request method
- **307**: temporary redirect; method **must** be preserved
- **308**: permanent redirect; method **must** be preserved

For SEO of GET requests, 301 and 308 behave the same. For HTTPS migration
where you want to preserve POST → POST behavior, 308 is technically more
correct than 301.

In practice, 301 is most widely supported and the standard choice.

## 404 vs 410

Both indicate "this URL doesn't have content." The difference:

- **404**: URL doesn't exist (might be a typo, might come back)
- **410**: URL existed but was **intentionally** removed (won't come back)

Google de-indexes 410 URLs faster than 404 URLs because 410 signals certainty.

### When to return 410

- Content deleted by the author with no replacement
- User accounts deleted (`/user/john` → 410 after account deletion)
- Discontinued products with no replacement
- Articles withdrawn (legal reasons, factual errors)

```php
// Laravel: returning 410
public function show($slug) {
    if (Page::archived()->where('slug', $slug)->exists()) {
        abort(410);  // explicitly gone
    }
    // ... rest of logic
}
```

### When to return 404

- URL typos
- URLs that simply never existed
- Removed but might return content

If you're returning a 410 for content that returns later, search engines may
take longer to re-discover and re-index it than if you'd used 404.

## 503: maintenance mode

When taking the site down for maintenance, return **503 Service Unavailable**
with a `Retry-After` header:

```
HTTP/1.1 503 Service Unavailable
Retry-After: 3600
Content-Type: text/html

<!-- Maintenance page HTML -->
```

The `Retry-After` value is in seconds (here: 1 hour). Crawlers respect this
and return after the specified time.

**Don't** return:

- 200 with maintenance page content (crawlers index "We're down for maintenance")
- 404 (crawlers think the URL is gone)
- Hard timeout (crawlers may de-index after repeated timeouts)

For Laravel:

```php
// In maintenance middleware or pre-execution check
return response()->view('maintenance', [], 503)
    ->header('Retry-After', 3600);
```

Built-in: `php artisan down --retry=3600` returns 503 with appropriate
`Retry-After` automatically.

## 429: rate limiting

Return 429 with `Retry-After` when rate-limiting requests:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

Crawlers respect this. Search Console's Crawl Stats shows your 429 rate;
sustained high rates indicate you should increase your rate limits or
optimize backend performance.

## 5xx errors

Sustained 5xx errors hurt rankings. Google's documentation:

> "If we see a sustained increase in server errors during crawl, we'll
> reduce how often we crawl your site."

Monitor 5xx rates in:

- Application logs (sentry, errors)
- Search Console → Crawl stats → "By response"
- Web server logs (5xx grep)

Investigate any 5xx spike. Common causes:

- Database connection limits exceeded
- Memory leaks in long-running processes
- Cascade failure from upstream service
- DDoS or crawler bursts

## Anti-patterns

### 301 chains

```
/old-product (301) → /products/old (301) → /products/widget
```

Every hop loses some link equity. **Maximum 1 redirect.**

Find chains with curl:

```bash
curl -I -L https://example.com/old-product
# Shows: HTTP/2 301 → HTTP/2 301 → HTTP/2 200
```

If the chain has more than one 301, update the first redirect to point
directly to the final destination.

### Redirect loops

```
/page-a (301) → /page-b (301) → /page-a
```

Crawler discards both. Use a CHECK constraint or app-level validation when
inserting redirects:

```php
class Redirect extends Model
{
    public static function safeCreate(string $from, string $to, int $status = 301): self
    {
        // Prevent A → A loops
        if ($from === $to) {
            throw new \InvalidArgumentException("Redirect from $from to itself");
        }

        // Prevent A → B → A loops
        $reverse = self::where('from_path', $to)->where('to_path', $from)->first();
        if ($reverse) {
            throw new \InvalidArgumentException("Reverse redirect exists: $to → $from");
        }

        return self::create([
            'from_path' => $from,
            'to_path' => $to,
            'status_code' => $status,
        ]);
    }
}
```

### Returning 200 on parameter combinations that should 404

```
/products?id=invalid-id  → 200 (with "no product found")
```

This soft 404s. Either return 404 explicitly or 301-redirect to a relevant
page.

## Verification

```bash
# Check status code
curl -I https://example.com/page

# Follow redirects and show full chain
curl -I -L https://example.com/page

# Test specific user-agent
curl -I -A "Googlebot" https://example.com/page
```

Search Console → Coverage report categorizes pages by status code, showing
sustained patterns.

## Cross-references

- [Redirects (301/302)](/seo/backend/redirects-301-302/) — implementation details
- [Crawl Budget](/seo/backend/crawl-budget/) — soft 404 impact on budget
- [CMS Content Workflow](/seo/backend/cms-content-workflow/) — when content transitions to 410
