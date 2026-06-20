# Product Requirements Document (PRD)

## Project: Kinly — Health & Cycle Tracker PWA

**Document version:** 2.0
**Date:** June 20, 2026
**Prepared for:** Build handoff to Claude (Claude Code / Claude Cowork)
**Author:** Product Owner (you) — drafted with Claude

**Changelog from v1.0:** Removed the two-mode (self-tracker / caretaker) split in favor of one unified view for all users. Male users still get a simplified alert experience layered on top of the same view rather than a separate dashboard. Renamed the app from "Lunara" to "Kinly" to read as generic health tracking rather than period-only branding, supporting future family-health extensibility. Locked in Next.js + Supabase as the stack (replacing the local-only IndexedDB MVP approach from v1.0).

---

## 0. How to use this document

This PRD is written to be handed directly to Claude as a build brief. It is intentionally explicit about data models, UI states, and edge cases so an AI builder can implement it with minimal back-and-forth. Sections marked **[DECISION NEEDED]** are places where you may want to confirm or change the assumption before/while building. Everything else is treated as a firm requirement.

---

## 1. App Name

**Chosen name: Kinly**

Rationale: an invented word built on "vital" — generic enough to cover any health domain (periods, migraines, future family health), not period-specific or gendered, and brandable as a wordmark/icon. Reads as a calm, modern health brand rather than a niche app.

Alternate names considered (swap freely if you prefer one):
| Name | Vibe |
|---|---|
| **Kinly** *(chosen)* | Generic health, modern, extensible |
| Wellspan | Health across time/family |
| Hearth | Home/family health, warm |
| Pulsewell | Health-data forward |
| Kindred | Explicitly family-oriented |
| Nuvia | Soft, clinical-light |

**[DECISION NEEDED]:** Confirm "Kinly" or pick an alternate before Claude scaffolds the project (affects manifest.json name, icons, Supabase project name, page titles).

---

## 2. Vision & Problem Statement

People who menstruate need a fast, private, non-judgmental way to log periods and understand their cycle patterns — including irregularities, delays, and skipped cycles — without the clutter, ads, or over-medicalized tone of many existing apps.

Men also use this app — most often to log on behalf of a partner (e.g., a husband logging dates for his wife) or to simply stay lightly informed. Rather than building a separate experience for them, **everyone sees and uses the same core tracker**. The only difference is a small one: when a male user is the one logged in, the app keeps things simple by surfacing a basic alert/reminder rather than presenting personal-cycle analytics framed around "your body."

Kinly is built on an **extensible logging engine** so that future health-tracking domains (migraines, mood, symptoms, medication) — and eventually **family health tracking** (multiple linked profiles, shared visibility, notifications to a partner) — can be added without re-architecting the app.

---

## 3. Goals

### Primary goals (v1 / MVP)
1. Let users register and log in with name, email, password, age, and sex/gender.
2. Let users log period start and end dates via an intuitive calendar (tap-to-select range).
3. Auto-calculate and display the next predicted cycle start date based on history.
4. Detect and flag **delays** (cycle running longer than the user's average) and **skipped cycles** (a full expected cycle window passed with no logged period).
5. Let users attach **free-text notes** to any logged period or any specific day.
6. Provide a **visual analytics view** (charts/graphs) of cycle length, period duration, and trends over time.
7. Provide **one unified view/UI for every user**, regardless of sex — same calendar, same logging flow, same notes. The only sex-based difference: a male user sees a simplified **alert/reminder banner** ("Next period expected around [date]") rather than copy framed as personal cycle data — see Section 7.5.
8. Be a true **PWA**: installable to home screen, offline-tolerant for viewing/logging, responsive and mobile-first.
9. Architect the data and UI layer so a **new trackable domain** (starting with **migraines**) can be added later as a sibling module without rewriting the core app.

### Secondary goals (Phase 2+, not in MVP but designed for)
- **Linked/family accounts**: e.g., a husband's account linked to his wife's account so he can receive notifications about her next predicted period without needing to log in and check manually himself. This is explicitly a *future enhancement*, not part of MVP — MVP has men logging data directly into their own account (Section 4), not a shared/linked account model.
- Migraine/headache journaling module (trigger, intensity, duration, medication taken).
- Symptom tagging on calendar days (cramps, mood, flow intensity, etc.).
- Push notifications (period due soon, log reminder, and eventually cross-account notifications per the linked-accounts idea above).
- Data export (CSV/PDF) for sharing with a doctor.
- Broader **family health tracking**: multiple people's health data (any domain — periods, migraines, medications, etc.) visible under one family "space," with permissioning.

### Non-goals (explicitly out of scope for MVP)
- Medical diagnosis or clinical advice of any kind.
- Fertility/ovulation medical-grade prediction (a basic ovulation *window estimate* is fine as a soft, clearly-labeled estimate; nothing presented as clinical guidance).
- Linked/shared accounts between two users (Phase 2 — see above).
- Social/sharing features between unrelated users.
- Payment, subscription, or monetization flows.

---

## 4. Target Users & Personas

| Persona | Description | Primary needs |
|---|---|---|
| **Woman tracking her own cycle** | Wants to log periods, see predictions, view trends, get delay/skip flags | Fast logging, accurate predictions, trend visibility, irregularity flags |
| **Man logging on behalf of a partner** | E.g., a husband who logs his wife's period dates into his own account, either because she's asked him to help track or for his own awareness | Same calendar and logging flow as anyone else, but doesn't need (and shouldn't be shown) copy that assumes the data is about his own body |
| **Future: Migraine logger** | Anyone (any sex) wanting to journal migraine episodes | Reuses the same extensible logging engine, different field set |
| **Future: Family health tracker** | Someone managing health logs for multiple family members in one place | Reuses the same `LogEntry` model and calendar/notes components, with profile-linking layered on top |

