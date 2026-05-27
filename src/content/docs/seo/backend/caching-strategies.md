---
title: Caching Strategies
description: Multi-layer caching for SEO performance
sidebar:
  order: 8
---

# Caching Strategies

Caching directly affects TTFB (Time to First Byte), which affects LCP (a
Core Web Vital), which affects ranking. Each cache layer takes load off
the next, reducing tail latency.

## The cache layers

```
Browser cache (client-side)
    ↓
CDN (Cloudflare, Bunny — edge)
    ↓
Reverse proxy cache (Nginx microcache, Varnish)
    ↓
Application cache (Redis, Memcached)
    ↓
Database query cache (built into MySQL/MariaDB)
    ↓
Database (source of truth)
```

Configure each layer to absorb the load that doesn't need to reach the next.

## HTTP cache headers

The fundamental browser/CDN caching protocol:

```
Cache-Control: public, max-age=31536000, immutable   # static assets (1 year)
Cache-Control: public, max-age=3600, must-revalidate # dynamic HTML (1 hour)
Cache-Control: no-store                              # private/sensitive content
ETag: "abc123"                                       # conditional GET
Last-Modified: Wed, 27 May 2026 10:00:00 GMT
```

### Directives explained

- **public** — anyone (browser, CDN, proxy) may cache
- **private** — only the user's browser may cache, not shared caches
- **max-age=N** — cache for N seconds
- **s-maxage=N** — like max-age but only for shared caches (CDN, proxy)
- **immutable** — content will never change at this URL (for versioned assets like `/app.abc123.css`)
- **must-revalidate** — when expired, must revalidate with origin (not serve stale)
- **stale-while-revalidate=N** — may serve stale for N seconds while fetching fresh in background
- **no-store** — don't cache anywhere, ever
- **no-cache** — cache, but always revalidate before use (different from no-store!)

### Laravel implementation

```php
// In a controller or middleware
return response($content)
    ->header('Cache-Control', 'public, max-age=3600, must-revalidate')
    ->setEtag(md5($content))
    ->setLastModified($page->updated_at);
```

For static asset versioning (with Vite):

```php
// Built assets get long cache headers automatically
// Nginx config:
location ~* \.(css|js|woff2|webp|avif|jpg|png)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

The cache-busting comes from the hashed filename (e.g., `app.abc123.css`).
When you deploy a new version, the filename changes, so browsers fetch the
new file.

## CDN caching

CDN edge caching is the single highest-impact optimization for global sites.

### Cloudflare configuration

In Cloudflare dashboard:

- **Caching → Configuration → Browser Cache TTL**: respect origin (let your `Cache-Control` headers control)
- **Caching → Configuration → Edge Cache TTL**: respect origin or set CDN-side override
- **Page Rules**: per-URL-pattern caching rules

For HTML pages, set:

```
Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400
```

- Browser caches for 5 minutes (`max-age=300`)
- CDN caches for 1 hour (`s-maxage=3600`)
- Stale content served for 1 day while fresh fetch happens (`stale-while-revalidate=86400`)

### Cloudflare cache purge

On content update, purge specific URLs:

```php
// app/Services/CloudflareCache.php
namespace App\Services;

use Illuminate\Support\Facades\Http;

class CloudflareCache
{
    public function purge(array $urls): bool
    {
        $response = Http::withToken(config('services.cloudflare.token'))
            ->post(
                "https://api.cloudflare.com/client/v4/zones/" . config('services.cloudflare.zone_id') . "/purge_cache",
                ['files' => $urls]
            );

        return $response->successful();
    }

    public function purgeAll(): bool
    {
        $response = Http::withToken(config('services.cloudflare.token'))
            ->post(
                "https://api.cloudflare.com/client/v4/zones/" . config('services.cloudflare.zone_id') . "/purge_cache",
                ['purge_everything' => true]
            );

        return $response->successful();
    }
}
```

Trigger on content updates:

```php
// In Page model
protected static function booted()
{
    static::saved(function (Page $page) {
        app(CloudflareCache::class)->purge([
            url($page->slug),
            url('/'),  // homepage often shows latest content
            url('/sitemap.xml'),
        ]);
    });
}
```

## Application cache (Redis)

For dynamic content that's expensive to compute but doesn't change often:

```php
$page = Cache::remember(
    "page.{$slug}",
    3600,
    function () use ($slug) {
        return Page::where('slug', $slug)
            ->with(['author', 'tags', 'media'])
            ->first();
    }
);
```

Cache invalidation on update:

```php
// In Page model
protected static function booted()
{
    static::saved(function (Page $page) {
        Cache::forget("page.{$page->slug}");
        Cache::forget("page.{$page->getOriginal('slug')}");  // old slug too
        Cache::forget('homepage');  // if homepage shows latest
        Cache::forget('sitemap');
    });
}
```

### Cache stampede prevention

When a cache expires and many requests hit simultaneously, they all try to
regenerate it (the "stampede" or "dog-pile"). Use Laravel's `Cache::lock()`:

```php
$page = Cache::remember("page.{$slug}", 3600, function () use ($slug) {
    $lock = Cache::lock("page.{$slug}.regenerating", 10);
    return $lock->block(5, function () use ($slug) {
        return Page::where('slug', $slug)->first();
    });
});
```

Only one process regenerates the cache; others wait briefly and use the
regenerated value.

For high-traffic sites, also consider **probabilistic early expiration**
or pre-warming (regenerate before expiry).

## Nginx microcache

For very high-traffic sites, Nginx's FastCGI microcache eliminates 90%+ of
PHP-FPM load:

```nginx
fastcgi_cache_path /var/cache/nginx levels=1:2 keys_zone=microcache:10m
                   max_size=100m inactive=10m use_temp_path=off;

