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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Welcome to Kinly</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Log dates for your own cycle, or for someone you support — it works the same either way.
      </p>
      <Link
        href="/home"
        className="mt-8 rounded-xl bg-rose-500 px-4 py-3 font-medium text-white transition hover:bg-rose-600"
      >
        Get started
      </Link>
    </main>
  );
}
