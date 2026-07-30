import { BackIcon, CheckCircleIcon } from "./icons.jsx";

const inputStyle = {
  width: "100%",
  border: "1.5px solid oklch(85% 0.02 60)",
  borderRadius: 14,
  padding: 15,
  fontSize: 16,
  outline: "none",
};

const primaryButtonStyle = (disabled) => ({
  marginTop: "auto",
  border: "none",
  borderRadius: 16,
  padding: 15,
  background: disabled ? "oklch(85% 0.02 60)" : "var(--color-primary)",
  color: "white",
  fontSize: 15,
  fontWeight: 700,
  cursor: disabled ? "default" : "pointer",
});

function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div
      style={{
        fontSize: 12.5,
        color: "oklch(45% 0.15 30)",
        background: "oklch(96% 0.04 30)",
        borderRadius: 10,
        padding: "10px 12px",
      }}
    >
      {error}
    </div>
  );
}

export default function GroupSetup({
  groupMode,
  groupCreated,
  createdGroupCode,
  groupNameValue,
  memberNameValue,
  joinCodeValue,
  submitting,
  error,
  onBack,
  onGroupNameInput,
  onMemberNameInput,
  onJoinCodeInput,
  onSubmitGroupCreate,
  onSubmitJoinCode,
  onSubmitSolo,
  onEnterApp,
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 26px 30px" }}>
      <button
        onClick={onBack}
        style={{ alignSelf: "flex-start", border: "none", background: "transparent", padding: 8, cursor: "pointer" }}
      >
        <BackIcon />
      </button>

      {groupMode === "create" &&
        (groupCreated ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 16 }}>
            <CheckCircleIcon />
            <div className="font-gaegu" style={{ fontSize: 22, fontWeight: 700, color: "var(--color-ink)" }}>
              그룹이 만들어졌어요!
            </div>
            <div style={{ fontSize: 13.5, color: "var(--color-muted)" }}>아래 코드를 친구에게 보내 초대해보세요</div>
            <div
              className="font-gaegu"
              style={{
                background: "oklch(95.5% 0.02 75)",
                border: "1.5px dashed oklch(80% 0.05 60)",
                borderRadius: 14,
                padding: "16px 26px",
                fontSize: 26,
                letterSpacing: 4,
                fontWeight: 700,
                color: "var(--color-primary)",
              }}
            >
              {createdGroupCode}
            </div>
            <button
              onClick={onEnterApp}
              style={{
                marginTop: 8,
                border: "none",
                borderRadius: 16,
                padding: "14px 40px",
                background: "var(--color-primary)",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              시작하기
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18, paddingTop: 20 }}>
            <div className="font-gaegu" style={{ fontSize: 24, fontWeight: 700, color: "var(--color-ink)" }}>
              그룹 이름을 지어주세요
            </div>
            <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: -10 }}>함께 칭찬 일기를 쓸 친구들의 모임이에요</div>
            <input
              value={groupNameValue}
              onChange={onGroupNameInput}
              placeholder="예: 우리 다정한 친구들"
              style={inputStyle}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)", marginBottom: 8 }}>내 이름</div>
              <input value={memberNameValue} onChange={onMemberNameInput} placeholder="예: 민지" style={inputStyle} />
            </div>
            <ErrorBanner error={error} />
            <button onClick={onSubmitGroupCreate} disabled={submitting} style={primaryButtonStyle(submitting)}>
              {submitting ? "만드는 중..." : "그룹 만들기"}
            </button>
          </div>
        ))}

      {groupMode === "join" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18, paddingTop: 20 }}>
          <div className="font-gaegu" style={{ fontSize: 24, fontWeight: 700, color: "var(--color-ink)" }}>
            초대 코드를 입력해주세요
          </div>
          <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: -10 }}>친구에게 받은 코드를 입력하면 그룹에 참여해요</div>
          <input
            value={joinCodeValue}
            onChange={onJoinCodeInput}
            placeholder="예: HUG482"
            style={{ ...inputStyle, letterSpacing: 2 }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)", marginBottom: 8 }}>내 이름</div>
            <input value={memberNameValue} onChange={onMemberNameInput} placeholder="예: 민지" style={inputStyle} />
          </div>
          <ErrorBanner error={error} />
          <button onClick={onSubmitJoinCode} disabled={submitting} style={primaryButtonStyle(submitting)}>
            {submitting ? "참여하는 중..." : "참여하기"}
          </button>
        </div>
      )}

      {groupMode === "solo" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18, paddingTop: 20 }}>
          <div className="font-gaegu" style={{ fontSize: 24, fontWeight: 700, color: "var(--color-ink)" }}>
            당신의 이름을 알려주세요
          </div>
          <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: -10 }}>
            나만 보는 칭찬 일기를 시작해요. 나중에 초대 코드로 친구를 불러올 수도 있어요.
          </div>
          <input value={memberNameValue} onChange={onMemberNameInput} placeholder="예: 민지" style={inputStyle} />
          <ErrorBanner error={error} />
          <button onClick={onSubmitSolo} disabled={submitting} style={primaryButtonStyle(submitting)}>
            {submitting ? "시작하는 중..." : "시작하기"}
          </button>
        </div>
      )}
    </div>
  );
}
