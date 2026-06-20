# Testing Reference

The rule from the SKILL: every new behaviour ships with tests, and the whole suite stays green at all
times. Tests are how the project's promises (correct predictions, RLS isolation, working flows) stay
true as the code changes. A passing suite is the definition of "done" — not a nice-to-have.

## The three layers and what each is for

| Layer | Tool | Use it for |
|---|---|---|
| Logic / pure functions | **Vitest** | The prediction engine, `getDashboardCopy`, `calendarUtils`, Zod schemas, any pure helper. This is where most tests live because the hardest logic is pure. |
| Components | **React Testing Library** (under Vitest) | Calendar interaction, bottom sheets, forms, dashboard rendering. Test behaviour a user can observe, not implementation details. |
| Flows + mobile | **Playwright** | Register→log→see prediction, offline-write→sync, and rendering at mobile viewports. Use emulated devices (iPhone, Pixel) since the app is tested in mobile view. |

## Commands

Once scaffolded, these are the canonical scripts (wire them into `package.json` and update
`CLAUDE.md`):

```bash
pnpm test            # run the whole Vitest suite once (this is the gate)
pnpm test:watch      # Vitest in watch mode while developing
pnpm test <pattern>  # run a single file/test, e.g. pnpm test periodInsights
pnpm e2e             # Playwright end-to-end + mobile-viewport tests
pnpm typecheck       # tsc --noEmit
pnpm lint            # eslint
```

Run a single test by file or `-t` name filter while iterating; run the **full** `pnpm test` before
declaring anything done — a change can pass its own test and break another.

## Write the test first

For new behaviour, capture it as a failing test before implementing (SKILL development loop step 3).
This is non-negotiable for the prediction engine and any security boundary — those are exactly the
places where "I'll test it after" leads to untested edge cases shipping.

## Prediction engine — cases that must always be covered

`lib/domains/period/periodInsights.ts` is pure, which makes it cheap and obligatory to test
thoroughly. Keep tests for at least:

- **Insufficient data:** 0 and 1 logged periods → `insufficient_data`, no prediction shown.
- **Exactly 2 periods:** minimum needed; prediction computes from a single cycle.
- **Rolling window:** with >6 periods, only the last 6 cycle pairs feed the average (older ones don't).
- **Threshold boundaries:** `daysSincePredicted` of 4 (`on_track`), 5 (`running_late`), 13
  (`running_late`), 14 (`significant_delay`) — test the exact edges, not just midpoints.
- **Skip detection:** a full extra cycle elapsed with nothing logged → `possible_skip`.
- **Period duration:** `end_date − start_date + 1` averaging, including single-day edge.

If the user later changes the 5/14-day thresholds or the 6-cycle window, these tests are what makes
the change safe — update the expected values deliberately, don't loosen the assertions.

## Security tests

RLS and auth regressions are silent, so they must be tested:

- Cross-user isolation: user A cannot select/update/delete user B's `log_entries` (and same for
  `profiles`). Run against a real local Supabase instance, not a mock — RLS only exists in Postgres.
- Account deletion cascades: deleting a user removes all their `log_entries`.
- Server entry points reject unauthenticated requests.

## Conventions

- Co-locate unit/component tests next to source as `*.test.ts(x)`; keep Playwright specs under `e2e/`.
- Test observable behaviour, not internals — assert on what a user or caller sees, so refactors don't
  break tests needlessly.
- When a bug is found, write the failing test that reproduces it first, then fix it. That test stays
  as a regression guard.
- Never make the suite green by skipping, deleting, or weakening a test. If a test is genuinely wrong,
  fix the test to assert the correct behaviour — and say so explicitly to the user.
- Keep tests deterministic: inject "today" into prediction logic rather than reading the real clock,
  so date-based tests don't rot over time.
