/** Milliseconds in one day — used for date arithmetic. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns today's date as a YYYY-MM-DD string in local time.
 * Using local-date arithmetic avoids UTC/timezone skew that can cause
 * off-by-one errors around midnight.
 */
function localDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calculates the new streak state after a user logs an eco-action.
 *
 * Rules:
 * - Logging for the first time ever → streak resets to 1.
 * - Logging on the same day as `lastActiveDate` → streak unchanged.
 * - Logging today when `lastActiveDate` is yesterday → streak increments.
 * - Logging today when `lastActiveDate` is further in the past → streak resets to 1.
 * - Logging on any other past date → streak resets to 1.
 * - `longestStreakCount` is only ever increased, never decreased.
 *
 * @param logDateStr     - The date of the action being logged (YYYY-MM-DD).
 * @param currentStreak  - The current consecutive-day count.
 * @param longestStreak  - The all-time best streak count.
 * @param lastActiveDateStr - The date of the most recent previous log, or null.
 * @returns Updated streak state.
 */
export function calculateUpdatedStreak(
  logDateStr: string,
  currentStreak: number,
  longestStreak: number,
  lastActiveDateStr: string | null
): { currentStreakCount: number; longestStreakCount: number; lastActiveDate: string } {
  const todayStr = localDateStr();
  const yesterdayStr = localDateStr(new Date(Date.now() - MS_PER_DAY));

  let newStreak = currentStreak;
  const newLongest = longestStreak;

  if (!lastActiveDateStr) {
    // First-ever log
    newStreak = 1;
  } else if (logDateStr === lastActiveDateStr) {
    // Same day — no change
  } else if (logDateStr === todayStr) {
    if (lastActiveDateStr === yesterdayStr) {
      // Consecutive day
      newStreak += 1;
    } else {
      // Gap of more than one day — reset
      newStreak = 1;
    }
  } else {
    // Logging for a past date that differs from last active → reset
    newStreak = 1;
  }

  return {
    currentStreakCount: newStreak,
    longestStreakCount: newStreak > newLongest ? newStreak : newLongest,
    lastActiveDate: logDateStr,
  };
}
