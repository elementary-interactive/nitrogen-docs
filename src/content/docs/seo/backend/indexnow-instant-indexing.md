---
title: IndexNow — Instant Indexing
description: Push URL updates to Bing, Yandex, Seznam instantly
sidebar:
  order: 13
---

# IndexNow — Instant Indexing

IndexNow is a protocol jointly developed by Microsoft (Bing) and Yandex,
later joined by Seznam (Czech Republic) and Naver (Korea). It lets you
push URL updates to participating search engines instantly — instead of
waiting for them to discover the changes via crawl.

**Important note:** Google does NOT support IndexNow as of 2026. Google
has its own (much more limited) Indexing API, restricted to JobPosting and
BroadcastEvent schemas. For general content, IndexNow benefits Bing,
Yandex, Seznam, but not Google directly.

That said, Bing covers a meaningful share (~5-10% of EU search traffic),
plus DuckDuckGo uses Bing's index, plus IndexNow takes ~5 minutes to
implement. ROI is excellent.

## How IndexNow works

1. You generate a random key (32-character hex string)
2. You publish a key verification file at `https://yoursite.com/{key}.txt` containing just the key
3. When content publishes or updates, your server sends a POST request to IndexNow:
   ```http
   POST /indexnow HTTP/1.1
   Host: api.indexnow.org
   Content-Type: application/json

   {
       "host": "example.com",
       "key": "abc123def456...",
       "keyLocation": "https://example.com/abc123def456....txt",
       "urlList": [
           "https://example.com/products/new-widget"
       ]
   }
   ```
4. Search engines verify the key file matches, then queue the URL for crawl/index

Participating engines: Bing, Yandex, Seznam, Naver (via the shared IndexNow API).

## Setup steps

### 1. Generate a key

```bash
# 32-character hex string
openssl rand -hex 16
# Example output: abc123def456789012345678901234ab
```

Store this in your environment configuration:

```bash
# .env
INDEXNOW_KEY=abc123def456789012345678901234ab
```

### 2. Publish the key verification file

Create a public file at `public/{key}.txt` containing just the key:

```bash
KEY="abc123def456789012345678901234ab"
echo "$KEY" > "public/$KEY.txt"
```

The file content is exactly the key, nothing else.

Verify it's accessible:

```bash
curl https://example.com/abc123def456789012345678901234ab.txt
# Should output the key
```

### 3. Configure the service

```php
// config/services.php
return [
    // ...
    'indexnow' => [
        'key' => env('INDEXNOW_KEY'),
        'endpoint' => 'https://api.indexnow.org/indexnow',
    ],
];
```

### 4. Create the service class

```php
// app/Services/IndexNowService.php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IndexNowService
{
    public function notify(array $urls): bool
    {
        if (empty($urls)) {
            return true;
        }

        if (count($urls) > 10000) {
            // IndexNow's batch limit
            $batches = array_chunk($urls, 10000);
            foreach ($batches as $batch) {
                $this->notify($batch);
            }
            return true;
        }

        $key = config('services.indexnow.key');
        $host = parse_url(config('app.url'), PHP_URL_HOST);

        try {
            $response = Http::timeout(10)
                ->post(config('services.indexnow.endpoint'), [
                    'host' => $host,
                    'key' => $key,
                    'keyLocation' => config('app.url') . "/{$key}.txt",
                    'urlList' => $urls,
                ]);

            if ($response->successful()) {
                Log::info('IndexNow notification sent', ['urls' => count($urls)]);
                return true;
            } else {
                Log::warning('IndexNow notification failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return false;
            }
        } catch (\Throwable $e) {
            Log::error('IndexNow notification error', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function notifyOne(string $url): bool
    {
        return $this->notify([$url]);
    }
}
```

## Hooking into content events

The natural place: model lifecycle hooks.

```php
// app/Models/Page.php
class Page extends Model
{
    protected static function booted()
    {
        // Notify on publish
        static::saved(function (Page $page) {
            if ($page->status === 'published' && $page->wasChanged('status')) {
                app(IndexNowService::class)->notifyOne(url($page->slug));
            }
        });

        // Notify on content update of published pages
        static::updated(function (Page $page) {
            $contentFields = ['title', 'content', 'seo_title', 'seo_description'];
            $changed = collect($contentFields)->some(fn($f) => $page->wasChanged($f));

            if ($page->status === 'published' && $changed) {
                app(IndexNowService::class)->notifyOne(url($page->slug));
            }
        });
    }
}
```

