---
title: Redirects (301/302)
description: Implementation and management of redirects
sidebar:
  order: 3
---

# Redirects (301/302)

This page covers implementation. For the conceptual distinction between
status codes, see [HTTP Status Codes](/seo/backend/http-status-codes/).

## When to use which

- **301 (permanent)**: new URL is permanent — `/old-product` → `/new-product`
- **302 (temporary)**: temporary — `/checkout` → `/login` (if not authenticated)
- **307/308**: API contexts where HTTP method must be preserved

In practice for SEO: **301 is correct in ~95% of cases.**

## Implementation: Laravel

### Route-level redirect

```php
// routes/web.php

// Simple permanent redirect
Route::redirect('/old-url', '/new-url', 301);

// With wildcard
Route::redirect('/old-blog/{slug}', '/blog/{slug}', 301);

// In a controller
return redirect('/new-url', 301);

// With more control
return redirect()->to('/new-url', 301);

// Named route
return redirect()->route('home', [], 301);
```

### Apache .htaccess

```apache
# Simple redirect
Redirect 301 /old-url /new-url

# Pattern-based with RedirectMatch
RedirectMatch 301 ^/products/(.*)$ /shop/$1

# Or with mod_rewrite
RewriteEngine On
RewriteRule ^old-page$ /new-page [R=301,L]
RewriteRule ^products/(.*)$ /shop/$1 [R=301,L]
```

### Nginx (recommended over PHP-level)

```nginx
# Simple exact match
location = /old-url {
    return 301 /new-url;
}

# Pattern-based
location ~* ^/products/(.*)$ {
    return 301 /shop/$1;
}

# Domain-level redirect (www to non-www)
server {
    listen 80;
    server_name www.example.com;
    return 301 https://example.com$request_uri;
}

# Force HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

Nginx-level redirects are faster than application-level (no PHP overhead).
Use for high-traffic redirects.

## CMS-managed redirect table

Static redirect rules are fine for known URLs. For dynamic redirects (CMS
slug changes, content migrations, bulk imports), use a database table.

### Schema

```sql
CREATE TABLE redirects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_path VARCHAR(500) NOT NULL,
    to_path VARCHAR(500) NOT NULL,
    status_code SMALLINT DEFAULT 301,
    hit_count INT DEFAULT 0,
    last_hit_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_from (from_path),
    INDEX idx_from (from_path),
    INDEX idx_to (to_path)
);
```

The `hit_count` and `last_hit_at` are for analytics — see how much traffic
old URLs still receive (indicates if backlinks are still active).

### Middleware

```php
// app/Http/Middleware/HandleRedirects.php
namespace App\Http\Middleware;

use App\Models\Redirect;
use Closure;
use Illuminate\Http\Request;

class HandleRedirects
{
    public function handle(Request $request, Closure $next)
    {
        $path = '/' . trim($request->path(), '/');

        $redirect = Redirect::where('from_path', $path)->first();

        if ($redirect) {
            // Track hits asynchronously to avoid blocking response
            dispatch(function () use ($redirect) {
                $redirect->increment('hit_count');
                $redirect->update(['last_hit_at' => now()]);
            })->afterResponse();

            return redirect($redirect->to_path, $redirect->status_code);
        }

        return $next($request);
    }
}
```

Register in `app/Http/Kernel.php` early in the middleware stack:

```php
protected $middleware = [
    // ... other middleware
    \App\Http\Middleware\HandleRedirects::class,
];
```

Important: register **before** the 404 handling middleware so redirects
take precedence over fallback 404s.

## Slug change automation

When a content item's slug changes, automatically create a redirect from
the old URL to the new one.

```php
// app/Models/Page.php
use App\Models\Redirect;

class Page extends Model
{
    protected static function booted()
    {
        static::updating(function (Page $page) {
            if ($page->isDirty('slug') && $page->getOriginal('slug')) {
                $oldPath = '/' . $page->getOriginal('slug');
                $newPath = '/' . $page->slug;

                // Use updateOrCreate to handle case where redirect already exists
                Redirect::updateOrCreate(
                    ['from_path' => $oldPath],
                    ['to_path' => $newPath, 'status_code' => 301]
                );

                // Also update any existing redirects pointing TO the old path
                // (prevents chains)
                Redirect::where('to_path', $oldPath)
                    ->update(['to_path' => $newPath]);
            }
        });
    }
}
```

The "update existing redirects pointing TO the old path" step prevents
chain redirects: if `/a` → `/b` and now `/b` → `/c`, the first redirect
becomes `/a` → `/c` directly.

## Bulk import

For site migrations, import redirects from CSV:

```php
// console command: php artisan redirects:import storage/redirects.csv
class ImportRedirects extends Command
{
    protected $signature = 'redirects:import {file}';

