export const AVATAR_PALETTE = [
  { avatarBg: "oklch(93% 0.05 40)", avatarColor: "oklch(45% 0.1 35)" },
  { avatarBg: "oklch(93% 0.04 150)", avatarColor: "oklch(42% 0.09 150)" },
  { avatarBg: "oklch(95% 0.05 85)", avatarColor: "oklch(48% 0.1 85)" },
  { avatarBg: "oklch(92% 0.01 70)", avatarColor: "oklch(48% 0.01 70)" },
  { avatarBg: "oklch(93% 0.05 260)", avatarColor: "oklch(45% 0.1 260)" },
  { avatarBg: "oklch(93% 0.05 320)", avatarColor: "oklch(45% 0.1 320)" },
];

export function colorForIndex(index) {
  return AVATAR_PALETTE[index % AVATAR_PALETTE.length];
}

export function initialOf(name) {
  return (name || "").trim().charAt(0) || "?";
}
