import { PencilIcon, FriendsIcon, HeartIcon, CalendarIcon } from "./icons.jsx";

const ACTIVE = "oklch(50% 0.1 35)";
const INACTIVE = "oklch(65% 0.01 70)";

const TABS = [
  { key: "write", label: "작성", Icon: PencilIcon },
  { key: "friends", label: "현황", Icon: FriendsIcon },
  { key: "feed", label: "피드", Icon: HeartIcon },
  { key: "archive", label: "보관함", Icon: CalendarIcon },
];

export default function BottomTabBar({ activeTab, onSelect }) {
  return (
    <div style={{ display: "flex", borderTop: "1px solid var(--color-border-soft)", background: "oklch(98.5% 0.008 75)", padding: "10px 8px 14px", flexShrink: 0 }}>
      {TABS.map(({ key, label, Icon }) => {
        const color = activeTab === key ? ACTIVE : INACTIVE;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            style={{ flex: 1, border: "none", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
          >
            <Icon size={21} color={color} />
            <span style={{ fontSize: 10.5, color, fontWeight: 600 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
