import { redirect } from "next/navigation";
import type { NoteListItem } from "@/components/notes/NotesList";
import { createClient } from "@/lib/supabase/server";
import { NotesView } from "./NotesView";

// The journal: every log_entries row that carries note text, across domains (a period's
// own notes column and standalone domain='note' rows alike). RLS scopes to the user's
// own rows; the client view handles add/edit/delete of standalone notes.
export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("log_entries")
    .select("id, domain, start_date, notes")
    .not("notes", "is", null)
    .order("start_date", { ascending: false });

  const items: NoteListItem[] = (data ?? [])
    .filter((row) => row.notes != null && row.notes.trim() !== "")
    .map((row) => ({
      id: row.id,
      domain: row.domain,
      date: row.start_date,
      text: row.notes as string,
    }));

  return <NotesView items={items} />;
}
