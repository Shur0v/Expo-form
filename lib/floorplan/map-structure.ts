import { textWidth } from "./map-text";
import clipping from "polygon-clipping";
import type { FloorLayout } from "./floorplan";
import type { Stall } from "./types";
import {
  corners,
  projectionProfile,
  footprintPolygon,
  multiArea,
  ring,
  objectVertices,
  GEOMETRY_EPSILON,
} from "./map-geometry";
export type SurfaceEdge = {
  stallId: string;
  kind: "front" | "side";
  path: string;
  seam: string;
};
const path = (p: number[][]) =>
  p.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ") + "Z";
const cross = (a: number[], b: number[]) => a[0] * b[1] - a[1] * b[0];
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1];
/** Only exposed edges extrude. Shared edges retain a thin cell seam, never a side fin. */
export function joinedEdges(
  stalls: Stall[],
  layout: FloorLayout,
): SurfaceEdge[] {
  const p = projectionProfile(layout),
    dy = p.extrusionM,
    dx = -dy * Math.tan((p.angleDeg * Math.PI) / 180),
    out: SurfaceEdge[] = [];
  if (!dy) return out;
  const placed = stalls.filter((st) => st.placed),
    points = new Map(placed.map((st) => [st.id, corners(st)]));
  const cells = new Map<string, Stall[]>(),
    keys = (st: Stall) => {
      const pts = points.get(st.id)!,
        xs = pts.map((v) => v[0]),
        ys = pts.map((v) => v[1]),
        k: string[] = [];
      const a = Math.floor(Math.min(...xs) / 8),
        b = Math.floor(Math.max(...xs) / 8),
        c = Math.floor(Math.min(...ys) / 8),
        d = Math.floor(Math.max(...ys) / 8);
      if ((b - a + 1) * (d - c + 1) > 5000) return [];
      for (let x = a; x <= b; x++)
        for (let y = c; y <= d; y++)
          k.push(`${st.hallId}|${st.editionId}|${x},${y}`);
      return k;
    };
  const large: Stall[] = [];
  for (const st of placed) {
    const list = keys(st);
    if (!list.length) large.push(st);
    for (const key of list) cells.set(key, [...(cells.get(key) || []), st]);
  }
  for (const st of placed) {
    const pts = points.get(st.id)!,
      ks = keys(st),
      near = ks.length
        ? [...new Set([...ks.flatMap((k) => cells.get(k) || []), ...large])]
        : placed;
    for (let i = 0; i < 4; i++) {
      const a = pts[i],
        b = pts[(i + 1) % 4],
        u = [b[0] - a[0], b[1] - a[1]],
        length2 = dot(u, u);
      if (u[1] * dx - u[0] * dy <= 1e-9) continue;
      const covered: number[][] = [];
      for (const other of near) {
        if (
          other.id === st.id ||
          other.hallId !== st.hallId ||
          other.editionId !== st.editionId
        )
          continue;
        const q = points.get(other.id)!;
        for (let j = 0; j < 4; j++) {
          const c = q[j],
            d = q[(j + 1) % 4],
            v = [d[0] - c[0], d[1] - c[1]],
            ca = [c[0] - a[0], c[1] - a[1]];
          if (
            dot(u, v) >= 0 ||
            Math.abs(cross(u, v)) > 1e-6 * Math.sqrt(length2) ||
            Math.abs(cross(u, ca)) > 1e-6 * Math.sqrt(length2)
          )
            continue;
          const t0 = dot(ca, u) / length2,
            t1 = dot([d[0] - a[0], d[1] - a[1]], u) / length2,
            lo = Math.max(0, Math.min(t0, t1)),
            hi = Math.min(1, Math.max(t0, t1));
          if (hi - lo > 1e-8) covered.push([lo, hi]);
        }
      }
      covered.sort((a, b) => a[0] - b[0]);
      const visible: number[][] = [];
      let cursor = 0;
      for (const [lo, hi] of covered) {
        if (lo > cursor + 1e-8) visible.push([cursor, lo]);
        cursor = Math.max(cursor, hi);
      }
      if (cursor < 1 - 1e-8) visible.push([cursor, 1]);
      for (const [lo, hi] of visible) {
        const start = [a[0] + u[0] * lo, a[1] + u[1] * lo],
          end = [a[0] + u[0] * hi, a[1] + u[1] * hi],
          side = Math.abs(u[1]) > Math.abs(u[0]);
        // Vertical left surface follows the supplied flat-top/tapered-bottom construction.
        const firstShift = [start[0] + dx, start[1] + dy];
        const lastShift =
          side && Math.abs(u[0]) < 1e-7
            ? [end[0] + dx, end[1]]
            : [end[0] + dx, end[1] + dy];
        out.push({
          stallId: st.id,
          kind: side ? "side" : "front",
          path: path([start, end, lastShift, firstShift]),
          seam: side
            ? ""
            : `M${start[0]},${start[1]}L${firstShift[0]},${firstShift[1]}`,
        });
      }
    }
  }
  return out;
}
export type PavilionArea = {
  id: string;
  name: string;
  color: string;
  paths: string[];
  polygons: clipping.MultiPolygon;
  stallIds: string[];
  gross: number;
  rentable: number;
  label?: {
    x: number;
    y: number;
    fontSize: number;
    width: number;
    height: number;
  };
};
export const automaticPavilions = (l: FloorLayout) =>
  !l.regions?.length &&
  (l.pavilionMode === "automatic" ||
    (!!l.referenceVersion && l.pavilionMode !== "objects"));
