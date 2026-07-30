import { SmileIcon, StreakIcon, FriendsIcon, CameraIcon } from "./icons.jsx";

export default function Onboarding({ onGroupCreate, onGroupJoin, onSolo }) {
  return (
    <div
      className="app-scroll"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "20px 28px 32px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 10,
        }}
      >
        <SmileIcon />
        <div className="font-gaegu" style={{ fontWeight: 700, fontSize: 30, color: "var(--color-ink-soft)", marginTop: 6 }}>
          칭찬 일기
        </div>
        <div style={{ fontSize: 14.5, color: "var(--color-muted)", lineHeight: 1.6, maxWidth: 270 }}>
          하루 세 가지, 나를 칭찬하며,
          <br />
          오늘의 나를 다정하게 안아주세요
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, margin: "18px 0 26px" }}>
        <Feature icon={<StreakIcon />} title="매일 쓰는 스트릭" desc="하루하루 이어가는 기록이 배지로 남아요" />
        <Feature icon={<FriendsIcon />} title="친구와 함께" desc="그룹을 만들어 서로의 칭찬을 나눠요" />
        <Feature icon={<CameraIcon />} title="사진으로 불러오기" desc="노트에 적은 손글씨를 사진 찍으면 자동으로 채워져요" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={onGroupCreate}
          style={{
            border: "none",
            borderRadius: 16,
            padding: 15,
            background: "var(--color-primary)",
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          새 그룹 만들고 친구 초대하기
        </button>
        <button
          onClick={onGroupJoin}
          style={{
            border: "1.5px solid var(--color-border)",
            borderRadius: 16,
            padding: 15,
            background: "white",
            color: "var(--color-ink-soft)",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          초대 코드로 참여하기
        </button>
        <button
          onClick={onSolo}
          style={{ border: "none", background: "transparent", color: "var(--color-muted)", fontSize: 13.5, padding: 8, cursor: "pointer" }}
        >
          일단 혼자 써볼게요
        </button>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--color-ink)" }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--color-muted-2)" }}>{desc}</div>
      </div>
    </div>
  );
}
