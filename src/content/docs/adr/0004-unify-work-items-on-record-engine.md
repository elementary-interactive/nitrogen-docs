---
title: "ADR-0004: Unify work items on the typed-record engine"
description: All work items (epics, tasks, subtasks, leads, campaigns) become typed Records; the legacy Project/Epic/Task Eloquent models are retired. Project stays the container; Epic is the billing unit; time logs live on tasks and roll up to epics.
---

## Status

Accepted — 2026-06-17. Builds on [ADR-0001](./0001-hub-centric-application-registration) and the typed-record engine; **supersedes the legacy Project-management models**. Operated on by [ADR-0002](./0002-headless-agent-execution-contract) (agents act on records) and surfaced as events by [ADR-0003](./0003-nitrogen-reactor-event-bus).

## Context

The platform carries **two parallel models** for work items:

1. **Legacy** — Eloquent `Project` / `Epic` / `Task` / `TimeLog` models with their Filament "Project Management" cluster (the original 1.x-era ERP).
2. **The typed-record engine** — `Record` + `RecordType` with per-type workflows, parent/child links, and a required `project_id` container (F4). This is what the MCP tools and the `RecordResource` UI drive, and it is where all new work already lives (the Atlas campaign is `collection → lead` records).

Maintaining both is drift and double work — two CRUD surfaces, two notions of "status", two places to wire workflow. We converge on one.

## Decision

**Every work item is a `Record` of a `RecordType`.** Concretely:

- **Project stays the container** — the per-company typed container from F4 (every record belongs to a project; the per-company **Inbox** is the default). Project is *not* a Record.
- **Epic, Task, Subtask become RecordTypes**, linked through the engine's parent/child + `allowed_children`: **Project → Epic → Task → Subtask**. (Leads/collections already use this same mechanism.)
- **Epic is a first-class, root work-record *and* the billing/estimation unit**: a quote is composed of epics; an epic rolls its tasks' hours up into an invoice line ("Epic — N h — X HUF").
- **Time logs attach to the Task** — the leaf where work actually happens. **Epic is the collector**: it aggregates the hours of its task children; it never owns time directly.
- **Workflow, statuses, transitions, guards, and custom fields all come from the type registry** — uniform across MCP, the `RecordResource` UI, and any future surface.
- The **legacy Eloquent Project-management models** (`Epic`, `Task`, `TimeLog`) and their Filament cluster resources are **retired**; existing rows migrate into `records` (+ `member_records`, + a record-attached time log).

## Consequences

**Enables:** one engine, one UI, one MCP surface for *every* work item — dev tasks, leads, campaigns alike. Billing becomes a query over records (epic → Σ task hours). Humans and autonomous agents operate on the same primitives, so the agent execution contract (ADR-0002) and the record lifecycle events (ADR-0003) apply uniformly.

**Requires building (phased — production stays live throughout):**

- **P1** — define `epic` / `task` / `subtask` RecordTypes (CLI-seeded YAML) with their workflows + `allowed_children` (Epic→Task→Subtask).
- **P2** — `RecordResource` handles the hierarchy (parent/child navigation, create-child) on top of the JIRA-style UX.
- **P3** — data migration: legacy `epics`/`tasks` → `records` (assignees → `member_records`), preserving codes and relations.
- **P4** — time logging: re-point `TimeLog` onto task records; epic hours = the rollup of its tasks.
- **P5** — retire the legacy Eloquent models + the Project-management cluster resources.

**Deferred:** per-transition required-field **"screens"** (JIRA-style transition forms) — authored later via the platform form builder. Today every transition uses one consistent move form (`to_status` + optional reason).
