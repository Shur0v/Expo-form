import clipping from 'polygon-clipping';
import type { MapGate } from './map-gates';
import {
  corners,
  validateMapModel,
  validateCategoryPublication,
  assignedRegion,
  footprintObstructs,
  footprintPolygon,
  multiArea,
} from "./map-geometry";
import { tracedReference } from "./reference-layout";
import type { DemoState, Hall, Stall } from "./types";
export type MapObjectKind =
  | "pavilion"
  | "aisle"
  | "wall"
  | "entrance"
  | "facility"
  | "text";
export interface ProjectionProfile {
  angleDeg: number;
  extrusionM: number;
  shadowXM: number;
  shadowYM: number;
  shadowBlurM: number;
  frontContrast: number;
  sideContrast: number;
  edgeContrast: number;
}
export interface MapCategory {
  id: string;
  name: string;
  color: string;
  description: string;
  editionId: string;
}
export interface CategoryRegion {
  id: string;
  categoryId: string;
  name: string;
  vertices: { x: number; y: number }[];
  opacity: number;
  policy: "category-first" | "open";
}
export interface MapObject {
  /** Door elevation is presentation; width/height remain its plan footprint. */
  door?: {
    clearWidthM: number;
    elevationM: number;
    frameM: number;
    wallDepthM: number;
    assumed: boolean;
  };
  nonRentable?: boolean;
  groupId?: string;
  id: string;
  kind: MapObjectKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
  color: string;
  locked: boolean;
  points?: string;
  appearance?:
    | "solid"
    | "hatched"
    | "water"
    | "garden"
    | "door-north"
    | "door-south";
}
export interface FloorLayout {
  siteGates?: MapGate[];
  siteObstacles?: {hall:string;x:number;y:number;width:number;height:number}[];
  siteArt?: {hall:string;kind?:string;d:string;fill:string;stroke:string;strokeWidth:number;transform?:string}[];
  siteArtTransform?: string;
  siteSymbols?: {hall:string;kind:string;x:number;y:number;width:number;height:number;rotation:number}[];
  siteSigns?: {hall:string;x:number;y:number;label:string}[];
  siteHalls?: { id: string; name: string; x: number; y: number; width: number; height: number; color: string; dimensionSource: string; northRotation?: number }[];
  version: 1;
  pavilionMode?: "automatic" | "objects";
  categories?: MapCategory[];
  regions?: CategoryRegion[];
  projection?: ProjectionProfile;
  floorBoundary?: { x: number; y: number }[];
  referenceVersion?: "dta-dcc-source-v1";
  name: string;
  width: number;
  height: number;
  calibrated: boolean;
  physicalHallId: string;
  objects: MapObject[];
}
export interface MapBooking {
  id: string;
  company: string;
  status: "held" | "confirmed";
  stallIds: string[];
  expiresAt?: string;
  paths?: string[];
}
export interface MapGeometry {
  hall: Hall;
  layout: FloorLayout;
  stalls: Stall[];
  revision: string;
}
export const physicalHall = (h: Hall) => h.physicalHallId || h.id;
export function layoutRecord(s: DemoState, h: Hall, draft = false) {
  return s.records.find(
    (r) =>
      r.module === (draft ? "floor-draft" : "floor-layout") &&
      r.fields.PhysicalHall === physicalHall(h),
  );
}
export function readLayout(s: DemoState, h: Hall, draft = false): FloorLayout {
  const r = layoutRecord(s, h, draft);
  if (r) return JSON.parse(r.fields.Layout);
  return {
    version: 1,
    name: h.name,
    width: h.width,
    height: h.height,
    calibrated: true,
    physicalHallId: physicalHall(h),
    objects: [],
  };
}
export const floorRevision = (s: DemoState, h: Hall) =>
  Number(
    layoutRecord(s, h, true)?.fields.Revision ||
      layoutRecord(s, h)?.fields.Revision ||
      0,
  );
