# Design

Visual system for Kinly — "Holistic Organic Olive." Captured from `app/globals.css` (`@theme`
tokens) and `.claude/skills/kinly-dev/references/ui.md`. Luxurious, calming, organic — premium
wellness, never clinical. Light-first today; a deliberate dark-olive variant is planned (don't invert).

## Color

OKLCH/hex tokens live as Tailwind v4 `@theme` variables in `app/globals.css`. Use the semantic
utilities (`bg-canvas`, `text-ink`, `bg-accent`, …) — never scatter raw hex in components.

| Role | Token / utility | Value | Use for | Rough ratio |
|---|---|---|---|---|
| Canvas | `bg-canvas` | `#FDFBF7` warm alabaster | page background | 60% |
| Surface | `bg-surface` | `#F7F4EF` soft cream | cards, containers, sections (layered depth, no harsh white) | — |
| Ink | `text-ink` / `border-ink/10` | `#1E3A1E` deep forest green | text, icons, structural lines | 30% |
| Accent | `bg-accent` / `text-accent` | `#A3E635` citron/sage | high-impact actions, vital metrics, active nav **only** | 10% |
| Accent (pressed) | `bg-accent-strong` | `#8FD123` | button hover / active | — |

**Color strategy: restrained.** Tinted warm neutrals carry the surface; one citron accent ≤10%.

- **Accent is precious — the 10% rule.** Citron draws the eye; spend it only on the primary action,
  the active nav tab, or a vital metric. Never tint whole sections with it.
- Text on the citron accent is `text-ink` (dark on citron) — reads premium, and clears AA contrast.
- Gray-on-tint is the trap to avoid: keep body text at the ink end of the ramp for AA (≥4.5:1).

## Typography

Two families on a contrast axis (serif display + sans body) — never two similar sans.

- **Display / headings + wordmark:** Fraunces (`font-display`) — a soft "old-style" serif. Used with
  **restraint** — headings and the wordmark, not body.
- **Body / UI:** Geist sans (`font-sans`, the default body family).
- Cap body line length at ~65–75ch. Use `text-wrap: balance` on headings, `pretty` on prose.

## Depth, radii & shadow

- **Depth via tone + soft shadow, not hard lines.** Layer `bg-surface` cards on the `bg-canvas`
  page; separate with `border-ink/10` hairlines or warm-tinted shadows. Never heavy black drop shadows.
- `--shadow-soft` (`0 4px 20px -4px rgba(30,58,30,0.06)`) for resting cards; `--shadow-lift`
  (`0 10px 30px -10px rgba(30,58,30,0.12)`) for raised surfaces / bottom sheets.
- **Generous organic radii:** `rounded-3xl` for cards, sheets, and CTAs; `rounded-2xl` for inputs and
  smaller controls.

## Layout & components

Mobile-first; primary breakpoint **360–430px** (build/verify at ~390px, desktop is centered max-width).

- **App shell:** `components/app/AppHeader` + `BottomNav`, wired in `app/(app)/layout.tsx` — reuse it,
  don't rebuild per screen.
- **Bottom navigation**, 4 tabs: Home · Calendar · Insights · Notes. Settings/Profile is a top-bar
  icon, not a 5th tab.
- **Bottom sheets / modals** (`components/ui/BottomSheet.tsx`) for date confirmation, note entry, and
  settings — not full-page navigation.
- **Cards** for the home dashboard (next-period, cycle-length, insight teaser). Avoid identical
  repeated card grids and nested cards.
- **FAB or bottom sheet** for primary "Log Period" / "Add Note" actions.
- **Skeleton loaders**, not spinners.
- **Empty states matter** — first-run users get friendly, encouraging guidance toward their first log,
  never a blank screen.
- Tap targets ≥ 44×44px; primary actions within thumb reach.

## Motion

- **Touch feedback everywhere:** interactive elements use `transition-all duration-200 active:scale-95`
  for a native, high-fidelity feel.
- Gentle micro-interactions on calendar date taps and month transitions. Ease-out curves; no bounce.
- `prefers-reduced-motion: reduce` is honored globally in `globals.css` (durations collapse to ~0).

## Copy & tone (load-bearing)

- Always informational, never alarmist. "Your period may be running a bit later than usual" — never
  "WARNING: IRREGULAR CYCLE." No all-caps, no implied diagnosis.
- `significant_delay` copy ends with a soft, non-pushy "worth a conversation with a provider *if it
  continues*" — never an imperative.
- Insights/analytics copy is domain-descriptive ("cycle length," "period duration"), not "your cycle."
- The **only** sex-conditional copy is the dashboard header, via `components/dashboard/getDashboardCopy.ts`
  (male → neutral alert framing; everyone else → first-person). Never branch on sex elsewhere.
- The ovulation/fertile window is a soft estimate and carries an explicit "estimate only, not for
  contraceptive or conception planning" disclaimer on first show.

## Theming

Light-first per the current brief. Dark mode is not yet built; when added, design a deliberate
dark-olive variant through the same `@theme` tokens (don't just invert), with a Settings toggle and a
default that respects system preference.
