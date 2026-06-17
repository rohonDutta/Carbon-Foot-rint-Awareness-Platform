import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  it("displays footprint in metric tons and benchmark comparisons", () => {
    render(<MetricCard totalKg={1900} onNavigateToCalculator={vi.fn()} />);

    expect(screen.getByText(/1\.9/)).toBeInTheDocument();
    expect(screen.getByText(/Metric Tons CO₂e \/ yr/)).toBeInTheDocument();
    expect(screen.getByText(/vs US Average/)).toBeInTheDocument();
    expect(screen.getByText(/vs World Average/)).toBeInTheDocument();
    expect(screen.getByText(/Sustainable Ceiling/)).toBeInTheDocument();
  });

  it("calls navigation handler when adjust button is clicked", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<MetricCard totalKg={2500} onNavigateToCalculator={onNavigate} />);

    await user.click(screen.getByRole("button", { name: /adjust baseline inputs/i }));

    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it("shows achieved status when footprint meets sustainable target", () => {
    render(<MetricCard totalKg={1800} onNavigateToCalculator={vi.fn()} />);

    expect(screen.getByText(/Achieved/)).toBeInTheDocument();
  });
});
