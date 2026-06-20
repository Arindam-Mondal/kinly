import { redirect } from "next/navigation";
import { signOutAction } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/server";

// Placeholder home — the real dashboard (header card, mini calendar, insight teaser)
// is build-sequence step 7. For now it confirms the auth session works end to end.
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("name").single();

  return (
    <main className="flex min-h-dvh flex-col p-6">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        Hi{profile?.name ? `, ${profile.name}` : ""} 👋
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        You&apos;re signed in. The dashboard is coming soon.
      </p>

      <form action={signOutAction} className="mt-auto">
        <button
          type="submit"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 font-medium text-neutral-700 transition hover:bg-white dark:border-neutral-700 dark:text-neutral-200"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
