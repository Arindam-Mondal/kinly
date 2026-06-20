import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Smoke test: proves the Vitest + React Testing Library + jsdom harness is wired
// up correctly. Replace/extend with real tests as features land.
describe("test harness", () => {
  it("renders a component and matches jest-dom assertions", () => {
    render(<h1>Kinly</h1>);
    expect(screen.getByRole("heading", { name: "Kinly" })).toBeInTheDocument();
  });
});
