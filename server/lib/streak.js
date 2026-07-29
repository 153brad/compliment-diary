export function isCompleteRow(row) {
  return !!(row.done_well_text && row.endured_text && row.word_to_me_text);
}

function isPartialRow(row) {
  return !!(row.done_well_text || row.endured_text || row.word_to_me_text);
}

export function statusForRow(row) {
  if (!row) return "none";
  if (isCompleteRow(row)) return "done";
  if (isPartialRow(row)) return "writing";
  return "none";
}

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** rows: entries for one member, any order. todayISO: 'YYYY-MM-DD'. */
export function computeStreak(rows, todayISO) {
  const completedDates = new Set(rows.filter(isCompleteRow).map((r) => r.entry_date));

  const cursor = new Date(`${todayISO}T00:00:00`);
  if (!completedDates.has(todayISO)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (completedDates.has(toIso(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
