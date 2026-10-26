import {
  displayColor,
  mapPalette,
  mapTheme,
  paletteFace,
} from "../../lib/floorplan/map-colors";
import type { Stall } from "@/lib/floorplan/types";
export const pavilionColors = [
  mapPalette.rose[200],
  mapPalette.lime[200],
  mapPalette.amber[200],
  mapPalette.sky[200],
  mapPalette.orange[200],
  mapPalette.slate[200],
];
/** Stable pavilion palette for older layouts; no inventory migration is required. */
export function boothColor(st: Pick<Stall, "zone" | "color">) {
  if (st.color && /^#[0-9a-f]{6}$/i.test(st.color))
    return displayColor(st.color);
  const zone = st.zone.toLowerCase();
  if (zone.includes("pakistan")) return pavilionColors[1];
  if (zone.includes("china") || zone.includes("dta")) return pavilionColors[0];
  if (zone.includes("dcc")) return pavilionColors[2];
  return pavilionColors[
    [...zone].reduce((n, c) => n + c.charCodeAt(0), 0) % pavilionColors.length
  ];
}
export function faceColor(
  st: Pick<Stall, "zone" | "color">,
  status: string,
  selected = false,
) {
  if (selected || status === "own-held") return mapTheme.selection.face;
  if (status === "other-confirmed" || status === "confirmed")
    return mapTheme.confirmed.face;
  if (status === "held") return mapTheme.pending.face;
  return boothColor(st);
}
export function companyColor(_id: string) {
  return mapTheme.confirmed.face;
}
export function boothStroke(status: string, selected = false) {
  return selected || status === "own-held"
    ? mapTheme.selection.border
    : status === "held"
      ? mapTheme.pending.border
      : status === "confirmed" || status === "other-confirmed"
        ? mapTheme.confirmed.border
        : mapPalette.slate[500];
}

/** Shade the same material in HSL: warm faces stay terracotta rather than muddy grey. */
export function frontColor(hex: string, factor = 0.7) {
  const shade = paletteFace(hex, factor);
  if (shade) return shade;
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255),
    max = Math.max(...rgb),
    min = Math.min(...rgb),
    delta = max - min,
    l = (max + min) / 2;
  let h = 0;
  if (delta) {
    if (max === rgb[0]) h = ((rgb[1] - rgb[2]) / delta + 6) % 6;
    else if (max === rgb[1]) h = (rgb[2] - rgb[0]) / delta + 2;
    else h = (rgb[0] - rgb[1]) / delta + 4;
  }
  const f = Math.pow(factor, 1.5),
    light = l * f,
    s = (delta ? delta / (1 - Math.abs(2 * l - 1)) : 0) * f,
    c = (1 - Math.abs(2 * light - 1)) * s,
    x = c * (1 - Math.abs((h % 2) - 1)),
    m = light - c / 2;
  const q =
    h < 1
      ? [c, x, 0]
      : h < 2
        ? [x, c, 0]
        : h < 3
          ? [0, c, x]
          : h < 4
            ? [0, x, c]
            : h < 5
              ? [x, 0, c]
              : [c, 0, x];
  return (
    "#" +
    q
      .map((v) =>
        Math.round((v + m) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

export function transformFace(
  st: Pick<Stall, "x" | "y" | "rotation">,
  d: string,
) {
  const r = (st.rotation * Math.PI) / 180,
    c = Math.cos(r),
    n = Math.sin(r);
  return d.replace(
    /([ML])(-?[\d.e+]+),(-?[\d.e+]+)/gi,
    (_, cmd, x, y) =>
      `${cmd}${st.x + Number(x) * c - Number(y) * n},${st.y + Number(x) * n + Number(y) * c}`,
  );
}

export function surfacePaint(
  st: Pick<Stall, "zone" | "color">,
  status: string,
  selected = false,
) {
  const active = selected || status === "own-held";
  return {
    fill: faceColor(st, status, selected),
    stroke: boothStroke(status, selected),
    strokeWidth: active ? 0.075 : 0.025,
    strokeDasharray: active
      ? ".16 .10"
      : status === "held"
        ? ".05 .07"
        : undefined,
  };
}
