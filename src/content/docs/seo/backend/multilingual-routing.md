---
title: Multilingual Routing
description: Server-side i18n for SEO
sidebar:
  order: 9
---

# Multilingual Routing

For Nitrogen sites in Hungary + EU markets, multilingual support (HU + EN
typically) is standard. Routing decisions affect SEO heavily — incorrect
locale detection or URL structure can devastate rankings in the secondary
language.

## URL structure choice

See [URL Structure](/seo/frontend/url-structure/) and [Hreflang](/seo/frontend/hreflang-multilingual/)
for the conceptual discussion. For Nitrogen sites, **subdirectory pattern**
is the default:

```
example.com/         (English default, no prefix)
example.com/hu/      (Hungarian)
example.com/de/      (German)
```

This page covers the Laravel-side implementation.

## Laravel routing

```php
// routes/web.php

// English (default, no prefix)
Route::get('/', [HomeController::class, 'index']);
Route::get('/about', [PageController::class, 'about']);
Route::get('/services/{slug}', [PageController::class, 'service']);

// Localized routes with prefix
Route::prefix('{locale}')
    ->where(['locale' => 'hu|de'])
    ->middleware('set-locale')
    ->group(function () {
        Route::get('/', [HomeController::class, 'index']);
        Route::get('/about', [PageController::class, 'about']);
        Route::get('/services/{slug}', [PageController::class, 'service']);
    });
```

The constraint `where(['locale' => 'hu|de'])` ensures only valid locales
match — any other prefix falls through to 404.

## SetLocale middleware

```php
// app/Http/Middleware/SetLocale.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class SetLocale
{
    protected array $supported = ['en', 'hu', 'de'];

    public function handle(Request $request, Closure $next)
    {
        $locale = $this->detectLocale($request);
        App::setLocale($locale);

        // Make locale available to views
        view()->share('currentLocale', $locale);

        return $next($request);
    }

    protected function detectLocale(Request $request): string
    {
        // 1. URL prefix (highest priority — explicit user choice)
        $urlLocale = $request->route('locale');
        if ($urlLocale && in_array($urlLocale, $this->supported)) {
            return $urlLocale;
        }

        // 2. Cookie (returning user's preference)
        $cookieLocale = $request->cookie('locale');
        if ($cookieLocale && in_array($cookieLocale, $this->supported)) {
            return $cookieLocale;
        }

        // 3. Accept-Language header (browser preference)
        // Only used as fallback for the default URL, NEVER overrides URL prefix
        $browserLocale = $this->parseAcceptLanguage($request);
        if ($browserLocale && in_array($browserLocale, $this->supported)) {
            return $browserLocale;
        }

        // 4. Default
        return config('app.fallback_locale', 'en');
    }

    protected function parseAcceptLanguage(Request $request): ?string
    {
        $header = $request->header('Accept-Language');
        if (!$header) {
            return null;
        }

        // Parse "hu-HU,hu;q=0.9,en;q=0.8"
        $languages = explode(',', $header);
        foreach ($languages as $lang) {
            $code = trim(explode(';', $lang)[0]);
            $base = explode('-', $code)[0];  // "hu-HU" → "hu"
            if (in_array($base, $this->supported)) {
                return $base;
            }
        }

        return null;
    }
}
```

## Critical SEO rule: never auto-redirect based on Accept-Language

A common mistake: a user lands on `example.com/about` (English page) but
their browser is set to Hungarian, so the server redirects to `/hu/about`.

**This is wrong** because:

1. Googlebot crawls from US locations with `Accept-Language: en` headers.
   If you redirect non-EN users away, you've created a one-way trap for
   Hungarian users sharing links.
2. The user explicitly visited the English URL (e.g., from a link). Overriding
   that is hostile UX.
3. Search Console treats Accept-Language-based redirects as suspicious.

**Correct behavior:**

- Accept-Language is **only** used to choose locale on the root path (`/`)
  when no cookie is set
- Once on a localized URL, never redirect to a different locale
- Users explicitly choose locale via the language switcher (which sets a cookie)

## CMS-stored translations

```sql
CREATE TABLE pages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(500) NOT NULL,
    locale VARCHAR(5) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content LONGTEXT,
    parent_page_id INT NULL,   -- the "main" translation source
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    UNIQUE KEY uq_slug_locale (slug, locale),
    INDEX idx_parent (parent_page_id),
    FOREIGN KEY (parent_page_id) REFERENCES pages(id) ON DELETE SET NULL
);
```

`parent_page_id` enables the hreflang group: every translation links to a
"main" page, and from there you can iterate all available languages.

### Identifying translation groups

```php
// app/Models/Page.php
class Page extends Model
{
    public function translationParent()
    {
        return $this->belongsTo(Page::class, 'parent_page_id');
    }

    public function translations()
    {
        return $this->hasMany(Page::class, 'parent_page_id');
    }

    public function allTranslations()
    {
        // The "main" page plus all its translations
        $rootId = $this->parent_page_id ?? $this->id;

        return Page::where('id', $rootId)
            ->orWhere('parent_page_id', $rootId)
            ->where('status', 'published')
            ->get();
    }
}
```

