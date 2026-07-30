import { BackIcon } from "./icons.jsx";

export default function ProfileOverlay({
  streak,
  displayName,
  myGroups,
  activeGroupCode,
  activeGroupName,
  notifyOn,
  onClose,
  onToggleNotify,
  onSwitchGroup,
  onLeaveGroup,
  onCreateGroup,
  onJoinGroup,
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--color-card-bg)",
        display: "flex",
        flexDirection: "column",
        padding: "14px 24px 30px",
        paddingTop: "calc(14px + env(safe-area-inset-top))",
        zIndex: 10,
        overflowY: "auto",
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
          {(displayName || "나").charAt(0)}
        </div>
        <div className="font-gaegu" style={{ fontSize: 20, fontWeight: 700, color: "var(--color-ink)" }}>
          {displayName || "나"}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--color-muted)" }}>{streak}일째 기록 중</div>
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
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-muted-2)", marginBottom: 10 }}>내 그룹</div>
        {myGroups.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 10 }}>아직 속한 그룹이 없어요.</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {myGroups.map((g) => {
            const isActive = g.groupCode === activeGroupCode;
            return (
              <button
                key={g.groupCode}
                onClick={() => onSwitchGroup(g)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: isActive ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border-soft)",
                  background: isActive ? "oklch(96% 0.03 40)" : "white",
                  borderRadius: 14,
                  padding: "12px 14px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}>{g.groupName}</div>
                  <div style={{ fontSize: 11.5, color: "var(--color-muted)" }}>{g.groupCode}</div>
                </div>
                {isActive && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary-text)" }}>보는 중</span>}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={onCreateGroup}
            style={{ flex: 1, border: "1.5px solid var(--color-border)", borderRadius: 12, padding: 11, background: "white", color: "var(--color-ink-soft)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            새 그룹 만들기
          </button>
          <button
            onClick={onJoinGroup}
            style={{ flex: 1, border: "1.5px solid var(--color-border)", borderRadius: 12, padding: 11, background: "white", color: "var(--color-ink-soft)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            초대 코드로 참여
          </button>
        </div>

        {activeGroupCode && (
          <button
            onClick={onLeaveGroup}
            style={{
              display: "block",
              width: "100%",
              marginTop: 18,
              padding: "12px 4px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 14, color: "oklch(45% 0.1 30)" }}>"{activeGroupName}" 나가기</span>
          </button>
        )}
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
