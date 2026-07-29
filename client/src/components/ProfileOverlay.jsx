import { BackIcon } from "./icons.jsx";

export default function ProfileOverlay({ streak, groupName, memberName, notifyOn, onClose, onToggleNotify, onLogout }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--color-card-bg)",
        display: "flex",
        flexDirection: "column",
        padding: "14px 24px 30px",
        zIndex: 10,
      }}
    >
      <button onClick={onClose} style={{ alignSelf: "flex-start", border: "none", background: "transparent", padding: 8, cursor: "pointer" }}>
        <BackIcon />
      </button>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, margin: "12px 0 26px" }}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: "oklch(93% 0.05 40)",
            color: "oklch(45% 0.1 35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          {(memberName || "나").charAt(0)}
        </div>
        <div className="font-gaegu" style={{ fontSize: 20, fontWeight: 700, color: "var(--color-ink)" }}>
          {memberName || "나"}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--color-muted)" }}>
          {groupName} · {streak}일째 기록 중
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Row label="저녁마다 알림받기">
          <button
            onClick={onToggleNotify}
            style={{
              width: 42,
              height: 24,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: notifyOn ? "var(--color-primary)" : "oklch(88% 0.015 70)",
              position: "relative",
              padding: 2,
            }}
          >
            <span
              style={{
                display: "block",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "white",
                transform: notifyOn ? "translateX(18px)" : "translateX(0)",
                transition: "transform 0.15s ease",
              }}
            />
          </button>
        </Row>
        <Row label="그룹 정보">
          <span style={{ fontSize: 13, color: "var(--color-muted)" }}>{groupName}</span>
        </Row>
        <button
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "15px 4px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: 14, color: "oklch(45% 0.1 30)" }}>그룹 나가기</span>
        </button>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 4px", borderBottom: "1px solid var(--color-border-soft)" }}>
      <span style={{ fontSize: 14, color: "var(--color-ink-soft)" }}>{label}</span>
      {children}
    </div>
  );
}
