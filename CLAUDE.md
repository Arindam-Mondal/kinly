# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current State

Build-sequence steps 1–3 are done: the Next.js app is **scaffolded**, the **Supabase schema
(`profiles` + `log_entries`) with owner-scoped RLS** is migrated and tested, and the **auth flows**
(register / login / forgot-password / reset-password / sign-out) are built and gated by middleware.
The app boots/builds/lints/typechecks; the test suite (validation, password strength, register form,
RLS isolation, profile trigger) is green. Next is build-sequence step 4 (the domain-agnostic Calendar
component).

**Auth approach (decided):** email confirmation is OFF (auto-confirm — `config.toml`
`auth.email.enable_confirmations = false`); the `profiles` row is created by the `handle_new_user`
DB trigger from sign-up metadata, not by client code. Both are switchable later without app changes.
Auth logic lives in `app/(auth)/actions.ts` (Server Actions) with Zod validation reused client+server
(`lib/validation/auth.ts`); session refresh + route gating is in `middleware.ts`.

**Use the `kinly-dev` skill for all development work here** (`.claude/skills/kinly-dev/`) — it carries
the workflow, security checklist, testing strategy, and architecture rules in depth.

Specification documents (read in this priority order):
1. **`Kinly_Technical_Specification.md`** — the source of truth for *what to build and in what order*. Start here. It is self-contained.
2. **`Kinly_Database_Schema.md`** — full column-by-column schema, RLS policies, and entity-relationship reasoning.
3. **`PRD_Kinly_Health_Tracker_PWA.md`** — product rationale, UX/copy direction, persona context, and the reasoning behind decisions (consult when the tech spec points to it).

Visual references: `Kinly_Architecture_Diagram.html` (request-flow diagrams) and `Kinly_ER_Diagram.html`
(entity relationships) are present in the repo root.

When the tech spec and PRD disagree, the **tech spec wins** for build decisions; the PRD wins for product/copy intent.

> **Next.js 16 / React 19 caveat:** this scaffold uses Next.js 16.2.9 and React 19.2.4 — newer than
> many training cutoffs, with breaking changes from earlier Next. Before writing Next-specific code,
> consult `AGENTS.md` and the bundled docs under `node_modules/next/dist/docs/`. Don't assume older
> App Router conventions.

## Project Summary

Kinly is a mobile-first PWA for menstrual cycle tracking. Every user logs through the same calendar, sees the same predictions/analytics, and writes the same notes. The **only** sex-specific behavior is a copy change on the home dashboard (male users see neutral alert-style framing instead of first-person "your cycle" language).

## Intended Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS |
| Backend / DB | Supabase (Postgres, Auth, Row Level Security, Storage) |
| Charts | Recharts |
| PWA | `next-pwa` (or manual manifest + service worker) |
| Supabase clients | `@supabase/supabase-js` (browser), `@supabase/ssr` (server components / route handlers) |

**Do not introduce a separate Express/API server.** All server-side logic lives in Next.js Route Handlers and Server Actions talking directly to Supabase. (Reasoning: PRD Section 9.1.)

## Commands

Package manager is **pnpm**, run via Corepack (no global install — the shim couldn't be written to
`Program Files`). Prefix commands with `corepack` if a bare `pnpm` isn't on PATH:

```bash
corepack pnpm install        # install dependencies
corepack pnpm dev            # dev server (http://localhost:3000)
corepack pnpm build          # production build
corepack pnpm typecheck      # tsc --noEmit
corepack pnpm lint           # eslint
corepack pnpm test           # run the full Vitest suite (the gate)
corepack pnpm test:watch     # Vitest in watch mode
corepack pnpm test <pattern> # run a single test file, e.g. `pnpm test periodInsights`
```

"Done" means `typecheck && lint && test` all pass. Run the **full** `test` before declaring anything
complete. Playwright (e2e + mobile-viewport) is added with the first real user flow; specs live in `e2e/`.

### Local Supabase

The CLI is a dev dependency, run via Corepack. Schema lives in `supabase/migrations/`.

```bash
corepack pnpm exec supabase start            # boot the local stack (Docker)
corepack pnpm exec supabase status           # URLs + keys (local demo keys, non-secret)
corepack pnpm exec supabase migration new <name>   # create a migration file
corepack pnpm exec supabase db reset         # re-apply all migrations to a fresh local DB
corepack pnpm exec supabase gen types typescript --local > lib/types/database.ts
corepack pnpm exec supabase db advisors --local --type all --level info --fail-on none
```

