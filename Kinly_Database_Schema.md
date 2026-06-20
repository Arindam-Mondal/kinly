# Kinly — Database Schema & Entity Relationships

**Document version:** 1.0
**Date:** June 20, 2026
**Platform:** Supabase (Postgres)
**Companion to:** PRD_Kinly_Health_Tracker_PWA.md, Kinly_Architecture_Diagram.html

---

## 0. How to read this document

Every table below is listed with full column definitions, then followed by a plain-language explanation of *why* it exists and how it relates to the others. Tables are grouped into **MVP** (build now) and **Phase 2** (designed for, not built yet) — Phase 2 tables are included here so the MVP schema is built in a way that won't need restructuring when they're added.

At the end: a full Entity Relationship explanation (Section 9) and a visual ER diagram (separate HTML file).

---

## 1. `profiles`

Extends Supabase's built-in `auth.users` table with the app-specific fields the PRD's registration form collects (Section 6.1).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users.id`, `ON DELETE CASCADE` | Same ID as the Supabase Auth user — 1:1 relationship |
| `name` | `text` | `NOT NULL` | Display name |
| `email` | `text` | `NOT NULL`, unique (mirrors `auth.users.email` for convenience) | Kept in sync via trigger on signup |
| `age` | `integer` | `NOT NULL`, `CHECK (age >= 13 AND age <= 120)` | Matches PRD validation range |
| `sex` | `text` | `NOT NULL`, `CHECK (sex IN ('female','male','other','prefer_not_to_say'))` | Drives the dashboard copy branch (Section 7.5 of PRD) |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Updated via trigger on row change |

**Status:** MVP

---

## 2. `log_entries`

The generic, extensible event log — the core of the entire data model. Every loggable thing in the app (a period, eventually a migraine, a standalone note) is a row here.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, `DEFAULT gen_random_uuid()` | |
| `user_id` | `uuid` | `NOT NULL`, FK → `profiles.id`, `ON DELETE CASCADE` | Owner of this entry |
| `domain` | `text` | `NOT NULL`, `CHECK (domain IN ('period','migraine','note'))` | Extensible — add values as new domains ship; no column changes needed |
| `start_date` | `date` | `NOT NULL` | For a period: the first day. For a single-day note: that day. |
| `end_date` | `date` | nullable, `CHECK (end_date IS NULL OR end_date >= start_date)` | Null for single-day entries (e.g., most notes, a migraine episode logged as one day) |
| `notes` | `text` | nullable, `CHECK (char_length(notes) <= 1000)` | Free-text, per PRD Section 7.3 cap |
| `metadata` | `jsonb` | nullable, `DEFAULT '{}'::jsonb` | Domain-specific structured fields (see below) |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `(user_id, domain, start_date)` — composite, supports the most common query: "this user's period entries, ordered by date," used by both the Calendar and the prediction engine.
- `(user_id, start_date)` — supports the Notes/Journal screen's chronological listing across all domains.

**`metadata` shape by domain** (not enforced at the DB level — validated in application code, since `jsonb` is intentionally flexible):
- `domain = 'period'`: metadata typically empty `{}` in MVP; reserved for future fields like flow intensity (`{ "flow": "light" | "medium" | "heavy" }`) — Phase 2.
- `domain = 'migraine'` (Phase 2): `{ "intensity": 1-10, "triggers": ["stress","caffeine"], "medication_taken": "..." }`.
- `domain = 'note'`: metadata typically empty; the entry exists mainly for its `notes` text and `start_date`.

**Status:** MVP (with `migraine` domain value reserved for Phase 2 — no schema change needed when that ships, just new rows and new application logic)

---

## 3. `cycle_predictions` *(recommended addition — see note below)*

A small cache table holding the most recently computed prediction per user, so the dashboard doesn't need to recompute the rolling average from scratch on every page load.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `user_id` | `uuid` | PK, FK → `profiles.id`, `ON DELETE CASCADE` | One row per user — always the latest prediction |
| `avg_cycle_length` | `numeric(4,1)` | nullable | Rolling 6-cycle average, in days |
| `avg_period_duration` | `numeric(4,1)` | nullable | Rolling 6-cycle average, in days |
| `predicted_next_start` | `date` | nullable | Computed: last period start + avg_cycle_length |
| `status` | `text` | `NOT NULL DEFAULT 'insufficient_data'`, `CHECK (status IN ('insufficient_data','on_track','running_late','significant_delay','possible_skip'))` | Drives the delay/skip flag UI (PRD Section 7.6) |
| `last_computed_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |

