---
title: Search Engine Integration
description: Google Search Console, Bing Webmaster, Yandex setup
sidebar:
  order: 10
---

# Search Engine Integration

Beyond getting your site crawled, integrate with search engine webmaster
tools to receive feedback, submit sitemaps, monitor errors, and use APIs
for instant indexing.

## Google Search Console — overview

The single most important SEO tool. Free, official, comprehensive. Detailed
in [Google Search Console (Cross-Cutting)](/seo/cross-cutting/google-search-console/);
this page covers the integration setup.

### Setup steps (summary)

1. Go to [Search Console](https://search.google.com/search-console)
2. Add Property — choose Domain (DNS verification) or URL prefix
3. Verify ownership (DNS TXT, HTML file, HTML meta tag, Google Analytics, or GTM)
4. Submit sitemap via Sitemaps section
5. Monitor Coverage, Core Web Vitals, Search Performance daily/weekly

### Backend integration

For SSR'd sites, ownership verification via HTML meta tag in `<head>`:

```php
// config/services.php
'google' => [
    'search_console_verification' => env('GOOGLE_SEARCH_CONSOLE_VERIFICATION'),
],
```

```blade
{{-- resources/views/layouts/app.blade.php --}}
@if($verification = config('services.google.search_console_verification'))
    <meta name="google-site-verification" content="{{ $verification }}">
@endif
```

Or place the HTML file verification at `public/google[code].html`:

```bash
echo "google-site-verification: google[code].html" > public/google[code].html
```

The verification persists as long as the file/meta tag remains. **Don't
remove** it after initial verification — Google revalidates periodically.

## Bing Webmaster Tools

Similar to Search Console, independent system. Free.

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add Site → Verify (similar methods to Google)
3. Submit sitemap
4. Monitor reports

Bing's index also powers DuckDuckGo and many smaller search engines, so
Bing setup has reach beyond Bing itself.

### Bing-specific features

- **IndexNow API support** — instant indexing (see [IndexNow](/seo/backend/indexnow-instant-indexing/))
- **Crawl Control** — set times of day when Bingbot should crawl heavily vs lightly
- **URL Submission Tool** — submit URLs for instant indexing (limited daily quota)
- **Site Scan** — built-in SEO audit tool

## Yandex Webmaster

For Russian market. Generally not relevant for EU B2B projects, but if your
clients have Russian-speaking customer base:

1. Go to [Yandex Webmaster](https://webmaster.yandex.com/)
2. Add Site → Verify
3. Submit sitemap

Yandex has its own indexing API similar to IndexNow (which it co-created).

## Naver, Baidu, Seznam

Region-specific:

- **Naver** (South Korea): [Naver Search Advisor](https://searchadvisor.naver.com/)
- **Baidu** (China): [Baidu Webmaster Tools](https://ziyuan.baidu.com/)
- **Seznam** (Czech Republic): [Seznam Webmaster](https://search.seznam.cz/pro-webmastery/)

Only relevant if you have geographic strategy targeting these regions.

## Submitting sitemaps

After verification, submit your sitemap in each tool:

**Google Search Console** → Sitemaps → enter URL → Submit
**Bing Webmaster Tools** → Sitemaps → Submit Sitemap
**Yandex Webmaster** → Indexing → Sitemaps → Add

Also reference in `robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

This way, crawlers that aren't explicitly registered (DuckDuckGo bot, etc.)
also find the sitemap.

## Programmatic interactions

### Google Indexing API (limited use)

Google has an Indexing API, but it's **only for JobPosting and BroadcastEvent
schemas**. Not for general content. The official guidance is to use sitemaps
+ Search Console URL Inspection for general content.

If you have job listings or live broadcast event pages, the Indexing API is
the fastest way to get them indexed.

### Bing Indexing API + IndexNow

Bing has a general-purpose Indexing API, but it's superseded by IndexNow.
Use IndexNow (covered in [IndexNow](/seo/backend/indexnow-instant-indexing/)).

### Search Console API (read-only)

Google Search Console has an API for reading analytics data (queries,
impressions, clicks) but **no API for writing** (you can't submit URLs
programmatically beyond sitemap).

Use cases:

- Pull search performance data into internal dashboards
- Identify keywords that get impressions but low CTR (optimization opportunities)
- Track ranking changes over time

```php
// Example: fetching search performance data via Google API client
use Google\Client;
use Google\Service\Webmasters;

$client = new Client();
$client->setApplicationName('My SEO Dashboard');
$client->setScopes(Webmasters::WEBMASTERS_READONLY);
$client->setAuthConfig(storage_path('google-credentials.json'));

$service = new Webmasters($client);

$query = new Webmasters\SearchAnalyticsQueryRequest();
$query->setStartDate('2026-04-01');
$query->setEndDate('2026-04-30');
$query->setDimensions(['query', 'page']);
$query->setRowLimit(1000);

$response = $service->searchanalytics->query('https://example.com', $query);

foreach ($response->getRows() as $row) {
    echo $row->getKeys()[0] . ' on ' . $row->getKeys()[1]
       . ': ' . $row->getClicks() . ' clicks, '
       . $row->getImpressions() . ' impressions, '
       . round($row->getCtr() * 100, 1) . '% CTR'
       . "\n";
}
```

This is read-only — you can't push URLs for re-indexing this way.

## Verifying domain in multiple tools

Each tool has independent verification. Common pattern: add verification
meta tags for all in the layout:

```blade
{{-- resources/views/layouts/app.blade.php --}}
@if(config('services.google.search_console_verification'))
    <meta name="google-site-verification" content="{{ config('services.google.search_console_verification') }}">
@endif

@if(config('services.bing.webmaster_verification'))
    <meta name="msvalidate.01" content="{{ config('services.bing.webmaster_verification') }}">
@endif

@if(config('services.yandex.webmaster_verification'))
    <meta name="yandex-verification" content="{{ config('services.yandex.webmaster_verification') }}">
@endif
```

Or use DNS TXT records (cleaner, no meta tag pollution):

```
google-site-verification=...
msvalidate.01=...
yandex-verification=...
```

DNS verification covers the entire domain plus subdomains.

## Removing URLs from index

Sometimes you need to remove a URL from index quickly (legal issue, accidental
publication of private content).

### Google: URL Removal Tool

Search Console → Removals → Temporary Removals → Submit URL

**Temporary** (6 months) removal. To make it permanent:

1. Submit removal request
2. Ensure URL returns 404, 410, or has `noindex` meta tag
3. Once Google re-crawls and sees the status, the removal becomes effective

### Bing: URL Removal

Bing Webmaster Tools → Configure My Site → Block URLs

Same principle.

### What removal doesn't do

URL removal:

- Hides the URL from search results (temporary)
- Does NOT remove the page from your site
- Does NOT prevent crawling

For permanent removal, you must also make the page actually inaccessible
(404, 410, password protect, etc.).

## Common pitfalls

### Forgetting to update Search Console after migration

After a site migration (HTTP → HTTPS, www → non-www, domain change):

1. Add the NEW property in Search Console
2. Keep the OLD property (don't delete!) — it shows historical data
3. Use "Change of Address" tool to signal the move
4. Implement 301 redirects from old URLs to new URLs

### Multiple verification meta tags accidentally removed

If you remove verification meta tags from your layout, the next time Google
revalidates, you'll lose verification. Then your data access stops.

Use DNS TXT verification for stability.

### Sitemap URL using HTTP not HTTPS

After HTTPS migration, sometimes the sitemap submitted to Search Console
still uses `http://` URLs. Update the submitted URL to the HTTPS version.

### Different properties showing different data

The "Domain" property (DNS verification) shows all subdomains and protocols
combined. "URL prefix" properties show only the exact match. They will have
different numbers — that's expected, not a bug.

## Cross-references

- [Google Search Console (Cross-Cutting)](/seo/cross-cutting/google-search-console/) — deeper GSC guide
- [IndexNow](/seo/backend/indexnow-instant-indexing/) — instant indexing protocol
- [Sitemap (Backend)](/seo/backend/sitemap-backend/) — sitemap submission
- [Analytics vs Search Console](/seo/cross-cutting/analytics-vs-search-console/) — when to use which
