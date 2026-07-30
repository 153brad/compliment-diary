import { BackIcon } from "./icons.jsx";

const inputStyle = {
  width: "100%",
  border: "1.5px solid oklch(85% 0.02 60)",
  borderRadius: 14,
  padding: 15,
  fontSize: 16,
  outline: "none",
  letterSpacing: 1,
};

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

export default function RecoverScreen({ value, submitting, error, onInput, onSubmit, onBack }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 26px 30px" }}>
      <button onClick={onBack} style={{ alignSelf: "flex-start", border: "none", background: "transparent", padding: 8, cursor: "pointer" }}>
        <BackIcon />
      </button>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18, paddingTop: 20 }}>
        <div className="font-gaegu" style={{ fontSize: 24, fontWeight: 700, color: "var(--color-ink)" }}>
          복구 코드를 입력해주세요
        </div>
        <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: -10 }}>
          예전 기기에서 확인해둔 계정 복구 코드를 입력하면 기존 기록을 그대로 불러와요.
        </div>
        <input value={value} onChange={onInput} placeholder="예: AB3C-9DEF-2JKL" style={inputStyle} />
        <ErrorBanner error={error} />
        <button
          onClick={onSubmit}
          disabled={submitting}
          style={{
            marginTop: "auto",
            border: "none",
            borderRadius: 16,
            padding: 15,
            background: submitting ? "oklch(85% 0.02 60)" : "var(--color-primary)",
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            cursor: submitting ? "default" : "pointer",
          }}
        >
          {submitting ? "복구하는 중..." : "복구하기"}
        </button>
      </div>
    </div>
  );
}
