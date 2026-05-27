---
title: Accessibility = SEO
description: WCAG 2.1 AA compliance and its SEO impact
sidebar:
  order: 9
---

# Accessibility = SEO

WCAG 2.1 AA compliance is increasingly an SEO factor. Google's guidance:
"create content that is accessible." Semantic HTML + ARIA = better crawler
understanding + better screen reader UX + ranking signal.

The overlap exists because what helps screen readers also helps crawlers:
both are non-visual parsers reading the document tree.

## Semantic HTML5

Use elements that describe content meaning, not just visual placement.

```html
<header>
    <nav aria-label="Main navigation">
        <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/services">Services</a></li>
        </ul>
    </nav>
</header>

<main>
    <article>
        <h1>Page Title</h1>
        <section>
            <h2>Section Heading</h2>
            <p>...</p>
        </section>
        <aside>
            <h2>Related Links</h2>
            <ul>...</ul>
        </aside>
    </article>
</main>

<footer>
    <p>&copy; 2026 Example Inc.</p>
</footer>
```

Elements with semantic meaning:

- `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` — structural landmarks
- `<article>` — standalone content unit (blog post, product card)
- `<section>` — thematic grouping within an article
- `<figure>`, `<figcaption>` — images with captions
- `<time datetime="2026-05-27">` — machine-readable dates
- `<address>` — contact information
- `<details>`, `<summary>` — collapsible content (native, no JS)

Avoid:

- `<div>` for everything (no semantic meaning)
- `<span>` where a semantic element fits
- ARIA roles on semantic elements (`<button role="button">` is redundant)

## Heading hierarchy

- **One `<h1>` per page** (the page title)
- **`<h2>`** for main sections
- **`<h3>`** for subsections under `<h2>`
- **Never skip levels** (`<h2>` → `<h4>` is wrong)
- **Don't use headings for styling** (`<h3>` because you want that font size) —
  use the semantic level and style with CSS

Crawlers use heading hierarchy to understand content structure. Screen readers
let users navigate by heading. A clean hierarchy benefits both.

## Alt text on images

Every content image needs `alt`. Decorative images use `alt=""` (empty, not absent).

```html
<!-- Content image (informative) -->
<img src="hero.jpg" alt="Two developers reviewing code on a laptop in a modern office">

<!-- Decorative image (decorative, no information) -->
<img src="divider-line.svg" alt="">

<!-- Image with function (e.g., logo linking to home) -->
<a href="/">
    <img src="logo.svg" alt="Elementary Interactive home">
</a>

<!-- Image of text — avoid, but if needed, repeat the text -->
<img src="quote.png" alt='"Quality is not an act, it is a habit." — Aristotle'>
```

Rules:

- **Describe the content, not the appearance.** "Person smiling" not "person wearing red shirt smiling at camera"
- **Don't start with "Image of..."** — screen readers already announce "image"
- **Concise.** ~125 characters max (screen readers may truncate)
- **Empty alt for purely decorative** — `alt=""` (not `alt="decoration"`)
- **Required field in CMS** — see [CMS Content Workflow](/seo/backend/cms-content-workflow/)

## Form labels

Every form input needs an explicit label.

```html
<!-- Best: label wraps input -->
<label>
    Email
    <input type="email" name="email" required>
</label>

<!-- Acceptable: label references input by id -->
<label for="email">Email</label>
<input type="email" id="email" name="email" required>

<!-- For grouped inputs -->
<fieldset>
    <legend>Preferred contact method</legend>
    <label><input type="radio" name="contact" value="email"> Email</label>
    <label><input type="radio" name="contact" value="phone"> Phone</label>
</fieldset>
```

When a visible label isn't desirable (e.g., search input with placeholder),
use `aria-label`:

```html
<input type="search" aria-label="Search the site" placeholder="Search...">
```

But: visible labels are always better. Placeholders disappear on focus and
are gray (low contrast) — they fail WCAG.

## Link text

Descriptive link text helps both screen readers and crawlers.

```html
<!-- BAD: "click here" out of context is meaningless -->
<p>To learn more, <a href="/services">click here</a>.</p>

<!-- GOOD: the link text describes the destination -->
<p>Learn more about <a href="/services">our web development services</a>.</p>
```

Screen reader users often navigate by tabbing through links. A list of
"click here, more info, read more" links is useless.

## Skip link

For keyboard users (and screen reader users), provide a skip link to bypass
repetitive navigation:

```html
<body>
    <a href="#main" class="skip-link">Skip to main content</a>

    <nav><!-- long navigation --></nav>

    <main id="main">
        <h1>Page Title</h1>
        <!-- main content -->
    </main>
</body>
```

```css
.skip-link {
    position: absolute;
    top: -9999px;
    left: -9999px;
    background: #0ea5e9;
    color: white;
    padding: 1em;
    z-index: 999;
}

.skip-link:focus {
    top: 0;
    left: 0;
}
```

