---
title: Structured Data — JSON-LD
description: Schema.org markup for rich search results
sidebar:
  order: 5
---

# Structured Data — JSON-LD

JSON-LD (JavaScript Object Notation for Linked Data) is Google's preferred
format for structured data. It uses the Schema.org vocabulary and produces
**rich results** — enhanced search result displays including knowledge panels,
breadcrumbs, FAQ accordions, sitelinks search boxes, and more.

For B2B Nitrogen sites, the high-value schemas are: Organization, Service,
Article (for blog content), BreadcrumbList, FAQPage, and Person (for team bios).

## Format and placement

JSON-LD is embedded as a `<script>` block in `<head>` (or anywhere in the
document, but `<head>` is convention):

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Elementary Interactive Kft.",
    "url": "https://elementary-interactive.com"
}
</script>
```

The `@context` declares the vocabulary (always Schema.org). The `@type`
declares the kind of entity (Organization, Article, etc.).

## Top schemas for B2B contexts

### Organization

Placed on every page (in layout). Describes the company itself.

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://elementary-interactive.com/#organization",
    "name": "Elementary Interactive Kft.",
    "alternateName": "Elementary Interactive",
    "url": "https://elementary-interactive.com",
    "logo": {
        "@type": "ImageObject",
        "url": "https://elementary-interactive.com/logo.png",
        "width": 600,
        "height": 60
    },
    "description": "Enterprise web development specializing in Laravel-based custom systems.",
    "foundingDate": "2020-11-01",
    "founder": {
        "@type": "Person",
        "name": "Balázs Ercsey",
        "url": "https://elementary-interactive.com/team/balazs"
    },
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "...",
        "addressLocality": "Budapest",
        "postalCode": "1...",
        "addressCountry": "HU"
    },
    "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+36-...",
        "contactType": "customer service",
        "email": "hello@elementary-interactive.com",
        "areaServed": "EU",
        "availableLanguage": ["en", "hu"]
    },
    "sameAs": [
        "https://www.linkedin.com/company/elementary-interactive",
        "https://github.com/elementary-interactive"
    ],
    "vatID": "HU...",
    "taxID": "..."
}
</script>
```

Key fields explained:

- **`@id`**: a unique identifier (URL-shaped) used for cross-referencing within the page. The `#organization` fragment is convention.
- **`sameAs`**: array of profile URLs on other authoritative sites (LinkedIn, GitHub, Twitter, Wikipedia, Crunchbase). Helps Google build the entity's knowledge graph.
- **`vatID` / `taxID`**: jurisdictional identifiers. For Hungarian companies, the VAT ID format is `HU` followed by 8 digits.
- **`logo`**: should ideally be a wide rectangle (60-600px wide) for Google's knowledge panel display.

### LocalBusiness (extends Organization)

If the company has physical premises and wants to appear in local search:

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Elementary Interactive Kft.",
    "image": "https://elementary-interactive.com/office.jpg",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "...",
        "addressLocality": "Budapest",
        "postalCode": "1...",
        "addressCountry": "HU"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": 47.4979,
        "longitude": 19.0402
    },
    "url": "https://elementary-interactive.com",
    "telephone": "+36-...",
    "openingHoursSpecification": [{
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
    }],
    "priceRange": "€€€"
}
</script>
```

For most B2B web agencies, this is **optional** — search visibility comes
from content marketing, not local discovery.

### Service

For each distinct service offering, a dedicated Service schema on the
relevant landing page:

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Custom Web Development",
    "provider": {
        "@type": "Organization",
        "@id": "https://elementary-interactive.com/#organization"
    },
    "areaServed": ["HU", "AT", "DE", "EU"],
    "serviceType": "Web Development",
    "description": "Bespoke web applications built on Laravel, Filament, and SvelteKit for enterprise clients.",
    "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Web development services",
        "itemListElement": [
            {
                "@type": "OfferCatalogItem",
                "itemOffered": {
                    "@type": "Service",
                    "name": "ERP/CRM systems"
                }
            },
            {
                "@type": "OfferCatalogItem",
                "itemOffered": {
                    "@type": "Service",
                    "name": "API integrations"
                }
            }
        ]
    }
}
</script>
```

The `provider` references the Organization via `@id` — this links the
schemas into a graph.

### Article (blog posts)

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Server-Side GTM for B2B Sites",
    "image": [
        "https://example.com/sgtm-1x1.jpg",
        "https://example.com/sgtm-4x3.jpg",
        "https://example.com/sgtm-16x9.jpg"
    ],
    "datePublished": "2026-05-27T08:00:00+02:00",
    "dateModified": "2026-05-27T10:00:00+02:00",
    "author": {
        "@type": "Person",
        "name": "Balázs Ercsey",
        "url": "https://elementary-interactive.com/team/balazs"
    },
    "publisher": {
        "@type": "Organization",
        "@id": "https://elementary-interactive.com/#organization"
    },
    "description": "Why and how to migrate from client-side to server-side Google Tag Manager.",
    "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://elementary-interactive.com/blog/sgtm-for-b2b"
    },
    "wordCount": 2500,
    "articleSection": "Engineering"
}
</script>
```

Article variants:

- **`NewsArticle`** — for news content. Requires Google News inclusion to be useful.
- **`BlogPosting`** — for blog posts. Equivalent to Article for most purposes; Article is more general and preferred.
- **`TechArticle`** — for technical documentation. Useful for docs sites.

### BreadcrumbList

Adds breadcrumb display to search results.

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://example.com"
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": "Services",
            "item": "https://example.com/services"
        },
        {
            "@type": "ListItem",
            "position": 3,
            "name": "Web Development",
            "item": "https://example.com/services/web-development"
        }
    ]
}
</script>
```

