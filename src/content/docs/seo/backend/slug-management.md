---
title: Slug Management
description: Slug history, automated redirects, and URL stability
sidebar:
  order: 6
---

# Slug Management

The slug is the URL-safe identifier for a piece of content. Once published,
the slug becomes part of the URL contract with users, search engines, and
external sites linking to your content. Changing it has cost.

## Slug generation

Auto-generate from title, with manual override:

```php
// app/Models/Page.php
use Illuminate\Support\Str;

class Page extends Model
{
    protected static function booted()
    {
        static::saving(function (Page $page) {
            if (empty($page->slug) && !empty($page->title)) {
                $page->slug = static::generateUniqueSlug($page->title);
            }
        });
    }

    protected static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $slug = Str::slug($title);
        $original = $slug;
        $counter = 1;

        while (static::slugExists($slug, $ignoreId)) {
            $slug = $original . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    protected static function slugExists(string $slug, ?int $ignoreId): bool
    {
        return static::query()
            ->where('slug', $slug)
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->exists();
    }
}
```

## Slug rules

- **Lowercase, ASCII-only** — transliterate accented characters
- **Hyphen-separated** — no spaces, no underscores
- **Unique within scope** — enforced at DB level
- **Stable** — once published, treat as immutable (changing has cost)
- **Concise** — under 60 characters typically

Laravel's `Str::slug()` handles most cases:

```php
Str::slug('How To Set Up Server-Side GTM In 2026!');
// "how-to-set-up-server-side-gtm-in-2026"

Str::slug('Új termékünk, az ŐKO 2026');
// "uj-termekunk-az-oko-2026"
```

For Hungarian transliteration, Laravel uses `iconv` under the hood. Custom
transliteration:

```php
Str::slug($title, '-', 'hu');
// Honors Hungarian transliteration rules where applicable
```

## Slug history pattern

When a published slug changes, you need to:

1. Update the page's current slug
2. Record the old slug in history
3. Make the old slug redirect to the new slug
4. Notify search engines

### Schema

```sql
CREATE TABLE page_slug_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    page_id INT NOT NULL,
    old_slug VARCHAR(500) NOT NULL,
    full_path VARCHAR(500) NOT NULL,  -- includes parent path if hierarchical
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_old_slug (old_slug),
    INDEX idx_full_path (full_path)
);
```

The `full_path` is critical for hierarchical content. For `/services/web-development`,
when the slug changes from `web-development` to `web-dev`, the old `full_path`
is `/services/web-development` regardless of how the parent is structured.

### Model hook

```php
// app/Models/Page.php
class Page extends Model
{
    protected static function booted()
    {
        static::updating(function (Page $page) {
            if ($page->isDirty('slug') && $page->getOriginal('slug')) {
                static::recordSlugHistory($page);
            }
        });
    }

    protected static function recordSlugHistory(Page $page): void
    {
        // Compute old full path (with parent if hierarchical)
        $oldFullPath = $page->parent_id
            ? $page->parent->full_path . '/' . $page->getOriginal('slug')
            : '/' . $page->getOriginal('slug');

        PageSlugHistory::create([
            'page_id' => $page->id,
            'old_slug' => $page->getOriginal('slug'),
            'full_path' => $oldFullPath,
            'changed_at' => now(),
        ]);
    }

    public function getFullPathAttribute(): string
    {
        if ($this->parent_id) {
            return $this->parent->full_path . '/' . $this->slug;
        }
        return '/' . $this->slug;
    }

    public function slugHistory()
    {
        return $this->hasMany(PageSlugHistory::class);
    }
}
```

### Resolving requests with history

```php
// app/Http/Middleware/ResolveSlugHistory.php
class ResolveSlugHistory
{
    public function handle(Request $request, Closure $next)
    {
        $path = '/' . trim($request->path(), '/');

        // First, try direct page match
        $page = Page::where('slug', $this->lastSegment($path))
            ->whereRaw('full_path = ?', [$path])
            ->first();

        if ($page) {
            return $next($request);
        }

        // Look up in slug history
        $history = PageSlugHistory::where('full_path', $path)
            ->with('page')
            ->first();

        if ($history && $history->page) {
            // Notify of access to old slug (for analytics)
            event(new OldSlugAccessed($history));

            return redirect($history->page->full_path, 301);
        }

        return $next($request);
    }

    protected function lastSegment(string $path): string
    {
        return last(explode('/', trim($path, '/')));
    }
}
```