**Why this table, even though it's derived data:** the PRD's prediction logic (Section 7.6) is cheap to compute (it's arithmetic over at most 6 rows), so this table is **not required** for correctness — you could compute it on-demand in a Route Handler every time, with no caching at all, and that would work fine at MVP scale. I'm including it as a **recommended optimization**, not a hard requirement, because:
- It lets the dashboard render the header card instantly without a recomputation query.
- It gives you a natural place to trigger Phase 2 push notifications from (a row changing status to `running_late` is an easy thing to watch for and notify on).

**[DECISION NEEDED]:** Include this cache table in MVP, or skip it and compute predictions on-the-fly in application code, adding this table only when/if performance or notifications make it worthwhile? Either is reasonable — flagged so you can decide before build.

**Status:** Optional in MVP / recommended by Phase 2

---

## 4. `profile_links` *(Phase 2)*

Supports the future family/linked-account feature (e.g., a husband's account linked to his wife's, so he can view her data and receive notifications without logging entries himself).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, `DEFAULT gen_random_uuid()` | |
| `owner_user_id` | `uuid` | `NOT NULL`, FK → `profiles.id`, `ON DELETE CASCADE` | The person whose data is being shared |
| `linked_user_id` | `uuid` | `NOT NULL`, FK → `profiles.id`, `ON DELETE CASCADE` | The person granted access |
| `relationship` | `text` | nullable | Free text or enum, e.g., `"spouse"`, `"parent"`, `"caregiver"` — descriptive only |
| `permission_level` | `text` | `NOT NULL DEFAULT 'view_and_notify'`, `CHECK (permission_level IN ('view_only','view_and_notify'))` | Controls whether the linked user just sees a read-only view, or also gets notifications |
| `status` | `text` | `NOT NULL DEFAULT 'pending'`, `CHECK (status IN ('pending','accepted','revoked'))` | Owner must accept a link request — see Section 9.3 |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |

**Constraint:** unique on `(owner_user_id, linked_user_id)` — no duplicate links between the same two people.

**Status:** Phase 2 — not built in MVP, but the table is fully specified now so RLS additions are additive, not a redesign (see PRD Section 8.1).

---

## 5. `report_analyses` *(Phase 2 — AI report analysis feature)*

Tracks an uploaded health report (e.g., a lab result PDF) through the asynchronous AI-analysis pipeline described in the architecture diagram.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, `DEFAULT gen_random_uuid()` | |
| `user_id` | `uuid` | `NOT NULL`, FK → `profiles.id`, `ON DELETE CASCADE` | |
| `file_path` | `text` | `NOT NULL` | Path within Supabase Storage |
| `original_filename` | `text` | nullable | For display in the UI |
| `status` | `text` | `NOT NULL DEFAULT 'pending'`, `CHECK (status IN ('pending','processing','complete','failed'))` | |
| `result` | `jsonb` | nullable | Structured findings returned by Claude once analysis completes |
| `error_message` | `text` | nullable | Populated only if `status = 'failed'` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |
| `completed_at` | `timestamptz` | nullable | |

**Status:** Phase 2

---

## 6. `data_exports` *(optional, supports PRD Section 9.3)*

A lightweight audit/record table for the "Export my data" feature — not strictly required (you could generate an export on-demand with no record of it), but useful if you want to rate-limit exports, show export history, or support large async exports later.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, `DEFAULT gen_random_uuid()` | |
| `user_id` | `uuid` | `NOT NULL`, FK → `profiles.id`, `ON DELETE CASCADE` | |
| `file_path` | `text` | nullable | Set once the export file is generated, if stored rather than streamed directly |
| `status` | `text` | `NOT NULL DEFAULT 'pending'`, `CHECK (status IN ('pending','ready','failed'))` | |
| `requested_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |

**[DECISION NEEDED]:** Skip this table entirely for MVP and just generate the JSON export synchronously in a Route Handler with no DB record? Recommended for MVP simplicity — add this table only if export volume or file size later requires async generation.

**Status:** Optional / likely deferred past MVP

---

## 7. Tables NOT needed (and why)

To keep the schema honest and avoid over-building, a few tables you might expect are deliberately **not** included:

- **No separate `periods` table.** Periods are just `log_entries` rows where `domain = 'period'`. A dedicated table would duplicate the generic entry model the PRD's extensibility architecture (Section 8) is built around.
- **No separate `notes` table.** Same reasoning — a standalone note is a `log_entries` row with `domain = 'note'` and no `end_date`. A note attached to a period is just a `log_entries` row's own `notes` column; it doesn't need a separate child table.
- **No `sessions` table.** Supabase Auth handles session/JWT management internally — the app never needs to model this itself.
- **No `notifications` table in MVP.** Push notifications are Phase 2 (PRD Section 3); when built, this would likely be a `notification_log` table recording what was sent and when, added at that time rather than speculatively now.

---

## 8. Full Schema — Combined SQL Reference

```sql
-- ========== MVP ==========

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

create index idx_log_entries_user_domain_date
  on log_entries (user_id, domain, start_date);

create index idx_log_entries_user_date
  on log_entries (user_id, start_date);

-- ========== Recommended (optional in MVP) ==========

create table cycle_predictions (
  user_id uuid primary key references profiles(id) on delete cascade,
  avg_cycle_length numeric(4,1),
  avg_period_duration numeric(4,1),
  predicted_next_start date,
  status text not null default 'insufficient_data'
    check (status in ('insufficient_data','on_track','running_late','significant_delay','possible_skip')),
  last_computed_at timestamptz not null default now()
);

-- ========== Phase 2 ==========

create table profile_links (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references profiles(id) on delete cascade,
  linked_user_id uuid not null references profiles(id) on delete cascade,
  relationship text,
  permission_level text not null default 'view_and_notify'
    check (permission_level in ('view_only','view_and_notify')),
  status text not null default 'pending'
    check (status in ('pending','accepted','revoked')),
  created_at timestamptz not null default now(),
  unique (owner_user_id, linked_user_id)
);

create table report_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  file_path text not null,
  original_filename text,
  status text not null default 'pending'
    check (status in ('pending','processing','complete','failed')),
  result jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table data_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  file_path text,
  status text not null default 'pending'
    check (status in ('pending','ready','failed')),
  requested_at timestamptz not null default now()
);
```

---

## 9. Entity Relationships — Detailed Explanation

### 9.1 The core relationship: `profiles` → `log_entries` (one-to-many)

This is the backbone of the entire app.

- **One `profiles` row has many `log_entries` rows.** Every period a user logs, every note they write — all of it lives in `log_entries`, linked back via `user_id`.
- The relationship is enforced with `ON DELETE CASCADE`: if a user deletes their account, every one of their `log_entries` rows is automatically deleted with them. This satisfies the PRD's "Delete all my data" requirement (Section 6.3) without needing application code to manually clean up — the database guarantees it.
- `domain` is what makes this one relationship serve multiple features. There's no separate foreign key or table per feature — a period, a future migraine entry, and a standalone note are all the *same kind of row*, distinguished only by this one column. This is the literal implementation of the PRD's "Loggable Entry" abstraction (Section 8.1).

**Why one-to-many and not many-to-many:** a log entry belongs to exactly one user. There's no scenario in MVP where one entry needs to be associated with multiple users — that's precisely what `profile_links` (Phase 2) handles differently and deliberately: rather than letting two users *share* a row, a linked user gets *read access* to another user's existing rows via a permissions table. This keeps `log_entries` simple and avoids ambiguous ownership.

### 9.2 `profiles` → `cycle_predictions` (one-to-one)

- Each user has **at most one** `cycle_predictions` row, which is why `user_id` is the primary key here rather than a separate `id` column with a unique constraint — it directly enforces the one-to-one relationship at the schema level.
- This row is **derived, not authoritative** — it's a cache of a calculation performed from `log_entries` data. If it were ever deleted or got out of sync, it could be fully recomputed from `log_entries` alone. This is an important distinction for whoever builds the prediction engine: never write business logic that treats `cycle_predictions` as a source of truth — `log_entries` is the only source of truth in this schema. `cycle_predictions` is just there to make reads fast.
- It gets recalculated and upserted every time a relevant `log_entries` row (domain = `period`) is inserted, updated, or deleted — this should happen in the same Server Action / Route Handler call that writes the period (see the request-flow diagram from the architecture doc), not in a separate background job, since the computation is cheap.

### 9.3 `profiles` ↔ `profiles` via `profile_links` (many-to-many, Phase 2)

- This is the one genuinely many-to-many relationship in the schema: a single user could in principle be linked *to* multiple other people's profiles (a husband linked to both his wife's and, say, his mother's accounts), and a single profile could be linked *from* multiple viewers (a wife linked to both her husband and her own mother).
- That's why `profile_links` is a proper **junction table** with two foreign keys back to `profiles` (`owner_user_id` and `linked_user_id`), rather than a single nullable "linked_to" column on `profiles` itself — a single column could only ever represent one link per user, which doesn't fit the relationship's real shape.
- The `status` column (`pending` / `accepted` / `revoked`) matters for a privacy-sensitive feature like this: a link shouldn't grant access the moment it's requested — the owner needs to explicitly accept it. The Row Level Security policy that grants read access (Section 10 below) checks for `status = 'accepted'` specifically, so a pending or revoked link grants nothing.
- The unique constraint on `(owner_user_id, linked_user_id)` prevents duplicate link requests between the same pair of people cluttering the table.

### 9.4 `profiles` → `report_analyses` (one-to-many, Phase 2)

- Same shape as `profiles` → `log_entries`: one user can upload and analyze many reports over time.
- This is deliberately a **separate table from `log_entries`**, not another `domain` value — a report analysis isn't really a calendar-dated event the way a period or migraine is; it's a document-processing job with its own lifecycle (`pending` → `processing` → `complete`/`failed`) that the generic `log_entries` shape doesn't naturally fit. Forcing it into `log_entries` would mean stuffing job-status fields into `metadata` and overloading what that table means — better to keep it as its own clean, single-purpose table.
- If a completed report analysis surfaces something the user wants saved alongside their health timeline (e.g., "doctor visit on this date, see attached report"), that connection would be made by *also* creating a `log_entries` row (likely `domain = 'note'`) that references the same date, rather than merging the two tables together — keeping each table's responsibility singular.

### 9.5 `profiles` → `data_exports` (one-to-many, optional)

- Simple audit trail, same one-to-many shape as above. Not relationally interesting — included mainly so export requests can be tracked if you choose to build it that way.

### 9.6 Summary diagram of relationships (text form)

```
auth.users (Supabase-managed)
   │ 1:1
   ▼
