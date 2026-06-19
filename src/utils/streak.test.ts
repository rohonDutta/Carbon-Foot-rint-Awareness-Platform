import { describe, it, expect } from "vitest";
import { calculateUpdatedStreak } from "./streak";

const today = new Date();
const todayStr = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

function offsetDate(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

const yesterday = offsetDate(-1);
const twoDaysAgo = offsetDate(-2);
const threeDaysAgo = offsetDate(-3);
const tomorrow = offsetDate(1);

describe("calculateUpdatedStreak", () => {
  // ---- happy paths --------------------------------------------------------

  it("starts streak at 1 when there is no prior activity", () => {
    const result = calculateUpdatedStreak(todayStr, 0, 0, null);

    expect(result.currentStreakCount).toBe(1);
    expect(result.longestStreakCount).toBe(1);
    expect(result.lastActiveDate).toBe(todayStr);
  });

  it("increments streak when logging on consecutive days", () => {
    const result = calculateUpdatedStreak(todayStr, 3, 3, yesterday);

    expect(result.currentStreakCount).toBe(4);
    expect(result.longestStreakCount).toBe(4);
  });

  it("preserves streak when logging again on the same day", () => {
    const result = calculateUpdatedStreak(todayStr, 5, 5, todayStr);

    expect(result.currentStreakCount).toBe(5);
    expect(result.longestStreakCount).toBe(5);
  });

  it("resets streak to 1 when gap exceeds one day", () => {
    const result = calculateUpdatedStreak(todayStr, 7, 7, threeDaysAgo);

    expect(result.currentStreakCount).toBe(1);
    expect(result.longestStreakCount).toBe(7);  // longest is preserved
  });

  // ---- edge cases ---------------------------------------------------------

  it("preserves longest streak when new streak is shorter after a reset", () => {
    const result = calculateUpdatedStreak(todayStr, 1, 10, twoDaysAgo);

    // Gap of 2 days resets current to 1, but longest stays at 10
    expect(result.currentStreakCount).toBe(1);
    expect(result.longestStreakCount).toBe(10);
  });

  it("updates longest streak when new streak exceeds it", () => {
    const result = calculateUpdatedStreak(todayStr, 15, 12, yesterday);

    expect(result.currentStreakCount).toBe(16);
    expect(result.longestStreakCount).toBe(16);
  });

  it("resets streak to 1 when logging a past date different from last active", () => {
    // Logging two days ago when last active was today → past date, reset
    const result = calculateUpdatedStreak(twoDaysAgo, 5, 5, todayStr);

    expect(result.currentStreakCount).toBe(1);
    expect(result.longestStreakCount).toBe(5);
  });

  it("sets lastActiveDate to the log date, not today", () => {
    const result = calculateUpdatedStreak(yesterday, 0, 0, null);

    expect(result.lastActiveDate).toBe(yesterday);
  });

  it("does not decrement streak below 1", () => {
    const result = calculateUpdatedStreak(todayStr, 1, 1, threeDaysAgo);

    expect(result.currentStreakCount).toBeGreaterThanOrEqual(1);
  });

  it("handles a future log date by resetting streak to 1", () => {
    // A log date in the future (tomorrow) is treated as a different-day past-date path
    const result = calculateUpdatedStreak(tomorrow, 5, 5, todayStr);

    // Not today and not lastActiveDate → resets
    expect(result.currentStreakCount).toBe(1);
    expect(result.longestStreakCount).toBe(5);
  });

  it("initialises correctly when streak and longest are both 0 and lastActive provided", () => {
    // lastActive is today → same-day log, no change
    const result = calculateUpdatedStreak(todayStr, 0, 0, todayStr);

    expect(result.currentStreakCount).toBe(0);
    expect(result.longestStreakCount).toBe(0);
  });
});
