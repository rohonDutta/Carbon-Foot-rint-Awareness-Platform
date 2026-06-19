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

    // getAllByRole handles any duplicate button elements in test DOM
    const buttons = screen.getAllByRole("button", { name: /adjust baseline inputs/i });
    await user.click(buttons[0]);

    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it("shows achieved status when footprint meets sustainable target", () => {
    render(<MetricCard totalKg={1800} onNavigateToCalculator={vi.fn()} />);

    // getAllByText handles any duplicate text nodes
    const achieved = screen.getAllByText(/Achieved/);
    expect(achieved.length).toBeGreaterThanOrEqual(1);
  });

  it("shows above-target status when footprint exceeds sustainable ceiling", () => {
    render(<MetricCard totalKg={5000} onNavigateToCalculator={vi.fn()} />);

    // Should show the "+Xt remaining to goal" text
    expect(screen.getByText(/remaining to goal/i)).toBeInTheDocument();
  });

  it("renders zero kg footprint without crashing", () => {
    render(<MetricCard totalKg={0} onNavigateToCalculator={vi.fn()} />);
    expect(screen.getByText(/0\.0/)).toBeInTheDocument();
  });

  it("renders very high kg footprint without crashing", () => {
    render(<MetricCard totalKg={50000} onNavigateToCalculator={vi.fn()} />);
    expect(screen.getByText(/50\.0/)).toBeInTheDocument();
  });
});
