---
title: Structured Data Validation
description: Automated JSON-LD validation in CI
sidebar:
  order: 2
---

# Structured Data Validation

Schema.org markup errors are silent — Google may stop generating rich results
without notifying you. Automated validation catches issues before they affect
search appearance.

## Manual validation tools

Before automating, know the tools:

- **[Rich Results Test](https://search.google.com/test/rich-results)** —
  Google's official tool. Shows which rich results your markup qualifies for.
  Test with URL or pasted code.

- **[Schema Markup Validator](https://validator.schema.org/)** —
  Schema.org's official validator. More thorough syntax checking.

- **Search Console → Enhancements** — Google's report on rich result coverage
  across your site. Shows valid + warning + error breakdown per schema type.

## Common errors

### Wrong type name

```json
{
    "@type": "organization"  // WRONG: lowercase
}
```

Correct:

```json
{
    "@type": "Organization"  // PascalCase
}
```

### Missing required fields

Each schema has required fields per Schema.org documentation. Common
oversights:

- **Article**: missing `image`, `datePublished`, `author`
- **Product**: missing `name`, `image`, `offers`
- **Recipe**: missing `recipeIngredient`, `recipeInstructions`

### Misrepresenting content

Schema markup must reflect what's actually visible on the page:

- ❌ Mark up `Product` with `aggregateRating` if no rating is visible
- ❌ FAQ schema with Q&A not present in body
- ❌ Recipe schema on a page that isn't a recipe

Google has manual actions for "spammy structured data." Don't risk it.

### Inconsistent dates

```json
{
    "@type": "Article",
    "datePublished": "2026-05-27",
    "dateModified": "2026-05-26"  // Modified BEFORE published?
}
```

Validators may not catch this; logic checks are needed.

### Broken references

```json
{
    "@type": "Service",
    "provider": {
        "@id": "https://example.com/#organization"  // Does this ID exist on the page?
    }
}
```

If the referenced `@id` isn't defined elsewhere on the page, the relationship
is broken.

## Automated validation

### Local CLI tool

```bash
npm install -g structured-data-testing-tool
```

```bash
sdtt --url https://example.com --schemas Organization,Article,BreadcrumbList
```

Exits with non-zero status on failure — usable in CI.

### Custom Node.js validator

For more control, integrate Schema.org validation:

```javascript
// scripts/validate-structured-data.js
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import Ajv from 'ajv';

const urls = [
    'https://example.com/',
    'https://example.com/about',
    'https://example.com/services/web-development',
    // ...
];

async function validate(url) {
    const html = await fetch(url).then(r => r.text());
    const dom = new JSDOM(html);
    const scripts = dom.window.document.querySelectorAll('script[type="application/ld+json"]');

    const errors = [];
    scripts.forEach((script, i) => {
        try {
            const json = JSON.parse(script.textContent);
            // Validate required fields based on @type
            if (json['@type'] === 'Article') {
                if (!json.headline) errors.push(`${url}: Article missing headline`);
                if (!json.datePublished) errors.push(`${url}: Article missing datePublished`);
                if (!json.author) errors.push(`${url}: Article missing author`);
                if (!json.image) errors.push(`${url}: Article missing image`);
            }
            // ... other type checks
        } catch (e) {
            errors.push(`${url}: JSON parse error - ${e.message}`);
        }
    });
    return errors;
}

async function main() {
    let allErrors = [];
    for (const url of urls) {
        const errors = await validate(url);
        allErrors = allErrors.concat(errors);
    }

    if (allErrors.length > 0) {
        console.error('Validation errors:');
        allErrors.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
    }

    console.log(`Validated ${urls.length} URLs, no errors`);
}

main();
```

Run in CI:

```yaml
# .github/workflows/seo.yml
name: SEO Validation
on: [push, pull_request]
jobs:
    validate-structured-data:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: '22'
            - run: npm install
            - run: node scripts/validate-structured-data.js
              env:
                  TARGET_URL: https://staging.example.com
```

### Google's API (limited)

Google has a [Structured Data Testing Tool API](https://developers.google.com/search/apis/indexing-api/v3/quickstart),
but it's deprecated. Use the manual Rich Results Test for now; for automation,
use third-party libraries or build your own.

## Pre-publish validation in CMS

Validate JSON-LD before allowing content to be saved:

```php
// app/Rules/ValidJsonLd.php
namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class ValidJsonLd implements Rule
{
    protected string $error = '';

    public function passes($attribute, $value): bool
    {
        if (empty($value)) {
            return true;
        }

        $decoded = json_decode($value, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->error = 'Invalid JSON: ' . json_last_error_msg();
            return false;
        }

        if (!isset($decoded['@context']) || !isset($decoded['@type'])) {
            $this->error = 'Missing @context or @type';
            return false;
        }

        if (!str_contains($decoded['@context'], 'schema.org')) {
            $this->error = '@context must reference schema.org';
            return false;
        }

        return true;
    }

    public function message(): string
    {
        return $this->error;
    }
}
```

Usage in Filament form:

```php
Textarea::make('structured_data')
    ->label('Custom JSON-LD')
    ->rules([new ValidJsonLd()])
    ->helperText('Optional: additional Schema.org markup as JSON');
```

## Monitoring in production

Set up Search Console Enhancement reports email notifications:

1. Search Console → Settings → Users and permissions → Your email → Edit notifications
2. Enable "Enhancement issues" emails
3. Receive immediate notification when Google detects structured data errors

Combine with weekly review of Enhancement reports:

- Article report
- Breadcrumb report
- FAQ report (if FAQ schema used)
- etc.

Each report shows: Valid pages, Pages with warnings, Pages with errors.

## Cross-references

- [Structured Data — JSON-LD](/seo/frontend/structured-data-jsonld/) — schema implementation
- [Schema.org Types Reference](/seo/reference/schema-org-types-reference/) — quick reference
- [Google Search Console](/seo/cross-cutting/google-search-console/) — Enhancement reports
