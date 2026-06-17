export function calculateUpdatedStreak(
  logDateStr: string,
  currentStreak: number,
  longestStreak: number,
  lastActiveDateStr: string | null
) {
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak = currentStreak;
  let newLongest = longestStreak;

  if (!lastActiveDateStr) {
    newStreak = 1;
  } else if (logDateStr === lastActiveDateStr) {
    // already logged today, streak continues
  } else if (logDateStr === yesterdayStr) {
    if (lastActiveDateStr === todayStr) {
      // already green today, keep current streak
    } else {
      newStreak += 1;
    }
  } else if (logDateStr === todayStr) {
    if (lastActiveDateStr === yesterdayStr) {
      newStreak += 1;
    } else if (lastActiveDateStr !== todayStr) {
      newStreak = 1;
    }
  } else {
    const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(logDateStr).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 1 && lastActiveDateStr !== yesterdayStr && lastActiveDateStr !== todayStr) {
      newStreak = 1;
    }
  }

  if (newStreak > newLongest) {
    newLongest = newStreak;
  }

  return {
    currentStreakCount: newStreak,
    longestStreakCount: newLongest,
    lastActiveDate: logDateStr,
  };
}
