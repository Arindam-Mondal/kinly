import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NotesList, type NoteListItem } from "./NotesList";

const items: NoteListItem[] = [
  { id: "a", domain: "note", date: "2026-06-05", text: "Older standalone note" },
  { id: "b", domain: "period", date: "2026-06-12", text: "Cramps on day one" },
  { id: "c", domain: "note", date: "2026-06-20", text: "Newest note" },
];

describe("NotesList", () => {
  it("renders each note's text, newest first", () => {
    render(<NotesList items={items} />);
    const rendered = screen.getAllByRole("button").map((b) => b.textContent);
    expect(rendered[0]).toContain("Newest note");
    expect(rendered[2]).toContain("Older standalone note");
  });

  it("shows a domain badge only when more than one domain is present", () => {
    const { rerender } = render(<NotesList items={items} domainLabels={{ period: "Period", note: "Note" }} />);
    // Mixed domains -> badges appear.
    expect(screen.getAllByText("Note").length).toBeGreaterThan(0);
    expect(screen.getByText("Period")).toBeInTheDocument();

    // Single domain -> no badge clutter.
    rerender(
      <NotesList
        items={items.filter((i) => i.domain === "note")}
        domainLabels={{ period: "Period", note: "Note" }}
      />,
    );
    expect(screen.queryByText("Period")).not.toBeInTheDocument();
    expect(screen.queryByText("Note")).not.toBeInTheDocument();
  });

  it("filters to a single domain when the domain prop is set", () => {
    render(<NotesList items={items} domain="note" />);
    expect(screen.queryByText("Cramps on day one")).not.toBeInTheDocument();
    expect(screen.getByText("Newest note")).toBeInTheDocument();
  });

  it("calls onItemTap with the tapped item", async () => {
    const user = userEvent.setup();
    const onItemTap = vi.fn();
    render(<NotesList items={items} onItemTap={onItemTap} />);
    await user.click(screen.getByText("Cramps on day one"));
    expect(onItemTap).toHaveBeenCalledWith(expect.objectContaining({ id: "b", domain: "period" }));
  });

  it("shows the empty message when there are no notes", () => {
    render(<NotesList items={[]} emptyMessage="Nothing here yet." />);
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("uses the raw domain value as the badge when no label is provided", () => {
    render(<NotesList items={items} />);
    const newest = screen.getByText("Newest note").closest("button") as HTMLElement;
    expect(within(newest).getByText("note")).toBeInTheDocument();
  });
});
