# Security Reference

Kinly stores menstrual and health data. A leak here is not an inconvenience — it's a serious harm to
a real person. Security is principle #1 for a reason: when it conflicts with convenience, speed, or
elegance, security wins. Read this before writing anything that touches data, authentication, or a
server boundary, and run the checklist before calling such a change done.

## The mental model

Two layers defend every byte of user data, and you maintain **both**:

1. **Database layer — RLS.** Postgres Row Level Security is the last line of defense and the one that
   can't be bypassed by an application bug. Every table has it; the base policy scopes every row to
   its owner via `auth.uid()`. Even if the app code is wrong, RLS keeps user A from reading user B.

2. **Application layer — auth + validation.** Never *rely* solely on RLS. Every server entry point
   re-establishes who the user is and validates what they sent, because defense in depth means a
   single mistake in one layer doesn't expose data.

## RLS rules

- Enable RLS on every table in the same migration that creates it. Never "turn it on later."
- Base policies are owner-only. For `log_entries`:

  ```sql
  alter table log_entries enable row level security;
  create policy "Users can view own log entries"   on log_entries for select using (auth.uid() = user_id);
  create policy "Users can insert own log entries" on log_entries for insert with check (auth.uid() = user_id);
  create policy "Users can update own log entries" on log_entries for update using (auth.uid() = user_id);
  create policy "Users can delete own log entries" on log_entries for delete using (auth.uid() = user_id);
  ```

- Phase 2's linked-viewer access is an **additional** `select` policy, never an edit to the base one
  (Postgres OR-combines same-operation policies). Don't pre-build it, but don't write the base policy
  in a way that would have to be rewritten for it.
- After writing or changing any policy, add/keep an integration test that proves user A cannot read,
  update, or delete user B's rows (see `testing.md`). RLS regressions are silent and catastrophic —
  a test is the only thing that catches them.

## Auth boundaries

- In every Route Handler and Server Action that touches data, get the user from the **server**
  Supabase client and treat a missing/invalid session as a hard stop (return 401 / redirect to
  login) before doing anything else.
- Never trust a `user_id` (or any identity) sent from the client. Derive it server-side from the
  authenticated session and use that. A client-supplied id is an IDOR waiting to happen.
- Passwords are handled entirely by Supabase Auth — never store, log, or handle raw passwords. Use
  Supabase's built-in reset-email flow for "forgot password."
- Keep the Supabase **service-role key** server-only and out of the repo. Only the anon/public key
  may reach the browser. If a feature seems to need the service key client-side, the design is wrong —
  rethink it.

## Input validation

- Validate every input server-side with Zod, even when a client form already validated it — the
  client check is UX, the server check is security. Reuse one schema for both so they can't drift.
- Enforce the domain rules at the boundary: `domain` is one of the allowed values, `end_date >=
  start_date` or null, `notes` ≤ 1000 chars, `age` 13–120, `sex` in the allowed set. The DB has
  these constraints too — validate in app code anyway so users get clean errors instead of raw DB
  failures, and so bad data never reaches the DB.
- Validate `metadata` against the per-domain Zod schema before writing. `jsonb` is intentionally
  unenforced at the DB level, so app-side validation is the only guard on its shape.

## Secrets & configuration

- Secrets live in `.env.local` (gitignored), never in code, never in client bundles. Only variables
  prefixed `NEXT_PUBLIC_` reach the browser — never give that prefix to anything sensitive.
- Before committing, confirm no key, token, or connection string is staged.

## Health-data handling

- No third-party analytics, ad, or session-replay SDKs that could capture health/period data. The
  PRD forbids this explicitly.
- Don't log entry contents, notes, or health values to the console or to server logs.
- Error responses must not leak data or internal detail — return a generic message to the client and
  keep specifics in server-side logs only (without health values).
- The "delete account" flow relies on `ON DELETE CASCADE`; verify a deletion actually removes all of
  a user's `log_entries`, and keep a test for it. "Delete my data" is a promise, not a best-effort.

## Checklist — run before calling a data/auth/server change done

- [ ] Every touched table has RLS enabled and an owner-scoped policy.
- [ ] A test proves cross-user access is denied for the touched table(s).
- [ ] The server entry point re-checks the session and rejects unauthenticated requests.
- [ ] `user_id`/identity is derived server-side, never taken from the client.
- [ ] All inputs (including `metadata`) are Zod-validated server-side.
- [ ] No secrets, service-role keys, or connection strings in client code or the commit.
- [ ] No health data in logs, analytics, or error responses.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` pass with output you've seen.
