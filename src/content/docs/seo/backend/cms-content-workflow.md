---
title: CMS Content Workflow
description: Content lifecycle and SEO interaction
sidebar:
  order: 5
---

# CMS Content Workflow

How content moves through its lifecycle — and what happens to SEO at each
transition — affects long-term ranking stability. A well-designed CMS
workflow automates the SEO-correct response to every state change.

## Content lifecycle

```
[draft] → [scheduled] → [published] → [archived]
   ↓           ↓             ↓              ↓
private    private       indexable    301-redirect
404        404           in sitemap   or 410-Gone
```

State definitions:

- **draft** — work-in-progress. Not accessible publicly. Returns 404 if guessed.
- **scheduled** — final but not yet published. Same as draft until publish time.
- **published** — live, indexable, in sitemap.
- **archived** — removed from public navigation. Either 301-redirects to a
  relevant alternative, or 410-Gone if truly removed.

## State transitions and SEO actions

| Transition | SEO action |
|---|---|
| draft → scheduled | No public URL yet; no SEO action |
| scheduled → published | Add to sitemap, IndexNow notify, cache new URL, clear any redirect from old URL |
| published → archived (with replacement) | Remove from sitemap, create 301 redirect to replacement content |
| published → archived (no replacement) | Remove from sitemap, return 410 Gone |
| archived → published (rare) | Re-add to sitemap, remove any 301 redirect, IndexNow notify |
| Slug change | Auto-create 301 from old slug, IndexNow notify new slug |
| Title/description edit | No URL change; just IndexNow notify for refresh |
| Content edit | No URL change; update `dateModified` in Article schema |

## Per-content SEO fields

Every content piece needs editable SEO metadata:

```sql
ALTER TABLE pages ADD COLUMN seo_title VARCHAR(60) NULL;
ALTER TABLE pages ADD COLUMN seo_description VARCHAR(160) NULL;
ALTER TABLE pages ADD COLUMN seo_robots VARCHAR(50) DEFAULT 'index, follow';
ALTER TABLE pages ADD COLUMN og_image VARCHAR(500) NULL;
ALTER TABLE pages ADD COLUMN og_image_alt VARCHAR(255) NULL;
ALTER TABLE pages ADD COLUMN canonical_override VARCHAR(500) NULL;
ALTER TABLE pages ADD COLUMN priority DECIMAL(2,1) DEFAULT 0.5;
ALTER TABLE pages ADD COLUMN sitemap_changefreq VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE pages ADD COLUMN structured_data JSON NULL;
```

Field purposes:

- **seo_title**: override `<title>`. If empty, fall back to page title.
- **seo_description**: meta description. If empty, fall back to first paragraph excerpt.
- **seo_robots**: robots meta value. Default `index, follow`.
- **og_image**: per-page social sharing image. If empty, fall back to site default.
- **og_image_alt**: alt text for the OG image.
- **canonical_override**: explicit canonical URL. Usually empty (self-canonical).
- **priority**: sitemap priority. Default 0.5.
- **sitemap_changefreq**: sitemap changefreq hint.
- **structured_data**: JSON for custom Schema.org additions beyond the defaults.

## Filament SEO tab

In the page edit form, group SEO fields into a dedicated tab:

```php
// app/Filament/Resources/PageResource.php
use Filament\Forms\Components\Tabs;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\FileUpload;

Tabs::make('Page')
    ->tabs([
        Tabs\Tab::make('Content')
            ->schema([
                // ... main content fields
            ]),

        Tabs\Tab::make('SEO')
            ->schema([
                TextInput::make('seo_title')
                    ->label('SEO Title')
                    ->maxLength(60)
                    ->helperText('50-60 characters. Leave empty to use page title.')
                    ->live()
                    ->afterStateUpdated(function ($state, callable $set) {
                        $set('seo_title_length', strlen($state));
                    }),

                Textarea::make('seo_description')
                    ->label('Meta Description')
                    ->maxLength(160)
                    ->rows(3)
                    ->helperText('150-160 characters. Improves CTR.')
                    ->live(),

                Select::make('seo_robots')
                    ->label('Robots Directive')
                    ->options([
                        'index, follow' => 'Index, Follow (default)',
                        'noindex, follow' => 'No Index, Follow',
                        'noindex, nofollow' => 'No Index, No Follow (private)',
                    ])
                    ->default('index, follow'),

                FileUpload::make('og_image')
                    ->label('Social Sharing Image')
                    ->image()
                    ->imageResizeMode('cover')
                    ->imageCropAspectRatio('1200:630')
                    ->maxSize(5120)
                    ->directory('og-images')
                    ->helperText('1200×630 pixels recommended. JPG or PNG, under 5MB.'),

                TextInput::make('og_image_alt')
                    ->label('Image Alt Text')
                    ->maxLength(255)
                    ->helperText('Describes the image for accessibility.'),

                TextInput::make('canonical_override')
                    ->label('Canonical URL Override')
                    ->url()
                    ->helperText('Leave empty for self-canonical. Use only when needed.'),

                Select::make('priority')
                    ->label('Sitemap Priority')
                    ->options([
                        '1.0' => '1.0 (highest)',
                        '0.8' => '0.8 (high)',
                        '0.5' => '0.5 (medium, default)',
                        '0.3' => '0.3 (low)',
                    ])
                    ->default('0.5'),

                Select::make('sitemap_changefreq')
                    ->label('Sitemap Change Frequency')
                    ->options([
                        'daily' => 'Daily',
                        'weekly' => 'Weekly',
                        'monthly' => 'Monthly',
                        'yearly' => 'Yearly',
                    ])
                    ->default('monthly'),
            ]),

        Tabs\Tab::make('Settings')
            ->schema([
                // ... visibility, scheduling, etc.
            ]),
    ]);
```

