export default function NoGroupState({ message, onCreateGroup, onJoinGroup }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 13.5, color: "var(--color-muted)", lineHeight: 1.6 }}>{message}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 260 }}>
        <button
          onClick={onCreateGroup}
          style={{ border: "none", borderRadius: 14, padding: 13, background: "var(--color-primary)", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          새 그룹 만들기
        </button>
        <button
          onClick={onJoinGroup}
          style={{ border: "1.5px solid var(--color-border)", borderRadius: 14, padding: 13, background: "white", color: "var(--color-ink-soft)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          초대 코드로 참여하기
        </button>
      </div>
    </div>
  );
}