server {
    location ~ \.php$ {
        # Don't cache for logged-in users
        set $skip_cache 0;
        if ($http_cookie ~* "laravel_session|XSRF-TOKEN") {
            set $skip_cache 1;
        }

        # Don't cache POST requests
        if ($request_method = POST) {
            set $skip_cache 1;
        }

        fastcgi_cache microcache;
        fastcgi_cache_valid 200 5s;
        fastcgi_cache_use_stale updating error timeout invalid_header http_500;
        fastcgi_cache_lock on;
        fastcgi_cache_bypass $skip_cache;
        fastcgi_no_cache $skip_cache;

        # ... rest of PHP-FPM config
    }
}
```

5-second microcache means:

- Each unique URL hits PHP-FPM at most once every 5 seconds
- Concurrent requests for the same URL share the cached response
- `fastcgi_cache_lock on` prevents stampedes

Trade-off: content can be up to 5 seconds stale. For most marketing pages,
acceptable.

## Database query cache

MySQL/MariaDB query cache (removed in MySQL 8.0, still in MariaDB):

```sql
-- Check if enabled
SHOW VARIABLES LIKE 'query_cache%';

-- Enable
SET GLOBAL query_cache_type = ON;
SET GLOBAL query_cache_size = 64M;
```

Modern best practice: **don't rely on DB query cache**. Use application-level
Redis cache instead. Query cache had concurrency issues and is being phased out.

## What to NEVER cache

- Authenticated user data (`X-Cache-Skip` header check)
- CSRF tokens
- One-time forms (e.g., password reset)
- Personalized content
- Real-time data (stock prices, live scores)
- Logged-in user pages (admin panels, dashboards)

Set explicitly:

```php
return response($content)
    ->header('Cache-Control', 'private, no-store, max-age=0');
```

Or for admin areas, add middleware:

```php
// app/Http/Middleware/NoCache.php
class NoCache
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);
        $response->headers->set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
        return $response;
    }
}
```

## Sitemap and feed caching

These can be cached aggressively (regenerated only when content changes):

```php
// In SitemapController
public function index()
{
    $xml = Cache::remember('sitemap', 86400, function () {
        return $this->generateSitemap();
    });

    return response($xml, 200, [
        'Content-Type' => 'text/xml',
        'Cache-Control' => 'public, max-age=3600, s-maxage=86400',
    ]);
}
```

24-hour cache on the server, 1-hour browser cache, 24-hour CDN cache. Cleared
explicitly on content publish.

## Image caching

Images should have **maximum** cache times because they change rarely:

```nginx
location ~* \.(jpg|jpeg|png|webp|avif|svg|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

When images do change (e.g., logo redesign), use cache-busting via filename
(`logo-v2.png` or `logo.png?v=2026`). Don't rely on cache invalidation.

## Measuring cache effectiveness

- **Cloudflare Analytics → Cache** — hit ratio (target >90% for static assets)
- **Nginx access logs**: grep for `HIT` vs `MISS` in upstream_cache_status
- **Laravel Telescope → Cache panel**: cache hit/miss ratios per key

A cache hit ratio under 80% on static assets indicates misconfiguration.
Under 60% on dynamic content suggests TTLs are too short.

## Cross-references

- [Performance & CWV](/seo/frontend/performance-core-web-vitals/) — TTFB impact on LCP
- [Server-Side Rendering](/seo/backend/server-side-rendering/) — what to render and cache
- [Security Headers](/seo/backend/security-headers/) — headers that interact with caching
- [CMS Content Workflow](/seo/backend/cms-content-workflow/) — cache invalidation on updates
