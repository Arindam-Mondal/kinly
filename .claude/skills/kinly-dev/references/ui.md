# UI & Design Reference

Kinly is developed on a laptop but **tested and used in mobile view**. Design every screen for a
phone first, then let it scale up. The feel is calm and warm, never clinical or alarmist — this is
health software people reach for in private moments, and the tone is part of the product.

## Mobile-first workflow

- Primary breakpoint: **360–430px** width. Build and verify at ~390px first; treat desktop as the
  afterthought, not the reverse.
- On larger viewports, don't stretch — center content in a max-width container. The phone layout is
  the canonical one.
- Verify mobile rendering for any UI change before calling it done: use the browser devtools device
  toolbar (~390px) during development, and cover key flows with Playwright using emulated devices
  (iPhone/Pixel) so it's checked automatically too.
- Tap targets ≥ 44×44px. Primary actions sit within thumb reach — bottom nav and bottom sheets, not
  top-corner menus.

## Layout patterns (from PRD §5)

- **Bottom navigation** with 4 tabs: Home · Calendar · Insights · Notes. Settings/Profile is an icon
  in the top bar, not a 5th tab.
- **Bottom sheets / modals** for date confirmation, note entry, and settings — not full-page
  navigation — to keep interactions fast and fluid.
- **Cards** for the home dashboard (next-period card, cycle-length card, insight teaser).
- **FAB or bottom sheet** for primary "Log Period" / "Add Note" actions.
- **Skeleton loaders**, not spinners, for a modern feel.
- **Empty states matter:** first-time users with no data get friendly, encouraging guidance toward
  logging their first period — never a blank screen.

## Visual language — "Holistic Organic Olive"

The design system is luxurious, calming, and organic — premium wellness, not clinical. It lives as
Tailwind v4 theme tokens in `app/globals.css` (`@theme`); use the semantic utilities, never scatter
raw hex across components.

| Role (rough ratio) | Token / utility | Value | Use for |
|---|---|---|---|
| Canvas (60%) | `bg-canvas` | `#FDFBF7` warm alabaster | page background |
| Surface | `bg-surface` | `#F7F4EF` soft cream | cards, containers, sections (layered depth, no harsh white) |
| Ink (30%) | `text-ink` / `border-ink/10` | `#1E3A1E` deep forest green | text, icons, structural lines |
| Accent (10%) | `bg-accent` / `text-accent` | `#A3E635` citron/sage | **only** high-impact actions, vital metrics, active nav |
| Accent pressed | `bg-accent-strong` | `#8FD123` | button hover/active |

- **Accent is precious — 10% rule.** Citron draws the eye, so spend it only on the primary action,
  an active nav tab, or a vital metric. Don't tint whole sections with it.
- **Depth via tone + soft shadow, not hard lines.** Layer `bg-surface` cards on the `bg-canvas` page;
  separate with `border-ink/10` hairlines or the warm-tinted `shadow-soft` (`shadow-lift` for raised
  surfaces). Never heavy black drop shadows.
- **Generous organic radii:** `rounded-3xl` for cards/sheets/CTAs, `rounded-2xl` for inputs and
  smaller controls.
- **Type:** Fraunces (`font-display`) — a soft "old style" serif — for the wordmark and headings,
  used with restraint; Geist sans (default) for body and UI. Buttons on accent use `text-ink` (dark
  on citron), which reads premium.
- **Touch feedback everywhere:** interactive elements get `transition-all duration-200 active:scale-95`
  for a native, high-fidelity feel.
- The shared shell lives in `components/app/` (`AppHeader`, `BottomNav`) and is wired into
  `app/(app)/layout.tsx`; reuse it rather than rebuilding per screen.
- **Dark mode:** not yet implemented — the current palette is light-first per the brief. When added,
  design a deliberate dark-olive variant via the same tokens (don't just invert), with a Settings toggle.

## Accessibility (WCAG AA minimum)

- AA color contrast throughout, in both light and dark mode.
- Every interactive element is keyboard-reachable and screen-reader labeled (the app is also a
  desktop PWA).
- The calendar must announce selected dates clearly to assistive tech — the range picker is the
  most interaction-heavy surface and needs the most care here.

## Copy & tone — especially for flags

The delay/skip flags are where tone matters most, and the rules are non-negotiable (PRD §7.6, tech
spec §6.3):

- Always informational, never alarmist. "Your period may be running a bit later than usual" — never
  "WARNING: IRREGULAR CYCLE." No all-caps, no implied diagnosis.
- `significant_delay` copy ends with a **soft, non-pushy** suggestion to consult a healthcare provider
  *if the pattern continues* — never an imperative like "see a doctor now."
- Insights/analytics copy is domain-descriptive ("cycle length," "period duration"), not "your
  cycle," so it reads correctly whether someone logs for themselves or a partner.
- The only sex-conditional copy in the app is the dashboard header, via `getDashboardCopy` (male →
  neutral alert framing, everyone else → first-person). Don't branch copy on sex anywhere else.
- The ovulation/fertile window is a soft estimate and must carry an explicit "estimate only, not for
  contraceptive or conception planning" disclaimer the first time it's shown.

## PWA

- `app/manifest.ts`: name, short_name, icons (192/512 + maskable), `display: "standalone"`,
  theme_color, background_color.
- Service worker (via `next-pwa` or manual): cache the app shell for offline load; queue writes made
  offline and flush on reconnect (a simple IndexedDB outbox is enough).
- "Add to Home Screen" prompt fires only **after** the user has logged at least one period — not on
  first load.
- Target a passing Lighthouse PWA audit (installability, viewport meta, fast load).
