---
title: "ADR-0001: Hub-centric application registration"
description: Applications build on the Hub and register into it; applications never depend on each other.
---

**Status:** Accepted (Balázs, 2026-06-12) · **Applies to:** Nitrogen 2.x

## Context

Nitrogen 2.x is built around the Hub as the platform foundation (tenancy, records, jobs,
panels, identity). Applications — ERP, CMS, and future ones — are built on top of it. A June
2026 architecture scan of the hub↔erp boundary found the boundaries drifting in both
directions: the Hub hardcodes knowledge of downstream applications (ERP/CMS route-map
defaults and an app-launcher card in `BaseRecordJob` / `Dashboard`), while ERP reaches
sideways into CMS (model imports, `nitrogen-cms::` translation keys, hard-coded discovery of
other packages' application directories). The shared `Nitrogen\Application\` PSR-4 namespace
makes such drift easy and invisible.

## Decision

1. **The Hub is the foundation. Applications depend only on the Hub** (and their own
   sub-packages). **Applications never depend on each other** — ERP must not require, import,
   discover, or reference CMS, and vice versa. This holds at every level: composer
   dependencies, class references, config keys, view/panel discovery — and translations.

2. **Translations are application-scoped.** Even when two applications need the *same* string,
   each ships it under its own domain: `nitrogen.erp.*`, `nitrogen.cms.*`. Truly generic
   strings may use the Hub-provided `nitrogen.generic.*` domain. No application ever
   references another application's translation namespace.

3. **The Hub provides frameworks; applications register into them.** Widgets, permissions,
   panels, navigation, app cards, record-job route maps and any future cross-cutting component
   follow one pattern: the Hub owns the extension point (the `HubExtension` /
   `HubExtensionManager` mechanism), the application registers its contribution. The Hub
   contains **zero** hardcoded knowledge of any application.

4. **Permissions follow the JIRA model.** Each application registers its permission set into
   the Hub; the Hub's rights-editing UI presents all registered permissions, grouped by
   application. Role/Permission administration is Hub functionality — applications contribute
   entries, not competing admin screens.

## Consequences

Known violations at the time of acceptance, to be worked off as tickets:

- Hub: ERP/CMS route-map defaults in `BaseRecordJob`, the hardcoded ERP card in `Dashboard`,
  and `nitrogen-erp.*` / `nitrogen-cms.*` config reads — replace with `HubExtension`
  registrations (extend the contract with app-card and route-map registration).
- ERP: `Nitrogen\CMS\*` model imports (`NitrogenApplication` trait, Site scoping),
  `nitrogen-cms::` translation keys (notably the Settings cluster), and the hardcoded
  discovery of `vendor/nitrogen/{cms,ai,contract}` application directories in
  `ApplicationPanelProvider`. The temporary `nitrogen/cms` composer requirement added in
  June 2026 documents this debt and is removed together with the usage.
- ERP → Hub: `RoleResource` / `PermissionResource` (and the ERP `Settings` cluster content)
  manage Hub-owned models and move to the Hub, per decision 4. The competing CMS `RoleResource`
  (which references a nonexistent cluster class) is retired the same way.
- Shared `Nitrogen\Application\` namespace: each package confines itself to its own sub-path;
  a CI check fails on duplicate relative paths across `application/` directories.

New code is reviewed against this ADR; the generation guard's review checklist references it.