## SERP Preview widget

Show editors how the page will appear in Google search results:

```php
// Custom Filament component
Forms\Components\View::make('filament.forms.serp-preview')
    ->viewData([
        'title' => fn (callable $get) => $get('seo_title') ?: $get('title'),
        'description' => fn (callable $get) => $get('seo_description'),
        'url' => fn (callable $get) => config('app.url') . '/' . $get('slug'),
    ]),
```

```blade
{{-- resources/views/filament/forms/serp-preview.blade.php --}}
<div class="serp-preview" style="max-width: 600px; font-family: arial, sans-serif;">
    <div class="serp-url" style="color: #006621; font-size: 14px;">
        {{ $url }}
    </div>
    <div class="serp-title" style="color: #1a0dab; font-size: 20px; margin: 4px 0;">
        {{ Str::limit($title, 60) }}
    </div>
    <div class="serp-description" style="color: #545454; font-size: 14px; line-height: 1.4;">
        {{ Str::limit($description, 160) }}
    </div>
</div>
```

This gives editors instant feedback on how their tweaks appear to users.

## Lifecycle event hooks

Implement state transitions as model events:

```php
// app/Models/Page.php
class Page extends Model
{
    protected $fillable = ['title', 'slug', 'content', 'status', 'published_at', /* ... */];

    protected static function booted()
    {
        // Auto-create redirect when slug changes
        static::updating(function (Page $page) {
            if ($page->isDirty('slug') && $page->getOriginal('slug')) {
                Redirect::updateOrCreate(
                    ['from_path' => '/' . $page->getOriginal('slug')],
                    ['to_path' => '/' . $page->slug, 'status_code' => 301]
                );
            }
        });

        // Notify search engines when content is published
        static::saved(function (Page $page) {
            if ($page->status === 'published' && $page->wasChanged('status')) {
                app(IndexNowService::class)->notify([url($page->slug)]);
                Cache::forget('sitemap');
            }
        });

        // Handle archive transitions
        static::updated(function (Page $page) {
            if ($page->wasChanged('status') && $page->status === 'archived') {
                // Decide: redirect to replacement, or 410?
                if ($page->replacement_page_id) {
                    $replacement = Page::find($page->replacement_page_id);
                    Redirect::updateOrCreate(
                        ['from_path' => '/' . $page->slug],
                        ['to_path' => '/' . $replacement->slug, 'status_code' => 301]
                    );
                } else {
                    // Mark for 410 Gone response
                    // (the controller checks this on request)
                }
                Cache::forget('sitemap');
            }
        });
    }
}
```

## Slug history table

When a slug changes, you have two options:

1. **Single redirect record** — simple, but loses history
2. **Slug history table** — preserves all old slugs ever used

The history approach:

```sql
CREATE TABLE page_slug_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    page_id INT NOT NULL,
    old_slug VARCHAR(500) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_old_slug (old_slug)
);
```

When the slug changes:

1. Insert into `page_slug_history` with the OLD slug
2. Update `pages.slug` to the new value
3. Middleware looks up requests against `page_slug_history` when no direct
   page matches; if found, 301-redirect to current slug

```php
// Middleware
class HandleSlugHistory
{
    public function handle($request, Closure $next)
    {
        $path = ltrim($request->path(), '/');

        // Try direct page match first
        if (Page::where('slug', $path)->exists()) {
            return $next($request);
        }

        // Check slug history
        $history = PageSlugHistory::where('old_slug', $path)->first();
        if ($history) {
            return redirect('/' . $history->page->slug, 301);
        }

        return $next($request);
    }
}
```

Benefit over a flat redirect table: when a slug changes multiple times
(`A` → `B` → `C`), you can either:

- Update all old-slug records to point to current (`A` → `C`, `B` → `C`)
- Or chain the redirects (which the slug-history pattern avoids automatically)

## Bulk SEO operations

For large sites, Filament should support bulk operations:

```php
Tables\Actions\BulkAction::make('updateRobots')
    ->label('Update Robots Directive')
    ->form([
        Select::make('seo_robots')
            ->options([
                'index, follow' => 'Index, Follow',
                'noindex, follow' => 'No Index',
                'noindex, nofollow' => 'No Index, No Follow',
            ])
            ->required(),
    ])
    ->action(function (Collection $records, array $data) {
        $records->each->update(['seo_robots' => $data['seo_robots']]);

        // Invalidate sitemap if noindex changes affected published pages
        Cache::forget('sitemap');

        // Notify IndexNow of changes
        $urls = $records->where('status', 'published')->map(fn($r) => url($r->slug))->toArray();
        app(IndexNowService::class)->notify($urls);
    }),
```

Use cases for bulk operations:

- Mark old blog category as noindex
- Change OG image after brand refresh
- Bulk-update canonical URLs after URL structure migration

## Editor guidance

A few in-CMS hints reduce SEO mistakes:

- **Character counters** on title and description fields (live feedback)
- **SERP preview** widget (shown above)
- **Image dimension validation** for OG images (1200×630)
- **Robots warning** when setting `noindex` on a published page
- **Redirect creation warning** when changing a published slug
- **Disable saving** if title or description is missing on a published page

## Cross-references

- [Slug Management](/seo/backend/slug-management/) — slug history details
- [Redirects](/seo/backend/redirects-301-302/) — implementation of auto-redirects
- [HTTP Status Codes](/seo/backend/http-status-codes/) — 410 vs 301 for archived content
- [IndexNow](/seo/backend/indexnow-instant-indexing/) — notifying search engines on content changes
- [Sitemap (Backend)](/seo/backend/sitemap-backend/) — including/excluding content from sitemap
