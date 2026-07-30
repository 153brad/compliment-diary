import { BackIcon } from "./icons.jsx";

function formatCode(code) {
  return code ? code.match(/.{1,4}/g).join("-") : "";
}

export default function RecoveryCodeScreen({ code, loading, error, copied, onBack, onCopy }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 26px 30px" }}>
      <button onClick={onBack} style={{ alignSelf: "flex-start", border: "none", background: "transparent", padding: 8, cursor: "pointer" }}>
        <BackIcon />
      </button>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 16, paddingBottom: 40 }}>
        <div className="font-gaegu" style={{ fontSize: 22, fontWeight: 700, color: "var(--color-ink)" }}>
          내 계정 복구 코드
        </div>

        {loading && <div style={{ fontSize: 13, color: "var(--color-muted)" }}>불러오는 중...</div>}
        {error && !loading && <div style={{ fontSize: 13, color: "oklch(45% 0.15 30)" }}>{error}</div>}

        {code && !loading && (
          <>
            <div
              className="font-gaegu"
              style={{
                background: "oklch(95.5% 0.02 75)",
                border: "1.5px dashed oklch(80% 0.05 60)",
                borderRadius: 14,
                padding: "16px 22px",
                fontSize: 21,
                letterSpacing: 2,
                fontWeight: 700,
                color: "var(--color-primary)",
              }}
            >
              {formatCode(code)}
            </div>

            <div
              style={{
                fontSize: 12.5,
                color: "oklch(45% 0.15 30)",
                background: "oklch(96% 0.04 30)",
                borderRadius: 10,
                padding: "12px 16px",
                lineHeight: 1.6,
                maxWidth: 280,
              }}
            >
              이 코드를 꼭 저장해두세요. 잃어버리면 기존 기록을 복구할 수 없어요.
            </div>

            <button
              onClick={onCopy}
              style={{
                border: "1.5px solid var(--color-border)",
                borderRadius: 14,
                padding: "11px 22px",
                background: "white",
                color: "var(--color-ink-soft)",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {copied ? "복사했어요!" : "코드 복사하기"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
