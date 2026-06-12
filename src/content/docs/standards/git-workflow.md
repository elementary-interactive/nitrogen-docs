---
title: Git Workflow Standard
description: The binding branching, versioning and release model for every Nitrogen package repository.
---

This standard applies to **every** `elementary-interactive/nitrogen-*` repository. Its single
overriding goal is **generation isolation**: Nitrogen 1.x (Laravel 11–12, Filament 3, classic
site architecture) and Nitrogen 2.x (Laravel 12, Filament 5, Hub-based architecture with thin
`nitrogen-frontend-*` clients) are maintained and developed **in parallel, without ever mixing**.

Every rule below exists to make cross-generation contamination *mechanically impossible* — not
merely discouraged — for humans and AI agents alike.

:::caution[Supersedes the 2024 Git Flow document]
This standard replaces the November 2024 `.claude/git-workflow.md` (classic Git Flow). The
commit conventions and merge strategy carry over; the branching model does **not**. In
particular, the old "merge hotfix to `main`, then back-merge to `develop`" rule is now a
**forbidden flow**: in dual-generation repositories those branches belong to different
generations.
:::

## Core principles

1. **The major version is the generation.** `1.*` releases bind to Filament 3 / classic
   architecture; `2.*` releases bind to Filament 5 / Hub architecture. There are no exceptions.
2. **The manifest is the source of truth.** Branch *names* differ between repositories for
   historical reasons. The meaning of a branch is declared in [`.nitrogen.yml`](/standards/nitrogen-manifest/)
   at the repository root. Tooling, CI and AI agents resolve generations **only** through the
   manifest — never by guessing from a branch name.
3. **Generations never merge.** No merge, rebase or cherry-pick may cross a generation
   boundary. If a bug exists in both generations, it gets **two tickets and two independent
   fixes** — the architectures differ too much for ports to be trustworthy.
4. **GitHub is the source of truth; GitLab distributes.** Development, PRs and tags happen on
   GitHub. Every repository mirrors to the on-premise GitLab
   (`git.elementary-interactive.dev`), whose Package Registry and Container Registry are the
   sole distribution points.

## Generation lines

A *generation line* is a long-lived, protected branch from which releases of one generation are
cut. Which branch plays which role is declared per repository in `.nitrogen.yml`.

| Repository class | 1.x line | 2.x line | Notes |
|---|---|---|---|
| **Dual-generation** (legacy packages) | `main` | `develop` | `main` keeps its historical role as the 1.x line. |
| **2.x-only** (packages born in 2.x: hub, blueprint, media, faces, webhook, workspace, all `frontend-*`, …) | — | `main` | No 1.x line exists; the manifest declares `1.x: none`. |

Generation lines are **protected**: direct pushes are forbidden, changes land via pull request
with the required status checks green (including the generation guard, below).

## Working branches

All work happens on short-lived branches whose name encodes **the generation and the ticket**:

```
<type>/<generation>/<TICKET>-<slug>

feature/2.x/N1-142-event-bus-adapter
bugfix/2.x/N1-156-form-validation
hotfix/1.x/N1-217-tenant-cookie-fix
refactor/2.x/N1-160-record-job-dispatch
chore/2.x/XX-update-dependencies
```

- `<type>` is one of `feature`, `bugfix`, `hotfix`, `refactor`, `docs`, `chore`,
  `release` — the same taxonomy as before, now with a mandatory generation segment.
- `<generation>` is `1.x` or `2.x` and **must** match the generation of the target line.
- `<TICKET>` is the ticket ID (N1 / Nitrogen ERP once live; during the transition a repo-local
  issue reference is acceptable, the segment is mandatory either way — use `XX` only for
  genuinely ticketless chores).
- `feature/*` branches off the generation line and merges back into the same line via PR.
- `hotfix/*` branches off the **latest release tag** of its generation, merges back into the
  same generation line via PR, and is released immediately as a patch version.

### Forbidden flows

These are rejected automatically by the generation guard (see CI guardrails):

- A PR from a `*/1.x/*` branch targeting the 2.x line, or vice versa.
- A PR between the two generation lines themselves (e.g. `main` → `develop`).
- A tag whose major version does not match the generation of the branch that contains it.

## Versioning and releases

