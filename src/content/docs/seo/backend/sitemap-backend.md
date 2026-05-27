---
title: Sitemap (Backend)
description: Server-side sitemap generation for CMS-driven sites
sidebar:
  order: 4
---

# Sitemap (Backend)

For database-driven content, sitemaps must be generated server-side because
content can change between deployments. For build-time generation patterns,
see [Sitemap (Frontend)](/seo/frontend/sitemap-frontend/).

## Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://example.com/</loc>
        <lastmod>2026-05-27T10:00:00+02:00</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <!-- more URLs -->
</urlset>
```

## When to use sitemap-index

50,000+ URLs OR 50 MB file size → split into multiple sitemap files with
a sitemap-index:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>https://example.com/sitemap-pages.xml</loc>
        <lastmod>2026-05-27</lastmod>
    </sitemap>
    <sitemap>
        <loc>https://example.com/sitemap-blog.xml</loc>
        <lastmod>2026-05-27</lastmod>
    </sitemap>
    <sitemap>
        <loc>https://example.com/sitemap-products.xml</loc>
        <lastmod>2026-05-27</lastmod>
    </sitemap>
</sitemapindex>
```

For Nitrogen-sized sites (typically <10,000 URLs), a single `sitemap.xml`
is fine. Plan for sitemap-index when approaching ~40,000 URLs.

## Laravel: Spatie package

```bash
composer require spatie/laravel-sitemap
```

Simple usage:

```php
use Spatie\Sitemap\SitemapGenerator;
use Spatie\Sitemap\Tags\Url;

SitemapGenerator::create('https://example.com')
    ->hasCrawled(function (Url $url) {
        // Filter out URLs you don't want indexed
        if (str_contains($url->path(), '/admin')) {
            return false;
        }
        return $url;
    })
    ->writeToFile(public_path('sitemap.xml'));
```

For database-driven content, build the sitemap from models:

```php
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;
use App\Models\Page;
use App\Models\Post;

$sitemap = Sitemap::create();

// Static pages
$sitemap->add(Url::create('/')->setPriority(1.0)->setChangeFrequency('weekly'));
$sitemap->add(Url::create('/about')->setPriority(0.8)->setChangeFrequency('monthly'));

// Dynamic pages
Page::published()->each(function (Page $page) use ($sitemap) {
    $sitemap->add(
        Url::create($page->path)
            ->setLastModificationDate($page->updated_at)
            ->setChangeFrequency('monthly')
            ->setPriority($page->priority ?? 0.5)
    );
});

// Blog posts
Post::published()->each(function (Post $post) use ($sitemap) {
    $sitemap->add(
        Url::create("/blog/{$post->slug}")
            ->setLastModificationDate($post->updated_at)
            ->setChangeFrequency('yearly')
            ->setPriority(0.6)
    );
});

$sitemap->writeToFile(public_path('sitemap.xml'));
```

## Custom Laravel implementation (no package)

For full control, generate sitemap with a controller + view:

```php
// app/Http/Controllers/SitemapController.php
class SitemapController extends Controller
{
    public function index()
    {
        $pages = Page::where('status', 'published')
            ->where('robots', '!=', 'noindex')
            ->select('slug', 'updated_at', 'priority')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()
            ->view('sitemap', compact('pages'))
            ->header('Content-Type', 'text/xml');
    }
}
```

```blade
{{-- resources/views/sitemap.blade.php --}}
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>{{ url('/') }}</loc>
        <lastmod>{{ now()->toAtomString() }}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
@foreach($pages as $page)
    <url>
        <loc>{{ url($page->slug) }}</loc>
        <lastmod>{{ $page->updated_at->toAtomString() }}</lastmod>
        <priority>{{ $page->priority ?? 0.5 }}</priority>
    </url>
@endforeach
</urlset>
```

Route:

```php
// routes/web.php
Route::get('/sitemap.xml', [SitemapController::class, 'index']);
```

## Rules for what to include

**Include:**

- All canonical URLs (the version you want indexed)
- All published, indexable content
- Both homepage and key category pages
- Recent content (Google prioritizes recently-added URLs)

**Exclude:**

- URLs with `noindex` meta tag (contradictory signal)
- URLs that 301-redirect (include the destination instead)
- Admin URLs, login pages, internal tools
- URLs blocked by robots.txt
- Pagination pages on small sites (debatable for large sites)

## lastmod best practices