export { corners } from "./map-geometry";
export function overlap(
  a: Pick<Stall, "x" | "y" | "width" | "height" | "rotation" | "footprintPoints">,
  b: Pick<Stall, "x" | "y" | "width" | "height" | "rotation" | "footprintPoints">,
) {
  if(a.footprintPoints||b.footprintPoints)return multiArea(clipping.intersection(footprintPolygon(a),footprintPolygon(b)))>1e-7;
  const aa = corners(a),
    bb = corners(b);
  for (const poly of [aa, bb])
    for (let i = 0; i < 4; i++) {
      const p = poly[i],
        q = poly[(i + 1) % 4],
        ax = -(q[1] - p[1]),
        ay = q[0] - p[0],
        pa = aa.map((v) => v[0] * ax + v[1] * ay),
        pb = bb.map((v) => v[0] * ax + v[1] * ay);
      if (
        Math.max(...pa) <= Math.min(...pb) + 1e-7 ||
        Math.max(...pb) <= Math.min(...pa) + 1e-7
      )
        return false;
    }
  return true;
}
export function samePhysical(s: DemoState, a: Stall, b: Stall) {
  const ah = s.halls.find((h) => h.id === a.hallId),
    bh = s.halls.find((h) => h.id === b.hallId);
  return !!ah && !!bh && physicalHall(ah) === physicalHall(bh) && overlap(a, b);
}
export function mapBookings(s: DemoState, stalls: Stall[]): MapBooking[] {
  const ids = new Set(stalls.map((st) => st.id));
  return s.participations
    .filter(
      (p) =>
        ["held", "confirmed"].includes(p.booking) &&
        (!p.expiresAt ||
          p.pausedAt ||
          p.booking === "confirmed" ||
          Date.parse(p.expiresAt) > Date.now()),
    )
    .map((p) => ({
      id: p.id,
      company:
        p.booking === "confirmed"
          ? s.companies.find((c) => c.id === p.companyId)?.name ||
            "Registered exhibitor"
          : "Pending approval",
      status: p.booking as "held" | "confirmed",
      stallIds: p.stallIds.filter((id) => ids.has(id)),
      expiresAt: p.booking === "held" && !p.pausedAt ? p.expiresAt : undefined,
    }))
    .filter((p) => p.stallIds.length);
}
function cleanText(v: string) {
  return typeof v === "string" && v.length <= 150 && !/[\u0000-\u001f]/.test(v);
}
export function saveLayout(
  s: DemoState,
  command: Extract<import("./types").Command, { type: "save-layout" }>,
  now: string,
) {
  const h = s.halls.find((h) => h.id === command.hallId);
  if (!h) throw Error("Hall missing");
  if (floorRevision(s, h) !== command.expectedRevision)
    throw Error("This map changed. Reload the latest draft before saving.");
  const l = command.layout,
    stocks = command.stalls;
  if (
    l.version !== 1 ||
    !cleanText(l.name) ||
    !l.name.trim() ||
    !cleanText(l.physicalHallId) ||
    !l.physicalHallId.trim() ||
    ![l.width, l.height].every(
      (n) => Number.isFinite(n) && n > 0 && n <= 1000,
    ) ||
    l.objects.length > 500 ||
    stocks.length > 1000
  )
    throw Error("Invalid layout size or name");
  const oldPhysical = physicalHall(h),
    related = s.halls.filter((x) => physicalHall(x) === oldPhysical),
    oldStocks = s.stalls.filter((st) =>
      related.some((x) => x.id === st.hallId),
    );
  validateMapModel(l, stocks, [...new Set(related.map((h) => h.editionId))]);
  if (
    l.physicalHallId !== oldPhysical &&
    oldStocks.some((st) =>
      s.participations.some(
        (p) =>
          ["held", "confirmed"].includes(p.booking) &&
          p.stallIds.includes(st.id),
      ),
    )
  )
    throw Error("A reserved hall cannot change its physical identity");
  if (
    l.physicalHallId !== oldPhysical &&
    s.halls.some((x) => x.id !== h.id && physicalHall(x) === l.physicalHallId)
  )
    throw Error(
      "Use a shared hall edition link instead of changing an existing hall identity",
    );
  const ids = new Set<string>(),
    codes = new Set<string>(),
    objects = new Set<string>();
  for (const o of l.objects) {
    if (
      objects.has(o.id) ||
      !cleanText(o.id) ||
      !["pavilion", "aisle", "wall", "entrance", "facility", "text"].includes(
        o.kind,
      ) ||
      !cleanText(o.label) ||
      (o.appearance !== undefined &&
        ![
          "solid",
          "hatched",
          "water",
          "garden",
          "door-north",
          "door-south",
        ].includes(o.appearance)) ||
      !/^#[0-9a-f]{6}$/i.test(o.color) ||
      ![o.x, o.y, o.width, o.height, o.rotation].every(Number.isFinite) ||
      o.width <= 0 ||
      o.height <= 0 ||
      (o.points && o.points.length > 1000)
    )
      throw Error("Invalid layout object");
    objects.add(o.id);
    if (
      corners(o).some(
        ([x, y]) =>
          x < -0.001 ||
          y < -0.001 ||
          x > l.width + 0.001 ||
          y > l.height + 0.001,
      )
    )
      throw Error(`${o.label || o.kind} is outside hall bounds`);
    if (o.points) {
      const points = o.points
        .trim()
        .split(/\s+/)
        .map((p) => p.split(",").map(Number));
      if (
        points.length < 3 ||
        points.some(
          (p) =>
            p.length !== 2 ||
            p.some((n) => !Number.isFinite(n)) ||
            p[0] < 0 ||
            p[1] < 0 ||
            p[0] > o.width ||
            p[1] > o.height,
        )
      )
        throw Error("Polygon points must fit the object dimensions");
    }
  }
  for (const st of stocks) {
    const target = s.halls.find((x) => x.id === st.hallId);
    if (
      !target ||
      !related.some((x) => x.id === target.id) ||
      st.editionId !== target.editionId ||
      ids.has(st.id) ||
      codes.has(st.editionId + ":" + st.code) ||
      !cleanText(st.code) ||
      !st.code.trim() ||
      !cleanText(st.zone) ||
      (st.displayLabel !== undefined && !cleanText(st.displayLabel)) ||
      (st.dimensionLabel !== undefined && !cleanText(st.dimensionLabel)) ||
      (st.color !== undefined && !/^#[0-9a-f]{6}$/i.test(st.color)) ||
      !["stall", "service", "decoration"].includes(st.type) ||
      ![st.x, st.y, st.width, st.height, st.rotation, st.price].every(
        Number.isFinite,
      ) ||
      st.width <= 0 ||
      st.height <= 0 ||
      !Number.isSafeInteger(st.price) ||
      st.price < 0
    )
      throw Error("Invalid or duplicate booth");
    ids.add(st.id);
    codes.add(st.editionId + ":" + st.code);
    const existing = s.stalls.find((x) => x.id === st.id);
    if (existing && !oldStocks.some((x) => x.id === st.id))
      throw Error("Booth identity belongs to another hall");
    if (
      st.placed &&
      corners(st).some(
        ([x, y]) =>
          x < -0.001 ||
          y < -0.001 ||
          x > l.width + 0.001 ||
          y > l.height + 0.001,
      )
    )
      throw Error(`${st.code} is outside hall bounds`);
  }
  if (command.publish) {
    validateCategoryPublication(l, stocks, oldStocks, s.participations);
    if (l.regions?.length)
      for (const st of stocks)
        if (st.placed && st.type === "stall")
          st.categoryZoneId = assignedRegion(l, st)?.id;
    if (!l.calibrated)
      throw Error("Confirm measured hall dimensions before publication");
    for (const old of oldStocks) {
      if (
        !s.participations.some(
          (p) =>
            ["held", "confirmed"].includes(p.booking) &&
            p.stallIds.includes(old.id),
        )
      )
        continue;
      const next = stocks.find((st) => st.id === old.id);
      if (old.categoryZoneId) {
        const oldLayout = readLayout(s, h),
          oldRegion = oldLayout.regions?.find(
            (r) => r.id === old.categoryZoneId,
          ),
          nextRegion = l.regions?.find((r) => r.id === old.categoryZoneId);
        if (
          !oldRegion ||
          !nextRegion ||
          oldRegion.categoryId !== nextRegion.categoryId ||
          oldRegion.policy !== nextRegion.policy ||
          oldLayout.categories?.find((c) => c.id === oldRegion.categoryId)
            ?.name !==
            l.categories?.find((c) => c.id === nextRegion.categoryId)?.name
        )
          throw Error("Reserved booth category eligibility cannot change");
      }

      if (
        !next ||
        [
          "x",
          "y",
          "width",
          "height",
          "rotation",
          "placed",
          "hallId",
          "editionId",
          "physicalSpaceId",
          "zone",
          "categoryZoneId",
        ].some((k) => old[k as keyof Stall] !== next[k as keyof Stall])
      )
        throw Error("Reserved booth geometry and assignments cannot change");
    }
    const placed = stocks.filter((st) => st.placed);
    for (let i = 0; i < placed.length; i++) {
      const a = placed[i];
      if (a.type !== "stall") continue;
      for (const b of placed.slice(i + 1))
        if (b.type === "stall" && a.editionId === b.editionId && overlap(a, b))
          throw Error(`Booths ${a.code} and ${b.code} overlap`);
      for (const o of l.objects)
        if (
          (o.nonRentable ||
            ["aisle", "wall", "facility", "entrance"].includes(o.kind) ||
            o.appearance?.startsWith("door-")) &&
          footprintObstructs(a, o)
        )
          throw Error(`${a.code} obstructs ${o.label || o.kind}`);
    }
    for (const x of related) {
      x.physicalHallId = l.physicalHallId;
      x.draft = false;
      x.width = l.width;
      x.height = l.height;
    }
    s.stalls = s.stalls.filter(
      (st) => !oldStocks.some((old) => old.id === st.id),
    );
    s.stalls.push(
      ...stocks.map((st) => {
        const out = { ...st };
        delete out.occupancy;
        return out;
      }),
    );
  }
  const previousDraft = layoutRecord(s, h, true) || layoutRecord(s, h);
  if (previousDraft)
    s.records.push({
      ...previousDraft,
      id: "floor-history-" + crypto.randomUUID(),
      module: "floor-history",
      status: "Previous draft",
      at: now,
    });
  const previous = layoutRecord(s, h);
  if (command.publish && previous)
    s.records.push({
      ...previous,
      id: "floor-history-" + crypto.randomUUID(),
      module: "floor-history",
      status: "Archived",
      at: now,
    });
  const revision = command.expectedRevision + 1;
  const put = (module: string) => {
    s.records = s.records.filter(
      (r) => !(r.module === module && r.fields.PhysicalHall === oldPhysical),
    );
    s.records.push({
      id: `${module}-${h.id}`,
      module,
      editionId: h.editionId,
      title: l.name,
      status: command.publish ? "Published" : "Draft",
      at: now,
      fields: {
        PhysicalHall: command.publish ? l.physicalHallId : oldPhysical,
        Layout: JSON.stringify(l),
        Stalls: JSON.stringify(stocks),
        Revision: String(revision),
      },
    });
  };
  put("floor-draft");
  if (command.publish) put("floor-layout");
}
/** An editable tracing template; dimensions must be verified before publication. */
export function referenceTemplate(h: Hall): {
  layout: FloorLayout;
  stalls: Stall[];
} {
  return tracedReference(h);
}

/** Alternate reference style, with editable service wings and central water feature. */
export function medicalTemplate(h: Hall): {
  layout: FloorLayout;
  stalls: Stall[];
} {
  const objects: MapObject[] = [],
    stalls: Stall[] = [];
  const feature = (
    kind: MapObjectKind,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: string,
    appearance?: MapObject["appearance"],
  ) =>
    objects.push({
      id: crypto.randomUUID(),
      kind,
      x,
      y,
      width,
      height,
      label,
      color,
      appearance,
      rotation: 0,
      locked: false,
    });
  feature("wall", 0, 0, 150, 0.6, "", "#52544d");
  feature("wall", 0, 81.4, 150, 0.6, "", "#52544d");
  feature("wall", 0, 0.6, 0.6, 80.8, "", "#52544d");
  feature("wall", 149.4, 0.6, 0.6, 80.8, "", "#52544d");
  feature("pavilion", 1, 1, 148, 47, "", "#e8f5f8");
  feature("pavilion", 1, 49, 148, 32, "", "#cfedf5");
  feature("wall", 0.6, 48, 148.8, 0.6, "", "#52544d");
  for (const x of [3, 24, 114, 135])
    feature("facility", x, 3, 11, 42, "SERVICE WING", "#d4d4cf", "hatched");
  feature("facility", 64, 4, 22, 41, "", "#cfcac1");
  feature("facility", 66, 6, 18, 37, "", "#0b749b", "water");
  feature("facility", 63, 10, 1, 28, "", "#497d46", "garden");
  feature("facility", 86, 10, 1, 28, "", "#497d46", "garden");
  feature("text", 42, 44, 18, 2, "HALL A & B CORRIDOR", "#334155");
  feature("text", 90, 44, 18, 2, "HALL A & C CORRIDOR", "#334155");
  feature(
    "text",
    12,
    62,
    119,
    3,
    "MEDICAL / DIAGNOSTIC / LAB · DEVICES & EQUIPMENT",
    "#20517c",
  );
  feature("facility", 141, 51, 6, 15, "FOOD ZONE", "#c7c1b3");
  feature("entrance", 1, 7, 2, 5, "ENTRY", "#147c88");
  feature("entrance", 1, 72, 2, 5, "EXIT", "#b94a43");
  feature("entrance", 47, 44.8, 3, 3, "HALL B", "#735335");
  feature("entrance", 100, 44.8, 3, 3, "HALL C", "#735335");
  let n = 0;
  const booth = (
    x: number,
    y: number,
    color: string,
    prefix: string,
    zone: string,
    groupId: string,
  ) => {
    n++;
    stalls.push({
      id: "stall-" + crypto.randomUUID(),
      editionId: h.editionId,
      hallId: h.id,
      physicalSpaceId: "medical-" + n,
      zone,
      code: prefix + String(n).padStart(3, "0"),
      x,
      y,
      width: 3,
      height: 3,
      rotation: 0,
      color,
      groupId,
      price: 240000,
      type: "stall",
      placed: true,
      power: 0,
      air: false,
      water: false,
      loading: 0,
      clearance: 0,
    });
  };
  for (const x of [40, 48, 56, 91, 99, 107]) {
    const group = crypto.randomUUID();
    for (let i = 0; i < 9; i++)
      booth(
        x,
        6 + i * 4,
        "#edc08b",
        x < 75 ? "B" : "C",
        "Surgical & dental",
        group,
      );
  }
  const palette = [
    "#88b6d1",
    "#aaca76",
    "#df929d",
    "#e9c16c",
    "#72b9c9",
    "#c5c0b3",
  ];
  for (let row = 0; row < 2; row++)
    for (let b = 0; b < 6; b++) {
      const group = crypto.randomUUID();
      for (let i = 0; i < 8; i++)
        booth(
          6 + b * 22 + (i % 4) * 3,
          52 + row * 17 + Math.floor(i / 4) * 3,
          palette[(b + row * 2) % palette.length],
          "A",
          "Medical devices",
          group,
        );
    }
  return {
    layout: {
      version: 1,
      name: "Medical & healthcare · Exhibition master",
      width: 150,
      height: 82,
      calibrated: false,
      physicalHallId: physicalHall(h),
      objects,
    },
    stalls,
  };
}

export function displayedBookings(s: DemoState, h: Hall) {
  const family = new Set(
    s.halls.filter((x) => physicalHall(x) === physicalHall(h)).map((x) => x.id),
  );
  const all = s.stalls.filter((st) => st.placed && family.has(st.hallId)),
    visible = all.filter((st) => st.hallId === h.id),
    byId = new Map(all.map((st) => [st.id, st]));
  const cells = new Map<string, Stall[]>();
  const keys = (st: Stall) => {
    const pts = corners(st),
      x0 = Math.floor(Math.min(...pts.map((p) => p[0])) / 8),
      x1 = Math.floor(Math.max(...pts.map((p) => p[0])) / 8),
      y0 = Math.floor(Math.min(...pts.map((p) => p[1])) / 8),
      y1 = Math.floor(Math.max(...pts.map((p) => p[1])) / 8);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 256) return [];
    const result: string[] = [];
    for (let x = x0; x <= x1; x++)
      for (let y = y0; y <= y1; y++) result.push(x + ":" + y);
    return result;
  };
  const large: Stall[] = [];
  for (const st of visible) {
    const slots = keys(st);
    if (!slots.length) large.push(st);
    for (const key of slots) {
      const rows = cells.get(key) || [];
      rows.push(st);
      cells.set(key, rows);
    }
  }
  return mapBookings(s, all)
    .map((b) => {
      const ids = new Set<string>();
      for (const id of b.stallIds) {
        const source = byId.get(id);
        if (!source) continue;
        if (source.hallId === h.id) {
          ids.add(id);
          continue;
        }
        const slots = keys(source),
          candidates = slots.length
            ? [
                ...new Set([
                  ...slots.flatMap((key) => cells.get(key) || []),
                  ...large,
                ]),
              ]
            : visible;
        for (const target of candidates)
          if (overlap(target, source)) ids.add(target.id);
      }
      return { ...b, stallIds: [...ids] };
    })
    .filter((b) => b.stallIds.length);
}
