import { areaLabel } from "./map-structure";
import { wrapName } from "./map-text";
import polygonClipping from "polygon-clipping";
import { corners, type MapBooking } from "./floorplan";
import type { Stall } from "./types";
/** One outline per connected component. Grouping never erases individual inventory. */
export function companyOutlines(booking: MapBooking, stalls: Stall[]) {
  const byZone = new Map<string, Stall[]>(),
    ids = new Set(booking.stallIds);
  for (const st of stalls.filter((st) => ids.has(st.id))) {
    const key = [
      st.hallId,
      st.editionId,
      st.zone,
      st.categoryZoneId || "",
    ].join("|");
    byZone.set(key, [...(byZone.get(key) || []), st]);
  }
  return [...byZone.values()].flatMap((group) => {
    if (!group.length) return [];
    const polygons = group.map((st) => {
      const ring = corners(st) as [number, number][];
      return [[...ring, ring[0]]] as polygonClipping.Polygon;
    });
    return polygonClipping
      .union(polygons[0], ...polygons.slice(1))
      .map((poly) =>
        poly
          .map(
            (r) =>
              r
                .map(
                  (p, i) =>
                    `${i ? "L" : "M"}${p[0].toFixed(3)},${p[1].toFixed(3)}`,
                )
                .join(" ") + " Z",
          )
          .join(" "),
      );
  });
}

/** Our cached outlines contain only absolute M/L rings; preserve holes for label placement. */
export function outlinePolygon(path: string): polygonClipping.Polygon {
  return [...path.matchAll(/M([^M]+)/g)]
    .map((match) => {
      const n =
        match[1].match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)?.map(Number) || [];
      return Array.from(
        { length: Math.floor(n.length / 2) },
        (_, i) => [n[i * 2], n[i * 2 + 1]] as polygonClipping.Pair,
      );
    })
    .filter((r) => r.length >= 4);
}

export function companyNameLayout(path: string, company: string) {
  const poly = outlinePolygon(path);
  if (!poly.length) return undefined;
  return [1, 2, 3]
    .map((n) => {
      const lines = wrapName(company, n);
      return { lines, anchor: areaLabel([poly], lines.join("\n"), []) };
    })
    .filter((v) => v.anchor)
    .sort(
      (a, b) =>
        b.anchor!.fontSize - a.anchor!.fontSize ||
        a.lines.length - b.lines.length,
    )[0];
}