### One unified experience, not two modes
Every user — regardless of sex — gets the **same calendar, same tap-to-select logging flow, same notes, same insights screen**. There is no separate "caretaker mode" or simplified dashboard for men in MVP.

The **only** difference tied to sex is at the home-dashboard copy/framing level (Section 7.5):
- Default framing assumes the data being logged belongs to the logged-in user's own body ("Day X of your cycle," "Your average cycle length is...").
- If the user's sex is **Male**, the dashboard instead shows a neutral, third-person-friendly framing ("Next period expected around [date]," "It's been longer than the usual cycle length since the last logged period") — i.e., an **alert/reminder style banner** instead of "your cycle" language — since the data plausibly belongs to someone else, not the logged-in user.
- All other screens (Calendar, Insights, Notes) are **identical** regardless of sex. Insights charts simply describe "cycle length" and "period duration" rather than "your cycle," so the language already works for anyone logging on someone else's behalf without needing a second screen variant.

This keeps the build simple (one dashboard component, one small conditional banner) while still respecting that a man logging data is very likely doing so for someone else.

---

## 5. Design Principles & UI/UX Direction

### 5.1 Visual & interaction trends to apply
- **Soft, warm, rounded design language** — generous corner radii, soft shadows, calming color palette (avoid clinical white/blue; lean into warm pinks, lavenders, soft corals, deep plums as accent — but keep it tasteful and gender-neutral enough to feel comfortable for any user, not exclusively "for women," since men use the same screens too).
- **Bottom navigation bar** (mobile-first, thumb-reachable) — not a hamburger menu, for the primary destinations (Home, Calendar, Insights, Notes/Journal).
- **Floating action button (FAB)** or bottom sheet for primary "Log a period" / "Add note" actions.
- **Bottom sheets / modals** for date confirmation, note entry, settings — not full page navigation, to keep interactions fast and fluid.
- **Card-based layout** for the home dashboard (next-period card, cycle-length card, insights teaser card).
- **Skeleton loading states**, not spinners, for a modern feel.
- **Micro-interactions**: gentle animation/transition feedback when tapping calendar dates, smooth transitions between months.
- **Dark mode support** from day one (toggle in settings, respects system preference by default).
- **Empty states matter**: first-time users with no data should see friendly, encouraging illustrations/copy guiding them to log their first period — not a blank screen.
- **Large tap targets** on the calendar (minimum 44x44px) for accessibility and ease of one-handed mobile use.

### 5.2 Tone of voice
- Warm, factual, never alarmist. "Your period may be running a bit later than usual" — not "WARNING: IRREGULAR CYCLE DETECTED."
- Never presumes distress. Irregularity flags are informational, not diagnostic, and should include a soft note that significant or persistent irregularity is worth discussing with a healthcare provider — without being preachy about it.
- Copy should read naturally for both a self-tracker and someone logging for a partner — avoid phrasing that only makes sense in one direction (Section 4 covers the one place this does need to branch).

### 5.3 Accessibility
- WCAG AA color contrast minimum throughout.
- All interactive elements reachable via keyboard (for desktop PWA use) and screen-reader labeled.
- Calendar must announce selected dates clearly to assistive tech.