- Reflect **actual last modification** of the content
- Use **ISO 8601 format**: `2026-05-27T10:00:00+02:00` (with timezone)
- Don't regenerate on every build if content hasn't changed
- Update only when actual content changes (not metadata-only changes)

Anti-pattern: setting `lastmod` to "now" on every regeneration. This gives
Google "freshness" signals that aren't real, and Google's algorithms can
detect this and reduce trust.

## changefreq and priority

These are **hints only**:

- Google ignores them
- Bing/Yandex use them
- Honest values are best

```xml
<changefreq>always | hourly | daily | weekly | monthly | yearly | never</changefreq>
<priority>0.0 to 1.0</priority>
```

Recommendations:

- Homepage: `weekly`, priority `1.0`
- Major landing pages: `monthly`, priority `0.8`
- Blog post listings: `weekly`, priority `0.7`
- Individual blog posts: `yearly`, priority `0.5-0.6`
- Static pages (about, contact): `yearly`, priority `0.5`

Don't put everything at priority `1.0` — relative differences are what matter.

## Image sitemap

For sites with many important images (portfolios, e-commerce, photo journalism),
include images in the sitemap with the image extension:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url>
        <loc>https://example.com/products/widget</loc>
        <image:image>
            <image:loc>https://example.com/images/widget.jpg</image:loc>
            <image:caption>Widget product photo</image:caption>
            <image:title>Widget</image:title>
        </image:image>
    </url>
</urlset>
```

This helps Google Images discovery. For most B2B sites, images aren't the
SEO priority — skip the image sitemap.

## Video sitemap

For sites with embedded videos:

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
    <url>
        <loc>https://example.com/tutorial/getting-started</loc>
        <video:video>
            <video:thumbnail_loc>https://example.com/thumb.jpg</video:thumbnail_loc>
            <video:title>Getting Started with Nitrogen</video:title>
            <video:description>Introduction to the Nitrogen platform...</video:description>
            <video:content_loc>https://example.com/videos/tutorial.mp4</video:content_loc>
            <video:duration>180</video:duration>
        </video:video>
    </url>
</urlset>
```

Rare for B2B agencies; useful for video-content-heavy sites.

## News sitemap

For sites publishing news content, register with [Google News](https://support.google.com/news/publisher-center/)
and use a news sitemap. Niche use case.

## Submission

1. **Google Search Console** → Sitemaps → "Add a new sitemap" → URL
2. **Bing Webmaster Tools** → Sitemaps → "Submit Sitemap"
3. **Reference in robots.txt:**

```
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

The robots.txt declaration is read by all crawlers, even those without
explicit submission (Yandex, DuckDuckGo's crawler, etc.).

## Caching

Generating a sitemap on every request is expensive. Cache aggressively:

```php
public function index()
{
    $xml = Cache::remember('sitemap', 3600, function () {
        return $this->generateSitemap();
    });

    return response($xml, 200, [
        'Content-Type' => 'text/xml',
        'Cache-Control' => 'public, max-age=3600',
    ]);
}
```

Invalidate cache when content changes:

```php
// In Page model
protected static function booted()
{
    static::saved(function () {
        Cache::forget('sitemap');
    });

    static::deleted(function () {
        Cache::forget('sitemap');
    });
}
```

For very large sites, pre-generate and write to disk:

```php
// Run after content updates or on a cron
php artisan sitemap:generate
```

The cron-based approach prevents cache stampedes when many users request
the sitemap simultaneously.

## Verification

- Visit `/sitemap.xml` in browser — should display XML
- Submit to Search Console, monitor "Indexed" count
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- Validate that all URLs in sitemap return 200 (not 404, not redirects)

A common audit script:

```bash
# Check all sitemap URLs
curl -s https://example.com/sitemap.xml | \
    grep -oP '(?<=<loc>)[^<]+' | \
    while read url; do
        code=$(curl -o /dev/null -s -w "%{http_code}" "$url")
        if [ "$code" != "200" ]; then
            echo "$code $url"
        fi
    done
```

## Cross-references

- [Sitemap (Frontend)](/seo/frontend/sitemap-frontend/) — build-time generation
- [Robots.txt](/seo/frontend/robots-txt/) — sitemap declaration in robots.txt
- [Search Engine Integration](/seo/backend/search-engine-integration/) — submitting to Search Console
- [Crawl Budget](/seo/backend/crawl-budget/) — sitemap's role in guiding crawlers