    public function handle()
    {
        $file = fopen($this->argument('file'), 'r');
        $count = 0;

        // Skip header row if present
        $header = fgetcsv($file);

        while (($row = fgetcsv($file)) !== false) {
            [$from, $to, $status] = array_pad($row, 3, null);

            Redirect::updateOrCreate(
                ['from_path' => $from],
                [
                    'to_path' => $to,
                    'status_code' => $status ?: 301,
                ]
            );
            $count++;
        }

        fclose($file);
        $this->info("Imported $count redirects");
    }
}
```

CSV format:

```csv
from_path,to_path,status_code
/old-products,/shop,301
/old-blog/post-name,/blog/new-post-name,301
/temporary-page,/home,302
```

## Filament admin for redirects

```php
// app/Filament/Resources/RedirectResource.php
class RedirectResource extends Resource
{
    protected static ?string $model = Redirect::class;

    public static function form(Form $form): Form
    {
        return $form->schema([
            TextInput::make('from_path')
                ->required()
                ->maxLength(500)
                ->unique(ignoreRecord: true)
                ->helperText('e.g., /old-product (include leading slash)'),

            TextInput::make('to_path')
                ->required()
                ->maxLength(500)
                ->helperText('e.g., /new-product or absolute URL'),

            Select::make('status_code')
                ->options([
                    301 => '301 - Permanent',
                    302 => '302 - Temporary',
                    307 => '307 - Temporary (preserve method)',
                    308 => '308 - Permanent (preserve method)',
                    410 => '410 - Gone (no redirect)',
                ])
                ->default(301)
                ->required(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('from_path')->searchable(),
                TextColumn::make('to_path')->searchable(),
                BadgeColumn::make('status_code')
                    ->colors([
                        'success' => 301,
                        'warning' => 302,
                        'danger' => 410,
                    ]),
                TextColumn::make('hit_count')->sortable(),
                TextColumn::make('last_hit_at')->sortable()->dateTime(),
                TextColumn::make('created_at')->sortable()->dateTime(),
            ])
            ->defaultSort('hit_count', 'desc')
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->headerActions([
                Tables\Actions\Action::make('import')
                    ->label('Import CSV')
                    ->action(function () {
                        // CSV import logic
                    }),
            ]);
    }
}
```

The default sort by `hit_count` desc shows which redirects are most active
— useful for prioritizing cleanup work.

## Testing redirects

```bash
# Single redirect check
curl -I https://example.com/old-url
# Expected: HTTP/2 301

# Follow redirect chain
curl -I -L https://example.com/old-url
# Shows full chain

# Verify final destination
curl -I -L -o /dev/null -s -w "%{http_code} %{url_effective}\n" https://example.com/old-url
```

For bulk testing:

```bash
# redirects-test.txt with one URL per line
while read url; do
    final=$(curl -I -L -o /dev/null -s -w "%{http_code} %{url_effective}" "$url")
    echo "$url → $final"
done < redirects-test.txt
```

## Performance considerations

- **Cache redirect lookups** — if you have hundreds of redirects, Redis cache
  reduces DB hits:

```php
$redirect = Cache::remember(
    "redirect:{$path}",
    3600,
    fn() => Redirect::where('from_path', $path)->first()
);
```

- **Index `from_path`** — already in the schema above, but verify it's used:

```sql
EXPLAIN SELECT * FROM redirects WHERE from_path = '/some-url';
-- Should show "index" in the type column
```

- **Move static redirects to Nginx** — for the highest-traffic redirects
  (e.g., `/old-homepage` → `/`), put them in Nginx config instead of the
  application:

```nginx
location = /old-homepage {
    return 301 /;
}
```

## Cross-references

- [HTTP Status Codes](/seo/backend/http-status-codes/) — conceptual differences
- [Slug Management](/seo/backend/slug-management/) — slug-change-driven redirects
- [CMS Content Workflow](/seo/backend/cms-content-workflow/) — content lifecycle and redirects
- [Crawl Budget](/seo/backend/crawl-budget/) — redirect chains hurt crawl efficiency
