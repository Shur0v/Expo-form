import { mapPalette } from "@/lib/floorplan/map-colors";
import type { FloorLayout } from "@/lib/floorplan/floorplan";
/** Decorative exterior only; never participates in physical or rentable geometry. */
export function GardenArt({ layout, id }: { layout: FloorLayout; id: string }) {
  const w = layout.width,
    h = layout.height;
  const horizontal = (north: boolean) => {
    const doors = layout.objects
      .filter((o) => o.appearance === (north ? "door-north" : "door-south"))
      .map((o) => [
        Math.max(-3, o.x - 0.5),
        Math.min(w + 3, o.x + o.width + 0.5),
      ])
      .sort((a, b) => a[0] - b[0]);
    const out: number[][] = [];
    let cursor = -3;
    for (const [a, b] of doors) {
      if (a > cursor) out.push([cursor, a - cursor]);
      cursor = Math.max(cursor, b);
    }
    if (cursor < w + 3) out.push([cursor, w + 3 - cursor]);
    return out.map(([x, width], i) => (
      <rect key={i} x={x} y={north ? -3 : h + 2} width={width} height="1" />
    ));
  };
  return (
    <g data-map-garden="true" pointerEvents="none">
      <defs>
        <pattern
          id={id + "-flowers"}
          width="1.2"
          height="1"
          patternUnits="userSpaceOnUse"
        >
          <rect width="1.2" height="1" fill="#71975f" />
          <path
            d="M0 .75Q.4 .2 .8 .8M.6 0Q.3 .4 1.2 .5"
            stroke="#426b43"
            strokeWidth=".08"
            fill="none"
          />
          {[
            { x: 0.27, y: 0.32, c: "#fff9f3" },
            { x: 0.85, y: 0.7, c: "#f8aacb" },
            { x: 1.05, y: 0.22, c: "#ebd386" },
          ].map((f, i) => (
            <g key={i} transform={`translate(${f.x} ${f.y})`} fill={f.c}>
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse
                  key={a}
                  cx="0"
                  cy="-.08"
                  rx=".055"
                  ry=".09"
                  transform={`rotate(${a})`}
                />
              ))}
              <circle r=".045" fill="#f3c95a" />
            </g>
          ))}
        </pattern>
      </defs>
      <g fill={`url(#${id}-flowers)`} stroke="#587b50" strokeWidth=".04">
        {horizontal(true)}
        {horizontal(false)}
        {(() => {
          const gaps = layout.objects
            .filter((o) => ["ENTRY", "EXIT"].includes(o.label))
            .map((o) => [o.y - 0.5, o.y + o.height + 0.5])
            .sort((a, b) => a[0] - b[0]);
          let start = -2;
          const strips = [];
          for (const [a, b] of gaps) {
            if (a > start)
              strips.push(
                <rect
                  key={start}
                  x="-3"
                  y={start}
                  width="1"
                  height={a - start}
                />,
              );
            start = b;
          }
          if (start < h + 2)
            strips.push(
              <rect
                key={start}
                x="-3"
                y={start}
                width="1"
                height={h + 2 - start}
              />,
            );
          return strips;
        })()}
        <rect x={w + 2} y="-2" width="1" height={h + 4} />
      </g>
    </g>
  );
}
import { boundsOf, exhibitionOf } from "@/lib/floorplan/map-experience";
import type { Stall } from "@/lib/floorplan/types";
export function ExhibitionWash({
  stalls,
  layout,
}: {
  stalls: Stall[];
  layout: FloorLayout;
}) {
  return (
    <g data-exhibition-backgrounds pointerEvents="none">
      {(["DTA", "DCC"] as const).map((name) => {
        const group = stalls.filter((s) => exhibitionOf(s.code) === name);
        if (!group.length) return null;
        const b = boundsOf(group);
        return (
          <rect
            key={name}
            data-exhibition={name}
            x={0.7}
            y={Math.max(0.7, b.y - 0.8)}
            width={layout.width - 1.4}
            height={Math.min(layout.height - 1.4, b.h + 1.6)}
            fill={name === "DTA" ? mapPalette.rose[100] : mapPalette.amber[100]}
            fillOpacity=".12"
          />
        );
      })}
    </g>
  );
}