Note: the **last item** in the list (the current page) traditionally omits
the `item` field per old Google guidance, but recent guidance now permits
including it. Either is accepted.

### FAQPage

For pages with question-and-answer sections, FAQPage produces a rich result
showing expandable Q&A in search.

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "How long does a typical project take?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Typical Nitrogen-based projects take 3-6 months from kickoff to launch, depending on scope and integrations required."
            }
        },
        {
            "@type": "Question",
            "name": "Do you offer maintenance after launch?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, all clients receive 12 months of included maintenance and bug fixes. Extended SLAs are available on request."
            }
        }
    ]
}
</script>
```

**Caveat:** Google has reduced FAQ rich result visibility since August 2023.
FAQs still help with relevance signals and may appear for some queries, but
expect fewer rich result impressions than 2022.

### Person (team member bios)

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Balázs Ercsey",
    "givenName": "Balázs",
    "familyName": "Ercsey",
    "jobTitle": "Founder and Managing Director",
    "worksFor": {
        "@type": "Organization",
        "@id": "https://elementary-interactive.com/#organization"
    },
    "url": "https://elementary-interactive.com/team/balazs",
    "image": "https://elementary-interactive.com/team/balazs.jpg",
    "sameAs": [
        "https://www.linkedin.com/in/...",
        "https://github.com/..."
    ],
    "knowsAbout": [
        "Laravel",
        "Filament",
        "SvelteKit",
        "ERP systems",
        "Multi-tenant SaaS architecture"
    ]
}
</script>
```

Useful for team bio pages and as `author` reference from Article schemas.

### WebSite (search box)

To enable the sitelinks search box in Google results:

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Elementary Interactive",
    "url": "https://elementary-interactive.com",
    "potentialAction": {
        "@type": "SearchAction",
        "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://elementary-interactive.com/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
    }
}
</script>
```

Only useful if your site actually has search functionality at `/search?q=...`.

## ID-based linking (graph structure)

For pages with multiple schemas, link them via `@id`:

```html
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": "https://example.com/#organization",
            "name": "Example",
            "url": "https://example.com"
        },
        {
            "@type": "WebSite",
            "@id": "https://example.com/#website",
            "url": "https://example.com",
            "publisher": { "@id": "https://example.com/#organization" }
        },
        {
            "@type": "WebPage",
            "@id": "https://example.com/about/#webpage",
            "url": "https://example.com/about",
            "isPartOf": { "@id": "https://example.com/#website" },
            "about": { "@id": "https://example.com/#organization" }
        },
        {
            "@type": "BreadcrumbList",
            "itemListElement": [/* ... */]
        }
    ]
}
</script>
```

The `@graph` array bundles multiple entities into one JSON-LD block, with
explicit relationships via `@id` references. Google parses this as a
connected entity graph rather than isolated entities.

## Validation

- **[Rich Results Test](https://search.google.com/test/rich-results)** — Google's official tool. Shows which rich results your markup qualifies for.
- **[Schema Markup Validator](https://validator.schema.org/)** — Schema.org's official validator. More thorough syntax checking than Google's tool.
- **Search Console → Enhancements** — Google's report on rich result coverage and errors across your site (only appears after pages are indexed).

## Using the `@nitrogen/frontend-seo` package

The package provides builder functions that return correctly-typed Schema.org
objects:

```svelte
<script>
    import {
        JsonLd,
        organization,
        service,
        article,
        breadcrumbs,
        faq
    } from '@nitrogen/frontend-seo';

    const orgSchema = organization({
        name: 'Elementary Interactive Kft.',
        url: 'https://elementary-interactive.com',
        logo: 'https://elementary-interactive.com/logo.png',
        sameAs: [
            'https://www.linkedin.com/company/elementary-interactive'
        ]
    });

    const breadcrumbSchema = breadcrumbs([
        { name: 'Home', url: '/' },
        { name: 'Services', url: '/services' },
        { name: 'Web Development', url: '/services/web-development' }
    ]);
</script>

<svelte:head>
    <JsonLd schema={orgSchema} />
    <JsonLd schema={breadcrumbSchema} />
</svelte:head>
```

The `JsonLd` component handles `JSON.stringify()` and proper script tag
wrapping. See the [package documentation](/packages/frontend-seo/overview/)
for the full builder API.

## Common pitfalls

### Wrong type names

`@type: "organization"` is wrong (lowercase). It must be `@type: "Organization"`.

### Missing required fields

Each schema has required fields per Schema.org documentation. For example,
`Article` requires `headline`, `image`, `datePublished`, `author`, `publisher`.
Validation tools flag missing required fields.

### Misrepresenting content

Schema.org markup must reflect what's actually on the page. If you mark up
a `Product` with a `rating`, the rating must be visible to users — fake or
hidden ratings are against Google's guidelines and can trigger manual
actions.

### Multiple `@id` collisions

If two schemas use the same `@id`, Google's interpretation is undefined.
Use unique fragments (`#organization`, `#website`, `#webpage`) per entity.

### Stale dates

`Article.dateModified` should reflect actual content edits. Resetting it on
every site rebuild (without content changes) signals freshness updates that
aren't real, which can backfire.

## Cross-references

- [Meta tags](/seo/frontend/meta-tags/) — the baseline that JSON-LD enriches
- [Search Engine Integration](/seo/backend/search-engine-integration/) — Search Console's rich results report
- [Structured Data Validation](/seo/cross-cutting/structured-data-validation/) — automated validation in CI
- [Schema.org Types Reference](/seo/reference/schema-org-types-reference/) — quick reference table
- [@nitrogen/frontend-seo package docs](/packages/frontend-seo/overview/)