The link is invisible until focused (Tab key), then jumps into view.

## Color contrast

WCAG AA requirements:

- **Normal text**: minimum **4.5:1** contrast ratio against background
- **Large text (18pt+ or 14pt bold)**: minimum **3:1**
- **UI components, graphical objects**: minimum **3:1**

Tools:

- **WAVE** browser extension — flags low-contrast text on page
- **axe DevTools** — comprehensive accessibility audit including contrast
- **Lighthouse a11y panel** — included in Chrome DevTools
- **[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)** — manual checking

In design systems, use color tokens that have been pre-verified:

```css
/* Pre-verified for AA on white background */
--text-primary: #0f172a;     /* 16.8:1 */
--text-secondary: #475569;   /* 7.5:1 */
--text-muted: #64748b;       /* 5.2:1 — borderline, verify case-by-case */
--link: #0ea5e9;             /* 4.6:1 — just over the line */
```

## Keyboard navigation

All interactive elements must be reachable via Tab key.

- Buttons, links, form fields are keyboard-accessible by default
- Custom controls (`<div onclick>`) are NOT — use `<button>` instead
- Focus indicator must be visible (`:focus-visible` styling)

```css
/* Strong visible focus */
:focus-visible {
    outline: 2px solid #0ea5e9;
    outline-offset: 2px;
}

/* Don't disable focus indicators */
*:focus {
    outline: none;  /* BAD! */
}
```

Test: load the page, press Tab repeatedly. You should see a visible focus
ring move through every interactive element in logical order. If you lose
track of where focus is, the focus indicator isn't strong enough.

### No keyboard traps

If you open a modal, the user must be able to close it with Esc and Tab
shouldn't leave them stuck:

```svelte
<script>
    function handleKeydown(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }
</script>

<dialog onkeydown={handleKeydown} open={isOpen}>
    <!-- focus trap inside dialog, but escape returns -->
</dialog>
```

The native `<dialog>` element handles a lot of this for you.

## ARIA — when to use it

The first rule of ARIA: **don't use ARIA when semantic HTML works**.

```html
<!-- BAD: reinventing button -->
<div role="button" tabindex="0" onclick="...">Submit</div>

<!-- GOOD: native button -->
<button onclick="...">Submit</button>
```

When ARIA is necessary:

- **`aria-label`** — when no visible text describes an element (icon-only buttons)
- **`aria-labelledby`** — when another element labels this one (uses ID reference)
- **`aria-describedby`** — additional context (e.g., form input with help text)
- **`aria-current="page"`** — current navigation item
- **`aria-expanded`** — for collapsible content
- **`aria-hidden="true"`** — hide decorative elements from screen readers

```html
<!-- Icon-only button needs aria-label -->
<button aria-label="Close menu">
    <svg aria-hidden="true">...</svg>
</button>

<!-- Current page in navigation -->
<nav>
    <a href="/">Home</a>
    <a href="/services" aria-current="page">Services</a>
    <a href="/about">About</a>
</nav>

<!-- Collapsible section -->
<button aria-expanded="false" aria-controls="faq-1">
    Question 1
</button>
<div id="faq-1" hidden>
    Answer 1
</div>
```

## Automated audits

Catch ~30% of accessibility issues automatically:

- **Lighthouse a11y panel** — Chrome DevTools
- **axe DevTools** browser extension — more thorough
- **Pa11y CI** — automated testing in CI pipeline
- **WAVE** — visual overlay highlighting issues

Run in CI:

```yaml
# .github/workflows/accessibility.yml
- name: Run pa11y-ci
  run: |
    npm install -g pa11y-ci
    pa11y-ci --urls https://staging.example.com
```

## Manual testing

Automated tools catch ~30% of issues. The rest require manual review:

- **Tab through every page** — can you reach everything?
- **Use a screen reader** (NVDA on Windows, VoiceOver on Mac — built-in) — does the page make sense?
- **Disable CSS** — does the document still flow logically? Crawlers see it without styling.
- **Zoom to 200%** — does content still fit and remain readable?
- **Test with high contrast mode** — Windows High Contrast Mode reveals contrast/border issues

## SEO implications summary

What helps accessibility helps SEO:

| Accessibility practice | SEO benefit |
|---|---|
| Semantic HTML5 | Better crawler understanding of content structure |
| Heading hierarchy | Section-level relevance signals |
| Alt text | Image search ranking |
| Descriptive link text | Anchor text signals |
| Forms with proper labels | Better understanding of conversion intent |
| Color contrast | Reduced bounce rate (better UX = ranking signal) |
| Mobile-friendly | Required for mobile-first indexing |

## Cross-references

- [Meta Tags](/seo/frontend/meta-tags/) — `lang` attribute and viewport meta tag
- [Internal Linking](/seo/frontend/internal-linking/) — anchor text overlap with accessibility
- [Performance & CWV](/seo/frontend/performance-core-web-vitals/) — both affect UX scores
