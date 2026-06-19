import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressCenter } from "./ProgressCenter";
import { getInitialState } from "../utils/storage";

describe("ProgressCenter", () => {
  const baseState = getInitialState();

  it("renders chart, streak, and badge sections", () => {
    render(
      <ProgressCenter
        state={baseState}
        totalSavingsFromLogs={6.2}
        recommendationsSavingsRate={500}
        computedBadges={baseState.badges}
      />
    );

    expect(screen.getByText(/Monthly CO₂ Footprint over Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Green Streak/i)).toBeInTheDocument();
    expect(screen.getByText(/Environmental Achievement Medals/i)).toBeInTheDocument();
    // Use aria-label to avoid ambiguity with longestStreakCount having the same numeric value
    expect(
      screen.getByLabelText(`Current streak: ${baseState.streakState.currentStreakCount} days`)
    ).toBeInTheDocument();
  });

  it("exposes accessible chart description for screen readers", () => {
    render(
      <ProgressCenter
        state={baseState}
        totalSavingsFromLogs={0}
        recommendationsSavingsRate={0}
        computedBadges={baseState.badges}
      />
    );

    // getAllByRole handles multiple SVG matches (responsive duplicates)
    const charts = screen.getAllByRole("img", { name: /monthly carbon footprint trend chart/i });
    expect(charts.length).toBeGreaterThanOrEqual(1);
  });

  it("shows correct unlocked badge count", () => {
    const achievedCount = baseState.badges.filter((b) => b.achieved).length;
    render(
      <ProgressCenter
        state={baseState}
        totalSavingsFromLogs={0}
        recommendationsSavingsRate={0}
        computedBadges={baseState.badges}
      />
    );
    expect(
      screen.getByText(new RegExp(`Unlocked: ${achievedCount} / ${baseState.badges.length}`))
    ).toBeInTheDocument();
  });

  it("displays reduction goal percentage", () => {
    render(
      <ProgressCenter
        state={baseState}
        totalSavingsFromLogs={0}
        recommendationsSavingsRate={0}
        computedBadges={baseState.badges}
      />
    );
    expect(
      screen.getByText(new RegExp(`${baseState.reductionGoal.percentTarget}% reduction`))
    ).toBeInTheDocument();
  });

  it("shows longest streak count in the streak panel", () => {
    render(
      <ProgressCenter
        state={baseState}
        totalSavingsFromLogs={5}
        recommendationsSavingsRate={100}
        computedBadges={baseState.badges}
      />
    );
    expect(
      screen.getByText(new RegExp(`${baseState.streakState.longestStreakCount} days`))
    ).toBeInTheDocument();
  });
});
