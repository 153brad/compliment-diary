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