**Windows/Docker note:** `storage` and `analytics` are disabled in `supabase/config.toml`
because their containers fail health checks here (analytics needs the Docker daemon on
tcp://localhost:2375; storage was flaky). Neither is needed for current work — re-enable
`storage` when Phase 2 report uploads begin. `db reset` can also be flaky on the older
local Docker; if it errors mid-run, recover with `supabase stop --no-backup && supabase start`.

`.env.local` holds the local keys (gitignored); copy `.env.example` and fill from `supabase status`.
Connect from app code via `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server).

**pnpm build-scripts note:** `pnpm-workspace.yaml` sets `allowBuilds: { sharp: false, unrs-resolver:
false }` (we intentionally skip those native builds — Next falls back fine) and
`verifyDepsBeforeRun: false`. Don't delete these or `pnpm` re-prompts and scripts start exiting
non-zero.

## Architecture: the constraints that span files

The whole design exists to support adding a second domain (migraines) and family/linked accounts later **without restructuring the core app**. These constraints are load-bearing — do not design around them casually.

**1. The "Loggable Entry" abstraction is the core of the data model.** There is no `periods` table and no `notes` table. Every loggable thing — a period, a future migraine episode, a standalone note — is a row in a single generic `log_entries` table, distinguished only by a `domain` column (`'period' | 'migraine' | 'note'`). A note *about a period* is that period row's own `notes` column; a *standalone* note is its own row with `domain = 'note'` and `end_date = null`. Domain-specific fields go in the flexible `metadata` jsonb column (validated in app code, not at the DB level).

**2. Shared components stay domain-agnostic.** `components/calendar/Calendar.tsx` and `components/notes/NotesList.tsx` must have **no knowledge of what a "period" is** — they receive entries plus a render config (colors/labels) as props. Domain-specific business logic (predictions, flagging, charts) lives in `lib/domains/<domain>/` (e.g. `lib/domains/period/periodInsights.ts`), one folder per domain. The litmus test: adding the migraine domain should require only new files (`lib/domains/migraine/`, new views reusing the shared components, a new `domain` value in the check constraint) — **zero changes** to `profiles`, the core `log_entries` columns, or the shared components. If a change seems to require touching those, stop and reconsider.

**3. Sex affects exactly one thing.** The only sex-based branch in the entire app is dashboard header copy, isolated in `components/dashboard/getDashboardCopy.ts` — a single function, not conditionals scattered across the dashboard. Calendar, Insights, Notes, and Settings are byte-for-byte identical regardless of sex. Insights/analytics copy is deliberately domain-descriptive ("cycle length," not "your cycle") so it reads correctly whether someone logs for themselves or a partner. If a future requirement seems to need another `sex` branch, treat that as a signal to revisit the PRD, not to add an ad-hoc conditional.

**4. The prediction engine is pure, testable, and runs synchronously on write.** Implement `lib/domains/period/periodInsights.ts` as a pure module over `log_entries` rows (`domain = 'period'`, ordered by `start_date`). It must be callable from both a Server Component (initial render) and a Route Handler (refetch after save). Recompute on every period save/edit/delete in the same Server Action that wrote the change — it's arithmetic over at most 6 rows; do **not** defer to a background job. `log_entries` is the only source of truth; the optional `cycle_predictions` table is a derived cache that must never be treated as authoritative.

**5. RLS is mandatory from the first migration.** Every table has Row Level Security enabled in `0001_init.sql` — do not defer it. Base policy is owner-only (`auth.uid() = user_id`). Phase 2's linked-viewer access is an *additive* `select` policy on `log_entries` (Postgres OR-combines same-operation policies), never a rewrite of the base policy.

### Prediction logic specifics
- `cycleLength` = days between consecutive period start dates. `avgCycleLength` = rolling average of the last 6 cycle pairs (min 2 periods needed before any prediction shows).
- `avgPeriodDuration` = rolling average of `(end_date − start_date + 1)` over last 6 periods.
- `predictedNextStart` = most recent period start + `avgCycleLength`.
- Status flags by `daysSincePredicted`: `≤4` → `on_track`; `5–13` → `running_late`; `≥14` → `significant_delay`; a full extra cycle elapsed with nothing logged → `possible_skip`; `<2` periods → `insufficient_data`.
- **Tone is a hard constraint:** flags are always informational, never alarmist, never all-caps, never imply a diagnosis. Significant-delay copy ends with a *soft, non-pushy* suggestion to consult a provider if the pattern continues — never an imperative.

## Build Sequence

Follow the ordered sequence in `Kinly_Technical_Specification.md` Section 11: scaffold → Supabase tables + RLS → auth flows → domain-agnostic `Calendar` → period logging → prediction engine → Home Dashboard (`getDashboardCopy`) → `NotesList` + Notes screen → Insights (Recharts) → Settings → onboarding → polish (empty states, PWA install prompt, offline write queue, Lighthouse pass).

## Explicitly out of scope for MVP

Do not build these even when working on something adjacent: caretaker/observer mode or any second dashboard variant; `profile_links` / linked accounts; push notifications; AI report analysis (`report_analyses`, `/api/reports/analyze` — the route file may exist as an empty stub only); the migraine domain itself (only the folder *convention* should exist). Several open `[DECISION NEEDED]` items (cache table vs. live compute, prediction window, delay thresholds) are catalogued in each doc's "Open Decisions" section — none block starting the build.
