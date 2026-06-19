import { describe, it, expect, beforeEach, vi } from "vitest";
import { getInitialState, saveState } from "./storage";
import { calculateBaseline } from "./carbonCalculations";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns seeded default state when localStorage is empty", () => {
    const state = getInitialState();

    expect(state.baselineInput).toBeDefined();
    expect(state.baselineResult).toBeDefined();
    expect(state.baselineResult.total).toBe(
      state.baselineResult.transportation +
        state.baselineResult.energy +
        state.baselineResult.diet +
        state.baselineResult.waste
    );
    expect(state.dailyLogs.length).toBeGreaterThan(0);
    expect(state.recommendations.length).toBeGreaterThan(0);
    expect(state.chatHistory.length).toBeGreaterThan(0);
    expect(state.selectedTab).toBe("calculator");
  });

  it("persists and restores state from localStorage", () => {
    const initial = getInitialState();
    const modified = {
      ...initial,
      selectedTab: "logs" as const,
      baselineInput: { ...initial.baselineInput, vehicleAnnualMiles: 12000 },
      baselineResult: calculateBaseline({
        ...initial.baselineInput,
        vehicleAnnualMiles: 12000,
      }),
    };

    saveState(modified);
    const restored = getInitialState();

    expect(restored.selectedTab).toBe("logs");
    expect(restored.baselineInput.vehicleAnnualMiles).toBe(12000);
    expect(restored.baselineResult.total).toBe(modified.baselineResult.total);
  });

  it("migrates legacy state missing newer fields", () => {
    const legacy = {
      baselineInput: getInitialState().baselineInput,
      baselineResult: getInitialState().baselineResult,
      dailyLogs: [],
      recommendations: [],
      chatHistory: [],
      lastPlanGeneratedAt: null,
      personalizedInsight: null,
      selectedTab: "planner",
    };

    localStorage.setItem("carbonwise_tracker_state", JSON.stringify(legacy));
    const restored = getInitialState();

    expect(restored.selectedTab).toBe("planner");
    expect(restored.badges.length).toBeGreaterThan(0);
    expect(restored.groups.length).toBeGreaterThan(0);
    expect(restored.challenges.length).toBeGreaterThan(0);
    expect(restored.streakState).toBeDefined();
    expect(restored.reductionGoal).toBeDefined();
  });

  it("falls back to defaults when localStorage contains invalid JSON", () => {
    localStorage.setItem("carbonwise_tracker_state", "{not-valid-json");
    const state = getInitialState();

    expect(state.baselineInput.vehicleType).toBe("gas_small");
    expect(state.selectedTab).toBe("calculator");
  });

  it("saveState silently handles QuotaExceededError without throwing", () => {
    // Simulate storage full
    vi.spyOn(localStorage, "setItem").mockImplementationOnce(() => {
      throw new DOMException("QuotaExceededError");
    });

    const state = getInitialState();
    // Should not throw
    expect(() => saveState(state)).not.toThrow();

    vi.restoreAllMocks();
  });

  it("returns valid selectedTab when stored value is an unrecognized tab", () => {
    const corrupt = {
      baselineInput: getInitialState().baselineInput,
      baselineResult: getInitialState().baselineResult,
      dailyLogs: [],
      recommendations: [],
      chatHistory: [],
      lastPlanGeneratedAt: null,
      personalizedInsight: null,
      selectedTab: "unknown_tab_xyz",
      badges: [],
      groups: [],
      challenges: [],
      streakState: { currentStreakCount: 0, longestStreakCount: 0, lastActiveDate: null },
      reductionGoal: { percentTarget: 10, timeframeMonths: 3, startDate: "2026-01-01", isCustom: false },
    };
    localStorage.setItem("carbonwise_tracker_state", JSON.stringify(corrupt));
    const state = getInitialState();
    // Should fall back to "calculator" for unrecognized tab
    expect(state.selectedTab).toBe("calculator");
  });
});
