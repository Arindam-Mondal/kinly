import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Placeholder onboarding — the real 3-screen skippable flow is build-sequence step 11.
// Registration lands here; for now it just forwards into the app.
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center bg-canvas p-6 text-center">
      <p className="font-display text-3xl font-semibold tracking-tight text-ink">Kinly</p>
      <h1 className="mt-8 font-display text-2xl font-semibold text-ink">Welcome</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">
        Log dates for your own cycle, or for someone you support — it works the same either way.
      </p>
      <Link
        href="/home"
        className="mt-8 rounded-2xl bg-accent px-4 py-3 font-semibold text-ink transition-all duration-200 hover:bg-accent-strong active:scale-95"
      >
        Get started
      </Link>
    </main>
  );
}
