import { fitText } from "./map-text";
import clipping from "polygon-clipping";
import type {
  FloorLayout,
  CategoryRegion,
  ProjectionProfile,
} from "./floorplan";
import type { Stall, Participation } from "./types";
export const GEOMETRY_EPSILON = 1e-7;
export type Point = { x: number; y: number };
export type Footprint = Pick<
  Stall,
  "x" | "y" | "width" | "height" | "rotation"
>;
export const DEFAULT_PROJECTION: ProjectionProfile = {
  angleDeg: 14,
  extrusionM: 0.65,
  shadowXM: 0.28,
  shadowYM: 0.7,
  shadowBlurM: 0.22,
  frontContrast: 0.7,
  sideContrast: 0.88,
  edgeContrast: 0.65,
};
export const DEFAULT_DOOR = {
  clearWidthM: 1.8,
  elevationM: 2.1,
  frameM: 0.12,
  wallDepthM: 0.3,
  assumed: true,
};
export const projectionProfile = (l: Pick<FloorLayout, "projection">) =>
  l.projection || DEFAULT_PROJECTION;
export function corners(st: Footprint): number[][] {
  const r = (st.rotation * Math.PI) / 180,
    c = Math.cos(r),
    n = Math.sin(r);
  return [
    [0, 0],
    [st.width, 0],
    [st.width, st.height],
    [0, st.height],
  ].map(([x, y]) => [st.x + x * c - y * n, st.y + x * n + y * c]);
}
export const footprintArea = (st: Pick<Stall, "width" | "height">) =>
  st.width * st.height;
export const polygonArea = (p: Point[]) =>
  Math.abs(
    p.reduce((sum, a, i) => {
      const b = p[(i + 1) % p.length];
      return sum + a.x * b.y - b.x * a.y;
    }, 0),
  ) / 2;
export const ring = (p: Point[]): clipping.Polygon => [
  [...p.map((v) => [v.x, v.y] as clipping.Pair), [p[0].x, p[0].y]],
];
export const footprintPolygon = (st: Footprint) =>
  ring(corners(st).map(([x, y]) => ({ x, y })));
export const multiArea = (m: clipping.MultiPolygon) =>
  m.reduce(
    (sum, p) =>
      sum +
      p.reduce(
        (n, r, i) =>
          n + (i ? -1 : 1) * polygonArea(r.map(([x, y]) => ({ x, y }))),
        0,
      ),
    0,
  );
const union = (polys: clipping.Polygon[]): clipping.MultiPolygon =>
  polys.length ? clipping.union(polys[0], ...polys.slice(1)) : [];
export const regionPath = (r: CategoryRegion) =>
  r.vertices.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ") + "Z";