Versions follow [SemVer 2.0](https://semver.org/), tagged as `v<version>`:

| Kind | Format | Cut from | Example |
|---|---|---|---|
| Stable | `v<MAJOR>.<MINOR>.<PATCH>` | the generation line | `v1.2.4`, `v2.2.0` |
| Beta | `…-beta.<N>` | the generation line | `v2.2.1-beta.4` |
| Release candidate | `…-rc.<N>` | the generation line | `v2.3.0-rc.1` |

Rules:

- `MAJOR` is fixed by the generation (principle 1). A version bump never crosses generations —
  there is no "upgrade to 2.0" release of a 1.x line; 2.x is a separate line with its own history.
- Tags are created **only** on commits reachable from the generation line declared for that
  major version in `.nitrogen.yml`. The tag guard enforces this with
  `git merge-base --is-ancestor`.
- Pre-releases (`-beta.N`, `-rc.N`) are the *only* way to ship work-in-progress. Consumers on
  stable constraints never see them.
- For larger releases an optional stabilization branch `release/<generation>/<version>`
  (e.g. `release/2.x/2.3.0`) may be cut from the generation line and merged back into **the
  same line** before tagging — never anywhere else. The old Git Flow "release → main +
  back-merge to develop" double merge is gone.
- Dependency constraints are part of the contract: a 1.x release must constrain
  `filament/filament: ^3` and `nitrogen/* : ^1`; a 2.x release `filament/filament: ^5` and
  `nitrogen/* : ^2` (Composer packages; npm packages constrain their `@nitrogen/*` peers
  analogously). The release guard verifies this, so an accidental cross-generation dependency
  fails the release instead of poisoning a site.

## Commits and merges

Unchanged from established practice, restated here so this document stands alone:

- **[Conventional Commits](https://www.conventionalcommits.org/)** — `<type>(<scope>): <subject>`
  with the established types (`feat`, `fix`, `refactor`, `perf`, `docs`, `style`, `test`,
  `chore`, `ci`, `build`, `revert`); imperative mood, lowercase subject, ≤ 50 characters.
  Breaking changes carry a `BREAKING CHANGE:` footer.
- **Merge commits (`--no-ff`) by default** — feature boundaries stay visible and revertible.
  Squash only messy experimental histories. Never rebase shared branches.
- Working branches land via **pull request on GitHub** with required checks green. Releases and
  hotfixes require Balázs's approval (or, in the autonomous-agent flow, a reviewer agent's
  approval plus Balázs's final sign-off on the release itself).

## CI guardrails

Three reusable workflows, maintained **once** in the org-level `.github` repository and called
by every package repo:

1. **Generation guard** (`pull_request`): resolves the target branch's generation from
   `.nitrogen.yml`, parses the source branch name, and fails the check on any forbidden flow.
   Also fails if the manifest is missing or invalid — no manifest, no merge.
2. **Tag guard** (`push: tags`): parses the major version from the tag, resolves the allowed
   branch from the manifest, verifies ancestry, verifies dependency constraints match the
   generation, and only then allows the release pipeline to continue.
3. **Mirror** (`push`): the existing `mirror-to-gitlab.yml` (SSH deploy-key, on-premise
   GitLab target) — kept as a reusable workflow so it is maintained in one place, not 34.

Publishing itself runs on GitLab CI after the mirror: tagged Composer packages go to the GitLab
Package Registry, npm packages to its npm registry, images to the Container Registry.

## Rules for AI agents

These rules are binding for every Claude (or other) agent instance working in a Nitrogen
repository, and are enforced by the container provisioning that checks out the work branch:

1. **Before touching anything**, read `.nitrogen.yml` and determine the generation of the
   assigned ticket. Verify the checked-out branch belongs to that generation. On mismatch:
   **stop and switch branches** — do not start "investigating compatibility issues".
2. Never create a branch without the `<generation>/` segment; never target a PR across
   generations.
3. A fix needed in the *other* generation, or in *another package*, is **out of scope**: open a
   ticket for it (via the N1 MCP once live) and reference it. Do not implement it.
4. Version numbers and tags are produced by the release pipeline, not by hand.

## Migration plan (current state → standard)

Current reality across the 34 repositories, and what each class needs:

| Class | Repos (examples) | Action |
|---|---|---|
| Dual-generation with `feature/prepare-v2.0` still open | core, api, api-client, faq, news, slideshow, social, tag, ui, ai, form, event, document | Land `feature/prepare-v2.0` into `develop` (PR), delete the feature branch, add manifest, protect both lines. |
| Dual-generation, 2.x already on `develop` | audit, attributes, cms, erp | Add manifest, protect both lines, rename any non-conforming open branches. |
| 2.x-only | hub, blueprint, media, faces, webhook, workspace, all `frontend-*`, docs, skeleton, skeleton-wsl, wp-extractor, docker-environment | Add manifest with `1.x: none`, protect `main`. |

Rollout order: pilot on `core`, `attributes` and one `frontend-*` repo; then the org-level
reusable workflows; then the remaining repos in bulk.