### Hreflang generation

```php
public function generateHreflangs(Page $page): array
{
    return $page->allTranslations()
        ->map(function (Page $translation) {
            return [
                'lang' => $translation->locale,
                'url' => $this->buildUrl($translation),
            ];
        })
        ->toArray();
}

protected function buildUrl(Page $page): string
{
    if ($page->locale === config('app.fallback_locale')) {
        return url($page->slug);  // no prefix for default locale
    }
    return url("{$page->locale}/{$page->slug}");
}
```

Render in Blade:

```blade
@php
    $hreflangs = app(\App\Services\HreflangService::class)->generateHreflangs($page);
@endphp

@foreach($hreflangs as $hreflang)
    <link rel="alternate" hreflang="{{ $hreflang['lang'] }}" href="{{ $hreflang['url'] }}">
@endforeach
<link rel="alternate" hreflang="x-default" href="{{ url($page->slug) }}">
```

## Language switcher

When the user clicks a language switcher, find the translation and redirect:

```php
// app/Http/Controllers/LocaleController.php
class LocaleController extends Controller
{
    public function switch(Request $request, string $locale)
    {
        if (!in_array($locale, ['en', 'hu', 'de'])) {
            abort(404);
        }

        $previousUrl = $request->session()->previousUrl();
        $previousPath = parse_url($previousUrl, PHP_URL_PATH) ?? '/';

        // Try to find the equivalent page in the new locale
        $targetUrl = $this->findEquivalent($previousPath, $locale);

        return redirect($targetUrl)
            ->cookie('locale', $locale, 60 * 24 * 365);  // 1 year
    }

    protected function findEquivalent(string $path, string $locale): string
    {
        // Strip locale prefix from path
        $cleanPath = preg_replace('#^/(hu|de)/#', '/', $path);
        $slug = trim($cleanPath, '/');

        // Find the page by slug (in default locale)
        $page = Page::where('slug', $slug)
            ->where('locale', config('app.fallback_locale'))
            ->first();

        if (!$page) {
            // No page found, just go to homepage in new locale
            return $locale === 'en' ? '/' : "/{$locale}";
        }

        // Find translation in target locale
        $translation = $page->translations()
            ->where('locale', $locale)
            ->where('status', 'published')
            ->first();

        if ($translation) {
            return $locale === 'en'
                ? '/' . $translation->slug
                : "/{$locale}/" . $translation->slug;
        }

        // No translation exists, return to root in target locale
        return $locale === 'en' ? '/' : "/{$locale}";
    }
}
```

## Filament admin for translations

In the page edit form, show the translation status:

```php
// app/Filament/Resources/PageResource.php
Forms\Components\Section::make('Translations')
    ->schema([
        Forms\Components\Placeholder::make('translations_status')
            ->content(function (Page $record) {
                $existing = $record->translations->pluck('locale')->toArray();
                $missing = array_diff(['en', 'hu', 'de'], $existing);
                $missing = array_diff($missing, [$record->locale]);  // exclude self

                $existingHtml = collect($existing)
                    ->map(fn($l) => "<span style='color:green'>✓ {$l}</span>")
                    ->implode(', ');

                $missingHtml = collect($missing)
                    ->map(fn($l) => "<span style='color:red'>✗ {$l}</span>")
                    ->implode(', ');

                return new \Illuminate\Support\HtmlString("Existing: {$existingHtml}<br>Missing: {$missingHtml}");
            }),

        Forms\Components\Actions::make([
            Forms\Components\Actions\Action::make('createTranslation')
                ->label('Create Hungarian translation')
                ->action(function (Page $record) {
                    $translation = $record->replicate();
                    $translation->locale = 'hu';
                    $translation->parent_page_id = $record->id;
                    $translation->status = 'draft';
                    $translation->title = '[HU] ' . $record->title;
                    $translation->save();

                    return redirect()->to(PageResource::getUrl('edit', ['record' => $translation]));
                })
                ->visible(fn (Page $record) => !$record->translations()->where('locale', 'hu')->exists()),
        ]),
    ]);
```

This gives editors a clear view of which translations exist and easy creation
of missing ones.

## Configuration

```php
// config/app.php
'locale' => env('APP_LOCALE', 'en'),
'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),
'supported_locales' => ['en', 'hu', 'de'],
```

```php
// config/translatable.php — if using spatie/laravel-translatable
return [
    'fallback_locale' => 'en',
    'locales' => ['en', 'hu', 'de'],
];
```

## Cross-references

- [Hreflang for Multilingual Sites](/seo/frontend/hreflang-multilingual/) — frontend annotation
- [URL Structure](/seo/frontend/url-structure/) — URL design for multilingual
- [Slug Management](/seo/backend/slug-management/) — per-locale slug strategies
- [CMS Content Workflow](/seo/backend/cms-content-workflow/) — managing translated content
