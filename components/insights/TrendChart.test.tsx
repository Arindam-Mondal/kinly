import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrendChart } from "./TrendChart";

const data = [
  { label: "Mar", value: 29 },
  { label: "Apr", value: 27 },
  { label: "May", value: 29 },
];

describe("TrendChart", () => {
  it("renders an accessible labelled chart for the data", () => {
    render(<TrendChart title="Cycle length" data={data} average={28} unit="days" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAccessibleName(/cycle length/i);
  });

  it("plots one marker per data point (line type)", () => {
    const { container } = render(
      <TrendChart title="Cycle length" data={data} average={28} unit="days" type="line" />,
    );
    expect(container.querySelectorAll("circle")).toHaveLength(data.length);
  });

  it("plots one bar per data point (bar type)", () => {
    const { container } = render(
      <TrendChart title="Period duration" data={data} average={5} unit="days" type="bar" />,
    );
    expect(container.querySelectorAll("rect")).toHaveLength(data.length);
  });

  it("draws an average reference line when an average is given", () => {
    const { container } = render(
      <TrendChart title="Cycle length" data={data} average={28} unit="days" />,
    );
    // Dashed average overlay carries a data attribute so we can assert it exists.
    expect(container.querySelector('[data-role="average-line"]')).toBeInTheDocument();
  });

  it("shows a calm empty state with no data", () => {
    render(<TrendChart title="Cycle length" data={[]} average={null} unit="days" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(/not enough data yet/i)).toBeInTheDocument();
  });
});
