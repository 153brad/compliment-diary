import { CameraIcon, StreakIcon, SunburstIcon, TrashIcon } from "./icons.jsx";

const FIELDS = [
  { key: "doneWell", label: "하나" },
  { key: "endured", label: "둘" },
  { key: "wordToMe", label: "셋" },
];

const RING_COLOR = {
  done: "var(--color-green)",
  writing: "var(--color-yellow)",
  none: "oklch(85% 0.01 70)",
};

export default function WriteScreen({
  diary,
  streak,
  todayLabel,
  showCelebration,
  partialSaveNotice,
  members,
  saving,
  saveDisabled,
  onFieldInput,
  onFieldDelete,
  onOpenCamera,
  onSaveDiary,
  onCloseCelebration,
}) {
  if (showCelebration) {
    return (
      <div
        style={{
          padding: "40px 30px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 14,
          animation: "popIn 0.5s ease",
        }}
      >
        <SunburstIcon />
        <div className="font-gaegu" style={{ fontSize: 26, fontWeight: 700, color: "var(--color-ink)" }}>
          오늘도 애썼어요
        </div>
        <div style={{ fontSize: 14, color: "var(--color-muted)", lineHeight: 1.6 }}>
          세 가지 칭찬을 모두 적었어요.
          <br />
          {streak}일째 이어가고 있어요 :)
        </div>
        <button
          onClick={onCloseCelebration}
          style={{ marginTop: 10, border: "none", borderRadius: 16, padding: "14px 44px", background: "var(--color-primary)", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
        >
          확인
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "14px 22px 90px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14.5, color: "var(--color-muted-2)", fontWeight: 500 }}>{todayLabel}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--color-primary-soft)", padding: "6px 12px", borderRadius: 20 }}>
          <StreakIcon size={15} fill="filled" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary-text)" }}>{streak}일째</span>
        </div>
      </div>

      {FIELDS.map(({ key, label }) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--color-ink)" }}>{label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {diary[key].text && (
                <button
                  onClick={() => onFieldDelete(key)}
                  aria-label={`${label} 삭제`}
                  style={{
                    border: "none",
                    background: "oklch(95.5% 0.02 75)",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <TrashIcon size={15} color="var(--color-muted-2)" />
                </button>
              )}
              <button
                onClick={() => onOpenCamera(key)}
                style={{
                  border: "none",
                  background: "oklch(95.5% 0.02 75)",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <CameraIcon size={16} color="var(--color-muted-2)" />
              </button>
            </div>
          </div>
          {diary[key].fromPhoto && (
            <div style={{ fontSize: 11, color: "var(--color-photo-badge)", display: "flex", alignItems: "center", gap: 4 }}>
              <PhotoBadgeSquare />
              노트 사진에서 작성
            </div>
          )}
          <textarea
            value={diary[key].text}
            onChange={(e) => onFieldInput(key, e)}
            placeholder="사소해도 좋아요, 오늘 잘 한 일을 적어보세요."
            style={{
              minHeight: 92,
              border: diary[key].fromPhoto ? "1.5px solid oklch(78% 0.08 40)" : "1.5px solid var(--color-border)",
              borderRadius: 14,
              padding: "13px 14px",
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--color-ink)",
              resize: "none",
              outline: "none",
              background: diary[key].fromPhoto ? "oklch(97.5% 0.02 85)" : "white",
            }}
          />
        </div>
      ))}

      <button
        onClick={onSaveDiary}
        disabled={saveDisabled}
        style={{
          border: "none",
          borderRadius: 16,
          padding: 15,
          fontSize: 15,
          fontWeight: 700,
          color: "white",
          background: saveDisabled ? "oklch(85% 0.02 60)" : "var(--color-primary)",
          cursor: saveDisabled ? "default" : "pointer",
        }}
      >
        {saving ? "저장하는 중..." : "오늘의 칭찬 저장하기"}
      </button>

      {partialSaveNotice && (
        <div style={{ fontSize: 12.5, color: "var(--color-primary-text)", textAlign: "center", marginTop: -8 }}>
          저장했어요. 나머지도 채우면 완료로 기록돼요!
        </div>
      )}

      {members.length > 0 && (
      <div style={{ marginTop: 6, borderTop: "1px solid var(--color-border-soft)", paddingTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-muted-2)", marginBottom: 10 }}>친구들의 오늘 진행 현황</div>
        <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
          {members.map((f) => {
            const dash = Math.round((f.ringProgress ?? 0) * 113);
            return (
              <div key={f.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{ position: "relative", width: 50, height: 50 }}>
                  <svg viewBox="0 0 44 44" width="50" height="50" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="oklch(93% 0.015 70)" strokeWidth="4" />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke={RING_COLOR[f.status]}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} 113`}
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: f.avatarColor,
                      background: f.avatarBg,
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      margin: "auto",
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0,
                    }}
                  >
                    {f.initial}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--color-muted-2)" }}>{f.name}</div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}

function PhotoBadgeSquare() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12">
      <rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke="var(--color-photo-badge)" strokeWidth="2" />
    </svg>
  );
}
