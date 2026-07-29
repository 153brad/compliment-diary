import { getMonthMeta, toDateKey, formatMonthLabel, getTodayISO } from "../lib/date.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ArchiveScreen({ year, month, monthStatus, selectedDate, selectedEntryItems, loading, onSelectDay, onAddPastPhoto }) {
  const { firstWeekday, daysInMonth } = getMonthMeta(year, month);
  const today = getTodayISO();
  const totalCells = firstWeekday + daysInMonth;
  const rows = Math.ceil(totalCells / 7) * 7;

  const cells = [];
  for (let i = 0; i < rows; i++) {
    const day = i - firstWeekday + 1;
    cells.push(day >= 1 && day <= daysInMonth ? day : null);
  }

  const selectedDay = Number(selectedDate.slice(-2));

  return (
    <div style={{ padding: "14px 22px 90px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="font-gaegu" style={{ fontSize: 20, fontWeight: 700, color: "var(--color-ink)" }}>
        {formatMonthLabel(year, month)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, textAlign: "center", fontSize: 11, color: "oklch(55% 0.02 60)" }}>
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} style={{ border: "none", background: "transparent", height: 40 }} />;
          }
          const dateKey = toDateKey(year, month, day);
          const isFuture = dateKey > today;
          const isSelected = dateKey === selectedDate;
          const status = monthStatus[dateKey];
          const dotColor = status === "done" ? "var(--color-green)" : status === "writing" ? "var(--color-yellow)" : "transparent";
          return (
            <button
              key={i}
              disabled={isFuture}
              onClick={() => onSelectDay(dateKey)}
              style={{
                border: isSelected ? "1.5px solid var(--color-primary)" : "1px solid transparent",
                background: isSelected ? "oklch(96% 0.03 40)" : "white",
                borderRadius: 10,
                height: 40,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                fontSize: 12.5,
                color: isFuture ? "oklch(80% 0.01 70)" : "var(--color-ink-soft)",
                cursor: isFuture ? "default" : "pointer",
              }}
            >
              <span>{day}</span>
              {status && <span style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor }} />}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 6, borderTop: "1px solid var(--color-border-soft)", paddingTop: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-ink-soft)", marginBottom: 10 }}>
          {month}월 {selectedDay}일
        </div>

        {loading && <div style={{ fontSize: 13, color: "var(--color-muted)", padding: "20px 0", textAlign: "center" }}>불러오는 중...</div>}

        {!loading && selectedEntryItems && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {selectedEntryItems.map((si, i) => (
              <div key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "oklch(52% 0.1 35)" }}>{si.label}</div>
                  {si.fromPhoto && (
                    <span style={{ fontSize: 10, color: "var(--color-photo-badge)", background: "var(--color-photo-badge-bg)", borderRadius: 6, padding: "1px 5px" }}>
                      노트 사진
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--color-ink-soft)" }}>{si.text || "-"}</div>
              </div>
            ))}
          </div>
        )}
        {!loading && !selectedEntryItems && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 0", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--color-muted)" }}>이 날은 기록이 없어요</div>
            <button
              onClick={onAddPastPhoto}
              style={{ border: "1.5px solid oklch(80% 0.05 60)", borderRadius: 14, padding: "10px 18px", background: "white", color: "oklch(45% 0.08 40)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              사진으로 칭찬 기록 추가하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
