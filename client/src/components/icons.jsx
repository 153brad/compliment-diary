export function SketchyDefs() {
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden="true"
    >
      <defs>
        <filter id="sketchy" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045 0.09" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
        </filter>
      </defs>
    </svg>
  );
}

export function SmileIcon({ size = 120 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="sketchy">
      <circle cx="50" cy="50" r="34" fill="none" stroke="var(--color-primary)" strokeWidth="3" />
      <path d="M35 52 Q42 60 48 52 Q54 44 62 50" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 36 Q43 32 46 36" fill="none" stroke="var(--color-primary)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M56 36 Q59 32 62 36" fill="none" stroke="var(--color-primary)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function StreakIcon({ size = 26, color = "var(--color-primary)", fill = "none" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="sketchy">
      <path
        d="M12 3c-1 3-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-1.8-4.2C13.6 9 13 8 13 6.5c0-1.2.4-2.3-1-3.5z"
        fill={fill === "none" ? "none" : color}
        stroke={color}
        strokeWidth={fill === "none" ? "1.8" : "0.5"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FriendsIcon({ size = 26, color = "var(--color-green)" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="sketchy">
      <circle cx="8" cy="8.5" r="3.1" fill="none" stroke={color} strokeWidth="1.8" />
      <path d="M2.6 20c.5-4 3-6 5.4-6s4.9 2 5.4 6" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="9.3" r="2.5" fill="none" stroke={color} strokeWidth="1.8" />
      <path d="M14.8 20c.3-3 2-4.5 3.8-4.9" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon({ size = 26, color = "var(--color-yellow)" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="sketchy">
      <rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke={color} strokeWidth="1.8" />
      <path d="M8 7l1.5-3h5L16 7" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3.2" fill="none" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function BackIcon({ size = 22, color = "var(--color-ink-soft)" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="sketchy">
      <path d="M15 5l-7 7 7 7" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 60 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="sketchy">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="var(--color-green)" strokeWidth="1.8" />
      <path d="M8 12.5l2.6 2.8L16 9.5" fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProfileIcon({ size = 18, color = "var(--color-muted-2)" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="sketchy">
      <circle cx="12" cy="8.5" r="3.4" fill="none" stroke={color} strokeWidth="1.8" />
      <path d="M5 20c1-4.3 4-6.4 7-6.4s6 2.1 7 6.4" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SunburstIcon({ size = 110 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="sketchy">
      <circle cx="50" cy="50" r="30" fill="none" stroke="var(--color-yellow)" strokeWidth="3" />
      <path
        d="M50 14v10M50 76v10M14 50h10M76 50h10M23 23l7 7M70 70l7 7M77 23l-7 7M30 70l-7 7"
        stroke="var(--color-yellow)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M39 51 Q45 60 51 50 Q57 41 63 49" fill="none" stroke="var(--color-primary)" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

export function PencilIcon({ size = 21, color }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="sketchy">
      <path d="M4 20l1-4L15 6l3 3L8 19l-4 1z" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 7.5l3 3" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ size = 17, color = "var(--color-primary)", filled = false }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="sketchy">
      <path
        d="M12 20s-7-4.4-9.1-9C1.4 7.6 2.7 4.6 5.7 4c1.9-.4 3.7.4 4.9 2 1.1-1.6 3-2.4 4.9-2 3 .6 4.3 3.6 2.8 7-2.1 4.6-9.1 9-9.1 9z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon({ size = 21, color }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="sketchy">
      <rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke={color} strokeWidth="1.9" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
