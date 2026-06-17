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
        dailyLogs={baseState.dailyLogs}
        totalSavingsFromLogs={6.2}
        recommendationsSavingsRate={500}
        computedBadges={baseState.badges}
      />
    );

    expect(screen.getByText(/Monthly CO₂ Footprint over Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Green Streak/i)).toBeInTheDocument();
    expect(screen.getByText(/Environmental Achievement Medals/i)).toBeInTheDocument();
    expect(screen.getByText(String(baseState.streakState.currentStreakCount))).toBeInTheDocument();
  });

  it("exposes accessible chart description for screen readers", () => {
    render(
      <ProgressCenter
        state={baseState}
        dailyLogs={baseState.dailyLogs}
        totalSavingsFromLogs={0}
        recommendationsSavingsRate={0}
        computedBadges={baseState.badges}
      />
    );

    expect(
      screen.getByRole("img", { name: /monthly carbon footprint trend chart/i })
    ).toBeInTheDocument();
  });
});
