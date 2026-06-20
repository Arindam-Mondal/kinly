import { CalendarCheck, Droplet, Repeat, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Placeholder dashboard — the real header card, predictions, and insight teaser are
// build-sequence step 7. For now it shows the design language and an inviting first-time
// state. No cycle data is fabricated: metrics read "—" until real periods are logged.
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("name").single();
  const firstName = profile?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const partOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const metrics = [
    { Icon: Repeat, label: "Avg cycle", value: "—", unit: "days" },
    { Icon: Droplet, label: "Avg period", value: "—", unit: "days" },
    { Icon: CalendarCheck, label: "Cycles logged", value: "0", unit: "" },
    { Icon: Sparkles, label: "Status", value: "New", unit: "" },
  ];

  return (
    <div className="space-y-6 pt-2">
      {/* Daily summary */}
      <section className="rounded-3xl bg-surface p-6 shadow-soft">
        <p className="text-sm text-ink/60">Good {partOfDay},</p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink">{firstName}</h1>

        <div className="mt-5 flex items-center gap-5">
          <CycleRing />
          <div className="flex-1">
            <p className="text-base font-medium text-ink">Let&apos;s start tracking</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/60">
              Log your first period and Kinly will begin learning your cycle.
            </p>
          </div>
        </div>
      </section>

      {/* Quick metrics */}
      <section>
        <h2 className="px-1 pb-3 text-sm font-medium text-ink/60">Your pillars</h2>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(({ Icon, label, value, unit }) => (
            <div key={label} className="rounded-3xl bg-surface p-4 shadow-soft">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/15 text-ink">
                <Icon size={18} />
              </span>
              <p className="mt-3 text-2xl font-semibold text-ink">
                {value}
                {unit && <span className="ml-1 text-sm font-normal text-ink/50">{unit}</span>}
              </p>
              <p className="text-sm text-ink/60">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Primary call to action */}
      <Link
        href="/calendar"
        className="flex items-center justify-between rounded-3xl bg-accent p-5 text-ink shadow-soft transition-all duration-200 active:scale-95"
      >
        <span>
          <span className="block font-display text-lg font-semibold">Log your first period</span>
          <span className="block text-sm text-ink/70">It only takes a few taps.</span>
        </span>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-accent">
          <Droplet size={20} />
        </span>
      </Link>
    </div>
  );
}

// Decorative cycle ring. Renders an inviting low-progress arc until real data exists;
// step 7 replaces this with a data-driven ring.
function CycleRing() {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const progress = 0.06; // gentle hint of an arc, not a real value

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-ink/10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className="text-accent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-ink/50">Cycle</span>
        <span className="font-display text-2xl font-semibold text-ink">Day —</span>
      </div>
    </div>
  );
}