profiles
   │
   ├── 1:many ──▶ log_entries          (domain: period | migraine | note)
   │
   ├── 1:1     ──▶ cycle_predictions   (derived cache, Phase 2-friendly recommended)
   │
   ├── 1:many ──▶ report_analyses      (Phase 2)
   │
   ├── 1:many ──▶ data_exports         (optional)
   │
   └── many:many ──▶ profiles          (via profile_links, Phase 2 — self-referencing junction)
```

---

## 10. Row Level Security (RLS) Policies

RLS is enabled on **every table without exception** — this is non-negotiable for health data on a shared Postgres instance.

```sql
-- profiles: a user can only see/edit their own profile
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- log_entries: a user can only see/write their own entries
alter table log_entries enable row level security;

create policy "Users can view own log entries"
  on log_entries for select using (auth.uid() = user_id);

create policy "Users can insert own log entries"
  on log_entries for insert with check (auth.uid() = user_id);

create policy "Users can update own log entries"
  on log_entries for update using (auth.uid() = user_id);

create policy "Users can delete own log entries"
  on log_entries for delete using (auth.uid() = user_id);

-- cycle_predictions: same pattern, read/write own row only
alter table cycle_predictions enable row level security;

create policy "Users can view own predictions"
  on cycle_predictions for select using (auth.uid() = user_id);

