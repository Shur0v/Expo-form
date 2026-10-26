import { mapPalette, mapTheme } from "@/lib/floorplan/map-colors";
// Cigarette and Flame glyphs: Lucide v0.553.0 (ISC).
// Copyright Lucide Contributors 2025 / Cole Bemis 2013–2023.
// License: public/assets/licenses/lucide.txt. Inline SVG keeps exports self-contained.
import type { FloorLayout } from "@/lib/floorplan/floorplan";
/** Source drawing grid and emergency signs; clearances are calculated separately, in source pixels. */
export default function ReferenceDetails({ layout }: { layout: FloorLayout }) {
  return (
    <g
      transform="translate(-5.6 -8) scale(.1)"
      pointerEvents="none"
      fontFamily="Arial,sans-serif"
      fill={mapTheme.scene.ink}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <path
          key={`grid-${i}`}
          d={`M56 ${115 + i * 50}H1602`}
          stroke={mapPalette.slate[400]}
          strokeWidth=".5"
          opacity=".55"
        />
      ))}
      {Array.from({ length: 31 }, (_, i) => (
        <text
          key={`col-${i}`}
          x={80 + i * 50}
          y="71"
          fontSize="10"
          textAnchor="middle"
        >
          {i + 1}
        </text>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <text
          key={`row-${i}`}
          x="47"
          y={106 + i * 50}
          fontSize="10"
          textAnchor="end"
        >
          {i + 1}
        </text>
      ))}
      {layout.objects
        .filter((o) => o.appearance?.startsWith("door-"))
        .map((o) => {
          const cx = 56 + (o.x + o.width / 2) * 10,
            north = o.appearance === "door-north",
            yy = north ? 41 : 650;
          return (
            <g key={o.id} data-emergency-sign="true">
              <path
                d={
                  north
                    ? `M${cx} ${yy + 14}V${yy - 12}m-7 11 7-11 7 11`
                    : `M${cx} ${yy - 14}V${yy + 12}m-7-11 7 11 7-11`
                }
                fill="none"
                stroke="#ff8917"
                strokeWidth="2.6"
              />
              <circle
                cx={cx + 24}
                cy={yy}
                r="13"
                fill="#f8fff5"
                stroke="#239b45"
                strokeWidth="2.3"
              />
              <svg
                data-map-symbol="smoking"
                x={cx + 14}
                y={yy - 10}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#303730"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
                aria-label="Smoking area"
              >
                <title>Smoking area</title>
                <path d="M17 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h14" />
                <path d="M18 8c0-2.5-2-2.5-2-5" />
                <path d="M21 16a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                <path d="M22 8c0-2.5-2-2.5-2-5" />
                <path d="M7 12v4" />
              </svg>
              <rect
                x={cx + 49}
                y={yy - 15}
                width="17"
                height="28"
                fill="#ed2537"
              />
              <text
                x={cx + 57.5}
                y={yy - 10}
                textAnchor="middle"
                fill="white"
                fontSize="5.5"
                fontWeight="700"
              >
                FIRE
                <tspan x={cx + 57.5} dy="5.5">
                  EXIT
                </tspan>
              </text>
              <svg
                data-map-symbol="fire"
                x={cx + 50.5}
                y={yy - 2}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="white"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
                aria-label="Fire exit"
              >
                <title>Fire exit</title>
                <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
              </svg>
            </g>
          );
        })}
    </g>
  );
}