---

## 6. User Accounts & Authentication

### 6.1 Registration (Sign Up)
**Fields required:**
| Field | Type | Validation |
|---|---|---|
| Name | Text | Required, 1–100 chars |
| Email | Email | Required, valid email format, must be unique |
| Password | Password | Required, min 8 chars, at least 1 number — show strength indicator |
| Age | Number | Required, 13–120 (app is not intended for young children; see Section 6.4) |
| Sex | Single-select | Required. Options: **Female, Male, Other, Prefer not to say** |

On successful registration:
- Account created in Supabase (Auth + corresponding row in the app's `profiles` table — see Section 9).
- User is routed to a brief, skippable **onboarding flow** (3 short screens): (1) what Kinly does, (2) a one-line note on how logging works ("log dates for your own cycle, or for someone you support — it works the same either way"), (3) optional: log your last period now or skip.

### 6.2 Login
- Email + password via Supabase Auth.
- Standard **"Forgot password"** flow using Supabase Auth's built-in password-reset email — fully supported now that a real backend exists (this resolves the v1.0 local-storage limitation).

### 6.3 Profile & Settings
- Edit name, age, sex.
- Toggle dark mode.
- Manage notification preferences (Phase 2).
- Export data.
- Delete account / clear all data.

### 6.4 Safety & minors
If age entered is under 18, the app should still function (this is core health-tracking utility for teens), but should avoid any age-targeted dating, social, or sharing features (which are non-goals anyway) and keep tone, imagery, and copy fully appropriate for younger teen users throughout.

---

## 7. Core Features (MVP)

### 7.1 Home Dashboard
The main landing screen after login. Same structure for every user; only the header card's copy branches by sex (Section 7.5).
1. **Header card**: "Day X of your cycle" / "Period likely in X days" (default framing) — or the neutral alert framing for male users (Section 7.5).
2. **Mini calendar preview** (current month, current/predicted period highlighted) — tapping it opens the full Calendar tab.
3. **Quick actions**: "Log Period," "Add Note," (Phase 2: "Log Symptom").
4. **Insight teaser card**: one rotating insight, e.g., "Average cycle length is 29 days" or a delay/skip flag if active (Section 7.6).

### 7.2 Calendar Screen (core interaction)
- Full month-view calendar, swipeable between months.
- **Tap-to-select range interaction**:
  - First tap on a date = sets **period start date**, date highlighted.
  - Second tap on a later date = sets **period end date**; all days in between are highlighted as a continuous "period range" (visually distinct color block, rounded at the start/end caps — common "range picker" pattern).
  - Tapping a date *before* the current start tap resets the start date (don't make users fight the picker).
  - Long-press or a small "i" icon per day opens **that day's details** (note entry, flow intensity if logged — Phase 2 for intensity).
  - A clearly visible **"Save Period" / confirm action** (bottom sheet with Start Date, End Date, optional Notes field, Save button) appears once a range is selected, rather than auto-saving on tap — gives the user a chance to review/edit before committing.
- **Color legend** at the bottom or via a small legend icon: logged period (solid color), predicted next period (dashed/lighter outline), fertile/ovulation estimate window (soft secondary color, clearly labeled "estimate only").
- Past logged periods remain visible/tappable for edit or deletion on past months.

### 7.3 Notes
- A note can be attached to:
  - A specific logged period (general note, e.g., "heavier than usual this month").
  - A specific calendar day, independent of whether it's a period day (e.g., "felt great today" or a non-period symptom note) — this is the seed of the extensibility model in Section 8.
- Notes are plain text, reasonable length cap (e.g., 1000 characters), timestamped, editable, deletable.
- A dedicated **"Notes / Journal" tab** lists all notes chronologically (most recent first), independent of the calendar, so users can browse their journal without hunting through months.

### 7.4 Insights / Analytics Screen
A dedicated tab with:
1. **Cycle length trend chart** — line or bar chart, last 6–12 cycles, x-axis = cycle number/date, y-axis = days. Average line overlaid.
2. **Period duration trend chart** — similar treatment for how many days each period lasted.
3. **Calendar heatmap / history view** — a compact view of the last 6–12 months showing which days were period days at a glance.
4. **Key stats cards**: average cycle length, average period length, shortest/longest cycle on record, total cycles logged.
5. **Irregularity summary**: a simple, friendly written summary, e.g., "Cycles have been fairly regular over the last 6 months" or "Cycle length has varied more than usual recently." (Note: phrased without "your" so it reads naturally whether the data is the user's own or someone else's.)

All charts must render cleanly on small mobile viewports — prefer simple, clean line/bar charts (e.g., via Recharts) over busy or 3D chart styles, consistent with the calm design direction in Section 5.

### 7.5 Sex-Based Dashboard Framing (the one intentional branch)
This replaces the v1.0 "Caretaker Mode" concept with a much smaller, single-purpose branch:

- If the logged-in user's sex = **Female, Other, or Prefer not to say** → Home Dashboard header card uses first-person framing: *"Day 14 of your cycle"*, *"Your period is expected in 3 days."*
- If the logged-in user's sex = **Male** → Home Dashboard header card uses neutral, alert-style framing: *"Next period expected around June 24"*, *"It's been longer than the usual cycle length since the last logged period."* No other screen changes — Calendar, Insights, and Notes are visually and functionally identical.
- This is purely a **text/copy conditional** in the dashboard header component, not a structural fork in the data model, routing, or any other screen. Implementation should be a single `getDashboardHeaderCopy(sex, cycleData)` -style function feeding the one Home Dashboard component, not two dashboard components.

**[DECISION NEEDED]:** Confirm this single-banner approach is sufficiently lightweight, or whether you'd like the alert framing to also apply to push notifications specifically (Phase 2, once notifications exist) — recommend yes, reuse the same conditional logic there too.

### 7.6 Predictions, Delay Flags & Skip Detection
This is a core differentiator — define the logic precisely:

**Cycle length** = number of days from one period's start date to the next period's start date.

**Average cycle length** = rolling average of the last **6 logged cycles** (or fewer if less history exists; minimum 2 cycles needed before any prediction is shown).

**Average period duration** = rolling average of last 6 logged period lengths (end date − start date + 1).

**Next predicted period start date** = last period's start date + average cycle length.

**Predicted period range shown on calendar** = predicted start date through (predicted start date + average period duration − 1), shown with a distinct "predicted" visual style (Section 7.2).

**Soft ovulation/fertile window estimate** (optional, clearly labeled as a rough estimate, not clinical): predicted start date − 14 days, ± 2-day window. Must carry an explicit "estimate only, not for contraceptive or conception planning purposes" disclaimer the first time it's shown (and accessible via an info icon thereafter).

**Delay flag logic:**
- If today's date is **past the predicted next period start date** and no new period has been logged yet:
  - 1–4 days past predicted date: no flag yet (normal variance).
  - 5+ days past predicted date: show a **soft "Running late"** indicator on the dashboard — "This is X days later than the average cycle. This happens — but here's the information if you want to keep an eye on it."
  - 14+ days past predicted date with still nothing logged: escalate tone slightly to a **"Significant delay"** flag, still calm, still non-alarmist, suggesting (not insisting) that prolonged irregularity is worth a conversation with a healthcare provider if it continues or is accompanied by other symptoms. **Never** uses scary language, all-caps warnings, or implies a specific diagnosis.

**Skip detection logic:**
- A "skip" is flagged when an entire expected cycle window has elapsed with no period logged at all — operationally, when today's date exceeds **predicted next period start date + average cycle length**. Shown as: **"It looks like a cycle may have been skipped this month."** Same calm, non-alarmist tone, same soft suggestion to consult a provider for patterns that repeat.
- Both delay and skip flags are **dismissible** per-instance (user can tap "Got it" to acknowledge and quiet the flag for that cycle window) but should reappear on a new analysis cycle if the pattern continues.

**[DECISION NEEDED]:** Confirm the day thresholds above (5 days for "running late," 14 days for "significant delay / skip"). These are reasonable defaults based on common cycle-tracking norms but you may want to adjust.

### 7.7 PWA Requirements
- Full **manifest.json** with app name, icons (multiple sizes incl. maskable icon), theme color, background color, `display: standalone`, start_url.
- **Service worker** for offline tolerance:
  - Core app shell (HTML/CSS/JS) cached for offline load.
  - Read access to recently-fetched data should work offline; writes made offline should queue and sync once back online (since data now lives in Supabase, not purely local storage — see Section 9).
- **Add to Home Screen** prompt at an appropriate moment (e.g., after the user has logged at least one period, not on first load).
- Must pass basic Lighthouse PWA audit checks (installability, fast load, responsive viewport meta tag).
- Responsive breakpoints: primary target is mobile (360–430px width), but layout should not break on tablet/desktop browser windows either (max-width centered content container is acceptable for larger screens).

---

## 8. Extensibility Architecture (Design for Phase 2+ Now)

This is a key requirement from the original brief: **the app must be built so that new logging domains (starting with migraines) and eventually multi-person family tracking can be added later without re-architecting the core app.**

### 8.1 The "Loggable Entry" abstraction
Model the data layer around a generic concept rather than a period-only schema:

```
log_entries
  id              uuid (PK)
  user_id         uuid (FK -> profiles.id)
  domain          text   -- "period" | "migraine" | "note" | ... (extensible)
  start_date      date
  end_date        date (nullable — some entries are single-day, e.g., a migraine episode or a note)
  notes           text
  metadata        jsonb  -- domain-specific fields, flexible shape per domain
  created_at      timestamptz
  updated_at      timestamptz
```

- **Period-specific logic** (cycle length calculation, predictions, delay/skip flags) lives in a `domain === "period"`-specific service/module that *consumes* `log_entries` rows of that domain — it is not hardcoded into the generic data layer.
- **Migraine-specific logic** (Phase 2) would be a parallel module/service operating on `domain === "migraine"` entries, with its own `metadata` shape (e.g., `{ intensity: 1-10, triggers: [...], medicationTaken: "..." }`) and its own dashboard/insights screens — reusing the same calendar component, the same note-entry UI patterns, and the same storage layer, but with domain-specific business logic and visualizations layered on top.
- **Family/linked-accounts** (Phase 2): add a `profile_links` table (e.g., `owner_user_id`, `linked_user_id`, `relationship`, `permission_level`) that grants a linked user read (and eventually notification) access to another profile's `log_entries`, enforced via Supabase Row Level Security policies. Because `log_entries` is already keyed by `user_id` and domain-generic, this is an additive table and an additional RLS policy — not a schema rewrite.
- The **navigation/dashboard shell** should be built to support multiple "modules" being plugged in (even if only "Period Tracking" exists at launch) — e.g., a settings area or future "Add a tracker" entry point that could surface "Migraine Journal" as a new module once built.

### 8.2 Practical implications for the build
- Build **one reusable Calendar component** that takes a domain's entries and rendering rules as props/config — don't build a "period calendar" that can't be repurposed.
- Build **one reusable Note/Journal component** keyed by domain, rather than period-specific note logic.
- Keep **prediction/analytics logic** (Section 7.6, 7.4) in domain-specific service files (e.g., `periodInsights.ts`) that operate on generic `log_entries` data, so a future `migraineInsights.ts` can be added side-by-side.
- Keep the **dashboard header copy logic** (Section 7.5) as an isolated, swappable function — this is the same pattern that will later let a linked viewer (e.g., a husband viewing his wife's linked profile) get appropriately-framed copy too.

---

## 9. Technical Architecture

### 9.1 Recommended stack

**Frontend & application framework: Next.js**

**Backend & database: Supabase** (Postgres + Auth + Row Level Security + Storage)

**Why Next.js over Express for this project:**
- Supabase already provides the backend primitives this app needs — authentication, a Postgres database, auto-generated APIs, and Row Level Security for per-user data isolation. Next.js integrates with Supabase directly (client SDK in the browser, server-side client in Route Handlers/Server Actions for anything that needs to run server-side, e.g., aggregating prediction data before sending it to the client).
- This avoids standing up and maintaining a separate Express API server as a middle layer between the frontend and Supabase — one fewer service to deploy, secure, and keep in sync.
- Next.js ships with strong PWA support (via `next-pwa` or manual manifest/service-worker setup), good routing for the screen list in Section 10, and React Server Components where useful for data-heavy screens like Insights.
- Express would be the better choice only if you needed a fully custom, framework-agnostic API consumed by multiple unrelated clients (e.g., native mobile apps with very different needs from the web client) or complex custom middleware/business logic that didn't fit Supabase's model. That's not the case here — recommend **Next.js**, with Supabase handling the data layer directly from the Next.js app (client-side calls for most CRUD, server-side calls inside Route Handlers for anything involving the prediction engine or sensitive aggregation).

**Supporting stack:**
- **Styling**: Tailwind CSS (utility-first, fast to iterate, easy to theme for dark mode and the warm color palette in Section 5).
- **Charts**: Recharts (clean, responsive, good mobile support) for Section 7.4.
- **PWA tooling**: `next-pwa` (or manual manifest + service worker, if more control is needed over caching strategy for offline-tolerant writes — see Section 7.7).
- **Auth & DB client**: `@supabase/supabase-js` (browser) and `@supabase/ssr` (server-side/Route Handlers) for session handling in Next.js.

### 9.2 Data storage — Supabase schema (MVP)

**`profiles` table** (extends Supabase Auth's built-in `auth.users`):
```
profiles
  id              uuid (PK, FK -> auth.users.id)
  name            text
  age             integer
  sex             text   -- "female" | "male" | "other" | "prefer_not_to_say"
  created_at      timestamptz
  updated_at      timestamptz
```

**`log_entries` table**: as defined in Section 8.1.

**Row Level Security (RLS):**
- Every table has RLS enabled.
- `profiles`: a user can read/update only their own row (`auth.uid() = id`).
- `log_entries`: a user can read/write only rows where `user_id = auth.uid()`.
- This is the foundation that Phase 2's `profile_links` table (Section 8.1) will extend — additional RLS policies granting read access to a linked profile's `log_entries`, without changing the base policy above.

### 9.3 Data backup/export
Even with a real backend, include a simple **"Export my data"** feature (download a JSON file of all entries) for portability and user trust — lightweight to build via a Route Handler that queries Supabase and returns a JSON file.

### 9.4 Security & privacy notes
- This is health data — apply care regardless of backend: no third-party analytics SDKs that capture period/health data, no ad trackers, clear privacy copy explaining what's stored and that it's protected by Supabase RLS (only the account owner — and, in future, an explicitly linked profile — can read it).
- Passwords are handled entirely by Supabase Auth (hashed, never stored or handled directly by the app).
- Provide a clear, accessible **"Delete all my data" / "Delete account"** action (Section 6.3) that cascades-deletes the user's `log_entries` and `profiles` row.

---

## 10. Information Architecture / Screen List (MVP)

1. **Splash/Loading** (PWA app shell load)
2. **Login**
3. **Register**
4. **Onboarding** (3 short screens, skippable)
5. **Home Dashboard** (Section 7.1, with the Section 7.5 copy branch)
6. **Calendar** (7.2)
7. **Insights/Analytics** (7.4)
8. **Notes/Journal** (7.3)
9. **Day Detail** (bottom sheet/modal from Calendar — log/edit note, view period info for that day)
10. **Settings/Profile** (6.3) — includes dark mode, export data, delete account

Bottom navigation (4 tabs): **Home · Calendar · Insights · Notes** — Profile/Settings accessible via an icon in the top bar rather than taking a 5th bottom-nav slot, to keep the bottom nav uncluttered.

---

## 11. Open Decisions Summary

For quick reference, here are all the **[DECISION NEEDED]** items flagged throughout this document:

1. Final app name (Section 1) — defaulting to **Kinly**.
2. Exact sex/gender options at registration (Section 6.1) — confirmed as **Female / Male / Other / Prefer not to say**.
3. Rolling average window for predictions — 6 cycles (Section 7.6) — confirm or adjust.
4. Delay/skip day thresholds — 5 days "running late," 14 days "significant delay/skip" (Section 7.6) — confirm or adjust.
5. Whether the male-specific alert framing (Section 7.5) should also extend to future push notification copy — recommend yes, deferred to Phase 2 implementation.

---

## 12. Suggested Build Sequence (for Claude Code)

1. Scaffold the Next.js project (App Router) + Tailwind + PWA manifest/service worker.
2. Set up Supabase project: enable Auth, create `profiles` and `log_entries` tables, write RLS policies (Section 9.2).
3. Build auth flows (register/login/forgot password) wired to Supabase Auth; on registration, write the corresponding `profiles` row.
4. Build the reusable Calendar component with tap-to-select range logic (Section 7.2).
5. Build period logging (save/edit/delete `log_entries` rows with `domain = "period"`) on top of the Calendar component.
6. Build the prediction/delay/skip engine as a standalone service module (Section 7.6), callable both client-side and from a Route Handler if server-side aggregation is preferred.
7. Build the Home Dashboard, including the Section 7.5 copy-branching logic.
8. Build Notes/Journal screen and day-detail bottom sheet.
9. Build Insights/Analytics screen with charts.
10. Build Settings (dark mode, export data, delete account).
11. Polish: empty states, onboarding flow, PWA install prompt, offline write-queueing, Lighthouse PWA audit pass.
12. (Phase 2 hook, not built now) Confirm a migraine module can be scaffolded as a sibling domain, and that `profile_links` can be added for family/linked accounts, without touching steps 2–6's core components.

---

*End of PRD.*