## Async dispatch

IndexNow API calls add latency to save operations. Dispatch asynchronously:

```php
// app/Jobs/NotifyIndexNow.php
namespace App\Jobs;

use App\Services\IndexNowService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class NotifyIndexNow implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public array $urls) {}

    public function handle(IndexNowService $service): void
    {
        $service->notify($this->urls);
    }

    public int $tries = 3;
    public int $backoff = 60;
}
```

Then dispatch from the model hook:

```php
static::saved(function (Page $page) {
    if ($page->status === 'published' && $page->wasChanged('status')) {
        NotifyIndexNow::dispatch([url($page->slug)])
            ->afterResponse();
    }
});
```

`afterResponse()` (Laravel 8+) runs the job after the HTTP response is sent
to the user, so save operations don't block on the API call.

## Bulk notification

For migrations or bulk operations:

```php
// Console command: php artisan indexnow:notify-all
class NotifyAllPages extends Command
{
    protected $signature = 'indexnow:notify-all {--chunk=100}';

    public function handle(IndexNowService $service)
    {
        $chunk = (int) $this->option('chunk');
        $totalNotified = 0;

        Page::where('status', 'published')
            ->chunk($chunk, function ($pages) use ($service, &$totalNotified) {
                $urls = $pages->map(fn ($p) => url($p->slug))->toArray();
                $service->notify($urls);
                $totalNotified += count($urls);
                $this->info("Notified {$totalNotified} URLs so far");
                sleep(2);  // Rate limit courtesy
            });

        $this->info("Done. Total notified: {$totalNotified}");
    }
}
```

## Batching strategy

If you're publishing many pages simultaneously (e.g., bulk content import),
batch them into a single IndexNow request:

```php
// Collect URLs during the import
$urls = [];
foreach ($csv_rows as $row) {
    $page = Page::create($row);
    if ($page->status === 'published') {
        $urls[] = url($page->slug);
    }
}

// Single batch notification at the end
if (!empty($urls)) {
    app(IndexNowService::class)->notify($urls);
}
```

IndexNow accepts up to 10,000 URLs per request. Above that, chunk.

## Monitoring

Track IndexNow calls in your application logs:

```php
// In IndexNowService::notify()
Log::info('IndexNow notification', [
    'urls' => $urls,
    'count' => count($urls),
    'response_status' => $response->status(),
    'response_time_ms' => $response->transferStats?->getTransferTime() * 1000,
]);
```

Build a Filament widget to show recent IndexNow activity:

- Total notifications today
- Success/failure rate
- Recently notified URLs

## What IndexNow does NOT do

IndexNow only **notifies search engines that a URL exists or changed**. It
doesn't:

- Guarantee indexing (search engines still decide based on quality, crawl budget, etc.)
- Index Google content (Google doesn't support IndexNow)
- Replace good content (poor content stays poor, faster discovery doesn't help)
- Replace sitemaps (use both — they complement each other)

## Response codes

| Code | Meaning |
|---|---|
| 200 OK | URLs accepted |
| 202 Accepted | URLs queued (some search engines respond async) |
| 400 Bad Request | Malformed JSON |
| 403 Forbidden | Key file verification failed |
| 422 Unprocessable | Invalid URLs in list |
| 429 Too Many Requests | Rate limited |

Most failures resolve themselves with retry. Persistent 403 means the key
file is misconfigured.

## Verification that it's working

Bing Webmaster Tools → Configure My Site → IndexNow shows:

- Recent notifications received
- Indexed URLs from notifications
- Notification source (the IP/domain that submitted)

After a few publish-and-notify cycles, you should see your URLs appearing
in the "indexed URLs" list within hours (compared to days/weeks for crawl
discovery).

## Cross-references

- [Search Engine Integration](/seo/backend/search-engine-integration/) — Bing Webmaster setup
- [CMS Content Workflow](/seo/backend/cms-content-workflow/) — when to notify
- [Sitemap (Backend)](/seo/backend/sitemap-backend/) — sitemap complement to IndexNow
- [Crawl Budget](/seo/backend/crawl-budget/) — IndexNow's role in crawl efficiency
