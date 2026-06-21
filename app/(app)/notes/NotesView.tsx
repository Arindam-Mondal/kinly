"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatHuman, todayISO } from "@/components/calendar/calendarUtils";
import { NotesList, type NoteListItem } from "@/components/notes/NotesList";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { createNoteEntry, deleteNoteEntry, updateNoteEntry } from "./actions";

// Human labels for the domain badge. Kept here (not in the agnostic NotesList) so the
// component stays free of period/note specifics — a future domain just adds a key.
const DOMAIN_LABELS: Record<string, string> = { period: "Period", note: "Note", migraine: "Migraine" };

// The sheet edits one standalone note. `id` null = creating; set = editing an existing one.
type SheetState = { id: string | null; date: string; text: string };

export function NotesView({ items }: { items: NoteListItem[] }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const editing = sheet?.id != null;

  function openNew() {
    setSheet({ id: null, date: todayISO(), text: "" });
    setConfirmingDelete(false);
    setError("");
  }

  function handleItemTap(item: NoteListItem) {
    // A period's note lives on the period row, so it's edited where it belongs — the
    // calendar's period editor (see the ?edit deep link). Only standalone notes open here.
    if (item.domain !== "note") {
      router.push(`/calendar?edit=${item.id}`);
      return;
    }
    setSheet({ id: item.id, date: item.date, text: item.text });
    setConfirmingDelete(false);
    setError("");
  }

  function closeSheet() {
    setSheet(null);
    setConfirmingDelete(false);
    setError("");
  }

  function save() {
    if (!sheet) return;
    startTransition(async () => {
      const payload = { date: sheet.date, notes: sheet.text };
      const result =
        sheet.id == null
          ? await createNoteEntry(payload)
          : await updateNoteEntry({ id: sheet.id, ...payload });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      closeSheet();
      router.refresh();
    });
  }

  function remove() {
    if (!sheet?.id) return;
    startTransition(async () => {
      const result = await deleteNoteEntry({ id: sheet.id });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      closeSheet();
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between px-1">
        <h1 className="font-display text-3xl font-semibold text-ink">Notes</h1>
        <button
          type="button"
          onClick={openNew}
          className="flex h-11 items-center gap-1.5 rounded-full bg-accent pl-3 pr-4 font-semibold text-ink shadow-soft transition-all duration-200 hover:bg-accent-strong active:scale-95"
        >
          <Plus size={18} />
          <span className="text-sm">Add note</span>
        </button>
      </div>

      <p className="px-1 text-sm text-ink/70">
        Your journal across days and cycles, newest first. Tap a note to edit it.
      </p>

      <NotesList
        items={items}
        domainLabels={DOMAIN_LABELS}
        onItemTap={handleItemTap}
        emptyMessage="No notes yet. Add your first one, or jot a note while logging a period."
      />

      <BottomSheet open={sheet != null} onClose={closeSheet} title={editing ? "Edit note" : "New note"}>
        {sheet && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-ink/80">
              Date
              <input
                type="date"
                value={sheet.date}
                max={todayISO()}
                onChange={(e) => setSheet({ ...sheet, date: e.target.value })}
                className="mt-1 w-full min-w-0 appearance-none rounded-2xl border border-ink/10 bg-canvas px-3 py-2.5 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
            </label>

            <p className="text-sm text-ink/70">{formatHuman(sheet.date)}</p>

            <label className="block text-sm font-medium text-ink/80">
              Note
              <textarea
                value={sheet.text}
                onChange={(e) => setSheet({ ...sheet, text: e.target.value })}
                maxLength={1000}
                rows={4}
                placeholder="Anything you want to remember about this day."
                className="mt-1 w-full resize-none rounded-2xl border border-ink/10 bg-canvas px-3 py-2.5 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
            </label>

            {error && <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeSheet}
                className="flex-1 rounded-2xl border border-ink/10 bg-canvas px-4 py-3 font-medium text-ink transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="flex-1 rounded-2xl bg-accent px-4 py-3 font-semibold text-ink transition-all duration-200 hover:bg-accent-strong active:scale-95 disabled:opacity-60"
              >
                {pending ? "Saving…" : editing ? "Save changes" : "Save note"}
              </button>
            </div>

            {editing &&
              (confirmingDelete ? (
                <div className="rounded-2xl bg-danger/10 p-3">
                  <p className="text-sm text-ink/80">Delete this note? This can&apos;t be undone.</p>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="flex-1 rounded-2xl border border-ink/10 bg-canvas px-4 py-2.5 font-medium text-ink active:scale-95"
                    >
                      Keep it
                    </button>
                    <button
                      type="button"
                      onClick={remove}
                      disabled={pending}
                      className="flex-1 rounded-2xl bg-danger px-4 py-2.5 font-semibold text-canvas active:scale-95 disabled:opacity-60"
                    >
                      {pending ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="w-full rounded-2xl px-4 py-2.5 text-sm font-medium text-danger transition-all duration-200 active:scale-95"
                >
                  Delete note
                </button>
              ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
