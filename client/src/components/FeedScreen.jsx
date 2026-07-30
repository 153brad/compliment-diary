import { HeartIcon } from "./icons.jsx";
import NoGroupState from "./NoGroupState.jsx";

export default function FeedScreen({ posts, hasGroup, expandedFeed, onToggleExpand, onToggleReact, onCreateGroup, onJoinGroup }) {
  return (
    <div style={{ padding: "14px 22px 90px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="font-gaegu" style={{ fontSize: 20, fontWeight: 700, color: "var(--color-ink)" }}>
        친구 칭찬 피드
      </div>

      {!hasGroup && (
        <NoGroupState
          message={"아직 속한 그룹이 없어요.\n그룹을 만들거나 초대 코드로 참여하면 친구들 칭찬을 볼 수 있어요."}
          onCreateGroup={onCreateGroup}
          onJoinGroup={onJoinGroup}
        />
      )}

      {hasGroup && posts.map((post) => {
        const expandKey = post.entryId ?? post.memberId;
        const expanded = !!expandedFeed[expandKey];
        const isCompleted = post.status === "done";

        return (
          <div
            key={post.memberId}
            style={{
              background: "white",
              borderRadius: 18,
              padding: 16,
              boxShadow: "0 1px 4px rgba(60,40,20,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: post.avatarBg,
                  color: post.avatarColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {post.initial}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-ink)" }}>{post.name}</div>
                <div style={{ fontSize: 11.5, color: "oklch(55% 0.02 60)" }}>{post.timeLabel}</div>
              </div>
            </div>

            {!isCompleted && (
              <div style={{ background: "oklch(96% 0.03 85)", borderRadius: 12, padding: 12, fontSize: 13, color: "var(--color-yellow-text)" }}>
                아직 오늘의 칭찬을 쓰고 있어요 · 완료되면 알려드릴게요
              </div>
            )}

            {isCompleted && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {post.items.map((it, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "oklch(52% 0.1 35)" }}>{it.label}</div>
                        {it.fromPhoto && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              fontSize: 10,
                              color: "var(--color-photo-badge)",
                              background: "var(--color-photo-badge-bg)",
                              borderRadius: 6,
                              padding: "1px 5px",
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="10" height="10">
                              <rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke="var(--color-photo-badge)" strokeWidth="2.4" />
                            </svg>
                            노트 사진
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 13.5,
                          lineHeight: 1.55,
                          color: "var(--color-ink-soft)",
                          ...(expanded
                            ? {}
                            : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }),
                        }}
                      >
                        {it.text}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onToggleExpand(expandKey)}
                  style={{ alignSelf: "flex-start", border: "none", background: "transparent", color: "oklch(52% 0.1 35)", fontSize: 12.5, fontWeight: 700, padding: "2px 0", cursor: "pointer" }}
                >
                  {expanded ? "접기" : "더보기"}
                </button>
              </div>
            )}

            {isCompleted && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid var(--color-border-soft)", paddingTop: 10, marginTop: 2 }}>
                <button
                  onClick={() => onToggleReact(post.entryId)}
                  style={{ border: "none", background: "transparent", display: "flex", alignItems: "center", gap: 5, cursor: "pointer", padding: "4px 8px", borderRadius: 20 }}
                >
                  <HeartIcon filled={post.viewerReacted} />
                  <span style={{ fontSize: 12.5, color: "var(--color-muted-2)" }}>{post.reactionCount}</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
