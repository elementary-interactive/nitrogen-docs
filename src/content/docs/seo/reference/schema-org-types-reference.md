---
title: Schema.org Types Reference
description: Common Schema.org types for B2B contexts
sidebar:
  order: 3
---

# Schema.org Types Reference

Quick reference of the Schema.org types most relevant to B2B Nitrogen sites.
For implementation see [Structured Data — JSON-LD](/seo/frontend/structured-data-jsonld/).

## Type hierarchy

Schema.org types are hierarchical. `Thing` is the root. Common branches:

```
Thing
├── Action
├── CreativeWork
│   ├── Article
│   ├── BlogPosting
│   ├── WebPage
│   └── WebSite
├── Event
├── Intangible
│   ├── ItemList
│   │   └── BreadcrumbList
│   ├── Offer
│   └── Service
├── Organization
│   ├── Corporation
│   ├── LocalBusiness
│   │   └── ProfessionalService
│   └── EducationalOrganization
├── Person
├── Place
│   ├── PostalAddress
│   └── LocalBusiness (also under Organization)
└── Product
```

A type inherits properties from its parents — `LocalBusiness` has all
`Organization` properties plus additional location-specific ones.

## Top types for B2B

### Organization

```json
{
    "@type": "Organization",
    "name": "Required",
    "url": "Required",
    "logo": "Recommended",
    "address": "Recommended",
    "contactPoint": "Recommended",
    "sameAs": "Recommended",
    "vatID": "Optional (HU-specific)",
    "foundingDate": "Optional",
    "numberOfEmployees": "Optional"
}
```

Use on every page (in layout).

### Service

```json
{
    "@type": "Service",
    "name": "Required",
    "provider": "Required (reference to Organization)",
    "areaServed": "Recommended",
    "serviceType": "Recommended",
    "description": "Recommended",
    "hasOfferCatalog": "Optional",
    "termsOfService": "Optional"
}
```

Use on each services landing page.

### Article

```json
{
    "@type": "Article",
    "headline": "Required (max 110 chars)",
    "image": "Required (one or more URLs)",
    "datePublished": "Required (ISO 8601)",
    "dateModified": "Required",
    "author": "Required (Person or Organization)",
    "publisher": "Required (Organization)",
    "description": "Recommended",
    "mainEntityOfPage": "Recommended",
    "wordCount": "Optional",
    "articleSection": "Optional",
    "articleBody": "Optional"
}
```

Use on blog posts.

Variations:

- `BlogPosting` — for blog content (subset of Article)
- `NewsArticle` — for news (requires Google News inclusion to be useful)
- `TechArticle` — for technical documentation

### BreadcrumbList

```json
{
    "@type": "BreadcrumbList",
    "itemListElement": [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Required",
            "item": "Required (URL)"
        }
    ]
}
```

Use on every deep page with breadcrumb navigation.

### FAQPage

```json
{
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "Required (the question)",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Required (the answer)"
            }
        }
    ]
}
```

Use on FAQ pages. Note: Google reduced FAQ rich result visibility since
August 2023.

### Person

```json
{
    "@type": "Person",
    "name": "Required",
    "givenName": "Recommended",
    "familyName": "Recommended",
    "jobTitle": "Recommended",
    "worksFor": "Recommended (Organization)",
    "url": "Recommended",
    "image": "Recommended",
    "sameAs": "Recommended (LinkedIn, GitHub, etc.)",
    "knowsAbout": "Optional (areas of expertise)"
}
```

Use on team bio pages.

### LocalBusiness / ProfessionalService

```json
{
    "@type": "ProfessionalService",
    "name": "Required",
    "image": "Required",
    "address": "Required",
    "geo": "Recommended (coordinates)",
    "url": "Required",
    "telephone": "Recommended",
    "priceRange": "Recommended ($, $$, $$$, etc.)",
    "openingHoursSpecification": "Recommended"
}
```

For agencies with physical offices and local-search ambitions.

### WebSite

```json
{
    "@type": "WebSite",
    "name": "Required",
    "url": "Required",
    "potentialAction": {
        "@type": "SearchAction",
        "target": "https://example.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
    }
}
```

Use on homepage if site has search functionality. Enables sitelinks search
box in Google results.

### WebPage

```json
{
    "@type": "WebPage",
    "name": "Required",
    "url": "Required",
    "description": "Recommended",
    "primaryImageOfPage": "Optional",
    "lastReviewed": "Optional",
    "reviewedBy": "Optional"
}
```

Used as a wrapper when needed for the `@graph` structure.

## Types for specific contexts

### Recipe (food blogs, rare for B2B)

```json
{
    "@type": "Recipe",
    "name": "Required",
    "image": "Required",
    "author": "Required",
    "recipeIngredient": "Required (array)",
    "recipeInstructions": "Required (array of HowToStep)",
    "datePublished": "Required",
    "prepTime": "Recommended (ISO 8601 duration)",
    "cookTime": "Recommended"
}
```

### Event

```json
{
    "@type": "Event",
    "name": "Required",
    "startDate": "Required (ISO 8601)",
    "location": "Required (Place or VirtualLocation)",
    "endDate": "Recommended",
    "description": "Recommended",
    "image": "Recommended",
    "offers": "Recommended (if paid)",
    "organizer": "Recommended"
}
```

For conferences, webinars, meetups.

### Course

```json
{
    "@type": "Course",
    "name": "Required",
    "description": "Required",
    "provider": "Required (Organization)",
    "courseCode": "Optional",
    "hasCourseInstance": "Recommended"
}
```

For training programs.

### JobPosting

```json
{
    "@type": "JobPosting",
    "title": "Required",
    "description": "Required",
    "datePosted": "Required",
    "validThrough": "Required",
    "employmentType": "Required",
    "hiringOrganization": "Required",
    "jobLocation": "Required"
}
```

For hiring pages. Google has a separate Indexing API for JobPosting.

### Product

```json
{
    "@type": "Product",
    "name": "Required",
    "image": "Required",
    "description": "Recommended",
    "brand": "Recommended",
    "offers": "Recommended (price, availability)",
    "aggregateRating": "Optional (if real ratings)",
    "review": "Optional"
}
```

For e-commerce. Don't fake ratings — Google has manual actions for this.

## Validation tools

- [Rich Results Test](https://search.google.com/test/rich-results) — Google's official tool
- [Schema Markup Validator](https://validator.schema.org/) — Schema.org's validator
- [Structured Data Testing Tool API](https://github.com/cleverdata/sdtt) — third-party CLI for CI integration

## ID-based linking pattern

For multiple schemas on one page, use `@id` to link them:

```json
{
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": "https://example.com/#organization",
            "name": "Example"
        },
        {
            "@type": "WebSite",
            "@id": "https://example.com/#website",
            "publisher": { "@id": "https://example.com/#organization" }
        },
        {
            "@type": "WebPage",
            "@id": "https://example.com/about/#webpage",
            "isPartOf": { "@id": "https://example.com/#website" },
            "about": { "@id": "https://example.com/#organization" }
        }
    ]
}
```

This builds a connected knowledge graph that Google can interpret.

## Cross-references

- [Structured Data — JSON-LD](/seo/frontend/structured-data-jsonld/) — implementation guide
- [Structured Data Validation](/seo/cross-cutting/structured-data-validation/) — automated validation
- [Schema.org documentation](https://schema.org/docs/full.html) — full Schema.org reference
