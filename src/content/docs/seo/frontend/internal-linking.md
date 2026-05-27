---
title: Internal Linking
description: Link architecture for SEO and UX
sidebar:
  order: 10
---

# Internal Linking

Internal links distribute link equity (PageRank-derived authority) among
pages on the same site and signal content hierarchy to crawlers. Strategic
internal linking improves crawl efficiency, topic authority, and user
navigation.

## The pillar-cluster model

A modern content architecture pattern:

- **Pillar page**: comprehensive overview of a topic (e.g., "Enterprise Web Development")
- **Cluster pages**: deep dives into subtopics (e.g., "Laravel for ERP", "SvelteKit for SaaS")
- **All cluster pages link to the pillar**; pillar links to all clusters
- **Cluster pages may link to each other** when topically relevant

```
                  [Pillar: Enterprise Web Development]
                  /          |          |          \
                 /           |          |           \
        [Cluster:        [Cluster:  [Cluster:    [Cluster:
         Laravel ERP]    SaaS]      Integrations] Migration]
              \              |          |          /
               \             |          |         /
                +-----links between clusters----+
```

Benefits:

- **Topical authority** — Google recognizes the pillar as the authoritative resource
- **Crawl efficiency** — clear hierarchy makes the site easy to map
- **User navigation** — readers can drill down or up naturally

## Anchor text best practices

Anchor text is the most important on-page SEO signal after the title tag.
What the link says strongly influences what the destination page ranks for.

### Rules

**Be descriptive:**

```html
<!-- BAD -->
<a href="/services">Click here</a>
<a href="/services">Read more</a>
<a href="/services">Learn more</a>

<!-- GOOD -->
<a href="/services">our web development services</a>
<a href="/blog/sgtm-for-b2b">why server-side GTM matters for B2B</a>
```

**Vary anchor text naturally:**

Don't use identical anchor text every time you link to a page. Mix variations:

```html
<a href="/services/web-development">web development services</a>
<a href="/services/web-development">custom web development</a>
<a href="/services/web-development">our development offering</a>
```

Google's algorithms can detect unnatural anchor text patterns (every internal
link saying "best Laravel agency"). Vary the wording.

**Avoid over-optimization:**

Linking with exact-match keyword anchor text everywhere is a manipulation
signal. Some natural variation is required.

**Don't use generic "here" or "this":**

These provide zero context to crawlers and screen reader users.

## Internal linking patterns for enterprise sites

### Footer

Every page links to the footer, so footer links carry significant equity to
the linked pages.

Typical footer:

- Home
- About
- Services (with sub-links to top services)
- Case studies / Portfolio
- Blog
- Contact
- Privacy Policy
- Terms of Service

Don't bloat the footer with 50+ links — link equity gets diluted.

### Mega-menu

Top navigation with up to 3 levels deep. Helps both UX and SEO.

```html
<nav>
    <ul>
        <li>
            <a href="/services">Services</a>
            <ul class="mega-menu">
                <li><a href="/services/web-development">Web Development</a></li>
                <li><a href="/services/erp-systems">ERP Systems</a></li>
                <li><a href="/services/integrations">Integrations</a></li>
            </ul>
        </li>
    </ul>
</nav>
```

Crawlers find these links easily; mega-menus are SEO-friendly when properly
implemented (no JavaScript-only menus that crawlers can't see).

### Sidebar (blog posts)

Related content links keep users engaged and distribute equity:

```html
<aside>
    <h2>Related Articles</h2>
    <ul>
        <li><a href="/blog/sgtm-vs-client-side">Server-side vs client-side GTM</a></li>
        <li><a href="/blog/csp-best-practices">CSP best practices for 2026</a></li>
    </ul>
</aside>
```

### In-content links

Every article should include 2-4 internal links to related pages. Place them
where they're contextually relevant, not awkwardly stuffed in.

```markdown
Server-side GTM resolves the third-party cookie restrictions that Safari ITP
imposes (see [our explanation of ITP and SEO]
(/blog/itp-and-seo)) and reduces ad-blocker interference.
```

### Breadcrumbs

Visible breadcrumbs on every deep page:

```html
<nav aria-label="Breadcrumb">
    <ol>
        <li><a href="/">Home</a></li>
        <li><a href="/services">Services</a></li>
        <li aria-current="page">Web Development</li>
    </ol>
</nav>
```

Combined with [BreadcrumbList JSON-LD](/seo/frontend/structured-data-jsonld/),
breadcrumbs appear in Google search results.

## Anti-patterns

### Orphaned pages

A page with NO incoming internal links is orphaned. Crawlers may not discover
it, and even if they do, it has no equity. To find orphans:

- **Screaming Frog**: crawl your site, look at "Orphan Pages" report
- **Search Console → Coverage**: pages flagged as "Discovered - currently not indexed"

Fix by adding links from related pages.

### All links to homepage

Some sites' internal linking funnels everything to the homepage. This wastes
link equity that should distribute to deeper pages.

```html
<!-- BAD: every footer link goes home -->
<footer>
    <a href="/">Home</a>
    <a href="/">About</a>
    <a href="/">Services</a>
</footer>
```

(Yes, this happens, especially after a CMS migration.)

### Excessive linking

A page with 100+ links dilutes the equity passed by each link. Google's
guideline: "keep the number of links on a page to a reasonable number."
Practical limit: ~100, including navigation. Footer-stuffing every URL on
the site is the typical violation.

### Footer link farms

Every page in the footer means every page receives equity from every other
page. This blunts the hierarchy signal. Keep the footer to genuinely
important destinations.

### Broken internal links

A 404 from a crawler is a wasted crawl. Audit regularly:

```bash
# Quick check with curl
curl -L -o /dev/null -s -w "%{http_code}\n" https://example.com/page

# Site-wide: Screaming Frog → "Internal Links" report → filter Status Code 404
```

Search Console reports broken internal links in "Links" → "Top linking pages"
section.

## NoFollow on internal links

Some sites add `rel="nofollow"` to internal links (e.g., login, terms of
service) to "preserve" PageRank. **This is outdated practice.**

Google's current treatment:

- `nofollow` is a hint, not a directive (since 2019)
- Internal nofollow doesn't conserve PageRank — the equity that would have
  flowed is simply lost
- Trust signals are computed across the link graph; nofollow disrupts this

Use `nofollow` only for:

- User-generated links (forum posts, comments)
- Paid/affiliate links (now use `rel="sponsored"`)
- Untrusted external links

Don't use nofollow on internal navigation, footer links, etc.

## Measuring internal linking effectiveness

- **Search Console → Links → Top linked pages** (internal column) — which pages have the most internal links
- **Screaming Frog**: full internal link audit, click-depth analysis (how many clicks from homepage to reach each page)
- **Ahrefs / Semrush**: link graph visualization

**Click depth target:** every important page should be reachable within
**3 clicks from the homepage**. Pages requiring more clicks are deprioritized
by crawlers.

## Cross-references

- [URL Structure](/seo/frontend/url-structure/) — URL hierarchy that internal links follow
- [Structured Data](/seo/frontend/structured-data-jsonld/) — BreadcrumbList schema
- [Crawl Budget](/seo/backend/crawl-budget/) — internal linking's role in crawl efficiency
- [Accessibility = SEO](/seo/frontend/accessibility-seo/) — descriptive anchor text overlap
