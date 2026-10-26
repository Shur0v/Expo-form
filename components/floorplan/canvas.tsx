/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs -- Preserve the imported camera synchronization and latest-event refs. */
"use client";
import { measuredGaps } from "@/lib/floorplan/map-dimensions";
import { GapArt } from "./dimensions";
import {
  joinedEdges,
  derivePavilions,
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
  footprintArea,
} from "@/lib/floorplan/map-geometry";
import type { FloorLayout } from "@/lib/floorplan/floorplan";
import { memo, useEffect, useMemo, useRef, useState, useId } from "react";
import type { ReactNode } from "react";
import { useMapWorkspace } from "./workspace";
import {
  sceneBounds,
  fitScene,
  type SceneRect,
} from "@/lib/floorplan/map-experience";
import { GardenArt, ExhibitionWash } from "./garden";
import { exportMap } from "./export";
import { downloadMapPdf, preservePrintShadow } from "./print-shadow";
import {
  Maximize,
  Minus,
  Plus,
  RotateCcw,
  Layers,
  Download,
} from "lucide-react";
import type { Stall } from "@/lib/floorplan/types";
import {
  corners,
  type MapGeometry,
  type MapBooking,
  type MapObject,
} from "@/lib/floorplan/floorplan";
import styles from "./map.module.css";
import {
  mapTheme,
  mapPalette,
  textColor,
  mapCssVariables,
} from "@/lib/floorplan/map-colors";
import { faceColor, surfacePaint } from "./presentation";
import ReferenceDetails from "./reference-details";
import { referenceFrame } from "@/lib/floorplan/reference-layout";
import { SceneDefs, HallBase, FeatureArt, ShadowArt } from "./architecture";
export interface CanvasProps {
  geometry: MapGeometry;
  bookings: MapBooking[];
  selected: string[];
  onSelect: (id: string, add: boolean) => void;
  editing?: boolean;
  selectedObjects?: string[];
  onObjectSelect?: (id: string, add: boolean) => void;
  onMove?: (ids: string[], dx: number, dy: number) => void;
  onResize?: (id: string, dx: number, dy: number) => void;
  flat?: boolean;
  activeCategory?: string;
  focusRegion?: string;
  searchMatches?: string[];
  preview?: boolean;
  ownedIds?: string[];
  toolbar?: ReactNode;
  footer?: (stall?: Stall) => ReactNode;
  focus?: SceneRect;
  target?: { rect: SceneRect; token: number };
  highlight?: string[];
}
const Booth = memo(function Booth({
  st,
  status,
  selected,
  editing,
  onSelect,
  sceneId,
  reference,
  layout,
  flat,
}: {
  layout: FloorLayout;
  flat: boolean;
  reference?: boolean;
  sceneId: string;
  st: Stall;
  status: string;
  selected: boolean;
  editing?: boolean;
  onSelect: (id: string, add: boolean) => void;
}) {
  return (
    <g
      data-item={st.id}
      fontFamily={reference ? "Arial,sans-serif" : undefined}
      role="button"
      tabIndex={0}
      aria-label={`${st.code}, ${status}, ${st.width} by ${st.height} metres`}
      transform={`translate(${st.x} ${st.y}) rotate(${st.rotation})`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(st.id, e.shiftKey || e.ctrlKey || e.metaKey);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(st.id, e.shiftKey);
        }
      }}
      className={styles.booth}
    >
      {BoothSurface({ st, layout, status, selected, flat })}
      <text
        x={st.width / 2}
        y={st.height * (reference ? 0.33 : 0.43)}
        textAnchor="middle"
        fontWeight="700"
        fontSize={boothCodeFontSize(st, reference)}
        fill={textColor(faceColor(st, status, selected))}
        pointerEvents="none"
      >
        {st.code}
      </text>
      <text
        className={styles.detail}
        x={st.width / 2}
        y={st.height * (reference ? 0.67 : 0.7)}
        textAnchor="middle"
        fontSize={dimensionFontSize(st, reference)}
        fontWeight={reference ? 700 : 400}
        fill={textColor(faceColor(st, status, selected))}
        pointerEvents="none"
      >
        {st.displayLabel || measuredLabel(st)}
      </text>
      <title>
        {st.code} · {st.zone} · {status}
        {editing ? " · Drag to move" : ""}
      </title>
    </g>
  );
});
function ObjectShape({
  o,
  selected,
  onSelect,
  sceneId,
}: {
  sceneId: string;
  o: MapObject;
  selected: boolean;
  onSelect?: CanvasProps["onObjectSelect"];
}) {
  return (
    <g
      data-item={o.locked ? undefined : o.id}
      transform={`translate(${o.x} ${o.y}) rotate(${o.rotation})`}
      onClick={(e) => {
        if (onSelect) {
          e.stopPropagation();
          onSelect(o.id, e.shiftKey || e.ctrlKey);
        }
      }}
      className={styles.object}
    >
      <FeatureArt o={o} id={sceneId} />
      {selected && (
        <rect
          width={o.width}
          height={o.height}
          fill="none"
          stroke={mapTheme.selection.border}
          strokeWidth=".075"
          strokeDasharray=".16 .10"
          pointerEvents="none"
        />
      )}
      <title>
        {o.label}
        {o.locked ? " · Locked" : ""}
      </title>
    </g>
  );
}
export default function FloorCanvas({
  geometry: g,
  bookings,
  selected,
  onSelect,
  editing,
  selectedObjects = [],
  onObjectSelect,
  onMove,
  onResize,
  flat: initialFlat = false,
  activeCategory,
  focusRegion,
  searchMatches,
  preview = false,
  ownedIds = [],
  toolbar,
  footer,
  focus,
  target,
  highlight = [],
}: CanvasProps) {
  const sceneId = useId().replace(/:/g, "");
  const workspace = useMapWorkspace();
  const frame = sceneBounds(g.layout);
  const cameraMode = useRef<"free" | "cover" | "focus">("free"),
    cameraFocus = useRef<SceneRect | undefined>(undefined);
  const scene = useRef<HTMLDivElement>(null),
    size = useRef({ width: 1, height: 1 }),
    inlineCamera = useRef<SceneRect | undefined>(undefined),
    wasExpanded = useRef(false),
    cameraRef = useRef<SceneRect>(frame),
    ready = useRef(false);
  const profile = projectionProfile(g.layout);
  const renderStall = (st: Stall) => {
    const r = g.layout.regions?.length
      ? assignedRegion(g.layout, st)
      : undefined;
    const category = g.layout.categories?.find((c) => c.id === r?.categoryId);
    return category
      ? { ...st, color: category.color, categoryZoneId: r!.id }
      : st;
  };
  const [overlay, setOverlay] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const svg = useRef<SVGSVGElement>(null),
    wrap = useRef<HTMLDivElement>(null),
    [flat, setFlat] = useState(initialFlat),
    [camera, setCamera] = useState(frame),
    [zoom, setZoom] = useState(1),
    [focusIndex, setFocusIndex] = useState(0),
    [printing, setPrinting] = useState(false),
    [hovered, setHovered] = useState<string>(),
    [hand, setHand] = useState(false),
    [dragging, setDragging] = useState(false);
  useEffect(() => {
    const r = g.layout.regions?.find((r) => r.id === focusRegion);
    if (!r) return;
    const xs = r.vertices.map((p) => p.x),
      ys = r.vertices.map((p) => p.y),
      x = Math.min(...xs) - 2,
      y = Math.min(...ys) - 2;
    const w = Math.max(...xs) - x + 2,
      h = Math.max(...ys) - y + 2;
    setCamera({ x, y, w, h });
    setZoom(frame.w / w);
  }, [focusRegion]);
  const space = useRef(false),
    inside = useRef(false);
  useEffect(() => {
    if (!editing) return;
    const release = () => {
      space.current = false;
      setHand(false);
    };
    const down = (e: KeyboardEvent) => {
      const target = e.target as Element;
      if (
        e.code !== "Space" ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        target.closest?.("input,textarea,select,[contenteditable=true]")
      )
        return;
      if (target.closest?.("button") && !inside.current) return;
      if (!inside.current && !wrap.current?.contains(document.activeElement))
        return;
      e.preventDefault();
      e.stopPropagation();
      space.current = true;
      setHand(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") release();
    };
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
      window.removeEventListener("blur", release);
      space.current = false;
    };
  }, [editing]);
  const hoveredStall = g.stalls.find((st) => st.id === hovered);
  const pointers = useRef(new Map<number, { x: number; y: number }>()),
    gesture = useRef<{
      point: { x: number; y: number };
      matrix?: DOMMatrix;
      pan?: boolean;
      camera: typeof camera;
      ids: string[];
      distance?: number;
      item?: string;
      resize?: string;
      dx: number;
      dy: number;
    } | null>(null),
    raf = useRef(0),
    moved = useRef(false);
  useEffect(() => {
    setCamera(frame);
    setZoom(1);
  }, [g.hall.id, g.layout.width, g.layout.height]);
  useEffect(() => {
    const el = svg.current,
      prevent = (e: WheelEvent) => e.preventDefault();
    el?.addEventListener("wheel", prevent, { passive: false });
    return () => {
      cancelAnimationFrame(raf.current);
      el?.removeEventListener("wheel", prevent);
    };
  }, []);
  const surfaceMode = useRef<"batched" | "individual">("individual");
  const printSnapshot = useRef<HTMLDivElement | null>(null);
  const printOptions = {
    crop: focus,
    selectedIds: selected,
    preview,
    ownedIds,
    get surfaceMode() {
      return surfaceMode.current;
    },
  };
  const preparePrint = () => {
    printSnapshot.current?.remove();
    const el = document.createElement("div");
    el.dataset.mapPrint = "true";
    const heading = document.createElement("p");
    heading.textContent = `${g.layout.name}${preview ? " · Design preview · simulated bookings" : ""}`;
    const summary = document.createElement("p");
    summary.textContent = selected.length
      ? `${g.stalls
          .filter((st) => selected.includes(st.id))
          .map((st) => st.code)
          .join(", ")} · ${selected.length} stalls · ${g.stalls
          .filter((st) => selected.includes(st.id))
          .reduce((n, st) => n + footprintArea(st), 0)
          .toFixed(2)} m²`
      : "Complete exhibition scene";
    const image = document.createElement("div");
    image.innerHTML = exportMap(g, bookings, flat, printOptions);
    const legend = document.createElement("p");
    legend.textContent = preview
      ? "Available: pavilion colors · Own selection / holds: blue dashed · Other pending: amber dotted · Other confirmed: teal outline"
      : "Available · Held · Confirmed · Selected";
    el.append(heading, summary, image, legend);
    document.body.append(el);
    printSnapshot.current = el;
  };
  useEffect(() => {
    // Prepare the soft shadow before a synchronous browser Ctrl/Cmd+P event.
    const refresh = () => {
      preparePrint();
      const snapshot = printSnapshot.current?.querySelector('svg');
      if (snapshot) void preservePrintShadow(snapshot).catch(() => {});
    };
    refresh();
    const before = () => { if (!printSnapshot.current) preparePrint(); },
      after = () => {
        printSnapshot.current?.remove();
        printSnapshot.current = null;
        refresh();
      };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
      printSnapshot.current?.remove();
      printSnapshot.current = null;
    };
  }, [g, bookings, flat, focus, selected, preview, ownedIds]);
  cameraRef.current = camera;
  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      size.current = { width, height };
      setCamera((c) => {
        const first = !ready.current;
        const source = first ? frame : c;
        ready.current = true;
        const result =
          cameraMode.current === "cover"
            ? fitScene(frame, width, height, "cover")
            : cameraMode.current === "focus" && cameraFocus.current
              ? fitScene(cameraFocus.current, width, height)
              : !first
                ? {
                    ...c,
                    y: c.y + c.h / 2 - (c.w * height) / width / 2,
                    h: (c.w * height) / width,
                  }
                : fitScene(source, width, height);
        cameraRef.current = result;
        return result;
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [g.hall.id]);
  useEffect(() => {
    if (workspace?.expanded && !wasExpanded.current) {
      inlineCamera.current = cameraRef.current;
      cameraMode.current = "cover";
      setCamera(
        fitScene(frame, size.current.width, size.current.height, "cover"),
      );
    }
    if (!workspace?.expanded && wasExpanded.current && inlineCamera.current) {
      cameraMode.current = "free";
      const saved = inlineCamera.current;
      ready.current = false;
      setCamera(saved);
      requestAnimationFrame(() => {
        ready.current = true;
        const h = (saved.w * size.current.height) / size.current.width;
        setCamera({ ...saved, y: saved.y + saved.h / 2 - h / 2, h });
      });
    }
    wasExpanded.current = !!workspace?.expanded;
  }, [workspace?.expanded]);
  useEffect(() => {
    if (target) {
      cameraMode.current = "focus";
      cameraFocus.current = target.rect;
      const { width, height } = size.current;
      setCamera(fitScene(target.rect, width, height));
      setZoom(frame.w / target.rect.w);
    }
  }, [target?.token]);
  const point = (x: number, y: number) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(x, y).matrixTransform(matrix.inverse())
      : { x: 0, y: 0 };
  };
  const changeZoom = (factor: number) => {
    cameraMode.current = "free";
    setCamera((c) => {
      const w = Math.max(
          g.layout.width / 6,
          Math.min(g.layout.width * 1.5, c.w / factor),
        ),
        h = (w * c.h) / c.w;
      setZoom(frame.w / w);
      return { x: c.x + (c.w - w) / 2, y: c.y + (c.h - h) / 2, w, h };
    });
  };
  const status = useMemo(
    () =>
      new Map(
        bookings.flatMap((b) =>
          b.stallIds.map(
            (id) =>
              [
                id,
                preview && ownedIds.includes(id)
                  ? "own-held"
                  : preview && b.status === "confirmed"
                    ? "other-confirmed"
                    : b.status,
              ] as const,
          ),
        ),
      ),
    [bookings, preview, ownedIds],
  );
  const shapes = useMemo(
    () =>
      g.stalls
        .filter((st) => st.placed)
        .map((st) => {
          st = renderStall(st);
          const pts = corners(st);
          return {
            st,
            d:
              pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ") +
              "Z",
            minX: Math.min(...pts.map((p) => p[0])),
            maxX: Math.max(...pts.map((p) => p[0])),
            minY: Math.min(...pts.map((p) => p[1])),
            maxY: Math.max(...pts.map((p) => p[1])),
          };
        }),
    [g.stalls, g.layout, flat],
  );
  const structuralStalls = useMemo(() => shapes.map((v) => v.st), [shapes]);
  const edges = useMemo(
    () => joinedEdges(structuralStalls, g.layout),
    [structuralStalls, g.layout],
  );
  const companyArt = useMemo(
    () => CompanyArt({ bookings, preview }),
    [bookings, preview],
  );
  const pavilions = useMemo(
    () => derivePavilions(g.layout, g.stalls),
    [g.layout, g.stalls],
  );
  const dimensions = useMemo(
    () => measuredGaps(g.layout, g.stalls, pavilions),
    [g.layout, g.stalls, pavilions],
  );
  const overscan = Math.max(
    2,
    profile.extrusionM +
      Math.abs(profile.shadowXM) +
      Math.abs(profile.shadowYM) +
      3 * profile.shadowBlurM,
  );
  const visible = useMemo(
    () =>
      shapes.filter(
        (v) =>
          v.maxX >= camera.x - overscan &&
          v.minX <= camera.x + camera.w + overscan &&
          v.maxY >= camera.y - overscan &&
          v.minY <= camera.y + camera.h + overscan,
      ),
    [shapes, camera, overscan],
  );
  // Dense overviews use a handful of SVG paths rather than thousands of DOM nodes.
  // Individual booth controls return as the user zooms in; the accessible list is always available.
  const batched = !editing && !printing && visible.length > 180;
  useEffect(() => { surfaceMode.current = batched ? "batched" : "individual"; }, [batched]);
  const batches = useMemo(() => {
    const selectedIds = new Set(selected),
      out = new Map<
        string,
        {
          kind: string;
          fill: string;
          paths: string[];
        }
      >();
    for (const v of visible) {
      const kind = selectedIds.has(v.st.id)
        ? "selected"
        : status.get(v.st.id) || "available";
      const fill = faceColor(v.st, kind, kind === "selected"),
        key = kind + fill;
      if (!out.has(key)) out.set(key, { kind, fill, paths: [] });
      out.get(key)!.paths.push(v.d);
    }
    return [...out.values()].map((v) => ({
      ...v,
      d: v.paths.join(" "),
    }));
  }, [visible, selected, status]);
  const hit = (pt: { x: number; y: number }) =>
    visible.find((v) => {
      const r = (-v.st.rotation * Math.PI) / 180,
        dx = pt.x - v.st.x,
        dy = pt.y - v.st.y,
        x = dx * Math.cos(r) - dy * Math.sin(r),
        y = dx * Math.sin(r) + dy * Math.cos(r);
      return x >= 0 && x <= v.st.width && y >= 0 && y <= v.st.height;
    })?.st.id;

  const download = async () => {
    workspace?.cancel();
    const { exportMap } = await import("./export");
    const url = URL.createObjectURL(
      new Blob([exportMap(g, bookings, flat, printOptions)], {
        type: "image/svg+xml",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = g.layout.name + ".svg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div
      style={mapCssVariables as React.CSSProperties}
      ref={wrap}
      className={`${styles.canvasWrap} ${footer || workspace ? styles.responsiveCanvas : ""}`}
    >
      <style>{`[data-map-print]{display:none}@media print{html:has([data-map-print]),body:has([data-map-print]){width:auto!important;margin:0!important;padding:0!important}body:has([data-map-print])>*{display:none!important}body>[data-map-print]{display:block!important;position:static!important;color:#102a43!important;background:white!important;padding:8px;font:12px Arial} [data-map-print],[data-map-print] *{print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important} [data-map-print] > div > svg{display:block;width:auto;height:auto;max-width:100%;max-height:85vh;overflow:hidden;margin:auto} [data-map-print] p{margin:5px 0} @page{size:landscape;margin:8mm}}`}</style>
      <div
        className={styles.canvasToolbar}
        onClickCapture={(e) => {
          const button = (e.target as Element).closest("button");
          if (button && !button.hasAttribute("data-no-auto-expand"))
            workspace?.activity();
        }}
      >
        <div>
          <strong>{g.layout.name}</strong>
          <span>
            {Math.round(zoom * 100)}% ·{" "}
            {editing
              ? "Space + drag to pan · Drag stalls to edit · Shift to multi-select"
              : "Select stalls to build your exhibition space"}
          </span>
        </div>
        {toolbar}
        <div className={styles.tools}>
          <button
            aria-label="Zoom in"
            onClick={() => {
              changeZoom(1.25);
              workspace?.activity();
            }}
          >
            <Plus size={17} />
          </button>
          <button
            aria-label="Zoom out"
            onClick={() => {
              changeZoom(0.8);
              workspace?.activity();
            }}
          >
            <Minus size={17} />
          </button>
          <button
            aria-label="Fit entire hall"
            onClick={() => {
              cameraMode.current = "focus";
              cameraFocus.current = frame;
              setCamera(
                fitScene(frame, size.current.width, size.current.height),
              );
              setZoom(1);
            }}
          >
            <RotateCcw size={17} />
          </button>
          <button
            aria-label={flat ? "Show 2.5D" : "Show 2D"}
            onClick={() => setFlat(!flat)}
          >
            <Layers size={17} />
            {flat ? "Flat" : "2.5D"}
          </button>
          <button
            data-no-auto-expand
            aria-label={
              workspace?.expanded ? "Back to dashboard" : "Expand map"
            }
            onClick={() =>
              workspace
                ? workspace.expanded
                  ? workspace.back()
                  : workspace.expand()
                : document.fullscreenElement
                  ? document.exitFullscreen()
                  : wrap.current?.requestFullscreen()
            }
          >
            <Maximize size={17} />
          </button>
          {editing && g.layout.referenceVersion && (
            <button aria-pressed={overlay} onClick={() => setOverlay(!overlay)}>
              Reference overlay
            </button>
          )}
          <button
            data-no-auto-expand
            aria-label="Download SVG"
            onClick={download}
          >
            <Download size={17} />
          </button>
          <button
            data-no-auto-expand
            disabled={exportingPdf}
            aria-busy={exportingPdf}
            onClick={async () => {
              setExportingPdf(true);
              setPdfError('');
              try {
              workspace?.cancel();
              preparePrint();
              const snapshot = printSnapshot.current?.querySelector('svg');
              if (snapshot) {
                const paragraphs = printSnapshot.current!.querySelectorAll('p');
                await downloadMapPdf(snapshot, paragraphs[0].textContent || '', paragraphs[1].textContent || '', paragraphs[2].textContent || '');
                void preservePrintShadow(snapshot).catch(() => {});
              }
              } catch {
                setPdfError('PDF export failed. Please try again or use your browser’s Print command.');
              } finally {
                setExportingPdf(false);
              }
            }}
          >
            Print / PDF
          </button>
        </div>
      </div>
      {pdfError && <p role="alert">{pdfError}</p>}
      <div ref={scene} className={styles.scene}>
        <svg
          ref={svg}
          data-live-map
          data-hand={hand ? (dragging ? "dragging" : "ready") : undefined}
          data-stall-count={g.stalls.length}
          aria-label="Live exhibition floorplan"
          onFocusCapture={(e) => {
            const id = (e.target as Element)
              .closest("[data-item]")
              ?.getAttribute("data-item");
            setHovered(id || g.stalls[focusIndex]?.id);
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter" || (e.key === " " && !editing))
              workspace?.activity();
          }}
          viewBox={`${camera.x} ${camera.y} ${camera.w} ${camera.h}`}
          className={`${styles.map} ${zoom > 1.3 ? styles.detailed : ""}`}
          style={{
            aspectRatio:
              footer || workspace ? undefined : `${frame.w} / ${frame.h}`,
            // Native SVG faces provide depth without rasterizing labels through CSS 3D.
            transform: "none",
          }}
          onClickCapture={(e) => {
            if (moved.current) {
              e.stopPropagation();
              moved.current = false;
            }
          }}
          onWheel={(e) => {
            changeZoom(e.deltaY < 0 ? 1.12 : 0.89);
            workspace?.cancel();
            workspace?.activity();
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            cameraMode.current = "free";
            workspace?.start();
            svg.current?.setPointerCapture(e.pointerId);
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            moved.current = false;
            const pt = point(e.clientX, e.clientY),
              id = space.current
                ? undefined
                : (e.target as Element)
                    .closest("[data-item]")
                    ?.getAttribute("data-item") ||
                  (batched ? hit(pt) : undefined),
              ids =
                id && editing
                  ? selected.includes(id) || selectedObjects.includes(id)
                    ? [...selected, ...selectedObjects]
                    : [id]
                  : [];
            gesture.current = {
              point: pt,
              matrix: svg.current?.getScreenCTM()?.inverse(),
              pan: space.current,
              camera,
              ids,
              item: id || undefined,
              resize: space.current
                ? undefined
                : (e.target as Element).getAttribute("data-resize") ||
                  undefined,
              dx: 0,
              dy: 0,
            };
            setDragging(true);
            if (pointers.current.size === 2) {
              const [a, b] = [...pointers.current.values()];
              gesture.current.distance = Math.hypot(a.x - b.x, a.y - b.y);
            }
          }}
          onPointerMove={(e) => {
            if (!gesture.current || !pointers.current.has(e.pointerId)) {
              if (e.pointerType !== "touch")
                setHovered(hit(point(e.clientX, e.clientY)));
              return;
            }
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            const start = gesture.current,
              pt = start.matrix
                ? new DOMPoint(e.clientX, e.clientY).matrixTransform(
                    start.matrix,
                  )
                : point(e.clientX, e.clientY);
            if (pointers.current.size === 2 && start.distance) {
              const [a, b] = [...pointers.current.values()],
                ratio = Math.hypot(a.x - b.x, a.y - b.y) / start.distance;
              cancelAnimationFrame(raf.current);
              raf.current = requestAnimationFrame(() => {
                const w = Math.max(
                    g.layout.width / 6,
                    Math.min(g.layout.width * 1.5, start.camera.w / ratio),
                  ),
                  h = (w * start.camera.h) / start.camera.w;
                setCamera({
                  x: start.camera.x + (start.camera.w - w) / 2,
                  y: start.camera.y + (start.camera.h - h) / 2,
                  w,
                  h,
                });
                setZoom(frame.w / w);
              });
              moved.current = true;
              return;
            }
            const dx = pt.x - start.point.x,
              dy = pt.y - start.point.y;
            if (Math.abs(dx) + Math.abs(dy) > 0.25) moved.current = true;
            start.dx = dx;
            start.dy = dy;
            if (start.resize) return;
            if (start.ids.length) {
              svg.current
                ?.querySelectorAll<SVGGElement>("[data-item]")
                .forEach((el) => {
                  if (start.ids.includes(el.dataset.item!))
                    el.style.translate = `${dx}px ${dy}px`;
                });
            } else if (moved.current) {
              cancelAnimationFrame(raf.current);
              raf.current = requestAnimationFrame(() =>
                setCamera({
                  ...start.camera,
                  x: start.camera.x - dx,
                  y: start.camera.y - dy,
                }),
              );
            }
          }}
          onPointerUp={(e) => {
            const start = gesture.current;
            setDragging(false);
            pointers.current.delete(e.pointerId);
            svg.current
              ?.querySelectorAll<SVGGElement>("[data-item]")
              .forEach((el) => el.style.removeProperty("translate"));
            if (start && pointers.current.size === 0) {
              if (moved.current) {
                if (start.resize) onResize?.(start.resize, start.dx, start.dy);
                else if (start.ids.length)
                  onMove?.(start.ids, start.dx, start.dy);
              } else if (start.item) {
                if (g.layout.objects.some((o) => o.id === start.item))
                  onObjectSelect?.(
                    start.item,
                    e.shiftKey || e.ctrlKey || e.metaKey,
                  );
                else onSelect(start.item, e.shiftKey || e.ctrlKey || e.metaKey);
              }
            }
            moved.current = true;
            gesture.current = null;
            if (pointers.current.size === 0) workspace?.activity();
          }}
          onPointerEnter={() => {
            inside.current = true;
            workspace?.enter();
          }}
          onPointerLeave={() => {
            inside.current = false;
            workspace?.leave();
            setHovered(undefined);
          }}
          onPointerCancel={() => {
            workspace?.cancel();
            pointers.current.clear();
            setDragging(false);
            gesture.current = null;
            svg.current
              ?.querySelectorAll<SVGGElement>("[data-item]")
              .forEach((el) => el.style.removeProperty("translate"));
          }}
        >
          <SceneDefs id={sceneId} profile={profile} bounds={frame} />
          {g.layout.referenceVersion && (
            <rect
              x={referenceFrame.x}
              y={referenceFrame.y}
              width={referenceFrame.w}
              height={referenceFrame.h}
              fill={`url(#${sceneId}-reference-background)`}
              pointerEvents="none"
            />
          )}
          {preview && GardenArt({ layout: g.layout, id: sceneId })}
          <HallBase
            width={g.layout.width}
            height={g.layout.height}
            id={sceneId}
            reference={!!g.layout.referenceVersion}
          />
          {g.layout.referenceVersion &&
            g.layout.objects
              .filter(
                (o) =>
                  (o.kind === "pavilion" || o.kind === "aisle") &&
                  !hideDetachedArtwork(g.layout, g.stalls, o),
              )
              .map((o) => (
                <ObjectShape
                  key={o.id}
                  o={o}
                  sceneId={sceneId}
                  selected={selectedObjects.includes(o.id)}
                  onSelect={editing ? onObjectSelect : undefined}
                />
              ))}
          {preview && ExhibitionWash({ stalls: g.stalls, layout: g.layout })}
          <PavilionArt areas={pavilions} />
          {highlight.length > 0 && (
            <g key={highlight.join()} pointerEvents="none" data-pavilion-pulse>
              {pavilions
                .filter((area) =>
                  area.stallIds.some((id) => highlight.includes(id)),
                )
                .flatMap((area) =>
                  area.paths.map((d, i) => (
                    <path
                      key={area.id + i}
                      d={d}
                      fill={mapPalette.blue[300]}
                      fillRule="evenodd"
                      opacity=".18"
                      stroke={mapTheme.selection.border}
                      strokeWidth=".08"
                      className={styles.pavilionPulse}
                    />
                  )),
                )}
            </g>
          )}
          <CategoryArt
            layout={g.layout}
            active={activeCategory}
            stalls={g.stalls}
          />
          {g.layout.referenceVersion && <ReferenceDetails layout={g.layout} />}
          {g.layout.objects
            .filter(
              (o) =>
                (!g.layout.referenceVersion ||
                  (o.kind !== "pavilion" && o.kind !== "aisle")) &&
                !hideDetachedArtwork(g.layout, g.stalls, o),
            )
            .map((o) => (
              <ObjectShape
                key={o.id}
                o={o}
                sceneId={sceneId}
                selected={selectedObjects.includes(o.id)}
                onSelect={editing ? onObjectSelect : undefined}
              />
            ))}
          {!flat &&
            ShadowArt({
              path: visible.map((v) => v.d).join(" "),
              id: sceneId,
              profile,
            })}
          {!flat && (
            <StructureArt
              edges={edges}
              stalls={structuralStalls}
              selected={selected}
              status={status}
              layout={g.layout}
            />
          )}
          <GapArt dimensions={dimensions} />
          {batched ? (
            <g
              className={styles.batch}
              role="button"
              tabIndex={0}
              aria-label={`${g.stalls.length} stalls. Arrow keys browse stalls; Enter selects ${g.stalls[focusIndex]?.code || "a stall"}. Details appear in the footer.`}
              onKeyDown={(e) => {
                if (
                  ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(
                    e.key,
                  )
                ) {
                  e.preventDefault();
                  const next =
                    (focusIndex +
                      (["ArrowLeft", "ArrowUp"].includes(e.key)
                        ? g.stalls.length - 1
                        : 1)) %
                    g.stalls.length;
                  setFocusIndex(next);
                  setHovered(g.stalls[next]?.id);
                } else if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const st = g.stalls[focusIndex];
                  if (st) onSelect(st.id, e.shiftKey);
                }
              }}
            >
              {batches
                .filter((b) => b.d)
                .map((b) => (
                  <path
                    key={b.kind + b.fill}
                    data-selection-overlay={
                      b.kind === "selected" ? "true" : undefined
                    }
                    d={b.d}
                    {...surfacePaint(
                      { zone: "", color: b.fill },
                      b.kind,
                      b.kind === "selected",
                    )}
                  />
                ))}
              <path
                d={visible.map((v) => v.d).join(" ")}
                fill={
                  g.layout.referenceVersion ? "none" : `url(#${sceneId}-face)`
                }
                pointerEvents="none"
              />
              {g.stalls[focusIndex] && (
                <rect
                  className={styles.keyboardFocus}
                  transform={`translate(${g.stalls[focusIndex].x} ${g.stalls[focusIndex].y}) rotate(${g.stalls[focusIndex].rotation})`}
                  width={g.stalls[focusIndex].width}
                  height={g.stalls[focusIndex].height}
                  fill="none"
                  stroke={mapTheme.selection.border}
                  strokeWidth=".2"
                  strokeDasharray=".35 .15"
                  pointerEvents="none"
                />
              )}
            </g>
          ) : (
            visible.map(({ st }) => (
              <Booth
                key={st.id}
                st={st}
                layout={g.layout}
                flat={flat}
                sceneId={sceneId}
                reference={!!g.layout.referenceVersion}
                status={status.get(st.id) || "available"}
                selected={selected.includes(st.id)}
                editing={editing}
                onSelect={onSelect}
              />
            ))
          )}
          {batched && zoom >= 0.85 && (
            <g
              pointerEvents="none"
              data-booth-labels="true"
              textAnchor="middle"
              fill="#24312b"
              fontFamily="Arial,sans-serif"
            >
              {visible.map(({ st }) => (
                <text
                  key={st.id}
                  transform={`translate(${st.x} ${st.y}) rotate(${st.rotation})`}
                  x={st.width / 2}
                  y={st.height * (g.layout.referenceVersion ? 0.33 : 0.43)}
                  fill={textColor(
                    faceColor(
                      st,
                      status.get(st.id) || "available",
                      selected.includes(st.id),
                    ),
                  )}
                  fontSize={boothCodeFontSize(st, !!g.layout.referenceVersion)}
                  fontWeight="700"
                >
                  {st.code}
                  <tspan
                    x={st.width / 2}
                    y={st.height * (g.layout.referenceVersion ? 0.67 : 0.73)}
                    fontSize={dimensionFontSize(
                      st,
                      !!g.layout.referenceVersion,
                    )}
                    fontWeight={g.layout.referenceVersion ? 700 : 400}
                  >
                    {st.displayLabel || measuredLabel(st)}
                  </tspan>
                </text>
              ))}
            </g>
          )}
          {searchMatches && (
            <path
              data-search-results="true"
              d={visible
                .filter(
                  (v) =>
                    searchMatches.includes(v.st.id) &&
                    !selected.includes(v.st.id),
                )
                .map((v) => v.d)
                .join(" ")}
              fill="none"
              stroke={mapTheme.selection.border}
              strokeWidth=".1"
              strokeDasharray=".16 .10"
              pointerEvents="none"
            />
          )}
          {activeCategory && (
            <path
              data-category-eligible="true"
              d={visible
                .filter(
                  (v) =>
                    !status.has(v.st.id) &&
                    !selected.includes(v.st.id) &&
                    g.layout.regions?.find((r) => r.id === v.st.categoryZoneId)
                      ?.categoryId === activeCategory,
                )
                .map((v) => v.d)
                .join(" ")}
              fill="none"
              stroke={mapTheme.selection.border}
              strokeWidth=".12"
              pointerEvents="none"
            />
          )}
          {hoveredStall && !selected.includes(hoveredStall.id) && (
            <rect
              transform={`translate(${hoveredStall.x} ${hoveredStall.y}) rotate(${hoveredStall.rotation})`}
              width={hoveredStall.width}
              height={hoveredStall.height}
              fill="none"
              stroke={mapTheme.selection.border}
              strokeWidth=".075"
              pointerEvents="none"
            />
          )}
          {editing &&
            [...g.stalls, ...g.layout.objects]
              .filter(
                (v) =>
                  (selected.includes(v.id) || selectedObjects.includes(v.id)) &&
                  !v.locked,
              )
              .map((v) => {
                const pt = corners(v)[2];
                return (
                  <rect
                    key={"resize-" + v.id}
                    data-item={v.id}
                    data-resize={v.id}
                    x={pt[0] - 0.35}
                    y={pt[1] - 0.35}
                    width=".7"
                    height=".7"
                    fill={mapTheme.selection.border}
                    stroke="white"
                    strokeWidth=".1"
                    style={{ cursor: "nwse-resize" }}
                  >
                    <title>Drag to resize</title>
                  </rect>
                );
              })}
          {!editing && companyArt}
          {focus && (
            <rect
              data-focus-rectangle
              x={focus.x}
              y={focus.y}
              width={focus.w}
              height={focus.h}
              fill={mapTheme.selection.face}
              fillOpacity=".035"
              stroke={mapTheme.selection.border}
              strokeWidth=".08"
              strokeDasharray=".5 .25"
              pointerEvents="none"
            />
          )}
          {!g.layout.referenceVersion &&
            Array.from({ length: Math.floor(g.layout.width / 5) }, (_, i) => (
              <text
                key={i}
                x={(i + 1) * 5}
                y="-.7"
                fontSize=".6"
                textAnchor="middle"
                fill="#64748b"
              >
                {(i + 1) * 5}m
              </text>
            ))}
          {overlay && g.layout.referenceVersion && (
            <image
              href="/assets/images/floorplans/dta-dcc-source.png"
              x={referenceFrame.x}
              y={referenceFrame.y}
              width={referenceFrame.w}
              height={referenceFrame.h}
              opacity=".45"
              pointerEvents="none"
            />
          )}
        </svg>
      </div>
      {footer ? (
        footer(hoveredStall)
      ) : (
        <>
          <div className={styles.inspector} aria-live="polite">
            {hoveredStall ? (
              <>
                <strong>{hoveredStall.code}</strong>
                <span>
                  {g.layout.categories?.find(
                    (c) =>
                      c.id ===
                      assignedRegion(g.layout, hoveredStall)?.categoryId,
                  )?.name || hoveredStall.zone}{" "}
                  · {measuredLabel(hoveredStall)} ·{" "}
                  {footprintArea(hoveredStall).toFixed(2)} m²{" "}
                  {g.layout.calibrated ? "" : "· provisional scale"}
                </span>
                <b>{status.get(hoveredStall.id) || "Available"}</b>
              </>
            ) : (
              <>
                <strong>Explore the exhibition</strong>
                <span>
                  {g.stalls.length} stalls · Drag to explore · Select adjoining
                  stalls to build your space
                </span>
              </>
            )}
          </div>
          <div className={styles.legend}>
            <span>
              ▧{" "}
              {g.layout.regions?.length ? "Category colors" : "Pavilion colors"}{" "}
              · Available
            </span>
            <span className={styles.held}>● Held / pending approval</span>
            <span className={styles.confirmed}>
              ● Company booking confirmed
            </span>
            <span className={styles.selected}>● Your selection</span>
          </div>
        </>
      )}
    </div>
  );
}
