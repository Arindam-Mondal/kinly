import { LogOut, Mail, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/server";

// Placeholder settings — full profile editing, dark mode, export, and delete are
// build-sequence step 10. For now it shows the account and offers sign-out.
export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("name, email").single();

  return (
    <div className="space-y-6 pt-2">
      <h1 className="px-1 font-display text-3xl font-semibold text-ink">Profile</h1>

      <section className="space-y-3 rounded-3xl bg-surface p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/15 text-ink">
            <UserRound size={18} />
          </span>
          <div>
            <p className="text-xs text-ink/50">Name</p>
            <p className="text-base font-medium text-ink">{profile?.name ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-ink/10 pt-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/15 text-ink">
            <Mail size={18} />
          </span>
          <div>
            <p className="text-xs text-ink/50">Email</p>
            <p className="text-base font-medium text-ink">{profile?.email ?? user.email}</p>
          </div>
        </div>
      </section>

      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-3xl border border-ink/10 bg-surface px-4 py-4 font-medium text-ink shadow-soft transition-all duration-200 active:scale-95"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </form>
    </div>
  );
}
