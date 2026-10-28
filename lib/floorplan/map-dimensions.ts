import type { FloorLayout } from "./floorplan";
import type { Stall } from "./types";
import {
  corners,
  objectVertices,
  ring,
  multiArea,
  projectionProfile,
} from "./map-geometry";
import clipping from "polygon-clipping";
import { fitText, textWidth } from "./map-text";
import { areaLabel, type PavilionArea } from "./map-structure";
type Rect = { x: number; y: number; width: number; height: number };
export type GapDimension = {
  axis: "x" | "y";
  a: number;
  b: number;
  at: number;
  label: string;
  fontSize: number;
  box: Rect;
};
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;
const rectPolygon = (b: Rect) =>
  ring([
    { x: b.x, y: b.y },
    { x: b.x + b.width, y: b.y },
    { x: b.x + b.width, y: b.y + b.height },
    { x: b.x, y: b.y + b.height },
  ]);
/** Exact scanline/polygon intersections, including rotated boards and concave floors. */
function intervals(poly: number[][], at: number, axis: "x" | "y") {
  const p = axis === "x" ? poly : poly.map(([x, y]) => [y, x]);
  const xs: number[] = [];
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const a = p[j],
      b = p[i];
    if (a[1] > at !== b[1] > at)
      xs.push(a[0] + ((at - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
  }
  xs.sort((a, b) => a - b);
  return xs.filter((_, i) => i % 2 === 0).map((a, i) => [a, xs[i * 2 + 1]]);
}
function mergedIntervals(parts: number[][]) {
  const out: number[][] = [];
  for (const part of parts.sort((a, b) => a[0] - b[0])) {
    const last = out.at(-1);
    if (last && part[0] <= last[1] + 1e-6) last[1] = Math.max(last[1], part[1]);
    else out.push([...part]);
  }
  return out;
}
const lineBounds = (d: GapDimension): Rect =>
  d.axis === "x"
    ? { x: d.a, y: d.at - 0.03, width: d.b - d.a, height: 0.06 }
    : { x: d.at - 0.03, y: d.a, width: 0.06, height: d.b - d.a };
const stableOffset = (key: string) => {
  let hash = 2166136261;
  for (const c of key) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
  return hash;
};
export const gapLabel = (metres: number) => `${Number(metres.toFixed(2))} m`;
/** Physical clearances, never copied dimension strings or decorative extrusion sizes. */
export function measuredGaps(
  layout: FloorLayout,
  stalls: Stall[],
  areas: PavilionArea[] = [],
) {
  if (layout.siteHalls) return layout.siteHalls.flatMap(h=>{
    const local=stalls.filter(st=>st.zone===h.name).map(st=>({...st,x:st.x-h.x,y:st.y-h.y,
      groupId:`${h.id}-${Math.round((st.x-h.x)*1000)}`}));
    const corridors = new Map<string,GapDimension>();
    const objects=(layout.siteObstacles||[]).filter(o=>o.hall===h.id).map((o,i)=>({...o,id:`nonrentable-${h.id}-${i}`,kind:'facility' as const,x:o.x-h.x,y:o.y-h.y,rotation:0,label:'',color:'#e2e8f0',locked:true,nonRentable:true}));
    for(const d of measuredGaps({...layout,siteHalls:undefined,width:h.width,height:h.height,objects,floorBoundary:undefined},local)) {
      const key=`${d.axis}|${d.a.toFixed(2)}|${d.b.toFixed(2)}`;
      if(!corridors.has(key))corridors.set(key,d);
    }
    return [...corridors.values()].map(d=>({...d,
      a:d.a+(d.axis==='x'?h.x:h.y),b:d.b+(d.axis==='x'?h.x:h.y),at:d.at+(d.axis==='x'?h.y:h.x),
      box:{...d.box,x:d.box.x+h.x,y:d.box.y+h.y}}));
  });
  const stocks = stalls.filter((s) => s.placed),
    floor = (
      layout.floorBoundary || [
        { x: 0, y: 0 },
        { x: layout.width, y: 0 },
        { x: layout.width, y: layout.height },
        { x: 0, y: layout.height },
      ]
    ).map((p) => [p.x, p.y]),
    obstacles = [
      ...stocks.map(corners),
      ...layout.objects
        .filter(
          (o) =>
            ["facility", "wall", "entrance"].includes(o.kind) ||
            (o.nonRentable && o.kind !== "aisle"),
        )
        .map((o) => objectVertices(o).map((p) => [p.x, p.y])),
    ];
  const obstacleBounds = obstacles.map((poly) => {
    const xs = poly.map((p) => p[0]),
      ys = poly.map((p) => p[1]);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  });
  const titleAreas = [
    ...areas,
    ...(layout.regions || []).map((r) => ({
      label: areaLabel(
        [ring(r.vertices)],
        r.name,
        stalls,
        undefined,
        projectionProfile(layout).extrusionM,
      ),
    })),
  ];
  const occupied: Rect[] = titleAreas.flatMap((a) =>
      a.label
        ? [
            {
              x: a.label.x - a.label.width / 2,
              y: a.label.y - a.label.height / 2,
              width: a.label.width,
              height: a.label.height,
            },
          ]
        : [],
    ),
    out: GapDimension[] = [];
  const corridors = new Map<string, GapDimension[]>();
  const runCache = new Map<string, number[][]>();
  const boundaryRun = (
    value: number,
    direction: number,
    at: number,
    axis: "x" | "y",
  ) => {
    const perpendicular = axis === "x" ? "y" : "x",
      key = `${axis}|${value.toFixed(6)}|${direction}`;
    if (!runCache.has(key))
      runCache.set(
        key,
        mergedIntervals(
          obstacles.flatMap((p) =>
            intervals(p, value + direction * 1e-5, perpendicular),
          ),
        ),
      );
    const run =
      runCache.get(key)!.find(([a, b]) => at >= a - 1e-6 && at <= b + 1e-6) ||
      intervals(floor, value - direction * 1e-5, perpendicular).find(
        ([a, b]) => at >= a && at <= b,
      );
    return run?.map((n) => n.toFixed(6)).join(":") || at.toFixed(6);
  };
  const rows = new Set<number>(),
    cols = new Set<number>();
  // Use row centres and structural block centres rather than an arbitrary pixel grid.
  const groups = new Map<string, Stall[]>();
  for (const st of stocks) {
    const k = st.groupId || st.id;
    groups.set(k, [...(groups.get(k) || []), st]);
    const pts = corners(st);
    rows.add(
      Number(
        (
          (Math.min(...pts.map((p) => p[1])) +
            Math.max(...pts.map((p) => p[1]))) /
          2
        ).toFixed(4),
      ),
    );
  }
  for (const group of groups.values()) {
    const xs = group.flatMap(corners).map((p) => p[0]);
    cols.add((Math.min(...xs) + Math.max(...xs)) / 2);
  }
  for (const axis of ["x", "y"] as const)
    for (const at of [...(axis === "x" ? rows : cols)].sort((a, b) => a - b)) {
      const merged = mergedIntervals(
        obstacles.flatMap((p) => intervals(p, at, axis)),
      );
      const free: number[][] = [];
      for (const [lo, hi] of intervals(floor, at, axis)) {
        let cursor = lo;
        for (const [a, b] of merged) {
          if (b <= lo || a >= hi) continue;
          if (a > cursor) free.push([cursor, Math.min(a, hi)]);
          cursor = Math.max(cursor, b);
        }
        if (cursor < hi) free.push([cursor, hi]);
      }
      for (const [a, b] of free) {
        if (b - a < 1.2) continue;
        const key =
          axis === "x"
            ? `${axis}|${a.toFixed(6)}|${b.toFixed(6)}|${boundaryRun(a, -1, at, axis)}|${boundaryRun(b, 1, at, axis)}`
            : `${axis}|${a.toFixed(6)}|${b.toFixed(6)}`;
        const label = gapLabel(b - a),
          fontSize = fitText([label], b - a - 0.3, 0.9, 0.65);
        if (fontSize < 0.3) continue;
        const length = textWidth(label, fontSize) + 0.12,
          thickness = fontSize * 1.5 + 0.12;
        const box: Rect =
          axis === "x"
            ? {
                x: (a + b - length) / 2,
                y: at - thickness - 0.16,
                width: length,
                height: thickness,
              }
            : {
                x: at + 0.16,
                y: (a + b - length) / 2,
                width: thickness,
                height: length,
              };
        const candidate = { axis, a, b, at, label, fontSize, box };
        const lineBox = lineBounds(candidate);
        if (occupied.some((r) => overlaps(r, box) || overlaps(r, lineBox)))
          continue;
        const poly = rectPolygon(box);
        if (
          multiArea(clipping.difference(poly, [floor as clipping.Pair[]])) >
          1e-7
        )
          continue;
        if (
          obstacles.some(
            (p, i) =>
              overlaps(box, obstacleBounds[i]) &&
              multiArea(clipping.intersection(poly, [p as clipping.Pair[]])) >
                1e-7,
          )
        )
          continue;
        const list = corridors.get(key) || [];
        list.push(candidate);
        corridors.set(key, list);
      }
    }
  // One stable, staggered annotation per physically continuous corridor.
  // Separate blocks across an aisle retain separate measurements even at the same width.
  for (const [key, choices] of corridors) {
    const start = stableOffset(key) % choices.length;
    for (let i = 0; i < choices.length; i++) {
      const d = choices[(start + i) % choices.length],
        line = lineBounds(d);
      if (occupied.some((r) => overlaps(r, d.box) || overlaps(r, line)))
        continue;
      out.push(d);
      occupied.push(d.box);
      break;
    }
  }
  return out;
}
