import {
  displayColor,
  textColor,
  mapTheme,
  mapPalette,
} from "@/lib/floorplan/map-colors";
import type { SceneRect } from "@/lib/floorplan/map-experience";
import { areaLabel } from "@/lib/floorplan/map-structure";
import { objectVertices, ring } from "@/lib/floorplan/map-geometry";
import { fitText } from "@/lib/floorplan/map-text";
import { DEFAULT_DOOR, DEFAULT_PROJECTION } from "@/lib/floorplan/map-geometry";
import type { ProjectionProfile } from "@/lib/floorplan/floorplan";
import type { MapObject } from "@/lib/floorplan/floorplan";
/** Shared lightweight SVG details. All positions stay in measured hall units. */
export function SceneDefs({
  id,
  profile = DEFAULT_PROJECTION,
  bounds,
}: {
  id: string;
  profile?: ProjectionProfile;
  bounds?: SceneRect;
}) {
  return (
    <defs>
      <linearGradient
        id={`${id}-reference-background`}
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop offset="0" stopColor={mapTheme.scene.start} />
        <stop offset="1" stopColor={mapTheme.scene.end} />
      </linearGradient>
      <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".42" />
        <stop offset=".45" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#4b3522" stopOpacity=".18" />
      </linearGradient>
      <filter
        id={`${id}-shadow`}
        filterUnits={bounds ? "userSpaceOnUse" : undefined}
        x={bounds ? bounds.x - 4 : "-10%"}
        y={bounds ? bounds.y - 4 : "-10%"}
        width={bounds ? bounds.w + 8 : "120%"}
        height={bounds ? bounds.h + 8 : "130%"}
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur in="SourceGraphic" stdDeviation={profile.shadowBlurM} />
      </filter>
      <pattern
        id={`${id}-hatch`}
        width="1.4"
        height="1.4"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-38)"
      >
        <path d="M0 0V1.4" stroke="#756f68" strokeWidth=".09" opacity=".65" />
      </pattern>
      <pattern
        id={`${id}-wall`}
        width="4"
        height="4"
        patternUnits="userSpaceOnUse"
      >
        <rect width="4" height="4" fill={mapTheme.scene.wall} />
        <path d="M0 0H4M0 0V4" stroke="#d8d8d0" strokeWidth=".22" />
      </pattern>
      <pattern
        id={`${id}-water`}
        width="3"
        height="2"
        patternUnits="userSpaceOnUse"
      >
        <rect width="3" height="2" fill="#1797c2" />
        <path
          d="M0 1Q.75 0 1.5 1T3 1"
          fill="none"
          stroke="#bcecf3"
          strokeWidth=".09"
        />
      </pattern>
      <pattern
        id={`${id}-garden`}
        width="2"
        height="2"
        patternUnits="userSpaceOnUse"
      >
        <rect width="2" height="2" fill="#497d46" />
        <circle cx=".5" cy=".5" r=".45" fill="#81ad51" />
        <circle cx="1.4" cy="1.5" r=".6" fill="#365d38" />
      </pattern>
    </defs>
  );
}
export function HallBase({
  width: w,
  height: h,
  id,
  reference,
}: {
  reference?: boolean;
  width: number;
  height: number;
  id: string;
}) {
  return (
    <g pointerEvents="none" data-hall-architecture="true">
      <rect
        x="-.5"
        y=".6"
        width={w + 1}
        height={h + 1}
        fill="#334155"
        opacity=".2"
      />
      <rect
        width={w}
        height={h}
        fill={mapTheme.scene.floor}
        stroke={mapTheme.scene.wall}
        strokeWidth=".6"
      />
      <path
        d={`M0 0H${w}V${h}H0Z`}
        fill="none"
        stroke={`url(#${id}-wall)`}
        strokeWidth="1.1"
      />
      {Array.from(
        { length: Math.floor(w / (reference ? 5 : 4)) + 1 },
        (_, i) => (
          <g key={i} fill="#f4f2e8" stroke="#83867e" strokeWidth=".06">
            <rect
              x={i * (reference ? 5 : 4) - 0.15}
              y="-.65"
              width=".3"
              height="1.3"
            />
            <rect
              x={i * (reference ? 5 : 4) - 0.15}
              y={h - 0.65}
              width=".3"
              height="1.3"
            />
          </g>
        ),
      )}
      {reference &&
        Array.from({ length: Math.floor(h / 5) + 1 }, (_, i) => (
          <g
            key={`side-${i}`}
            fill="#f4f2e8"
            stroke="#83867e"
            strokeWidth=".06"
          >
            <rect x="-.65" y={i * 5 - 0.15} width="1.3" height=".3" />
            <rect x={w - 0.65} y={i * 5 - 0.15} width="1.3" height=".3" />
          </g>
        ))}
    </g>
  );
}
export function FeatureArt({ o, id }: { o: MapObject; id: string }) {
  if (o.appearance?.startsWith("door-")) {
    const d = o.door || DEFAULT_DOOR,
      north = o.appearance === "door-north";
    const width = d.clearWidthM + 2 * d.frameM,
      height = d.elevationM + d.frameM;
    const x = (o.width - width) / 2,
      y = north ? -d.elevationM : 0;
    const leaf = (d.clearWidthM - d.frameM) / 2;
    return (
      <g data-reference-door="true" data-door-assumed={d.assumed}>
        <rect
          x={x - d.wallDepthM}
          y={y - d.frameM * 2}
          width={width + 2 * d.wallDepthM}
          height={height + d.frameM * 2}
          fill="#4d4e47"
        />
        <rect
          x={x - d.wallDepthM}
          y={y - d.frameM * 2}
          width={width + 2 * d.wallDepthM}
          height={d.wallDepthM}
          fill="#d2d3d4"
        />
        <path
          d={`M${x - d.wallDepthM / 2} ${y + d.wallDepthM}V${y + height}M${x + width + d.wallDepthM / 2} ${y + d.wallDepthM}V${y + height}`}
          stroke="#a6a8aa"
          strokeWidth={d.wallDepthM}
        />
        <rect x={x} y={y} width={width} height={height} fill="#603712" />
        {[0, 1].map((i) => (
          <g key={i} data-door-leaf={i}>
            <rect
              x={x + d.frameM + i * (leaf + d.frameM)}
              y={y + d.frameM}
              width={leaf}
              height={d.elevationM}
              fill="#744c2b"
            />
            <rect
              x={x + d.frameM + i * (leaf + d.frameM)}
              y={y + d.frameM + d.elevationM * 0.38}
              width={leaf}
              height={d.elevationM * 0.62}
              fill="#3c2413"
            />
          </g>
        ))}
        <title>{`${d.clearWidthM} m clear opening × ${d.elevationM} m high${d.assumed ? " · assumed planning preset" : ""}`}</title>
      </g>
    );
  }
  const serviceLabel = /REFRESHMENT|FOOD ZONE|ORGANIZER OFFICE/.test(o.label);
  const vertical =
    !o.points &&
    o.kind !== "pavilion" &&
    o.height > o.width * (serviceLabel ? 1 : 1.5);
  const raised = o.kind === "facility" || o.kind === "entrance";
  const fill =
    o.kind === "text"
      ? "none"
      : o.kind === "wall"
        ? `url(#${id}-wall)`
        : displayColor(o.color);
  const pattern =
    o.appearance && o.appearance !== "solid"
      ? `url(#${id}-${o.appearance === "hatched" ? "hatch" : o.appearance})`
      : undefined;
  const splitLabel = serviceLabel ? o.label.split(" ") : [o.label];
  const padding = Math.min(0.4, Math.min(o.width, o.height) * 0.1);
  const labelWidth = (vertical ? o.height : o.width) - padding * 2;
  const labelHeight = (vertical ? o.width : o.height) - padding * 2;
  const fittedSize = fitText(
    splitLabel,
    labelWidth,
    labelHeight,
    o.kind === "text" ||
      o.kind === "pavilion" ||
      ["#e8c9c1", "#b12d26"].includes(o.color)
      ? 1.4
      : 1.2,
  );
  const polygonAnchor =
    o.points && o.label
      ? areaLabel(
          [ring(objectVertices({ ...o, x: 0, y: 0, rotation: 0 }))],
          splitLabel.join("\n"),
          [],
        )
      : undefined;
  const labelX = polygonAnchor?.x ?? o.width / 2,
    labelY = polygonAnchor?.y ?? o.height / 2;
  const textSize = Math.min(fittedSize, polygonAnchor?.fontSize ?? Infinity);
  return (
    <>
      {raised && (
        <rect
          x=".13"
          y=".4"
          width={o.width}
          height={o.height}
          fill="#363932"
          opacity=".35"
        />
      )}
      {o.points ? (
        <polygon points={o.points} fill={fill} />
      ) : (
        <rect
          width={o.width}
          height={o.height}
          fill={fill}
          stroke={raised ? "#8d897d" : "none"}
          strokeWidth=".13"
        />
      )}
      {pattern && !o.points && (
        <rect width={o.width} height={o.height} fill={pattern} />
      )}
      {o.appearance === "water" && !o.points && (
        <g
          pointerEvents="none"
          fill="none"
          stroke="#dbf8ff"
          strokeWidth=".12"
          opacity=".85"
        >
          {[0.28, 0.7].map((t) => (
            <g key={t}>
              <ellipse
                cx={o.width / 2}
                cy={o.height * t}
                rx={o.width * 0.23}
                ry={o.width * 0.07}
              />
              <path
                d={`M${o.width / 2 - o.width * 0.1} ${o.height * t}Q${o.width / 2} ${o.height * t - o.width * 0.65} ${o.width / 2 + o.width * 0.1} ${o.height * t}M${o.width / 2} ${o.height * t}v${-o.width * 0.5}`}
              />
            </g>
          ))}
        </g>
      )}
      {o.kind === "entrance" && (
        <>
          <rect
            x={o.width * 0.2}
            y=".18"
            width={o.width * 0.6}
            height={o.height - 0.36}
            fill="#69472e"
            stroke="#e0c89d"
            strokeWidth=".12"
          />
          <path
            d={`M${o.width / 2} .3V${o.height - 0.3}`}
            stroke="#bd9c6a"
            strokeWidth=".08"
          />
        </>
      )}
      {o.label && (!o.points || polygonAnchor) && (
        <text
          data-feature-label={o.id}
          x={labelX}
          y={labelY}
          transform={
            vertical && o.kind !== "pavilion"
              ? `rotate(${/REFRESHMENT|FOOD|ORGANIZER/.test(o.label) ? 90 : -90} ${labelX} ${labelY})`
              : undefined
          }
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Arial,sans-serif"
          fontWeight="700"
          fontSize={textSize}
          fill={
            o.kind === "text"
              ? displayColor(o.color)
              : textColor(
                  o.kind === "entrance" ? "#69472e" : displayColor(o.color),
                )
          }
          stroke={o.kind === "entrance" ? "#473626" : "none"}
          strokeWidth=".025"
          paintOrder="stroke"
          pointerEvents="none"
        >
          {splitLabel.length === 1
            ? o.label
            : splitLabel.map((line, i) => (
                <tspan
                  key={i}
                  x={labelX}
                  dy={
                    i === 0
                      ? -((splitLabel.length - 1) * textSize * 1.1) / 2
                      : textSize * 1.1
                  }
                >
                  {line}
                </tspan>
              ))}
        </text>
      )}
      {o.kind === "entrance" && (
        <g pointerEvents="none">
          <circle
            cx={o.width / 2}
            cy={o.height + 0.85}
            r=".6"
            fill="#edf9e7"
            stroke="#4b8c45"
            strokeWidth=".12"
          />
          <path
            d={`M${o.width / 2} ${o.height + 1.15}v-.65m-.25 .25 .25-.25 .25 .25`}
            fill="none"
            stroke="#4b8c45"
            strokeWidth=".14"
          />
        </g>
      )}
    </>
  );
}

/** One transparent shadow treatment shared by screen, cropped exports and print. */
export function ShadowArt({
  path,
  id,
  profile,
}: {
  path: string;
  id: string;
  profile: ProjectionProfile;
}) {
  return (
    <path
      data-map-shadow="true"
      d={path}
      transform={`translate(${profile.shadowXM} ${profile.shadowYM})`}
      fill={mapTheme.shadow.fill}
      opacity={mapTheme.shadow.opacity}
      filter={`url(#${id}-shadow)`}
      pointerEvents="none"
    />
  );
}
