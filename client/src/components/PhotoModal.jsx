import { useRef } from "react";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = String(result).split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function PhotoModal({ modal, onClose, onStartRecognizing, onResolved, onError }) {
  const captureInputRef = useRef(null);
  const albumInputRef = useRef(null);

  if (!modal.open) return null;

  async function handleFile(file) {
    if (!file) return;
    onStartRecognizing();
    try {
      const mediaType = file.type || "image/jpeg";
      const imageBase64 = await fileToBase64(file);
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mediaType }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error || "사진을 인식하지 못했어요.");
        return;
      }
      onResolved(data.text);
    } catch (err) {
      console.error(err);
      onError("사진을 인식하는 중 문제가 생겼어요. 다시 시도해주세요.");
    }
  }

  return (
    <div
      style={{ position: "absolute", inset: 0, background: "rgba(40,30,20,0.35)", display: "flex", alignItems: "flex-end", zIndex: 20 }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          width: "100%",
          borderRadius: "24px 24px 0 0",
          padding: "22px 24px 34px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          animation: "floatUp 0.25s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, background: "oklch(88% 0.01 70)", borderRadius: 2, margin: "0 auto" }} />

        {modal.stage === "source" && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-ink)", textAlign: "center" }}>
              노트 사진으로 칭찬 채우기
            </div>
            <div style={{ fontSize: 12.5, color: "var(--color-muted)", textAlign: "center", marginTop: -8 }}>
              손글씨로 적어둔 칭찬을 사진으로 찍으면
              <br />
              글자를 인식해서 자동으로 채워드려요
            </div>

            {modal.error && (
              <div
                style={{
                  fontSize: 12.5,
                  color: "oklch(45% 0.15 30)",
                  background: "oklch(96% 0.04 30)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  textAlign: "center",
                }}
              >
                {modal.error}
              </div>
            )}

            <button
              onClick={() => captureInputRef.current?.click()}
              style={{ border: "none", borderRadius: 16, padding: 15, background: "var(--color-primary)", color: "white", fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}
            >
              사진 촬영하기
            </button>
            <button
              onClick={() => albumInputRef.current?.click()}
              style={{ border: "1.5px solid oklch(85% 0.02 60)", borderRadius: 16, padding: 15, background: "white", color: "var(--color-ink-soft)", fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}
            >
              앨범에서 선택하기
            </button>

            <input
              ref={captureInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <input
              ref={albumInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </>
        )}

        {modal.stage === "capturing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "16px 0" }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 14,
                background:
                  "repeating-linear-gradient(45deg, oklch(93% 0.02 85), oklch(93% 0.02 85) 6px, oklch(97% 0.02 85) 6px, oklch(97% 0.02 85) 12px)",
              }}
            />
            <div
              style={{
                width: 22,
                height: 22,
                border: "3px solid oklch(90% 0.02 60)",
                borderTopColor: "var(--color-primary)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <div style={{ fontSize: 13, color: "var(--color-muted)" }}>손글씨를 인식하고 있어요...</div>
          </div>
        )}
      </div>
    </div>
  );
}
