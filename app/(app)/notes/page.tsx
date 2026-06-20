import { NotebookPen } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";

export default function NotesPage() {
  return (
    <ComingSoon
      Icon={NotebookPen}
      title="Notes"
      description="A simple journal of your notes across days and cycles, newest first."
    />
  );
}