export function objectVertices(o: Footprint & { points?: string }) {
  if (!o.points) return corners(o).map(([x, y]) => ({ x, y }));
  const r = (o.rotation * Math.PI) / 180,
    c = Math.cos(r),
    s = Math.sin(r);
  return o.points
    .trim()
    .split(/\s+/)
    .map((p) => {
      const [x, y] = p.split(",").map(Number);
      return { x: o.x + x * c - y * s, y: o.y + x * s + y * c };
    });
}
export function validPolygon(p: Point[]) {
  if (
    p.length < 3 ||
    p.length > 200 ||
    p.some((v) => !Number.isFinite(v.x) || !Number.isFinite(v.y)) ||
    polygonArea(p) <= GEOMETRY_EPSILON
  )
    return false;
  const cross = (a: Point, b: Point, c: Point) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const on = (a: Point, b: Point, c: Point) =>
    Math.abs(cross(a, b, c)) < GEOMETRY_EPSILON &&
    c.x >= Math.min(a.x, b.x) - GEOMETRY_EPSILON &&
    c.x <= Math.max(a.x, b.x) + GEOMETRY_EPSILON &&
    c.y >= Math.min(a.y, b.y) - GEOMETRY_EPSILON &&
    c.y <= Math.max(a.y, b.y) + GEOMETRY_EPSILON;
  for (let i = 0; i < p.length; i++) {
    const a = p[i],
      b = p[(i + 1) % p.length];
    if (Math.hypot(a.x - b.x, a.y - b.y) < GEOMETRY_EPSILON) return false;
    for (let j = i + 1; j < p.length; j++) {
      if (j === i + 1 || (i === 0 && j === p.length - 1)) continue;
      const c = p[j],
        d = p[(j + 1) % p.length];
      if (
        (cross(a, b, c) * cross(a, b, d) < 0 &&
          cross(c, d, a) * cross(c, d, b) < 0) ||
        on(a, b, c) ||
        on(a, b, d) ||
        on(c, d, a) ||
        on(c, d, b)
      )
        return false;
    }
  }
  return true;
}
export function regionMembership(layout: FloorLayout, st: Stall) {
  const points = corners(st),
    fp = ring(points.map(([x, y]) => ({ x, y }))),
    area = footprintArea(st);
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]),
    minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  return (layout.regions || [])
    .filter((region) => {
      const xs = region.vertices.map((p) => p.x),
        ys = region.vertices.map((p) => p.y);
      return (
        Math.max(...xs) > minX + GEOMETRY_EPSILON &&
        Math.min(...xs) < maxX - GEOMETRY_EPSILON &&
        Math.max(...ys) > minY + GEOMETRY_EPSILON &&
        Math.min(...ys) < maxY - GEOMETRY_EPSILON
      );
    })
    .map((region) => ({
      region,
      area: multiArea(clipping.intersection(fp, ring(region.vertices))),
    }))
    .filter((v) => v.area > GEOMETRY_EPSILON)
    .map((v) => ({
      ...v,
      contained: Math.abs(v.area - area) <= GEOMETRY_EPSILON,
    }));
}
export function assignedRegion(layout: FloorLayout, st: Stall) {
  const found = regionMembership(layout, st);
  return found.length === 1 &&
    found[0].contained &&
    (!st.categoryZoneId || st.categoryZoneId === found[0].region.id)
    ? found[0].region
    : undefined;
}
export function eligibleForCategory(
  layout: FloorLayout,
  st: Stall,
  category: string,
) {
  if (!layout.regions?.length) return true;
  const region = assignedRegion(layout, st);
  if (!region) return false;
  const c = layout.categories?.find((c) => c.id === region.categoryId);
  return (
    region.policy === "open" ||
    (!!c &&
      [c.id.toLowerCase(), c.name.trim().toLowerCase()].includes(
        category.trim().toLowerCase(),
      ))
  );
}
export function validateMapModel(
  l: FloorLayout,
  stalls: Stall[],
  editionId: string | string[],
) {
  if (
    l.pavilionMode !== undefined &&
    !["automatic", "objects"].includes(l.pavilionMode)
  )
    throw Error("Invalid pavilion background mode");
  if (l.projection) {
    const p = l.projection;
    if (
      !Object.values(p).every(Number.isFinite) ||
      p.angleDeg < 0 ||
      p.angleDeg > 60 ||
      p.extrusionM < 0 ||
      p.extrusionM > 2 ||
      p.shadowBlurM < 0 ||
      p.shadowBlurM > 1 ||
      Math.abs(p.shadowXM) > 3 ||
      Math.abs(p.shadowYM) > 3 ||
      [p.frontContrast, p.sideContrast, p.edgeContrast].some(
        (v) => v < 0 || v > 1,
      )
    )
      throw Error("Invalid projection profile");
  }
  const boundary = l.floorBoundary || [
    { x: 0, y: 0 },
    { x: l.width, y: 0 },
    { x: l.width, y: l.height },
    { x: 0, y: l.height },
  ];
  const inHall = (p: Point[]) =>
    p.every((v) => v.x >= 0 && v.y >= 0 && v.x <= l.width && v.y <= l.height);
  if (!validPolygon(boundary) || !inHall(boundary))
    throw Error("Invalid floor boundary");
  const ids = new Set<string>();
  for (const c of l.categories || []) {
    if (
      ids.has(c.id) ||
      !c.id.trim() ||
      c.id.length > 150 ||
      !c.name.trim() ||
      c.name.length > 150 ||
      c.description.length > 1000 ||
      !(Array.isArray(editionId) ? editionId : [editionId]).includes(
        c.editionId,
      ) ||
      !/^#[0-9a-f]{6}$/i.test(c.color)
    )
      throw Error("Invalid or duplicate category");
    ids.add(c.id);
  }
  if ((l.categories?.length || 0) > 100 || (l.regions?.length || 0) > 100)
    throw Error("Too many category regions");
  const regions = new Set<string>();
  for (const r of l.regions || []) {
    if (
      regions.has(r.id) ||
      !r.id.trim() ||
      r.id.length > 150 ||
      !r.name.trim() ||
      r.name.length > 150 ||
      !ids.has(r.categoryId) ||
      !["open", "category-first"].includes(r.policy) ||
      !Number.isFinite(r.opacity) ||
      r.opacity < 0 ||
      r.opacity > 1 ||
      !validPolygon(r.vertices) ||
      !inHall(r.vertices) ||
      multiArea(clipping.difference(ring(r.vertices), ring(boundary))) >
        GEOMETRY_EPSILON
    )
      throw Error("Invalid category boundary or category reference");
    regions.add(r.id);
  }
  for (const [i, a] of (l.regions || []).entries())
    for (const b of (l.regions || []).slice(i + 1))
      if (
        multiArea(clipping.intersection(ring(a.vertices), ring(b.vertices))) >
        GEOMETRY_EPSILON
      )
        throw Error("Category boundaries overlap");
  for (const o of l.objects) {
    if (o.points && !validPolygon(objectVertices(o)))
      throw Error("Malformed object polygon");
    if (o.door) {
      const d = o.door;
      if (
        ![d.clearWidthM, d.elevationM, d.frameM, d.wallDepthM].every(
          (v) => Number.isFinite(v) && v > 0,
        ) ||
        d.clearWidthM + 2 * d.frameM > o.width + GEOMETRY_EPSILON ||
        d.elevationM > 10 ||
        d.frameM > 0.5 ||
        d.wallDepthM > 2
      )
        throw Error("Invalid door dimensions or frame wider than its bay");
    }
  }
  for (const st of stalls) {
    if (st.categoryZoneId && !regions.has(st.categoryZoneId))
      throw Error("Stall category zone is missing");
    if (
      st.placed &&
      multiArea(clipping.difference(footprintPolygon(st), ring(boundary))) >
        GEOMETRY_EPSILON
    )
      throw Error(`${st.code} is outside the floor bounds`);
  }
}
export function validateCategoryPublication(
  l: FloorLayout,
  stocks: Stall[],
  old: Stall[],
  participations: Participation[],
) {
  if (!l.regions?.length) return;
  for (const st of stocks.filter((st) => st.placed && st.type === "stall")) {
    const r = assignedRegion(l, st);
    if (!r) throw Error(`${st.code} must fit exactly one category zone`);
    const previous = old.find((v) => v.id === st.id);
    if (
      previous &&
      participations.some(
        (p) =>
          ["held", "confirmed"].includes(p.booking) &&
          p.stallIds.includes(st.id),
      )
    ) {
      // Existing holds retain their previous eligibility, even if legacy maps had no regions.
      if (!previous.categoryZoneId || previous.categoryZoneId !== r.id)
        throw Error("Reserved booth category assignments cannot change");
    }
  }
}
export function assertCategoryBooking(
  l: FloorLayout,
  st: Stall,
  category: string,
) {
  if (!eligibleForCategory(l, st, category))
    throw Error(
      "This stall is outside your category. Discuss a custom location with sales.",
    );
}
export function mapMeasurements(
  l: FloorLayout,
  stocks: Stall[],
  bookings: { status: string; stallIds: string[] }[],
) {
  const seen = new Set<string>(),
    stalls = stocks.filter(
      (st) =>
        st.placed &&
        st.type === "stall" &&
        !seen.has(st.id) &&
        !!seen.add(st.id),
    );
  const floor = ring(
    l.floorBoundary || [
      { x: 0, y: 0 },
      { x: l.width, y: 0 },
      { x: l.width, y: l.height },
      { x: 0, y: l.height },
    ],
  );
  const excluded = union(
    l.objects
      .filter(
        (o) =>
          o.nonRentable ||
          ["aisle", "wall", "facility", "entrance"].includes(o.kind),
      )
      .map((o) => ring(objectVertices(o))),
  );
  const net = excluded.length ? clipping.difference(floor, excluded) : [floor];
  const state = new Map<string, string>();
  for (const b of bookings)
    for (const id of b.stallIds)
      if (state.get(id) !== "confirmed") state.set(id, b.status);
  for (const st of stalls)
    if (st.occupancy && st.occupancy !== "available")
      state.set(st.id, st.occupancy);
  const sums = new Map<string, number>();
  const sum = (items: Stall[]) => {
    if (!items.length) return 0;
    const key = JSON.stringify(items.map((st) => st.id));
    if (sums.has(key)) return sums.get(key)!;
    const u = union(items.map(footprintPolygon)),
      area = u.length ? multiArea(clipping.intersection(u, net)) : 0;
    sums.set(key, area);
    return area;
  };
  const breakdown = (items: Stall[]) => ({
    rentable: sum(items),
    occupied: sum(items.filter((st) => state.get(st.id) === "confirmed")),
    reserved: sum(items.filter((st) => state.get(st.id) === "held")),
    available: sum(items.filter((st) => !state.has(st.id))),
  });
  const memberships = new Map(
    stalls.map((st) => [st.id, assignedRegion(l, st)?.id]),
  );
  return {
    gross: multiArea([floor]),
    net: multiArea(net),
    ...breakdown(stalls),
    zones: (l.regions || []).map((r) => {
      const poly = ring(r.vertices),
        inside = stalls.filter((st) => memberships.get(st.id) === r.id);
      return {
        id: r.id,
        categoryId: r.categoryId,
        name: r.name,
        gross: polygonArea(r.vertices),
        net: multiArea(clipping.intersection(poly, net)),
        ...breakdown(inside),
        count: inside.length,
      };
    }),
  };
}
export function extrusionGeometry(
  st: Footprint,
  p: ProjectionProfile,
  flat = false,
) {
  const dy = flat ? 0 : p.extrusionM,
    dx = -dy * Math.tan((p.angleDeg * Math.PI) / 180);
  const path = (points: number[][]) =>
    points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ") + "Z";
  return {
    front: path([
      [0, st.height],
      [st.width, st.height],
      [st.width + dx, st.height + dy],
      [dx, st.height + dy],
    ]),
    side: path([
      [0, 0],
      [0, st.height],
      [dx, st.height + dy],
      [dx, 0],
    ]),
    dx,
    dy,
  };
}
export const measuredLabel = (st: Stall) =>
  `${Number(st.width.toFixed(3))} × ${Number(st.height.toFixed(3))} m`;

/** Fit authoritative dimension text inside the physical top face at every zoom. */
export function dimensionFontSize(st: Stall, reference = false) {
  const label = st.displayLabel || measuredLabel(st);
  return fitText(
    [label],
    st.width * 0.9,
    st.height * 0.35,
    reference ? 0.56 : 0.38,
  );
}

export function footprintObstructs(
  st: Footprint,
  object: Footprint & { points?: string },
) {
  return (
    multiArea(
      clipping.intersection(footprintPolygon(st), ring(objectVertices(object))),
    ) > GEOMETRY_EPSILON
  );
}

export function boothCodeFontSize(st: Stall, reference = false) {
  return fitText(
    [st.code],
    st.width * 0.9,
    st.height * 0.35,
    reference ? 0.52 : 0.85,
  );
}
