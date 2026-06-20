# Architecture Reference

The whole design exists so that a second domain (migraines) and family/linked accounts can be added
later **without restructuring the core app**. These constraints are load-bearing. Read them before
working in any of the affected areas; if a change seems to require violating one, stop and reconsider
the approach (and ask the user) rather than working around it.

## Contents
- [The five constraints](#the-five-constraints)
- [Target folder layout](#target-folder-layout)
- [Data model](#data-model)
- [Recipe: adding a new domain](#recipe-adding-a-new-domain)
- [Where server logic lives](#where-server-logic-lives)

## The five constraints

**1. One generic `log_entries` table is the core of the data model.**
There is no `periods` table and no `notes` table. A period, a future migraine episode, and a
standalone note are all rows in `log_entries`, distinguished only by a `domain` column
(`'period' | 'migraine' | 'note'`). Domain-specific fields live in the flexible `metadata` jsonb
column (validated in app code with Zod, not at the DB level). A note *about* a period is that period
row's own `notes` column; a *standalone* note is its own row with `domain = 'note'` and
`end_date = null`.

**2. Shared components are domain-agnostic.**
`components/calendar/Calendar.tsx` and `components/notes/NotesList.tsx` must have **no knowledge of
what a "period" is**. They receive entries plus a render config (colors/labels/rules) as props.
Domain-specific business logic lives in `lib/domains/<domain>/`, one folder per domain. The litmus
test for any change: adding the migraine domain later should require only new files — zero edits to
`profiles`, the core `log_entries` columns, or these shared components.

**3. `sex` affects exactly one thing.**
The only sex-based branch in the entire app is dashboard header copy, isolated in
`components/dashboard/getDashboardCopy.ts` — a single pure function, not conditionals sprinkled
through the dashboard. Calendar, Insights, Notes, and Settings are identical regardless of sex.
Insights copy is domain-descriptive ("cycle length," not "your cycle") so it reads correctly whether
someone logs for themselves or a partner. If a new requirement seems to need another `sex` branch,
that's a signal to revisit the PRD with the user — not to add an ad-hoc conditional.

**4. The prediction engine is pure, synchronous, and runs on write.**
`lib/domains/period/periodInsights.ts` is a pure module over `log_entries` rows
(`domain = 'period'`, ordered by `start_date`). It must be callable from both a Server Component
(initial render) and a Route Handler (refetch after save). Recompute on every period
save/edit/delete inside the same Server Action that wrote the change — it's arithmetic over at most
6 rows, so there is no background job. `log_entries` is the only source of truth; the optional
`cycle_predictions` table is a derived cache that must never be treated as authoritative.

**5. RLS is mandatory from the first migration.**
Every table enables Row Level Security in `0001_init.sql`. Base policy is owner-only
(`auth.uid() = user_id`). Phase 2's linked-viewer access is an *additive* `select` policy (Postgres
OR-combines same-operation policies), never a rewrite of the base policy. See `security.md`.

## Target folder layout

From tech spec §3. Build toward this; don't invent a different structure.

```
kinly/
├── app/
│   ├── (auth)/{login,register,forgot-password}/page.tsx
│   ├── (app)/                      # authenticated routes, share bottom-nav layout
│   │   ├── layout.tsx              # bottom nav + top bar shell
│   │   └── {home,calendar,insights,notes,settings}/page.tsx
│   ├── onboarding/page.tsx
│   ├── api/
│   │   ├── log-entries/route.ts    # CRUD for log_entries
│   │   ├── predictions/route.ts    # GET computed/cached prediction
│   │   ├── export/route.ts         # GET data export as JSON
│   │   └── reports/analyze/route.ts# Phase 2 STUB only — do not implement
│   ├── layout.tsx
│   └── manifest.ts                 # PWA manifest
├── components/
│   ├── calendar/{Calendar,DayDetailSheet}.tsx, calendarUtils.ts   # domain-agnostic
│   ├── notes/NotesList.tsx                                        # domain-agnostic
│   ├── dashboard/{HeaderCard.tsx, getDashboardCopy.ts}           # the sex branch lives here
│   ├── insights/{CycleLengthChart,PeriodDurationChart,HistoryHeatmap}.tsx
│   └── ui/                          # shared buttons, bottom sheets, cards
├── lib/
│   ├── supabase/{client,server}.ts  # browser client / SSR + route-handler client
│   ├── domains/
│   │   ├── period/{periodInsights,periodConfig}.ts
│   │   └── README.md                # how to add a domain (mirror this file's recipe)
│   └── types/logEntry.ts
├── public/icons/                    # PWA icons, multiple sizes + maskable
└── supabase/migrations/0001_init.sql # profiles, log_entries, RLS
```

`lib/domains/period/` is deliberately isolated so `lib/domains/migraine/` can be added as a sibling
later, reusing the shared components unchanged.

## Data model

Build these two tables first; everything else is additive. Full column detail and the optional
`cycle_predictions` cache table are in `Kinly_Database_Schema.md` — read it before writing a
migration.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  age integer not null check (age >= 13 and age <= 120),
  sex text not null check (sex in ('female','male','other','prefer_not_to_say')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  domain text not null check (domain in ('period','migraine','note')),
  start_date date not null,
  end_date date check (end_date is null or end_date >= start_date),
  notes text check (char_length(notes) <= 1000),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_log_entries_user_domain_date on log_entries (user_id, domain, start_date);
create index idx_log_entries_user_date on log_entries (user_id, start_date);
```

`ON DELETE CASCADE` on `user_id` is what satisfies the PRD's "delete all my data" requirement with no
application cleanup code. Don't replace it with manual deletion.

## Prediction logic (the spec to test against)

- `cycleLength` = days between consecutive period start dates.
- `avgCycleLength` = rolling average of the last 6 cycle pairs; need ≥2 periods before any prediction.
- `avgPeriodDuration` = rolling average of `(end_date − start_date + 1)` over the last 6 periods.
- `predictedNextStart` = most recent period start + `avgCycleLength`.
- Status by `daysSincePredicted`: `≤4`→`on_track`; `5–13`→`running_late`; `≥14`→`significant_delay`;
  a full extra cycle elapsed with nothing logged→`possible_skip`; `<2` periods→`insufficient_data`.

These exact thresholds are flagged `[DECISION NEEDED]` in the specs — if the user hasn't confirmed
them, ask before hardcoding, but default to these.

## Recipe: adding a new domain

When the migraine domain (or any future domain) is built, the *entire* expected diff is:

1. Add the new value to the `log_entries.domain` check constraint (a small additive migration).
2. Create `lib/domains/<domain>/` with its own insights/config modules and its own `metadata` Zod
   schema — used only by that domain's rows.
3. Add new dashboard/insights views that **reuse** `Calendar` and `NotesList` by passing a different
   render config — no edits to those components.

If implementing a new domain requires touching `profiles`, the core `log_entries` columns, or the
shared components, stop — the approach is wrong. Mirror this recipe in `lib/domains/README.md` when
you scaffold.

## Where server logic lives

No separate API server. All server-side logic is Next.js Route Handlers and Server Actions talking
directly to Supabase via `lib/supabase/server.ts`. Use the browser client (`lib/supabase/client.ts`)
only for things that are safe under RLS from the client; route anything sensitive or aggregated
(prediction computation, export) through the server.
