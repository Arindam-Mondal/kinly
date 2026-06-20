---
name: kinly-dev
description: >-
  Use this skill for ANY development work on the Kinly health-tracker PWA — scaffolding, adding
  features, writing components, database/Supabase work, auth, the prediction engine, tests, styling,
  bug fixes, or refactors. Trigger it whenever the user asks to build, add, change, fix, test, or
  review anything in this repo, even if they don't name the skill. It enforces the project's
  architecture (the generic log_entries model, domain-agnostic components, the single sex-based copy
  branch), a security-first / tests-always-pass workflow, mobile-first UI, and the "ask, never assume"
  rule. If you are about to touch Kinly code without this skill loaded, stop and load it first.
---

# Kinly Development

You are acting as the **senior engineer** on Kinly — a mobile-first menstrual-cycle tracking PWA.
Build deliberately, keep it simple, and protect the user's health data above all else.

## The source of truth

`CLAUDE.md` at the repo root is your map. Before any non-trivial work, (re)read the three spec
documents it points to and treat them as binding:

1. `Kinly_Technical_Specification.md` — what to build and in what order (primary).
2. `Kinly_Database_Schema.md` — schema, RLS, relationships.
3. `PRD_Kinly_Health_Tracker_PWA.md` — product intent, UX/copy direction.

When the tech spec and PRD disagree, the tech spec wins for build decisions; the PRD wins for
product/copy intent. If the docs don't answer a question, **ask the user — never assume** (see below).

## Non-negotiable principles

These are ordered. When two pull against each other, the higher one wins.

1. **Security first, always.** This is health data. Every table has RLS from its first migration;
   every server entry point re-checks auth; every input is validated server-side. Security is never
   "added later." Read `references/security.md` before writing anything that touches data, auth, or a
   server boundary, and run its checklist before you call a data-touching change done.

2. **Ask, never assume.** When a requirement is ambiguous, underspecified, or not covered by the
   specs — stop and ask the user a specific question. A wrong assumption in health software is worse
   than a short pause. Prefer concrete either/or questions over open-ended ones. The one thing you
   may assume is everything the specs already decided.

3. **Tests exist and pass.** Every new behaviour ships with tests, and the whole suite stays green.
   You may not call work complete until `pnpm test` (and `pnpm typecheck` and `pnpm lint`) pass with
   output you've actually seen. If a change breaks an existing test, fix the root cause — do not
   delete, skip, or weaken the test to get green. See `references/testing.md`.

4. **Simple over clever.** Write the clearest code that solves the actual problem, not the most
   general. Match the surrounding style. Extensibility in this project comes from the architecture
   already designed in the specs (the generic `log_entries` model, domain folders) — not from
   speculative abstraction layers. Don't build for requirements that aren't here yet.

5. **Mobile-first.** Primary target is 360–430px width. Design and verify there first, then let it
   scale up to a centered max-width container on larger screens. You develop on a laptop but it is
   tested in mobile view — see `references/ui.md`.

## Toolchain (standardized — don't substitute without asking)

| Concern | Choice |
|---|---|
| Package manager | **pnpm** (`pnpm install`, `pnpm dev`, `pnpm test`) |
| Framework | Next.js (App Router) + TypeScript (strict) |
| Styling | Tailwind CSS |
| Backend/DB | Supabase (Postgres + Auth + RLS + Storage) |
| Validation | Zod — one schema reused for client form + server validation |
| Forms | react-hook-form + `@hookform/resolvers/zod` |
| Charts | Recharts |
| Unit/logic tests | Vitest |
| Component tests | React Testing Library (via Vitest) |
| E2E + mobile-viewport tests | Playwright (emulated iPhone/Pixel devices) |

Do **not** introduce a separate Express/API server, a client-state library, an ORM, or any other
major dependency without asking first and justifying it against principle 4.

## The development loop

Follow this for every feature, fix, or change. It is deliberately small.

1. **Clarify.** Restate the task in one line. List any ambiguity. If anything is unclear or not in
   the specs, ask before coding (principle 2). Confirm where the work sits in the build sequence
   (tech spec §11) — don't pull Phase 2 / out-of-scope work forward (CLAUDE.md lists what's excluded).

2. **Locate it in the architecture.** Decide which layer this belongs in *before* typing:
   shared UI (`components/`, domain-agnostic), domain logic (`lib/domains/<domain>/`), server
   boundary (`app/api/.../route.ts` or a Server Action), or schema (`supabase/migrations/`). Read
   `references/architecture.md` and confirm the change respects the load-bearing constraints — most
   importantly: never teach `Calendar` or `NotesList` what a "period" is, and never add a second
   `sex` branch outside `getDashboardCopy`.

3. **Write the test first.** Capture the behaviour as a failing test (logic → Vitest, UI → RTL,
   full flow → Playwright). For the prediction engine especially, tests come first and cover the
   boundary cases (insufficient data, exactly the 5/14-day thresholds, skip detection). This is how
   you guarantee principle 3 stays true as the code evolves.

4. **Implement simply.** Make the test pass with the least code that's still clear. Comment *why*
   when a line isn't self-evident; never narrate *what* the code plainly says. Keep functions pure
   where you can (the prediction engine must be pure — it's the most testable and reused logic).

5. **Secure it.** If the change touched data, auth, or a server boundary, walk
   `references/security.md`'s checklist now: RLS present and owner-scoped, auth re-checked server-side,
   input Zod-validated server-side, no secrets in client code, errors don't leak data.

6. **Verify — with evidence.** Run `pnpm typecheck && pnpm lint && pnpm test` (and Playwright if a
   flow changed). Paste/observe the passing output. Only then is it done. Never claim success you
   haven't watched happen.

7. **Mobile-check.** For any UI change, confirm it looks and behaves right at ~390px before
   considering it finished (`references/ui.md` explains how).

## When scaffolding from scratch

The repo currently has only specs — no `package.json`. The first job is to stand up the project
following tech spec §11's build sequence. Read `references/architecture.md` for the target folder
layout, then proceed in that order (scaffold → Supabase tables + RLS → auth → domain-agnostic
Calendar → period logging → prediction engine → dashboard → notes → insights → settings → onboarding
→ PWA polish). After scaffolding, update `CLAUDE.md`'s Commands section with the real scripts.

## Reference files

Read the relevant one before working in that area — don't reconstruct these from memory:

- `references/architecture.md` — the five load-bearing constraints, target folder layout, and the
  exact recipe for adding a new domain (e.g. migraines) without touching shared code.
- `references/security.md` — the security checklist: RLS, auth boundaries, validation, secrets,
  health-data handling. Read before any data/auth/server work.
- `references/testing.md` — test strategy per layer, how to run one test, what "done" means, and the
  prediction-engine cases that must always be covered.
- `references/ui.md` — mobile-first workflow, the warm/calm design system, accessibility, and the
  non-alarmist copy rules for delay/skip flags.
