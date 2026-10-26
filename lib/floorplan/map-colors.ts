/** Map-only palette. Shade families are centralized; persisted geometry and custom colors stay unchanged. */
export const mapPalette = {
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  teal: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e",
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
  rose: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519",
  },
  lime: {
    50: "#f7fee7",
    100: "#ecfccb",
    200: "#d9f99d",
    300: "#bef264",
    400: "#a3e635",
    500: "#84cc16",
    600: "#65a30d",
    700: "#4d7c0f",
    800: "#3f6212",
    900: "#365314",
    950: "#1a2e05",
  },
  sky: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49",
  },
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407",
  },
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
} as const;
export type MapFamily = keyof typeof mapPalette;
export const mapTheme = {
  selection: {
    face: mapPalette.blue[300],
    border: mapPalette.blue[600],
    wash: mapPalette.blue[100],
  },
  pending: {
    face: mapPalette.amber[200],
    border: mapPalette.amber[700],
    wash: mapPalette.amber[50],
  },
  confirmed: {
    face: mapPalette.teal[700],
    border: mapPalette.teal[900],
    wash: mapPalette.teal[50],
  },
  scene: {
    floor: mapPalette.slate[100],
    start: mapPalette.sky[50],
    end: mapPalette.sky[100],
    ink: mapPalette.slate[900],
    line: mapPalette.slate[500],
    wall: mapPalette.slate[700],
  },
  shadow: { fill: mapPalette.slate[950], opacity: 0.32 },
} as const;
const legacy: Record<string, MapFamily> = {
  "#efcec0": "rose",
  "#edc2ae": "rose",
  "#e4b09e": "rose",
  "#e8c9c1": "sky",
  "#e5dad8": "sky",
  "#d4deb5": "lime",
  "#bacc91": "lime",
  "#bdc88e": "lime",
  "#f2d188": "amber",
  "#eec77c": "amber",
  "#e9c77e": "amber",
  "#edc774": "amber",
  "#e8cc8b": "amber",
  "#f9a558": "orange",
  "#ed9f5d": "orange",
  "#e6b579": "orange",
  "#8cbeda": "sky",
  "#df98aa": "rose",
  "#c7c1b3": "slate",
  "#cdcece": "slate",
};
export function displayColor(color: string) {
  const family = legacy[color.toLowerCase()];
  return family ? mapPalette[family][200] : color;
}
export function mixColor(
  color: string,
  opacity: number,
  base: string = mapTheme.scene.floor,
) {
  const rgb = (c: string) => {
    const h = c.replace("#", "");
    const value =
      h.length === 3
        ? h
            .split("")
            .map((x) => x + x)
            .join("")
        : h;
    return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  };
  const a = rgb(color),
    b = rgb(base);
  return (
    "#" +
    a
      .map((v, i) =>
        Math.round(v * opacity + b[i] * (1 - opacity))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function pavilionColor(color: string) {
  const family = legacy[color.toLowerCase()];
  return family ? mapPalette[family][100] : mixColor(color, 0.22, "#ffffff");
}
export function contrastRatio(a: string, b: string) {
  const luminance = (c: string) => {
    const h = c.replace("#", ""),
      hex =
        h.length === 3
          ? h
              .split("")
              .map((x) => x + x)
              .join("")
          : h;
    return [0, 2, 4]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
  };
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function textColor(background: string) {
  const dark = mapTheme.scene.ink;
  const lightContrast = contrastRatio(background, "#ffffff"),
    darkContrast = contrastRatio(background, dark);
  return lightContrast >= 4.5 && lightContrast >= darkContrast
    ? "#ffffff"
    : darkContrast >= 4.5
      ? dark
      : "#000000";
}
const shadeLevels = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;
const shadeIndex = new Map<string, { family: MapFamily; index: number }>(
  Object.entries(mapPalette).flatMap(([family, shades]) =>
    shadeLevels.map((level, index) => [
      shades[level],
      { family: family as MapFamily, index },
    ]),
  ),
);
/** Known palette colors extrude through their own shade scale. Custom colors use the existing HSL fallback. */
export function paletteFace(color: string, factor: number) {
  const match = shadeIndex.get(color.toLowerCase());
  if (!match) return;
  const step = Math.max(0, Math.round((1 - factor) * 6));
  return mapPalette[match.family][
    shadeLevels[Math.min(10, match.index + step)]
  ];
}
export const mapCssVariables = {
  "--map-selection": mapTheme.selection.border,
  "--map-selection-face": mapTheme.selection.face,
  "--map-selection-wash": mapTheme.selection.wash,
  "--map-pending": mapTheme.pending.border,
  "--map-pending-wash": mapTheme.pending.wash,
  "--map-confirmed": mapTheme.confirmed.face,
  "--map-confirmed-wash": mapTheme.confirmed.wash,
  "--map-ink": mapTheme.scene.ink,
  "--map-floor": mapTheme.scene.floor,
  "--map-border": mapPalette.slate[200],
} as const;
