import type { LucideIcon } from "lucide-react";

// Elegant placeholder for screens that aren't built yet, so navigation feels complete.
export function ComingSoon({
  title,
  description,
  Icon,
}: {
  title: string;
  description: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-surface text-ink shadow-soft">
        <Icon size={28} />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink/70">{description}</p>
      <span className="mt-5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-ink">Coming soon</span>
    </div>
  );
}
