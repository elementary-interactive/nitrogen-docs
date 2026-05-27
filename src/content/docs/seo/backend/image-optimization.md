---
title: Image Optimization
description: Server-side image processing for SEO
sidebar:
  order: 7
---

# Image Optimization

Images often dominate page weight. Proper optimization affects LCP (a Core
Web Vital), mobile data costs, and image search ranking. The backend's job
is to convert, resize, and serve images optimally.

## Multi-size + multi-format strategy

Backend responsibilities for every uploaded image:

1. **Accept original** (any common format: JPG, PNG, HEIC, etc.)
2. **Strip EXIF data** (GPS coordinates, camera details — privacy + size)
3. **Convert to modern formats**: WebP and AVIF
4. **Generate multiple sizes**: 480w, 768w, 1200w, 1920w
5. **Push to CDN** (optional but recommended)

The frontend serves the right format and size via `<picture>` and `srcset`.
See [Performance & CWV](/seo/frontend/performance-core-web-vitals/) for the
HTML pattern.

## Laravel with Intervention Image v3

```bash
composer require intervention/image
```

```php
use Intervention\Image\Laravel\Facades\Image;

class ImageProcessor
{
    public function process(string $originalPath, string $basename): array
    {
        $image = Image::read($originalPath);

        // Strip EXIF
        $image->orient();  // applies orientation from EXIF, then strips it

        $sizes = [480, 768, 1200, 1920];
        $formats = ['webp', 'avif', 'jpg'];
        $output = [];

        foreach ($sizes as $width) {
            $resized = clone $image;
            $resized->scale(width: $width);

            foreach ($formats as $format) {
                $filename = "{$basename}-{$width}.{$format}";
                $path = storage_path("app/public/images/{$filename}");
                $quality = $format === 'avif' ? 60 : 85;
                $resized->encode("image/{$format}", $quality)->save($path);
                $output["{$width}-{$format}"] = $filename;
            }
        }

        return $output;
    }
}
```

## Spatie Media Library (preferred for Nitrogen)

```bash
composer require spatie/laravel-medialibrary
```

Define media conversions in the model:

```php
// app/Models/Page.php
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Page extends Model implements HasMedia
{
    use InteractsWithMedia;

    public function registerMediaConversions(?Media $media = null): void
    {
        // Open Graph image
        $this->addMediaConversion('og')
            ->width(1200)
            ->height(630)
            ->format('webp')
            ->quality(85);

        // Hero image at multiple sizes
        $this->addMediaConversion('hero-1200')
            ->width(1200)
            ->format('webp')
            ->quality(85);

        $this->addMediaConversion('hero-1200-avif')
            ->width(1200)
            ->format('avif')
            ->quality(60);

        $this->addMediaConversion('hero-768')
            ->width(768)
            ->format('webp')
            ->quality(80);

        // Thumbnail
        $this->addMediaConversion('thumb')
            ->width(400)
            ->height(300)
            ->format('webp')
            ->fit(\Spatie\Image\Enums\Fit::Crop);
    }
}
```

Usage:

```php
// Upload
$page->addMedia($request->file('image'))
    ->toMediaCollection('hero');

// Retrieve
$heroUrl = $page->getFirstMediaUrl('hero', 'hero-1200');
$heroAvifUrl = $page->getFirstMediaUrl('hero', 'hero-1200-avif');
```

## Frontend HTML output (rendered server-side)

```blade
{{-- resources/views/components/responsive-image.blade.php --}}
@props(['media', 'alt'])

<picture>
    <source
        srcset="{{ $media->getUrl('hero-1200-avif') }} 1200w,
                {{ $media->getUrl('hero-768-avif') }} 768w"
        type="image/avif"
        sizes="(max-width: 768px) 100vw, 1200px"
    >
    <source
        srcset="{{ $media->getUrl('hero-1200') }} 1200w,
                {{ $media->getUrl('hero-768') }} 768w"
        type="image/webp"
        sizes="(max-width: 768px) 100vw, 1200px"
    >
    <img
        src="{{ $media->getUrl('hero-1200') }}"
        alt="{{ $alt }}"
        width="1200"
        height="800"
        loading="lazy"
        decoding="async"
    >
</picture>
```

For above-the-fold images (hero, LCP candidate):

```blade
<img
    src="..."
    alt="..."
    width="1200"
    height="800"
    loading="eager"
    fetchpriority="high"
    decoding="async"
>
```

## Alt text — required field

