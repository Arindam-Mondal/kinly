# Product

## Register

product

## Users

Three personas, one shared interface:

- **A person tracking their own cycle** — wants fast period logging, accurate next-cycle predictions, trend visibility, and calm flags for delays or skipped cycles. Reaches for the app in private, often one-handed on a phone.
- **A partner logging on someone else's behalf** (e.g. a husband logging his wife's dates) — uses the exact same calendar, logging flow, and notes, but should not be shown copy that assumes the data is about his own body.
- **Future loggers** (migraine journaling, then linked family profiles) — reuse the same generic logging engine and shared components; out of scope to build now, but the design must not preclude them.

Context of use: mobile-first (360–430px), private, low-stress moments. The job to be done is "log quickly, understand the pattern, and surface irregularity without anxiety."

## Product Purpose

Kinly is a private, non-judgmental PWA for menstrual cycle tracking. Everyone logs through the same calendar, sees the same predictions and analytics, and writes the same notes. It calculates the next predicted cycle, flags delays and skipped cycles in a calm informational tone, and shows trend charts — without the clutter, ads, or over-medicalized feel of typical period apps.

Success looks like: a user logs a period in seconds, trusts the next-period prediction, and feels informed (never alarmed) when something is off-pattern. The whole architecture exists so a second domain (migraines) and linked family accounts can be added later without re-architecting the core.

## Brand Personality

**Calm · warm · trustworthy.** Premium-wellness, not clinical. The voice is factual and reassuring, never alarmist and never preachy. Copy reads naturally whether the data is the user's own or someone they support — domain-descriptive ("cycle length," "period duration"), not "your cycle," everywhere except the one dashboard header branch. Irregularity flags are informational, never diagnostic; significant-delay copy ends with a *soft, non-pushy* suggestion to consult a provider if a pattern continues. Health data is treated with visible care and privacy.

## Anti-references

- **Clinical / medical-dashboard aesthetics** — white-and-blue, charts-first, "patient record" coldness. Kinly is warm and human.
- **Hyper-feminine period-app tropes** — bubblegum pink, flowers, "girly" framing. The same screens serve men logging for a partner; the palette and copy must feel comfortable for anyone.
- **Alarmist health UX** — red warnings, all-caps alerts, scary language, implied diagnoses. Flags stay calm and informational.
- **Ad-cluttered, upsell-heavy consumer health apps** — no trackers, no noise, no monetization pressure.

## Design Principles

1. **Calm over clinical.** Tone is part of the product. Warmth, soft depth, and reassuring copy come before density or "data-richness." Never alarm the user.
2. **One unified experience.** Every user gets the same calendar, logging flow, notes, and insights. Sex affects exactly one thing — the dashboard header copy — and nothing else, ever.
3. **Domain-agnostic by construction.** Shared components (Calendar, Notes) know nothing about "periods." Adding a domain should mean new files, not edits to shared UI. Design choices must not bake period-specifics into reusable surfaces.
4. **Mobile-first, thumb-first.** Build and verify at ~390px. Primary actions live in thumb reach (bottom nav, bottom sheets, FAB), tap targets ≥44px. Desktop is a centered max-width afterthought.
5. **Quiet confidence in the data.** Predictions and flags are presented plainly and honestly — estimates labeled as estimates, irregularity surfaced softly, never overstated as clinical fact.

## Accessibility & Inclusion

- **WCAG AA** color contrast throughout, in both light and (future) dark mode.
- Every interactive element keyboard-reachable and screen-reader labeled — the app is also a desktop PWA.
- The calendar range-picker is the most interaction-heavy surface and must announce selected dates clearly to assistive tech.
- `prefers-reduced-motion` honored (already wired globally); every animation needs a reduced alternative.
- Tone, imagery, and copy kept appropriate for teen users (13+) as well as adults.
- Gender-neutral language and palette so the shared screens read correctly for self-trackers and partners alike.
