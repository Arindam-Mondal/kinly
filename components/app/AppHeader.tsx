import { User } from "lucide-react";
import Link from "next/link";

// Floating app header: the Kinly wordmark on the left, a profile button on the right.
export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-canvas/80 px-5 py-4 backdrop-blur-md">
      <Link href="/home" className="font-display text-2xl font-semibold tracking-tight text-ink">
        Kinly
      </Link>
      <Link
        href="/settings"
        aria-label="Profile and settings"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-surface text-ink transition-all duration-200 active:scale-95"
      >
        <User size={18} />
      </Link>
    </header>
  );
}
