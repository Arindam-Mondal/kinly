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

    await user.click(screen.getByLabelText("Jun 10, 2026"));
    expect(onRangeComplete).not.toHaveBeenCalled(); // start only

    await user.click(screen.getByLabelText("Jun 12, 2026"));
    expect(onRangeComplete).toHaveBeenCalledWith("2026-06-10", "2026-06-12");
  });

  it("does not allow selecting future dates", async () => {
    const user = userEvent.setup();
    const onRangeComplete = vi.fn();
    render(<Harness onRangeComplete={onRangeComplete} />);

    // today is 2026-06-20, so the 25th is in the future and disabled
    expect(screen.getByLabelText("Jun 25, 2026")).toBeDisabled();
    await user.click(screen.getByLabelText("Jun 25, 2026"));
    expect(onRangeComplete).not.toHaveBeenCalled();
  });

  it("renders the month the injected today falls in", () => {
    render(<Harness onRangeComplete={vi.fn()} />);
    expect(screen.getByText("June 2026")).toBeInTheDocument();
  });

  it("calls onEntryTap (not onRangeComplete) when tapping a day inside an existing entry", async () => {
    const user = userEvent.setup();
    const onRangeComplete = vi.fn();
    const onEntryTap = vi.fn();
    render(
      <Calendar
        entries={[{ id: "abc", startDate: "2026-06-10", endDate: "2026-06-12", styleKey: "logged" }]}
        config={config}
        selection={null}
        onSelectionChange={vi.fn()}
        onRangeComplete={onRangeComplete}
        onEntryTap={onEntryTap}
        today="2026-06-20"
      />,
    );

    await user.click(screen.getByLabelText("Jun 11, 2026, Logged period"));
    expect(onEntryTap).toHaveBeenCalledWith("abc");
    expect(onRangeComplete).not.toHaveBeenCalled();
  });
});
