import type { FloorLayout, MapBooking, MapGeometry } from "./floorplan";
import type { DemoState, Hall, Stall } from "./types";
import {
  tracedReference,
  referenceFrame,
  REFERENCE_VERSION,
} from "./reference-layout";
import { corners } from "./map-geometry";
import { companyOutlines } from "./map-outlines";
export const DESIGN_PREVIEW =
  process.env.NEXT_PUBLIC_FLOORPLAN_DESIGN_PREVIEW !== "false";
export type SceneRect = { x: number; y: number; w: number; h: number };
export type Alignment = {
  horizontal: "left" | "center" | "right";
  vertical: "top" | "center" | "bottom";
};
export const CENTER_ALIGNMENT: Alignment = {
  horizontal: "center",
  vertical: "center",
};
export function boundsOf(stalls: Stall[]): SceneRect {
  const pts = stalls.flatMap(corners),
    xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}
export function sceneBounds(layout: FloorLayout): SceneRect {
  const frame = layout.referenceVersion
    ? referenceFrame
    : { x: -3, y: -3, w: layout.width + 6, h: layout.height + 6 };
  const x = Math.min(frame.x, -3),
    y = Math.min(frame.y, -3);
  return {
    x,
    y,
    w: Math.max(frame.x + frame.w, layout.width + 3) - x,
    h: Math.max(frame.y + frame.h, layout.height + 3) - y,
  };
}
const clampAxis = (n: number, size: number, start: number, length: number) =>
  size <= length
    ? Math.max(start, Math.min(start + length - size, n))
    : start + (length - size) / 2;
export function clampScene(rect: SceneRect, scene: SceneRect): SceneRect {
  return {
    ...rect,
    x: clampAxis(rect.x, rect.w, scene.x, scene.w),
    y: clampAxis(rect.y, rect.h, scene.y, scene.h),
  };
}
export function selectionContext(
  stalls: Stall[],
  scene: SceneRect,
  alignment: Alignment = CENTER_ALIGNMENT,
): SceneRect | undefined {
  if (!stalls.length) return;
  const b = boundsOf(stalls),
    w = Math.max(40, b.w + 4),
    h = Math.max(40, b.h + 4);
  const x =
    alignment.horizontal === "left"
      ? b.x - 2
      : alignment.horizontal === "right"
        ? b.x + b.w + 2 - w
        : b.x + b.w / 2 - w / 2;
  const y =
    alignment.vertical === "top"
      ? b.y - 2
      : alignment.vertical === "bottom"
        ? b.y + b.h + 2 - h
        : b.y + b.h / 2 - h / 2;
  return clampScene({ x, y, w, h }, scene);
}
export function fitScene(
  rect: SceneRect,
  width: number,
  height: number,
  mode: "contain" | "cover" = "contain",
): SceneRect {
  const aspect = Math.max(1, width) / Math.max(1, height),
    w =
      mode === "contain"
        ? Math.max(rect.w, rect.h * aspect)
        : Math.min(rect.w, rect.h * aspect),
    h = w / aspect;
  return { x: rect.x + (rect.w - w) / 2, y: rect.y + (rect.h - h) / 2, w, h };
}
export function canonicalHall(
  s: DemoState,
  allowed?: string[],
): Hall | undefined {
  return s.halls
    .filter(
      (h) =>
        h.id.endsWith("-reference-master-v2") &&
        (!allowed || allowed.includes(h.editionId)),
    )
    .sort(
      (a, b) =>
        Number(s.editions.find((e) => e.id === b.editionId)?.series === "DTA") -
          Number(
            s.editions.find((e) => e.id === a.editionId)?.series === "DTA",
          ) ||
        (s.editions.find((e) => e.id === b.editionId)?.year || 0) -
          (s.editions.find((e) => e.id === a.editionId)?.year || 0),
    )[0];
}
/** Synthetic IDs and occupancy never enter DemoState or real command APIs. */
export function previewGeometry(editionId: string): MapGeometry {
  const hall = {
    id: "design-preview",
    physicalHallId: "design-preview",
    editionId,
    name: "DTA / DCC · Design preview",
    width: 154.6,
    height: 53.6,
  } as Hall;
  const source = tracedReference(hall);
  return {
    hall,
    layout: {
      ...source.layout,
      name: hall.name,
      pavilionMode: "automatic",
      objects: source.layout.objects.map((o, i) => ({
        ...o,
        id: "preview-object-" + i,
      })),
    },
    stalls: source.stalls
      .map((st) => ({ ...st, id: "preview-" + st.code, groupId: undefined }))
      .map((st, i) => {
        // Match the source structural group by its original membership, with stable group IDs.
        const original = source.stalls[i],
          first = source.stalls.findIndex(
            (s) => s.groupId === original.groupId,
          );
        return { ...st, groupId: "preview-group-" + first };
      }),
    revision: REFERENCE_VERSION,
  };
}
export function previewExamples(stalls: Stall[]): MapBooking[] {
  const codes = (list: string[]) =>
    stalls.filter((s) => list.includes(s.code)).map((s) => s.id);
  const confirmed: MapBooking = {
    id: "preview-brother",
    company: "Brother and Brother Corporation",
    status: "confirmed",
    stallIds: codes(["A045", "A046", "A047", "A048"]),
  };
  return [
    { ...confirmed, paths: companyOutlines(confirmed, stalls) },
    ...[["A017", "A018"], ["B031", "B032"], ["C017", "C018"], ["D025"]].map(
      (list, i) => ({
        id: "preview-pending-" + i,
        company: "Pending exhibitor " + (i + 1),
        status: "held" as const,
        stallIds: codes(list),
      }),
    ),
  ];
}
export const exhibitionOf = (code: string): "DTA" | "DCC" =>
  /^[LAB]/.test(code) ? "DTA" : "DCC";
export const pavilionOf = (zone: string) =>
  zone.includes("China")
    ? "China"
    : zone.includes("Pakistan")
      ? "Pakistan"
      : "General";
export const previewHoldKey = (accountId: string) =>
  `ecoexpo-formstudio-map-preview-holds-${REFERENCE_VERSION}-${accountId}`;
export type PreviewHold = { id: string; stallIds: string[]; expiresAt: string };
export function validPreviewHolds(
  value: unknown,
  stalls: Stall[],
  blocked: Set<string>,
  now = Date.now(),
): PreviewHold[] {
  if (!Array.isArray(value)) return [];
  const valid = new Set(stalls.map((s) => s.id)),
    seen = new Set<string>();
  return value.flatMap((v) => {
    if (
      !v ||
      typeof v.id !== "string" ||
      !Array.isArray(v.stallIds) ||
      typeof v.expiresAt !== "string" ||
      !Number.isFinite(Date.parse(v.expiresAt)) ||
      Date.parse(v.expiresAt) <= now
    )
      return [];
    const ids = v.stallIds.filter(
      (id: unknown): id is string =>
        typeof id === "string" &&
        valid.has(id) &&
        !blocked.has(id) &&
        !seen.has(id) &&
        !!seen.add(id),
    );
    return ids.length
      ? [{ id: v.id, stallIds: ids, expiresAt: v.expiresAt }]
      : [];
  });
}
