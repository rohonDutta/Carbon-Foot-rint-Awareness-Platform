import { describe, it, expect } from "vitest";
import { calculateUpdatedStreak } from "./streak";

describe("calculateUpdatedStreak", () => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  it("starts streak at 1 when there is no prior activity", () => {
    const result = calculateUpdatedStreak(today, 0, 0, null);

    expect(result.currentStreakCount).toBe(1);
    expect(result.longestStreakCount).toBe(1);
    expect(result.lastActiveDate).toBe(today);
  });

  it("increments streak when logging on consecutive days", () => {
    const result = calculateUpdatedStreak(today, 3, 3, yesterday);

    expect(result.currentStreakCount).toBe(4);
    expect(result.longestStreakCount).toBe(4);
  });

  it("preserves streak when logging again on the same day", () => {
    const result = calculateUpdatedStreak(today, 5, 5, today);

    expect(result.currentStreakCount).toBe(5);
    expect(result.longestStreakCount).toBe(5);
  });

  it("resets streak to 1 when gap exceeds one day", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const result = calculateUpdatedStreak(today, 7, 7, threeDaysAgo);

    expect(result.currentStreakCount).toBe(1);
    expect(result.longestStreakCount).toBe(7);
  });
});