In Filament admin, alt text must be required:

```php
SpatieMediaLibraryFileUpload::make('hero')
    ->collection('hero')
    ->image()
    ->responsiveImages()
    ->maxSize(10240)
    ->required()
    ->customProperties(fn () => [
        'alt' => '',  // editor must fill this
    ])
    ->customPropertiesSchema([
        TextInput::make('alt')
            ->required()
            ->maxLength(255)
            ->helperText('Describes the image for screen readers and image search.'),
    ]);
```

Alt text guidelines (covered in detail in [Accessibility = SEO](/seo/frontend/accessibility-seo/)):

- Describe the content, not the appearance
- Don't start with "Image of..."
- Concise (~125 characters)
- Empty `alt=""` for purely decorative images

## EXIF stripping (mandatory)

Original photos often contain EXIF metadata: GPS coordinates, camera model,
shooting date, photographer name. Strip on upload:

```php
// Intervention Image v3 — orient() applies EXIF rotation then strips it
$image->orient();
```

For Spatie Media Library, EXIF is stripped automatically by default during
conversions.

Why mandatory:

- **Privacy**: GPS coordinates in user-uploaded photos can leak location
- **File size**: EXIF data adds 10-50KB per image
- **No SEO value**: search engines don't read EXIF

## CDN integration

For production sites with significant image traffic, use a CDN:

**Cloudflare**:
- Images automatically optimized via Cloudflare Images (paid)
- Free tier caches and serves at edge
- DDoS protection bundled

**Bunny CDN**:
- Cheap (~€0.01/GB)
- Bunny Optimizer for automatic resize/format conversion
- Simple integration

**Imgix / Cloudinary**:
- Full image API with on-the-fly transformations
- More expensive but powerful

Self-hosted CDN setup is rarely worth it; managed CDNs are cheap.

### Cloudflare integration (Laravel)

```php
// config/filesystems.php
'cloudflare' => [
    'driver' => 's3',
    'key' => env('CLOUDFLARE_R2_KEY'),
    'secret' => env('CLOUDFLARE_R2_SECRET'),
    'endpoint' => env('CLOUDFLARE_R2_ENDPOINT'),
    'bucket' => env('CLOUDFLARE_R2_BUCKET'),
    'url' => env('CLOUDFLARE_R2_PUBLIC_URL'),  // your CDN URL
],
```

```php
// In model
public function registerMediaCollections(): void
{
    $this->addMediaCollection('hero')
        ->useDisk('cloudflare');
}
```

Spatie Media Library writes conversions to the R2 bucket; Cloudflare CDN
serves them.

## Lazy loading

Below-the-fold images should lazy-load:

```html
<img src="..." loading="lazy" decoding="async" ...>
```

Above-the-fold (LCP candidate):

```html
<img src="..." loading="eager" fetchpriority="high" decoding="async" ...>
```

`loading="lazy"` is native browser support, no JS needed. Don't use
JavaScript lazy-loading libraries; native works in all modern browsers.

## Image sitemap (optional)

For sites where images drive traffic (portfolios, photo-heavy content),
include in sitemap:

```xml
<url>
    <loc>https://example.com/case-study/abc</loc>
    <image:image>
        <image:loc>https://example.com/images/abc-hero.jpg</image:loc>
        <image:caption>Project ABC redesign showing new dashboard</image:caption>
    </image:image>
</url>
```

For most Nitrogen B2B sites, images aren't the SEO priority — skip.

## Image SEO checklist

- [ ] Alt text on every content image (required field in CMS)
- [ ] Width and height attributes on every `<img>` (prevents CLS)
- [ ] Modern formats: WebP fallback, AVIF when supported
- [ ] Responsive sizes via `srcset` and `sizes`
- [ ] Lazy loading on below-fold images
- [ ] Eager + high priority on LCP candidate images
- [ ] EXIF stripped (no privacy leaks)
- [ ] File size under 200KB for content images, under 100KB for thumbnails
- [ ] CDN-served (or at least browser-cached with long expiry)
- [ ] Meaningful filenames (`product-widget-red.jpg` not `IMG_2849.jpg`)

## Cross-references

- [Performance & CWV](/seo/frontend/performance-core-web-vitals/) — LCP impact
- [Accessibility = SEO](/seo/frontend/accessibility-seo/) — alt text details
- [Caching Strategies](/seo/backend/caching-strategies/) — image cache headers
- [CMS Content Workflow](/seo/backend/cms-content-workflow/) — OG image management
