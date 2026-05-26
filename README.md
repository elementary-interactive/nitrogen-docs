# nitrogen-docs

Developer documentation site for the **Nitrogen Frontend Ecosystem**, built with
[Astro](https://docs.astro.build/) 5 and [Starlight](https://starlight.astro.build/).
Deployed at <https://kb.elementary-interactive.dev>.

## What is this?

This repository contains the source for the Nitrogen developer docs:

- **Getting Started** — overview and quickstart for SvelteKit consumers
- **Packages** — per-package reference (`frontend-seo`, `frontend-tracking`, `frontend-legal`)
- **Skills & Cookbook** — task-oriented recipes
- **ADR** — architectural decision records
- **Reference** — glossary and supporting material

The docs site is intentionally tracker-less: no analytics, no consent banner,
no third-party scripts. Static HTML, served over HTTPS via the `.dev` HSTS
preload.

## Local development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to ./dist
npm run preview  # serve the production build locally
npm run check    # type-check content + config
```

Requires Node.js 20+.

## Deploy

Pushes to `main` trigger the GitLab CI pipeline (`.gitlab-ci.yml`):

1. `build` — `npm ci && npm run build`, output to `dist/`.
2. `deploy` — pushes the static build to the GitHub Pages mirror repo
   (`elementary-interactive/nitrogen-docs-deploy`), which serves the site at
   `kb.elementary-interactive.dev` via a CNAME.

GitHub → GitLab mirroring of this source repo is handled by
`.github/workflows/mirror-to-gitlab.yml`.

## Adding content

Content lives under `src/content/docs/` as Markdown (`.md`) or MDX (`.mdx`).
Every file needs frontmatter with at minimum a `title`:

```markdown
---
title: My page
description: Short description used for meta tags and search.
---

Page body here.
```

Sidebar grouping follows the directory structure under `src/content/docs/`
and is configured in `astro.config.mjs`. New top-level sections require a
sidebar entry there.

ADRs go under `src/content/docs/adr/` using the `ADR-NNNN-title.md` naming
convention. See [ADR-0005](https://kb.elementary-interactive.dev/adr/) once
published for the documentation infrastructure rationale.
