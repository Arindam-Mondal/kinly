import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { CalendarConfig } from "@/lib/types/calendar";
import { Calendar } from "./Calendar";
import type { Selection } from "./calendarUtils";

const config: CalendarConfig = {
  styles: { logged: { label: "Logged period", fillClass: "bg-accent text-ink" } },
};

// The Calendar's selection is controlled, so drive it through a stateful harness.
function Harness({ onRangeComplete }: { onRangeComplete: (s: string, e: string) => void }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  return (
    <Calendar
      entries={[]}
      config={config}
      selection={selection}
      onSelectionChange={setSelection}
      onRangeComplete={onRangeComplete}
      today="2026-06-20"
    />
  );
}

describe("Calendar", () => {
  it("completes a range from a start tap then a later tap", async () => {
    const user = userEvent.setup();
    const onRangeComplete = vi.fn();
    render(<Harness onRangeComplete={onRangeComplete} />);

    await user.click(screen.getByLabelText("2026-06-10"));
    expect(onRangeComplete).not.toHaveBeenCalled(); // start only

    await user.click(screen.getByLabelText("2026-06-12"));
    expect(onRangeComplete).toHaveBeenCalledWith("2026-06-10", "2026-06-12");
  });

  it("does not allow selecting future dates", async () => {
    const user = userEvent.setup();
    const onRangeComplete = vi.fn();
    render(<Harness onRangeComplete={onRangeComplete} />);

    // today is 2026-06-20, so the 25th is in the future and disabled
    expect(screen.getByLabelText("2026-06-25")).toBeDisabled();
    await user.click(screen.getByLabelText("2026-06-25"));
    expect(onRangeComplete).not.toHaveBeenCalled();
  });

  it("renders the month the injected today falls in", () => {
    render(<Harness onRangeComplete={vi.fn()} />);
    expect(screen.getByText("June 2026")).toBeInTheDocument();
  });
});
