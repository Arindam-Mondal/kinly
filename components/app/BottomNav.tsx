"use client";

import { CalendarDays, House, LineChart, NotebookPen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays },
  { href: "/insights", label: "Insights", Icon: LineChart },
  { href: "/notes", label: "Notes", Icon: NotebookPen },
] as const;

// Fixed, native-style bottom tab bar. The active tab is marked with the citron accent.
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20">
      <div className="mx-auto flex max-w-md items-stretch justify-around border-t border-ink/10 bg-canvas/85 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-1 transition-all duration-200 active:scale-95"
            >
              <span
                className={`flex h-9 w-14 items-center justify-center rounded-2xl transition-colors duration-200 ${
                  active ? "bg-accent text-ink" : "text-ink/70"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={`text-[11px] font-medium ${active ? "text-ink" : "text-ink/70"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
