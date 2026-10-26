import { mapPalette, mapTheme } from "@/lib/floorplan/map-colors";
import type { GapDimension } from "@/lib/floorplan/map-dimensions";
export function GapArt({ dimensions }: { dimensions: GapDimension[] }) {
  return (
    <g
      data-gap-dimensions="true"
      pointerEvents="none"
      fontFamily="Arial,sans-serif"
    >
      {dimensions.map((d, i) => {
        const horizontal = d.axis === "x",
          middle = (d.a + d.b) / 2,
          arrow = Math.min(0.22, (d.b - d.a) * 0.08);
        return (
          <g
            key={i}
            data-gap-metres={d.b - d.a}
            data-gap-axis={d.axis}
            data-gap-start={d.a}
            data-gap-end={d.b}
            data-gap-position={d.at}
          >
            <path
              d={
                horizontal
                  ? `M${d.a} ${d.at}H${d.b}M${d.a + arrow} ${d.at - arrow}L${d.a} ${d.at}L${d.a + arrow} ${d.at + arrow}M${d.b - arrow} ${d.at - arrow}L${d.b} ${d.at}L${d.b - arrow} ${d.at + arrow}`
                  : `M${d.at} ${d.a}V${d.b}M${d.at - arrow} ${d.a + arrow}L${d.at} ${d.a}L${d.at + arrow} ${d.a + arrow}M${d.at - arrow} ${d.b - arrow}L${d.at} ${d.b}L${d.at + arrow} ${d.b - arrow}`
              }
              stroke={mapPalette.slate[500]}
              strokeWidth=".045"
              fill="none"
            />
            <text
              x={d.box.x + d.box.width / 2}
              y={d.box.y + d.box.height / 2}
              transform={
                horizontal
                  ? undefined
                  : `rotate(90 ${d.box.x + d.box.width / 2} ${middle})`
              }
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={d.fontSize}
              fill={mapTheme.scene.ink}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
