import { measuredGaps } from "@/lib/floorplan/map-dimensions";
import { GapArt } from "./dimensions";
import {
  derivePavilions,
  joinedEdges,
  hideDetachedArtwork,
} from "@/lib/floorplan/map-structure";
import {
  BoothSurface,
  CategoryArt,
  StructureArt,
  PavilionArt,
  CompanyArt,
} from "./surfaces";
import {
  projectionProfile,
  measuredLabel,
  dimensionFontSize,
  boothCodeFontSize,
  assignedRegion,
} from "@/lib/floorplan/map-geometry";
import { isValidElement, type ReactNode } from "react";
import {
  corners,
  type MapGeometry,
  type MapBooking,
} from "@/lib/floorplan/floorplan";
import { sceneBounds, type SceneRect } from "@/lib/floorplan/map-experience";
import { GardenArt, ExhibitionWash } from "./garden";
import { referenceFrame } from "@/lib/floorplan/reference-layout";
import { SceneDefs, HallBase, FeatureArt, ShadowArt } from "./architecture";
import { faceColor, surfacePaint } from "./presentation";
import { textColor } from "@/lib/floorplan/map-colors";
import ReferenceDetails from "./reference-details";
export interface MapExportOptions {
  crop?: SceneRect;
  surfaceMode?: "batched" | "individual";
  selectedIds?: readonly string[];
  preview?: boolean;
  ownedIds?: readonly string[];
}
/** Complete safe vector export, using exactly the same architecture as the viewer. */
export function exportMap(
  g: MapGeometry,
  bookings: MapBooking[],
  flat = false,
  options: MapExportOptions = {},
) {
  const profile = projectionProfile(g.layout);
  const ns = "http://www.w3.org/2000/svg";
  const node = (
    tag: string,
    attrs: Record<string, string | number>,
    text?: string,
  ) => {
    const el = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    if (text) el.textContent = text;
    return el;
  };
  const preserved = new Set([
    "viewBox",
    "patternUnits",
    "patternTransform",
    "gradientUnits",
    "gradientTransform",
    "preserveAspectRatio",
    "stdDeviation",
    "filterUnits",
    "primitiveUnits",
    "baseFrequency",
    "numOctaves",
    "seed",
    "edgeMode",
    "kernelUnitLength",
    "textLength",
    "lengthAdjust",
    "markerWidth",
    "markerHeight",
    "refX",
    "refY",
  ]);
  const artwork = (value: ReactNode, parent: Element) => {
    if (value == null || typeof value === "boolean") return;
    if (Array.isArray(value)) {
      value.forEach((v) => artwork(v, parent));
      return;
    }
    if (typeof value === "string" || typeof value === "number") {
      parent.append(document.createTextNode(String(value)));
      return;
    }
    if (!isValidElement(value)) return;
    const props = value.props as Record<string, unknown>;
    if (typeof value.type !== "string") {
      artwork(props.children as ReactNode, parent);
      return;
    }
    const attrs: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(props))
      if (
        k !== "children" &&
        v != null &&
        typeof v !== "function" &&
        typeof v !== "object"
      )
        attrs[
          k === "className"
            ? "class"
            : preserved.has(k)
              ? k
              : k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())
        ] = String(v);
    const el = node(value.type, attrs);
    artwork(props.children as ReactNode, el);
    parent.append(el);
  };
  const reference = !!g.layout.referenceVersion,
    frame =
      options.crop ||
      (options.preview
        ? sceneBounds(g.layout)
        : reference
          ? referenceFrame
          : { x: -3, y: -3, w: g.layout.width + 6, h: g.layout.height + 6 });
  const root = node("svg", {
    xmlns: ns,
    style:
      "print-color-adjust:exact;-webkit-print-color-adjust:exact;overflow:hidden",
    preserveAspectRatio: "xMidYMid meet",
    viewBox: `${frame.x} ${frame.y} ${frame.w} ${frame.h}`,
    width: 1647,
    height: (1647 * frame.h) / frame.w,
    "font-family": "Arial,sans-serif",
  });
  root.append(node("title", {}, g.layout.name));
  artwork(
    SceneDefs({ id: "export", profile, bounds: sceneBounds(g.layout) }),
    root,
  );
  if (reference)
    root.append(
      node("rect", {
        x: sceneBounds(g.layout).x,
        y: sceneBounds(g.layout).y,
        width: sceneBounds(g.layout).w,
        height: sceneBounds(g.layout).h,
        fill: "url(#export-reference-background)",
      }),
    );
  if (options.preview)
    artwork(GardenArt({ layout: g.layout, id: "export" }), root);
  artwork(
    HallBase({
      width: g.layout.width,
      height: g.layout.height,
      id: "export",
      reference,
    }),
    root,
  );
  const drawObject = (o: (typeof g.layout.objects)[number]) => {
    if (hideDetachedArtwork(g.layout, g.stalls, o)) return;
    const group = node("g", {
      transform: `translate(${o.x} ${o.y}) rotate(${o.rotation})`,
    });
    artwork(FeatureArt({ o, id: "export" }), group);
    root.append(group);
  };
  if (reference) {
    g.layout.objects
      .filter((o) => o.kind === "pavilion" || o.kind === "aisle")
      .forEach(drawObject);
    if (options.preview)
      artwork(ExhibitionWash({ stalls: g.stalls, layout: g.layout }), root);
    artwork(PavilionArt({ areas: derivePavilions(g.layout, g.stalls) }), root);
    artwork(CategoryArt({ layout: g.layout, stalls: g.stalls }), root);
    artwork(ReferenceDetails({ layout: g.layout }), root);
  }
  g.layout.objects
    .filter((o) => !reference || (o.kind !== "pavilion" && o.kind !== "aisle"))
    .forEach(drawObject);
  if (!reference) {
    artwork(PavilionArt({ areas: derivePavilions(g.layout, g.stalls) }), root);
    artwork(CategoryArt({ layout: g.layout, stalls: g.stalls }), root);
  }
  const stocks = g.stalls.filter((st) => st.placed),
    status = new Map(
      bookings.flatMap((b) =>
        b.stallIds.map(
          (id) =>
            [
              id,
              options.preview && options.ownedIds?.includes(id)
                ? "own-held"
                : options.preview && b.status === "confirmed"
                  ? "other-confirmed"
                  : b.status,
            ] as const,
        ),
      ),
    );
  if (!flat)
    artwork(
      ShadowArt({
        path: stocks
          .map(
            (st) =>
              corners(st)
                .map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`)
                .join(" ") + "Z",
          )
          .join(" "),
        id: "export",
        profile,
      }),
      root,
    );
  const visualStocks = stocks.map((st) => {
    const r = g.layout.regions?.length
        ? assignedRegion(g.layout, st)
        : undefined,
      c = g.layout.categories?.find((c) => c.id === r?.categoryId);
    return c ? { ...st, color: c.color } : st;
  });
  if (!flat)
    artwork(
      StructureArt({
        edges: joinedEdges(stocks, g.layout),
        selected: options.selectedIds,
        stalls: visualStocks,
        status,
        layout: g.layout,
      }),
      root,
    );
  artwork(
    GapArt({
      dimensions: measuredGaps(
        g.layout,
        g.stalls,
        derivePavilions(g.layout, g.stalls),
      ),
    }),
    root,
  );

  const batched = options.surfaceMode === "batched";
  if (batched) {
    const batches = new Map<
      string,
      {
        st: (typeof stocks)[number];
        kind: string;
        selected: boolean;
        paths: string[];
      }
    >();
    for (const st of visualStocks) {
      const selected = !!options.selectedIds?.includes(st.id),
        kind = selected ? "selected" : status.get(st.id) || "available",
        fill = faceColor(st, kind, selected),
        key = kind + fill;
      let batch = batches.get(key);
      if (!batch) {
        batch = { st, kind, selected, paths: [] };
        batches.set(key, batch);
      }
      batch.paths.push(
        corners(st)
          .map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`)
          .join(" ") + "Z",
      );
    }
    for (const b of batches.values()) {
      const paint = surfacePaint(b.st, b.kind, b.selected);
      const attrs: Record<string, string | number> = {
        d: b.paths.join(" "),
        fill: paint.fill,
        stroke: paint.stroke,
        "stroke-width": paint.strokeWidth,
      };
      if (paint.strokeDasharray)
        attrs["stroke-dasharray"] = paint.strokeDasharray;
      root.append(node("path", attrs));
    }
    if (!reference)
      root.append(
        node("path", {
          d: stocks
            .map(
              (st) =>
                corners(st)
                  .map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`)
                  .join(" ") + "Z",
            )
            .join(" "),
          fill: "url(#export-face)",
        }),
      );
  }
  for (const st of stocks) {
    const group = node("g", {
      transform: `translate(${st.x} ${st.y}) rotate(${st.rotation})`,
    });
    const region = g.layout.regions?.length
      ? assignedRegion(g.layout, st)
      : undefined;
    const category = g.layout.categories?.find(
      (c) => c.id === region?.categoryId,
    );
    if (!batched)
      artwork(
        BoothSurface({
          st: category ? { ...st, color: category.color } : st,
          layout: g.layout,
          status: status.get(st.id) || "available",
          flat,
          selected: options.selectedIds?.includes(st.id),
        }),
        group,
      );
    group.append(
      node(
        "text",
        {
          x: st.width / 2,
          y: st.height * (reference ? 0.33 : 0.43),
          "text-anchor": "middle",
          "font-size": boothCodeFontSize(st, reference),
          "font-weight": 700,
          fill: textColor(
            faceColor(
              category ? { ...st, color: category.color } : st,
              status.get(st.id) || "available",
              options.selectedIds?.includes(st.id),
            ),
          ),
        },
        st.code,
      ),
    );
    group.append(
      node(
        "text",
        {
          x: st.width / 2,
          y: st.height * (reference ? 0.67 : 0.7),
          "text-anchor": "middle",
          "font-size": dimensionFontSize(st, reference),
          "font-weight": reference ? 700 : 400,
          fill: textColor(
            faceColor(
              category ? { ...st, color: category.color } : st,
              status.get(st.id) || "available",
              options.selectedIds?.includes(st.id),
            ),
          ),
        },
        st.displayLabel || measuredLabel(st),
      ),
    );
    root.append(group);
  }
  artwork(CompanyArt({ bookings, preview: options.preview }), root);
  return new XMLSerializer().serializeToString(root);
}
