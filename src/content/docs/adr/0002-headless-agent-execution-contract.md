---
title: "ADR-0002: Headless agent execution contract"
description: How autonomous (headless) Claude agents pick up, execute, hand off, review and merge work through the N1 ticket system.
---

## Status

Accepted — 2026-06-15. Builds on [ADR-0001](./0001-hub-centric-application-registration) and the [Git Workflow Standard](../standards/git-workflow).

## Context

The Nitrogen platform is built by autonomous, containerised Claude Code agents coordinated by a single central orchestrator, **Cave** — a persistent-memory Claude instance. The "brain" the agents depend on is already server-side: the **Elementary Central Intelligence** MCP + the **Nitrogen ERP (N1)** ticket system, plus **GitHub** as the code source of truth. Only Cave's orchestration loop currently runs on a workstation, and that loop is itself just an MCP client.

We need an execution contract that (a) lets many agents work in parallel safely, (b) keeps the *entire* process observable and driven inside N1, and (c) is **location-independent**, so that moving Cave onto a server later is a deployment change — not an agent rewrite.

## Decision

Coordination happens **only** through three stable, location-independent interfaces:

1. **Work state — N1 tickets/records over the MCP** (`get_record` / `get_type` / `move_record` / `assign_record` / `approve_record` / `link_records`).
2. **Code — git / GitHub** (own checkout, branch per the Git Workflow Standard, PR).
3. **Context — platform docs served over the MCP** (never the orchestrator's local `CLAUDE.md` files).

Each agent is a self-contained container image (Claude Code headless / Agent SDK) parameterised purely by env: `ticket id + package + MCP endpoint/token + git remote/credentials`. Agents must **not** depend on the orchestrator's filesystem, local clones, `~/.ssh/config`, or any in-memory hand-off.

### 1. One ticket = one agent

A ticket always has exactly one `ASSIGNED` member (its owner). Many tickets may be worked in parallel, but never more than one agent per ticket. Ownership is the `assignee`; phase is the `status`; a hand-off is a change of these via the MCP.

### 2. Lifecycle = status × assignee

`backlog` (untriaged) → **`to-do`** (pulled from backlog, queued for the assignee) → `in_progress` (actively worked) → (`pending` / `in_review`) → `done`; plus `blocked` and `cancelled`.

- **`pending`** — waiting on a person's input; stores **who** (assignee) and **why** (a `reason`), so the agent itself knows what it is waiting for (e.g. it raised a question). Used on both sides of a question/answer hand-off: agent → `pending`(human); human answers → `pending`(agent, signalling there is work) → agent `in_progress`.
- **`in_review`** — PR open, awaiting review/approval (reviewer: first Cave, then a human).
- **`blocked`** — waiting on another **linked** ticket or an external dependency (see §5).

Typical flow: Cave `backlog→to-do` (ASSIGNED = AgentX) → AgentX `to-do→in_progress` → opens PR, sets `pr_url`, `in_progress→in_review` (reassign = Cave; `has_pr_url` guard) → Cave OK: stays `in_review`, reassign = human → human OK: `in_review→done`. Any review "changes requested" → `in_review→in_progress`, reassign = AgentX.

### 3. Assignment model — the `member_record` pivot

Members relate to records through a `member_record` pivot carrying a configurable role **enum** (`ASSIGNED`, `FOLLOWER`, …). Exactly one `ASSIGNED` per record; **reassigning automatically demotes the previous `ASSIGNED` to `FOLLOWER`**. This uniformly handles every record type (a dev task or a marketing lead alike) and generalises the legacy `task_members` onto `record_id`.

### 4. Review & merge gate

`in_review→done` is the single merge gate. It requires **a Cave approval AND a human approval**, each under the four-eyes rule (approver ≠ actor). The human stage is config-toggleable and may later be dropped. Reaching `done` triggers the PR merge (Cave / automation). An agent can never move its own work to `done`.

### 5. Cross-module work → a new linked ticket

When an agent finds another package is affected, it does **not** touch it. It creates a new `development_task` (for that package) and links it (`relates` / `blocks`). A hard dependency moves the source ticket to `blocked`, referencing the link. The new ticket is triaged to a different agent.

## Consequences

**Enables:** parallel autonomous agents, a fully ticket-driven and auditable process, and a clean machine review-gate for autonomy. Because the brain and code already live server-side, relocating Cave to a server requires no agent changes.

**Requires building (engine prerequisites, ahead of the RecordResource UI):**

- **F1** — `member_record` pivot + role enum + `assign_record` MCP tool (single-`ASSIGNED` + auto-demote).
- **F2** — workflow statuses: rename `ready`→`to-do`, add `pending` (with `assignee` + `reason`).
- **F3** — record links (`relates` / `blocks`) + `link_records` MCP tool.
- Extend the approval guard to the two-stage Cave + (configurable) human gate (`approve_record`).
- A hand-off comment mechanism on the ticket.

**Deferred:** moving Cave itself onto a server — postponed for time reasons; this contract makes the deferral risk-free.
