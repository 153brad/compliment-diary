export function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toIsoDate(new Date());
}

export function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toIsoDate(d);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export function isValidDate(str) {
  if (typeof str !== "string" || !DATE_RE.test(str)) return false;
  const d = new Date(`${str}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  // round-trip: rejects overflowed values like "2026-13-99" that Date() silently rolls over
  return toIsoDate(d) === str;
}

export function isValidMonth(str) {
  if (typeof str !== "string" || !MONTH_RE.test(str)) return false;
  const [year, month] = str.split("-").map(Number);
  return month >= 1 && month <= 12;
}

const KST_YMD_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });

/** Korean calendar date `offsetDays` from right now, as YYYY-MM-DD — independent
 * of the host process's own system timezone (Render's containers default to
 * UTC, so plain `new Date()` field getters would lag Korean midnight by up to
 * 9 hours). Used only for the feed's "오늘/어제" day labels; todayISO()/
 * daysAgoISO() above stay as-is since streak/validation logic already depends
 * on their current (UTC-based) behavior. */
export function kstDateISO(offsetDays = 0) {
  return KST_YMD_FORMATTER.format(new Date(Date.now() + offsetDays * 86400000));
}

const KST_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** Renders a SQLite `datetime('now')` string (always UTC, whatever machine
 * wrote it) as Korean wall-clock time. Never mutates the stored value. */
export function formatKstTime(sqliteUtcDatetime) {
  const utcDate = new Date(`${sqliteUtcDatetime.replace(" ", "T")}Z`);
  return KST_TIME_FORMATTER.format(utcDate);
}
