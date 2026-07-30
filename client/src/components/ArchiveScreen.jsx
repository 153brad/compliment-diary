import { getMonthMeta, toDateKey, formatMonthLabel, getTodayISO } from "../lib/date.js";
import { CameraIcon, TrashIcon, PencilIcon } from "./icons.jsx";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const FIELDS = [
  { key: "doneWell", label: "하나" },
  { key: "endured", label: "둘" },
  { key: "wordToMe", label: "셋" },
];

function iconButtonStyle() {
  return {
    border: "none",
    background: "oklch(95.5% 0.02 75)",
    width: 30,
    height: 30,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}

function DayEditor({ diary, saving, saveDisabled, onFieldInput, onFieldDelete, onOpenCamera, onSave, onCancel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {FIELDS.map(({ key, label }) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>{label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {diary[key].text && (
                <button onClick={() => onFieldDelete(key)} aria-label={`${label} 삭제`} style={iconButtonStyle()}>
                  <TrashIcon size={14} color="var(--color-muted-2)" />
                </button>
              )}
              <button onClick={() => onOpenCamera(key)} style={iconButtonStyle()}>
                <CameraIcon size={15} color="var(--color-muted-2)" />
              </button>
            </div>
          </div>
          <textarea
            value={diary[key].text}
            onChange={(e) => onFieldInput(key, e)}
            placeholder="사소해도 좋아요, 오늘 잘 한 일을 적어보세요."
            style={{
              minHeight: 72,
              border: "1.5px solid var(--color-border)",
              borderRadius: 12,
              padding: "11px 12px",
              fontSize: 16,
              lineHeight: 1.55,
              color: "var(--color-ink)",
              resize: "none",
              outline: "none",
              background: "white",
            }}
          />
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, border: "1.5px solid var(--color-border)", borderRadius: 14, padding: 13, background: "white", color: "var(--color-ink-soft)", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
        >
          취소
        </button>
        <button
          onClick={onSave}
          disabled={saveDisabled}
          style={{
            flex: 2,
            border: "none",
            borderRadius: 14,
            padding: 13,
            fontSize: 13.5,
            fontWeight: 700,
            color: "white",
            background: saveDisabled ? "oklch(85% 0.02 60)" : "var(--color-primary)",
            cursor: saveDisabled ? "default" : "pointer",
          }}
        >
          {saving ? "저장하는 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}

export default function ArchiveScreen({
  year,
  month,
  monthStatus,
  selectedDate,
  selectedEntryItems,
  loading,
  onSelectDay,
  editMode,
  editDiary,
  editSaving,
  editSaveDisabled,
  onEnterEdit,
  onExitEdit,
  onEditFieldInput,
  onEditFieldDelete,
  onEditOpenCamera,
  onSaveEdit,
}) {
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-ink-soft)" }}>
            {month}월 {selectedDay}일
          </div>
          {!loading && !editMode && (
            <button
              onClick={onEnterEdit}
              style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "transparent", color: "oklch(52% 0.1 35)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 4 }}
            >
              <PencilIcon size={14} color="oklch(52% 0.1 35)" />
              {selectedEntryItems ? "수정" : "기록 추가"}
            </button>
          )}
        </div>

        {loading && <div style={{ fontSize: 13, color: "var(--color-muted)", padding: "20px 0", textAlign: "center" }}>불러오는 중...</div>}

        {!loading && editMode && (
          <DayEditor
            diary={editDiary}
            saving={editSaving}
            saveDisabled={editSaveDisabled}
            onFieldInput={onEditFieldInput}
            onFieldDelete={onEditFieldDelete}
            onOpenCamera={onEditOpenCamera}
            onSave={onSaveEdit}
            onCancel={onExitEdit}
          />
        )}

        {!loading && !editMode && selectedEntryItems && (
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
        {!loading && !editMode && !selectedEntryItems && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 0", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--color-muted)" }}>이 날은 기록이 없어요</div>
            <button
              onClick={onEnterEdit}
              style={{ border: "1.5px solid oklch(80% 0.05 60)", borderRadius: 14, padding: "10px 18px", background: "white", color: "oklch(45% 0.08 40)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              기록 추가하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
