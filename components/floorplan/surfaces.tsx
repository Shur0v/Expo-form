import { companyNameLayout } from "@/lib/floorplan/map-outlines";
import type { MapBooking } from "@/lib/floorplan/floorplan";
import {
  textColor,
  pavilionColor,
  mixColor,
  mapTheme,
  mapPalette,
} from "@/lib/floorplan/map-colors";
import { companyColor, surfacePaint } from "./presentation";
import {
  areaLabel,
  type SurfaceEdge,
  type PavilionArea,
} from "@/lib/floorplan/map-structure";
import type { FloorLayout } from "@/lib/floorplan/floorplan";
import type { Stall } from "@/lib/floorplan/types";
import { projectionProfile, ring } from "@/lib/floorplan/map-geometry";
import { faceColor, frontColor } from "./presentation";
/** Main footprint and both visual faces share one authoritative rectangle. */
export function BoothSurface({
  st,
  layout,
  status,
  selected = false,
  flat = false,
}: {
  st: Stall;
  layout: FloorLayout;
  status: string;
  selected?: boolean;
  flat?: boolean;
}) {
  return (
    <g data-booth-surfaces="true">
      {st.footprintPoints ? <polygon points={st.footprintPoints.map(p=>`${p.x},${p.y}`).join(' ')} {...surfacePaint(st,status,selected)} data-selection-overlay={selected?'true':undefined} /> : <rect
        width={st.width}
        height={st.height}
        {...surfacePaint(st, status, selected)}
        data-selection-overlay={selected ? "true" : undefined}
      />}
    </g>
  );
}
export function CategoryArt({
  layout,
  active,
  stalls = [],
}: {
  layout: FloorLayout;
  active?: string;
  stalls?: Stall[];
}) {
  return (
    <g data-category-overlays="true" pointerEvents="none">
      {(layout.regions || []).map((r) => {
        const c = layout.categories?.find((c) => c.id === r.categoryId);
        if (!c) return null;
        return (
          <g key={r.id}>
            <polygon
              data-category-region={r.id}
              points={r.vertices.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={c.color}
              fillOpacity={r.opacity}
              stroke={c.color}
              strokeWidth={active === c.id ? 0.08 : 0.025}
              strokeDasharray={active === c.id ? ".16 .10" : undefined}
            >
              <title>
                {c.name} · {r.name}
              </title>
            </polygon>
            {AreaName({
              name: r.name,
              anchor: areaLabel(
                [ring(r.vertices)],
                r.name,
                stalls,
                undefined,
                projectionProfile(layout).extrusionM,
              ),
              id: r.id,
              color: mixColor(c.color, r.opacity),
            })}
          </g>
        );
      })}
    </g>
  );
}

export function AreaName({
  name,
  anchor,
  id,
  color = mapTheme.scene.floor,
}: {
  color?: string;
  name: string;
  anchor?: PavilionArea["label"];
  id: string;
}) {
  return anchor ? (
    <text
      data-area-name={id}
      x={anchor.x}
      y={anchor.y}
      dominantBaseline="middle"
      textAnchor="middle"
      fontFamily="Arial,sans-serif"
      fontWeight="700"
      fontSize={anchor.fontSize}
      data-label-width={anchor.width}
      data-label-height={anchor.height}
      fill={textColor(color)}
      pointerEvents="none"
    >
      {name}
    </text>
  ) : null;
}
export function PavilionArt({ areas }: { areas: PavilionArea[] }) {
  return (
    <g data-pavilion-areas="true" pointerEvents="none">
      {areas.map((area) => (
        <g key={area.id}>
          <path
            data-pavilion-area={area.id}
            data-area-sqm={area.gross}
            d={area.paths.join(" ")}
            fill={pavilionColor(area.color)}
            fillRule="evenodd"
          />
          {AreaName({
            name: area.name,
            anchor: area.label,
            id: area.id,
            color: pavilionColor(area.color),
          })}
        </g>
      ))}
    </g>
  );
}
export function StructureArt({
  edges,
  stalls,
  status,
  layout,
  selected = [],
}: {
  edges: SurfaceEdge[];
  stalls: Stall[];
  status: Map<string, string>;
  layout: FloorLayout;
  selected?: readonly string[];
}) {
  const stocks = new Map(stalls.map((st) => [st.id, st])),
    profile = projectionProfile(layout),
    selectedIds = new Set(selected);
  if (edges.length > 180) {
    const batches = new Map<
      string,
      { kind: string; fill: string; paths: string[]; selected: boolean }
    >();
    for (const edge of edges) {
      const st = stocks.get(edge.stallId);
      if (!st) continue;
      const fill = frontColor(
          faceColor(
            st,
            status.get(st.id) || "available",
            selectedIds.has(st.id),
          ),
          edge.kind === "front" ? profile.frontContrast : profile.sideContrast,
        ),
        key = edge.kind + fill + selectedIds.has(st.id);
      if (!batches.has(key))
        batches.set(key, {
          kind: edge.kind,
          fill,
          paths: [],
          selected: selectedIds.has(st.id),
        });
      batches.get(key)!.paths.push(edge.path);
    }
    return (
      <g
        data-joined-structure="true"
        data-exposed-edge-count={edges.length}
        pointerEvents="none"
      >
        {[...batches].map(([key, b]) => (
          <path
            key={key}
            data-extrusion={b.kind}
            data-surface-count={b.paths.length}
            data-selected-extrusion={b.selected ? "true" : undefined}
            d={b.paths.join(" ")}
            fill={b.fill}
          />
        ))}
        <path
          data-structural-seam="true"
          d={edges.map((e) => e.seam).join(" ")}
          fill="none"
          stroke={mapPalette.slate[500]}
          strokeWidth=".025"
        />
      </g>
    );
  }
  return (
    <g data-joined-structure="true" pointerEvents="none">
      {edges.map((edge, i) => {
        const st = stocks.get(edge.stallId);
        if (!st) return null;
        const fill = frontColor(
          faceColor(
            st,
            status.get(st.id) || "available",
            selectedIds.has(st.id),
          ),
          edge.kind === "front" ? profile.frontContrast : profile.sideContrast,
        );
        return (
          <g key={i}>
            <path
              data-extrusion={edge.kind}
              data-edge-stall={edge.stallId}
              data-selected-extrusion={
                selectedIds.has(st.id) ? "true" : undefined
              }
              d={edge.path}
              fill={fill}
            />
            {edge.seam && (
              <path
                data-structural-seam="true"
                d={edge.seam}
                fill="none"
                stroke={mapPalette.slate[500]}
                strokeWidth=".025"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Shared company fill and full-name layout for live view and vector export. */
export function CompanyArt({
  bookings,
  preview = false,
}: {
  bookings: MapBooking[];
  preview?: boolean;
}) {
  return (
    <g
      data-company-areas="true"
      pointerEvents="none"
      fontFamily="Arial,sans-serif"
    >
      {bookings
        .filter((b) => b.status === "confirmed")
        .flatMap((b) =>
          (b.paths || []).map((d, i) => {
            const choice = companyNameLayout(d, b.company),
              anchor = choice?.anchor;
            const fontSize = Math.min(0.8, anchor?.fontSize || 0.8);
            return (
              <g key={b.id + "-" + i} data-company-area={b.id}>
                <path
                  d={d}
                  fill={companyColor(b.id)}
                  fillOpacity="1"
                  stroke={mapTheme.confirmed.border}
                  strokeWidth=".15"
                  fillRule="evenodd"
                />
                {anchor && (
                  <text
                    data-company-name={b.id}
                    aria-label={b.company}
                    x={anchor.x}
                    y={anchor.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={textColor(companyColor(b.id))}
                    fontWeight="700"
                    fontSize={fontSize}
                  >
                    {choice!.lines.map((line, j) => (
                      <tspan
                        key={j}
                        x={anchor.x}
                        dy={
                          j === 0
                            ? -(choice!.lines.length - 1) * fontSize * 0.6
                            : fontSize * 1.2
                        }
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                )}
                <title>{b.company} · Confirmed</title>
              </g>
            );
          }),
        )}
    </g>
  );
}