export const polygonPaths = (polys: clipping.MultiPolygon) =>
  polys.map((poly) => poly.map((r) => path(r)).join(" "));
function bounds(stalls: Stall[]) {
  const pts = stalls.flatMap(corners),
    xs = pts.map((v) => v[0]),
    ys = pts.map((v) => v[1]);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  };
}
function contains(polys: clipping.MultiPolygon, x: number, y: number) {
  let inside = false;
  for (const poly of polys) {
    let part = false;
    for (const r of poly) {
      let hit = false;
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const a = r[i],
          b = r[j];
        if (
          a[1] > y !== b[1] > y &&
          x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
        )
          hit = !hit;
      }
      if (hit) part = !part;
    }
    if (part) inside = true;
  }
  return inside;
}
/** Prefer empty space inside the allocated polygon; labels never use hard-coded map positions. */
export function areaLabel(
  polys: clipping.MultiPolygon,
  name: string,
  stalls: Stall[],
  preferredY?: number,
  visualDepth = 0,
) {
  const all = polys.flat(2),
    xs = all.map((v) => v[0]),
    ys = all.map((v) => v[1]);
  if (!all.length) return undefined;
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys),
    lines = name.split("\n"),
    advance = Math.max(1, ...lines.map((line) => textWidth(line))),
    maximum = Math.min(
      1.15,
      (maxX - minX - 0.3) / advance,
      (maxY - minY - 0.3) / (lines.length * 1.5),
    );
  const obstacles = stalls.map((st) => {
    const b = bounds([st]);
    return { ...b, bottom: b.bottom + visualDepth };
  });
  // Retry smaller type when a short band or concave boundary cannot fit the preferred size.
  for (let fontSize = maximum; fontSize >= 0.12; fontSize *= 0.8) {
    const width = advance * fontSize + 0.16,
      h = fontSize * lines.length * 1.5 + 0.16;
    const yscan = [
      ...(preferredY === undefined ? [] : [preferredY]),
      (minY + maxY) / 2,
      minY + h / 2 + 0.02,
      maxY - h / 2 - 0.02,
    ];
    for (let y = minY + h / 2; y <= maxY - h / 2; y += Math.max(h / 2, 0.3))
      yscan.push(y);
    const xscan = [0.5, 0.35, 0.65, 0.2, 0.8].map(
      (t) => minX + (maxX - minX) * t,
    );
    for (const x of xs) xscan.push(x + width / 2 + 0.02, x - width / 2 - 0.02);
    for (const y of yscan)
      for (const x of xscan) {
        const left = x - width / 2,
          right = x + width / 2,
          top = y - h / 2,
          bottom = y + h / 2;
        if (left < minX || right > maxX || top < minY || bottom > maxY)
          continue;
        if (
          ![
            [left, top],
            [right, top],
            [right, bottom],
            [left, bottom],
            [x, y],
          ].every(([x, y]) => contains(polys, x, y))
        )
          continue;
        if (
          obstacles.some(
            (b) =>
              left < b.right + 0.08 &&
              right > b.x - 0.08 &&
              top < b.bottom + 0.08 &&
              bottom > b.y - 0.08,
          )
        )
          continue;
        const labelBox = ring([
          { x: left, y: top },
          { x: right, y: top },
          { x: right, y: bottom },
          { x: left, y: bottom },
        ]);
        if (multiArea(clipping.difference(labelBox, polys)) > GEOMETRY_EPSILON)
          continue;
        return { x, y, fontSize, width, height: h };
      }
  }
  return undefined;
}
/** Legacy pavilion names become geometry-linked allocation bands, not product-category guesses. */
export function derivePavilions(
  layout: FloorLayout,
  stalls: Stall[],
): PavilionArea[] {
  if (!automaticPavilions(layout)) return [];
  const groups = new Map<string, Stall[]>();
  const seen = new Set<string>();
  for (const st of stalls.filter(
    (st) =>
      st.placed && st.type === "stall" && !seen.has(st.id) && !!seen.add(st.id),
  )) {
    const key = `${st.editionId}|${st.hallId}|${st.zone}|${st.groupId || st.id}`;
    groups.set(key, [...(groups.get(key) || []), st]);
  }
  const blocks = [...groups.values()].map((stocks) => ({
    stocks,
    ...bounds(stocks),
  }));
  const bands: {
    stocks: Stall[];
    blocks: typeof blocks;
    name: string;
    x: number;
    y: number;
    right: number;
    bottom: number;
  }[] = [];
  for (const b of blocks.sort((a, b) => a.y - b.y || a.x - b.x)) {
    const existing = bands.find(
      (v) =>
        v.name === b.stocks[0].zone &&
        v.stocks[0].hallId === b.stocks[0].hallId &&
        Math.abs(v.y - b.y) < 0.01 &&
        Math.abs(v.bottom - b.bottom) < 0.01,
    );
    if (existing) {
      existing.blocks.push(b);
      existing.stocks.push(...b.stocks);
      existing.x = Math.min(existing.x, b.x);
      existing.right = Math.max(existing.right, b.right);
    } else
      bands.push({
        ...b,
        stocks: [...b.stocks],
        blocks: [b],
        name: b.stocks[0].zone,
      });
  }
  const floor = ring(
    layout.floorBoundary || [
      { x: 0, y: 0 },
      { x: layout.width, y: 0 },
      { x: layout.width, y: layout.height },
      { x: 0, y: layout.height },
    ],
  );
  const excluded = layout.objects
    .filter(
      (o) =>
        ["wall", "aisle", "facility", "entrance"].includes(o.kind) ||
        o.nonRentable,
    )
    .map((o) => ring(objectVertices(o)));
  const out: PavilionArea[] = [],
    used: clipping.MultiPolygon = [];
  const margins = (b: (typeof bands)[number]) =>
    b.stocks.every((st) => /^[AB]\d/.test(st.code))
      ? { top: 2.25, bottom: 0.75 }
      : b.stocks.every((st) => /^[CD]\d/.test(st.code))
        ? { top: 0.75, bottom: 2.25 }
        : { top: 0.75, bottom: 0.75 };
  for (const b of bands) {
    const desired = margins(b);
    let top = desired.top,
      bottom = desired.bottom,
      left = 1.5,
      right = 1.5;
    for (const other of bands) {
      if (other === b) continue;
      const horizontal = other.right > b.x && other.x < b.right,
        vertical = other.bottom > b.y && other.y < b.bottom;
      if (horizontal && other.bottom <= b.y)
        top = Math.min(
          top,
          Math.max(
            0,
            ((b.y - other.bottom) * desired.top) /
              (desired.top + margins(other).bottom),
          ),
        );
      if (horizontal && other.y >= b.bottom)
        bottom = Math.min(
          bottom,
          Math.max(
            0,
            ((other.y - b.bottom) * desired.bottom) /
              (desired.bottom + margins(other).top),
          ),
        );
      if (vertical && other.right <= b.x)
        left = Math.min(left, Math.max(0, (b.x - other.right) / 2));
      if (vertical && other.x >= b.right)
        right = Math.min(right, Math.max(0, (other.x - b.right) / 2));
    }
    const rectangles = b.blocks.map((v) =>
      ring([
        { x: v.x - left, y: v.y - top },
        { x: v.right + right, y: v.y - top },
        { x: v.right + right, y: v.bottom + bottom },
        { x: v.x - left, y: v.bottom + bottom },
      ]),
    );
    let polygons = clipping.intersection(
      clipping.union(rectangles[0], ...rectangles.slice(1)),
      floor,
    );
    const foreign = stalls
      .filter(
        (st) =>
          st.placed &&
          st.type === "stall" &&
          st.hallId === b.stocks[0].hallId &&
          st.editionId === b.stocks[0].editionId &&
          st.zone !== b.name,
      )
      .map(footprintPolygon);
    if (foreign.length) polygons = clipping.difference(polygons, ...foreign);
    if (excluded.length) polygons = clipping.difference(polygons, ...excluded);
    if (used.length) polygons = clipping.difference(polygons, used);
    if (!polygons.length) continue;
    used.push(...polygons);
    const name = b.name,
      color = b.stocks[0].color || "#edc2ae",
      showLabel = !b.stocks.every((st) => /^[LR]\d/.test(st.code));
    const below = b.stocks.every((st) => /^[CD]\d/.test(st.code));
    out.push({
      id: `pavilion-${b.stocks[0].id}`,
      name,
      color,
      polygons,
      paths: polygonPaths(polygons),
      stallIds: b.stocks.map((st) => st.id),
      gross: multiArea(polygons),
      rentable: multiArea(
        clipping.union(
          footprintPolygon(b.stocks[0]),
          ...b.stocks.slice(1).map(footprintPolygon),
        ),
      ),
      label: showLabel
        ? areaLabel(
            polygons,
            name,
            stalls,
            below
              ? b.bottom + (bottom + projectionProfile(layout).extrusionM) / 2
              : b.y - top / 2,
            projectionProfile(layout).extrusionM,
          )
        : undefined,
    });
  }
  return out;
}
export function hideDetachedArtwork(
  layout: FloorLayout,
  stalls: Stall[],
  o: FloorLayout["objects"][number],
) {
  if (!automaticPavilions(layout) && !layout.regions?.length) return false;
  return (
    (o.kind === "pavilion" && !o.label) ||
    (o.kind === "text" && stalls.some((st) => st.zone === o.label))
  );
}

export function pavilionOccupancy(
  area: PavilionArea,
  stalls: Stall[],
  bookings: { status: string; stallIds: string[] }[],
) {
  const ids = new Set(area.stallIds),
    stocks = [
      ...new Map(
        stalls.filter((st) => ids.has(st.id)).map((st) => [st.id, st]),
      ).values(),
    ],
    status = new Map<string, string>();
  for (const b of bookings)
    for (const id of b.stallIds)
      if (status.get(id) !== "confirmed") status.set(id, b.status);
  for (const st of stocks)
    if (st.occupancy && st.occupancy !== "available")
      status.set(st.id, st.occupancy);
  const sum = (list: Stall[]) =>
    list.length
      ? multiArea(
          clipping.intersection(
            clipping.union(
              footprintPolygon(list[0]),
              ...list.slice(1).map(footprintPolygon),
            ),
            area.polygons,
          ),
        )
      : 0;
  return {
    occupied: sum(stocks.filter((st) => status.get(st.id) === "confirmed")),
    reserved: sum(stocks.filter((st) => status.get(st.id) === "held")),
    available: sum(stocks.filter((st) => !status.has(st.id))),
  };
}
