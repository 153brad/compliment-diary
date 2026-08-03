const WEEKDAY_LABELS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

export function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTodayISO() {
  return toIsoDate(new Date());
}

export function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function toMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function toDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatMonthLabel(year, month) {
  return `${year}년 ${month}월`;
}

export function formatKoreanDateLabel(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}년 ${m}월 ${d}일 ${WEEKDAY_LABELS[date.getDay()]}`;
}

export function addDaysISO(dateISO, delta) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toIsoDate(dt);
}

export function formatFeedDateLabel(dateISO) {
  const today = getTodayISO();
  if (dateISO === today) return "오늘";
  if (dateISO === addDaysISO(today, -1)) return "어제";
  const [, m, d] = dateISO.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

/** First weekday (0=Sun) of the month and the number of days in it. */
export function getMonthMeta(year, month) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  return { firstWeekday, daysInMonth };
}
