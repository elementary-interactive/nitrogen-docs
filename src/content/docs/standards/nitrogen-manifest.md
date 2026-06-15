---
title: The .nitrogen.yml Manifest
description: Machine-readable package manifest — the source of truth for generations, branches and tooling.
---

Every `nitrogen-*` repository carries a `.nitrogen.yml` at its root. It is the **single source
of truth** for what the repository is, which generations it participates in, and which branch
hosts which generation. CI guards, the Elementary Central Intelligence MCP, and every AI agent
resolve this file — never folklore, never branch-name guessing.

The manifest is intentionally small. Anything derivable from `composer.json` / `package.json`
stays there; the manifest only declares what *cannot* be derived.

## Schema (version 1)

```yaml
# .nitrogen.yml
manifest: 1                       # schema version of this file
package: nitrogen-attributes      # canonical repo name on GitHub
ecosystem: composer               # composer | npm | mixed | none
description: >-
  EAV-style attribute engine; in 2.x the primary extension surface of the Hub.

generations:
  "1.x":
    branch: main                  # the 1.x generation line — or `none` for 2.x-only repos
    status: maintenance           # active | maintenance | frozen | none
    framework:
      laravel: "^11 || ^12"
      filament: "^3"
  "2.x":
    branch: develop
    status: active
    framework:
      laravel: "^12"
      filament: "^5"

mirror: https://git.elementary-interactive.dev/elementary-interactive/nitrogen/attributes.git
registry: gitlab                  # where releases are published from
```

### Field reference

| Field | Required | Meaning |
|---|---|---|
| `manifest` | yes | Schema version; bump only with a documented migration. |
| `package` | yes | Canonical GitHub repository name (`nitrogen-…`). Local folder names may differ (the prefixless convention); this field is authoritative. |
| `ecosystem` | yes | `composer`, `npm`, `mixed` (both), or `none` (docs, environments). Selects which release guard checks run. |
| `description` | yes | One paragraph for catalogs and MCP answers — what the package *is*, not its changelog. |
| `generations` | yes | Map of generation → line declaration. Both keys (`"1.x"`, `"2.x"`) must be present so absence is always explicit, never an omission. |
| `generations.<g>.branch` | yes | The generation line branch name, or `none`. |
| `generations.<g>.status` | yes | `active` (gets features), `maintenance` (fixes only), `frozen` (tagged history, no work), `none` (generation does not exist here). |
| `generations.<g>.framework` | when branch ≠ none | The framework constraints this generation guarantees. The release guard cross-checks these against `composer.json` / `package.json`. |
| `mirror` | yes | The on-premise GitLab mirror URL (disaster-recovery copy and distribution origin). GitLab layout convention: packages live in the `elementary-interactive/nitrogen/` subgroup **without** the `nitrogen-` prefix (`…/nitrogen/core.git`), **except** frontend packages, which keep their full name (`…/nitrogen/nitrogen-frontend-pages.git`). Infrastructure projects (CDN etc.) live in the separate `devops` group. |
| `registry` | yes | Where packages are published (`gitlab` = GitLab Package/Container Registry). |

### Example: a 2.x-only package

```yaml
manifest: 1
package: nitrogen-hub
ecosystem: composer
description: >-
  The foundation of Nitrogen 2.x — tenancy, records, jobs and the extension
  points every other 2.x package builds on.

generations:
  "1.x":
    branch: none
    status: none
  "2.x":
    branch: main                  # 2.x-only repos use main as the 2.x line
    status: active
    framework:
      laravel: "^12"
      filament: "^5"

mirror: https://git.elementary-interactive.dev/elementary-interactive/nitrogen/hub.git
registry: gitlab
```

## Consumers

- **Generation guard / tag guard** — branch-to-generation resolution and release validation
  (see [Git Workflow Standard](/standards/git-workflow/)).
- **Elementary Central Intelligence (MCP)** — aggregates every manifest into the live package
  catalog and generation matrix that agents query.
- **Agent provisioning** — the container bootstrap reads the manifest to check out the correct
  generation line for the assigned ticket before the agent starts.
- **Documentation** — the package catalog pages in these docs are generated from the manifests,
  so the docs cannot drift from reality.

## Validation

The manifest is validated in CI on every PR (part of the generation guard): schema-valid YAML,
both generation keys present, declared branches exist, `framework` constraints consistent with
the dependency files. An invalid or missing manifest blocks the merge.
