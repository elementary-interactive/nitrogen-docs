---
title: "ADR-0003: Nitrogen Reactor — platform event bus"
description: A central, in-platform event bus that decouples Nitrogen packages — producers fire events, consumers subscribe to the bus (never to each other), with company-scoped, coalesced delivery.
---

## Status

Accepted — 2026-06-16. Builds on [ADR-0001](./0001-hub-centric-application-registration) (hub-centric architecture) and complements the typed-record engine (workflow transitions are the first producer).

## Context

The Nitrogen platform is a hub-centric package ecosystem: per [ADR-0001](./0001-hub-centric-application-registration), applications depend only on the hub, never on each other. That keeps packages decoupled at the *dependency* level, but they still need to **react** to things that happen elsewhere — e.g. when a record changes status, a transactional-email module should notify the people following that record.

Two ways of wiring that are both unacceptable:

- **Direct dependency** (email module → record engine) — violates ADR-0001.
- **Ad-hoc Laravel listeners** — every consumer registers its own subscriptions against every producer, so subscription wiring is duplicated and scattered across packages.

We also hit a concrete correctness problem: a single user action (saving a record) can fire several Laravel events (record updated, status transitioned, `pr_url` set …). If more than one of those maps to "notify the assignee", the naive result is several near-duplicate emails for one logical change.

We need a single, platform-level **event bus** — the **Nitrogen Reactor** (`nitrogen/reactor`) — that is the one place events enter and the one place consumers subscribe, with delivery that is company-scoped and de-duplicated per logical firing.

## Decision

A new hub-level package, **`nitrogen/reactor`**, provides the bus. Producers and consumers communicate **only** through it; they never depend on, or subscribe to, each other directly.

### 1. A bridge in, not many subscriptions out

Producers keep firing **ordinary Laravel events** — they take no dependency on the Reactor. A single Reactor **bridge** (one wildcard listener on Laravel's dispatcher) forwards the mapped events onto the bus. Consumers subscribe to the **Reactor**, never to Laravel's dispatcher. This is the single ingress point that avoids every consumer re-subscribing to every producer (the duplication we rejected).

### 2. Explicit emission: `Reactor::dispatch()`

Alongside the auto-bridge, code may place an event on the bus directly through a façade — `Reactor::dispatch($event)` — for first-class bus events that need not round-trip through Laravel's dispatcher. Same bus, same delivery guarantees; the bridge is simply the adapter for pre-existing Laravel events.

### 3. Coalesced delivery ("singletonify")

The Reactor coalesces deliveries within a **dispatch window** (one request, or one queued batch). The unit of delivery is a **(handler, recipient, coalescing-key)** triple, and the bus guarantees **at most one invocation per triple per window**. The coalescing-key defaults to the event's logical subject (e.g. `record:{id}`), so several events about the same subject within one window collapse into a single delivery.

Handlers declare how the collapse resolves — *latest-wins* (receive one event) or *digest* (receive the coalesced set) — and are therefore written to be idempotent per window. This is what turns "one save fired five events" into "one email".

### 4. Every event is company-scoped (`company_id` NOT NULL)

Every event on the bus carries a `company_id`; the Reactor **rejects** any event without one. This upholds the landlord invariant — nothing in the landlord database exists without a company. Consumers always receive company-scoped events, coalescing keys are namespaced per company, and any Reactor persistence (dedup ledger / outbox) is `company_id` NOT NULL. "Global" events use the system-company sentinel, never NULL.

### 5. Async handlers, per company

Delivery to handlers runs on the Laravel **queue**, so consumers never block the producing request and failures retry independently. The coalescing window aligns with the dispatch/queue boundary, so the collapse happens **before** fan-out, not after.

## Consequences

**Enables:** packages react to each other without depending on each other (ADR-0001 preserved — the bus *is* the decoupling mechanism); a single, observable ingress for events; correct, non-duplicated notifications; new consumers (a transactional-email module, audit, webhooks …) added by subscribing to the bus with **zero producer changes**.

**Requires building:**

- **R1** — `nitrogen/reactor` package skeleton. *(Done — scaffolded and mirrored to GitLab.)*
- **R2** — the event envelope (carrying `company_id` + subject + payload) and the `company_id`-NOT-NULL guard.
- **R3** — the Laravel→Reactor bridge (wildcard listener + event map) and the `Reactor::dispatch()` façade.
- **R4** — the coalescing layer: dispatch window, (handler, recipient, key) dedup, latest-wins / digest resolution.
- **R5** — queue-backed delivery + a subscription-registration API for consumer modules.
- **R6** — first producer: emit record-lifecycle events from the workflow engine; first consumer: the transactional-email module.

**Deferred:** a durable cross-process transport (outbox / external broker). The first cut is in-process + queue; the envelope and bus API are designed so that swapping the transport is internal to the Reactor, never a consumer change.
