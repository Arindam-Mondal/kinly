"use client";

import { formatHuman } from "@/components/calendar/calendarUtils";

// Domain-agnostic journal list. Like Calendar, it knows nothing about what a "period"
// is — callers pass entries tagged with a `domain` string plus optional human labels,
// and the list renders date + (badge slot) + text, newest first. Period-specific
// behaviour (where a tapped period note goes) lives entirely in the caller's onItemTap.
export type NoteListItem = {
  id: string;
  domain: string;
  date: string; // 'YYYY-MM-DD'
  text: string;
};

export function NotesList({
  items,
  domain,
  domainLabels = {},
  onItemTap,
  emptyMessage = "No notes yet.",
}: {
  items: NoteListItem[];
  domain?: string;
  domainLabels?: Record<string, string>;
  onItemTap?: (item: NoteListItem) => void;
  emptyMessage?: string;
}) {
  const visible = (domain ? items.filter((i) => i.domain === domain) : items)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  // The badge is a no-op slot until a second domain exists (migraines) — shown only when
  // the rendered set actually spans more than one domain, so today's period-only journal
  // stays uncluttered.
  const showBadge = new Set(visible.map((i) => i.domain)).size > 1;

  if (visible.length === 0) {
    return <p className="rounded-3xl bg-surface p-6 text-center text-sm text-ink/70 shadow-soft">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3">
      {visible.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onItemTap?.(item)}
            className="w-full rounded-3xl bg-surface p-4 text-left shadow-soft transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-ink">{formatHuman(item.date)}</span>
              {showBadge && (
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-ink">
                  {domainLabels[item.domain] ?? item.domain}
                </span>
              )}
            </div>
            <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/70">
              {item.text}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