create policy "Users can upsert own predictions"
  on cycle_predictions for all using (auth.uid() = user_id);

-- ===== Phase 2 additions (do not affect the policies above) =====

-- profile_links: visible to either party in the link
alter table profile_links enable row level security;

create policy "Participants can view their links"
  on profile_links for select
  using (auth.uid() = owner_user_id or auth.uid() = linked_user_id);

create policy "Owner can manage their links"
  on profile_links for all
  using (auth.uid() = owner_user_id);

-- log_entries: ADDITIONAL policy granting linked viewers read access
-- (added alongside the existing owner policy above, not replacing it)
create policy "Linked viewers can read shared entries"
  on log_entries for select
  using (
    exists (
      select 1 from profile_links
      where profile_links.owner_user_id = log_entries.user_id
        and profile_links.linked_user_id = auth.uid()
        and profile_links.status = 'accepted'
    )
  );

-- report_analyses: owner only
alter table report_analyses enable row level security;

create policy "Users can view own report analyses"
  on report_analyses for select using (auth.uid() = user_id);

create policy "Users can insert own report analyses"
  on report_analyses for insert with check (auth.uid() = user_id);

-- data_exports: owner only
alter table data_exports enable row level security;

create policy "Users can view own export requests"
  on data_exports for select using (auth.uid() = user_id);

create policy "Users can insert own export requests"
  on data_exports for insert with check (auth.uid() = user_id);
```

**Important note on the Phase 2 `log_entries` policy:** Postgres RLS policies for the same operation (`select`) are combined with **OR** — so adding the "Linked viewers can read shared entries" policy *extends* access (a linked viewer can now also read) without weakening or replacing the original "Users can view own log entries" policy. This is exactly the additive behavior the PRD promised in Section 8.1 — no existing policy needs to be rewritten when this feature ships.

---

## 11. Open Decisions Summary (schema-specific)

1. **Include `cycle_predictions` in MVP**, or compute predictions on-the-fly and add this table later? (Section 3) — no wrong answer; affects whether prediction logic needs a write-back step on every period save.
2. **Include `data_exports` in MVP**, or generate exports synchronously with no DB record? (Section 6) — recommend skipping for MVP simplicity.
3. Confirm the `domain` check constraint values (`'period','migraine','note'`) are the right starting set — easy to extend later by altering the constraint, but worth confirming now.

---

*End of schema document.*