Register early in the middleware stack so it runs before route resolution.

## Chain prevention

When a slug changes multiple times, the slug history pattern prevents chains:

```
v1: slug = "old-product"
v2: slug = "old-product-v2"
v3: slug = "current-product"
```

After all three changes, three rows exist in `page_slug_history`:
- `old-product` → page_id 1
- `old-product-v2` → page_id 1

Any request to either old slug resolves directly to `current-product` (the
current slug). No chains.

Compare to a redirect-table approach:
- Initially: `old-product` → `old-product-v2`
- Then: `old-product-v2` → `current-product`
- Chain! Request to `old-product` goes through two redirects.

The slug history pattern avoids this automatically.

## Slug uniqueness scopes

For hierarchical content, slugs are unique within their parent:

```
/services/web-development        (slug: web-development under parent: services)
/blog/web-development             (slug: web-development under parent: blog)
```

Both are valid because the parent is different. The DB constraint should
reflect this:

```sql
ALTER TABLE pages ADD UNIQUE KEY uq_slug_parent (slug, parent_id);
```

For flat sites (all top-level), slug is globally unique:

```sql
ALTER TABLE pages ADD UNIQUE KEY uq_slug (slug);
```

## Multilingual slug strategies

For multilingual sites, choices:

### 1. Same slug across languages

```
/en/services/web-development
/hu/services/web-development
/de/services/web-development
```

**Pros:** Simple. Translation table relates pages by ID.
**Cons:** Hungarian/German users see English in URL.

### 2. Translated slugs

```
/en/services/web-development
/hu/szolgaltatasok/webfejlesztes
/de/dienstleistungen/webentwicklung
```

**Pros:** Localized URLs better in local search.
**Cons:** Complex management, more redirects needed.

For Nitrogen B2B sites, **same slug across languages is default**. Translation
is per-content (title, body), not per-slug.

If translated slugs are needed, the schema must accommodate:

```sql
CREATE TABLE pages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NULL,
    slug VARCHAR(500),
    locale VARCHAR(5),
    title VARCHAR(500),
    -- ...
    UNIQUE KEY uq_slug_locale_parent (slug, locale, parent_id)
);
```

## Editor warnings

When an editor attempts to change a published slug, Filament should warn:

```php
TextInput::make('slug')
    ->required()
    ->rules(['alpha_dash'])
    ->live()
    ->afterStateUpdated(function ($state, callable $set, $record) {
        if ($record && $record->status === 'published' && $record->slug !== $state) {
            Notification::make()
                ->warning()
                ->title('Slug change will create a redirect')
                ->body("The old slug '{$record->slug}' will 301-redirect to the new slug. Existing inbound links should still work, but consider whether this change is necessary.")
                ->send();
        }
    });
```

## Verification

Periodically check for slug-history issues:

```php
// Check for slug-history records pointing to deleted pages
PageSlugHistory::whereDoesntHave('page')->get();

// Check for chains (slug history pointing to a slug that also has history)
DB::table('page_slug_history as h1')
    ->join('page_slug_history as h2', 'h1.page_id', '=', 'h2.page_id')
    ->where('h1.changed_at', '<', DB::raw('h2.changed_at'))
    ->select('h1.*', 'h2.old_slug as later_slug')
    ->get();
```

## Cross-references

- [Redirects](/seo/backend/redirects-301-302/) — redirect table approach (alternative)
- [URL Structure](/seo/frontend/url-structure/) — slug format rules
- [CMS Content Workflow](/seo/backend/cms-content-workflow/) — when slugs change
- [Multilingual Routing](/seo/backend/multilingual-routing/) — slug strategies per language
