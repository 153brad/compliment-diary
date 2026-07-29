import { StreakIcon } from "./icons.jsx";

const STATUS_LABEL = {
  done: "오늘 작성 완료",
  writing: "작성 중이에요",
  none: "아직 시작 전이에요",
};

export default function FriendsScreen({ members }) {
  const countCompleted = members.filter((f) => f.status === "done").length;
  const countWriting = members.filter((f) => f.status === "writing").length;
  const countNotStarted = members.filter((f) => f.status === "none").length;

  return (
    <div style={{ padding: "14px 22px 90px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="font-gaegu" style={{ fontSize: 20, fontWeight: 700, color: "var(--color-ink)" }}>
        친구 현황
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <SummaryCard value={countCompleted} label="완료" bg="var(--color-green-bg)" valueColor="var(--color-green-text)" labelColor="oklch(50% 0.04 150)" />
        <SummaryCard value={countWriting} label="작성 중" bg="var(--color-yellow-bg)" valueColor="var(--color-yellow-text)" labelColor="oklch(55% 0.06 85)" />
        <SummaryCard value={countNotStarted} label="미시작" bg="var(--color-neutral-bg)" valueColor="var(--color-neutral-text)" labelColor="oklch(52% 0.01 70)" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {members.map((f, i) => (
          <div
            key={f.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "white",
              borderRadius: 16,
              padding: "12px 14px",
              opacity: f.status === "none" ? 0.45 : 1,
              boxShadow: "0 1px 3px rgba(60,40,20,0.05)",
            }}
          >
            <div style={{ width: 20, textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--color-muted)" }}>{i + 1}</div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: f.avatarBg,
                color: f.avatarColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {f.initial}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}>{f.name}</div>
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{STATUS_LABEL[f.status]}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <StreakIcon size={14} fill="filled" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "oklch(45% 0.1 35)" }}>{f.streak}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ value, label, bg, valueColor, labelColor }) {
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 14, padding: 12, textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: valueColor }}>{value}</div>
      <div style={{ fontSize: 11.5, color: labelColor }}>{label}</div>
    </div>
  );
}
