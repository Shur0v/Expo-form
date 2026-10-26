"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  ArrowLeft,
  Info,
  MousePointer2,
  Check,
} from "lucide-react";
import type { ViewProps } from "./context";
import { visibleEditions, money } from "./context";
import {
  boundsOf,
  CENTER_ALIGNMENT,
  exhibitionOf,
  pavilionOf,
  previewExamples,
  previewGeometry,
  previewHoldKey,
  sceneBounds,
  selectionContext,
  validPreviewHolds,
  type Alignment,
  type PreviewHold,
  type SceneRect,
} from "@/lib/floorplan/map-experience";
import { footprintArea, measuredLabel } from "@/lib/floorplan/map-geometry";
import type { Stall } from "@/lib/floorplan/types";
import MapWorkspace, { introduction, useMapWorkspace } from "./workspace";
import FloorCanvas from "./canvas";
import styles from "./experience.module.css";
import chrome from "./chrome.module.css";
const sessionFallback = new Map<string, PreviewHold[]>();

function PreviewHeader({ children }: { children: ReactNode }) {
  const workspace = useMapWorkspace();
  return <header className={chrome.header}>
    <div className={chrome.previewIdentity}>
      {workspace?.expanded && <button data-map-back data-no-auto-expand
        className={chrome.headerBack} onClick={workspace.back} autoFocus>
        <ArrowLeft size={16} /><span>Back</span>
      </button>}
      <strong>Design preview</strong>
      <span className={chrome.simulationBadge} title="Simulated bookings only. No real booking or payment is created.">Simulation</span>
    </div>
    {children}
  </header>;
}
export default function PreviewViewer({
  state: s,
  context: c,
  readOnly,
}: ViewProps) {
  const account = s.accounts.find((a) => a.id === c.accountId)!;
  const editions = visibleEditions(s, c).filter((e) =>
    c.editionId === "selected"
      ? c.editionIds?.includes(e.id)
      : c.editionId === "history"
        ? e.status === "completed"
        : !c.editionId || c.editionId === "all"
          ? account.role !== "admin" ||
            ["sales-open", "preparation", "live"].includes(e.status)
          : e.id === c.editionId,
  );
  const [edition, setEdition] = useState(""),
    eid = editions.find((e) => e.id === edition)?.id || editions[0]?.id || "";
  const g = useMemo(() => previewGeometry(eid), [eid]),
    examples = useMemo(() => previewExamples(g.stalls), [g.stalls]),
    blocked = useMemo(
      () => new Set(examples.flatMap((b) => b.stallIds)),
      [examples],
    );
  const [selected, setSelected] = useState<string[]>([]),
    [holds, setHolds] = useState<PreviewHold[]>([]),
    [loadedKey, setLoadedKey] = useState(""),
    [message, setMessage] = useState(""),
    [review, setReview] = useState(false),
    [inspected, setInspected] = useState<string>(),
    [exhibition, setExhibition] = useState<"DTA" | "DCC">("DTA"),
    [pavilion, setPavilion] = useState(""),
    [alignment, setAlignment] = useState<Alignment>(CENTER_ALIGNMENT),
    [aligned, setAligned] = useState(false),
    [target, setTarget] = useState<{ rect: SceneRect; token: number }>(),
    [highlight, setHighlight] = useState<string[]>([]),
    [intro, setIntro] = useState(false);
  const appeared = useRef(false),
    legendMenu = useRef<HTMLDetailsElement>(null),
    highlightTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined,
    );
  const key = previewHoldKey(c.accountId);
  useEffect(() => {
    setLoadedKey("");
    let value: unknown = sessionFallback.get(key) || [];
    try {
      value = JSON.parse(sessionStorage.getItem(key) || JSON.stringify(value));
    } catch {}
    setHolds(validPreviewHolds(value, g.stalls, blocked));
    setLoadedKey(key);
  }, [key]);
  useEffect(() => {
    if (loadedKey !== key) return;
    sessionFallback.set(key, holds);
    try {
      sessionStorage.setItem(key, JSON.stringify(holds));
    } catch {}
  }, [holds, key, loadedKey]);
  useEffect(() => {
    const timer = setInterval(
      () =>
        setHolds((current) => {
          const next = validPreviewHolds(current, g.stalls, blocked);
          return next.length === current.length ? current : next;
        }),
      1000,
    );
    return () => clearInterval(timer);
  }, [g.stalls, blocked]);
  useEffect(() => () => clearTimeout(highlightTimer.current), []);
  const ownedIds = useMemo(() => holds.flatMap((h) => h.stallIds), [holds]);
  const bookings = useMemo(
    () => [
      ...examples,
      ...holds.map((h) => ({
        ...h,
        company: "Your preview hold",
        status: "held" as const,
      })),
    ],
    [examples, holds],
  );
  const picked = useMemo(
      () => g.stalls.filter((st) => selected.includes(st.id)),
      [g.stalls, selected],
    ),
    area = picked.reduce((n, st) => n + footprintArea(st), 0),
    price = picked.reduce((n, st) => n + st.price, 0),
    currency = editions.find((e) => e.id === eid)?.currency || "BDT";
  const scene = useMemo(() => sceneBounds(g.layout), [g.layout]);
  const focus = useMemo(
    () => selectionContext(picked, scene, alignment),
    [picked, scene, alignment],
  );
  useEffect(() => {
    if (selected.length && !appeared.current) {
      setIntro(introduction(`ecoexpo-formstudio-map-align-v1-${c.accountId}`, 3));
      appeared.current = true;
    }
    if (!selected.length) {
      appeared.current = false;
      setAligned(false);
      setAlignment(CENTER_ALIGNMENT);
    }
  }, [selected.length, c.accountId]);
  useEffect(() => {
    if (aligned && focus) setTarget({ rect: focus, token: Date.now() });
  }, [focus, aligned]);
  const select = (id: string) => {
    const booking = bookings.find((b) => b.stallIds.includes(id));
    if (booking) {
      setInspected(id);
      setMessage(
        `${g.stalls.find((st) => st.id === id)?.code}: ${booking.company} · ${ownedIds.includes(id) ? "Your preview hold" : booking.status === "confirmed" ? "Confirmed" : "Pending verification"}`,
      );
      return;
    }
    setMessage("");
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id],
    );
  };
  const align = (axis: keyof Alignment, value: string) => {
    setAlignment((a) => ({ ...a, [axis]: value }));
    setAligned(true);
    if (focus)
      setTarget({
        rect: selectionContext(picked, scene, { ...alignment, [axis]: value })!,
        token: Date.now(),
      });
  };
  const navigate = (name: "DTA" | "DCC", zone = "") => {
    setExhibition(name);
    setPavilion(zone);
    const group = g.stalls.filter(
      (st) =>
        exhibitionOf(st.code) === name &&
        (!zone || pavilionOf(st.zone) === zone),
    );
    if (!group.length) return;
    const b = boundsOf(group);
    setTarget({
      rect: { x: b.x - 2, y: b.y - 2, w: b.w + 4, h: b.h + 4 },
      token: Date.now(),
    });
    setHighlight([]);
    requestAnimationFrame(() => setHighlight(group.map((st) => st.id)));
    clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlight([]), 1400);
  };
  const alignmentControls = [
    ["horizontal", "left", "Left", AlignStartVertical],
    ["horizontal", "center", "Horizontal center", AlignCenterVertical],
    ["horizontal", "right", "Right", AlignEndVertical],
    ["vertical", "top", "Top", AlignStartHorizontal],
    ["vertical", "center", "Vertical center", AlignCenterHorizontal],
    ["vertical", "bottom", "Bottom", AlignEndHorizontal],
  ] as const;
  const toolbar = selected.length ? (
    <div
      aria-label="Selection alignment"
      className={`${chrome.nav} ${intro ? styles.intro : ""}`}
      data-alignment-introduction={intro}
    >
      {alignmentControls.map(([axis, value, label, Icon], i) => (
        <button
          key={label}
          aria-label={label}
          title={label}
          aria-pressed={aligned && alignment[axis] === value}
          style={{ "--order": 5 - i } as CSSProperties}
          onClick={() => align(axis, value)}
        >
          <Icon size={17} />
        </button>
      ))}
    </div>
  ) : (
    <nav className={chrome.nav} aria-label="Exhibition and pavilion navigation">
      {(["DTA", "DCC"] as const).map((name) => (
        <button
          key={name}
          aria-pressed={exhibition === name}
          title={name === "DTA" ? "Textile equipment" : "Textile chemicals"}
          onClick={() => navigate(name)}
        >
          {name}
        </button>
      ))}
      {[
        ...new Set(
          g.stalls
            .filter((st) => exhibitionOf(st.code) === exhibition)
            .map((st) => pavilionOf(st.zone)),
        ),
      ].map((zone) => (
        <button
          key={zone}
          aria-pressed={pavilion === zone}
          onClick={() => navigate(exhibition, zone)}
        >
          {zone === "General" ? zone : `P ${zone}`}
        </button>
      ))}
    </nav>
  );
  const hold = () => {
    if (!picked.length || readOnly || loadedKey !== key) return;
    const expiresAt = new Date(
      Date.now() + s.policy.holdHours * 3600000,
    ).toISOString();
    setHolds((old) => [
      ...old,
      { id: `preview-own-${Date.now()}`, stallIds: [...selected], expiresAt },
    ]);
    setMessage(
      `Preview hold saved for ${picked.map((st) => st.code).join(", ")}. Expires ${new Date(expiresAt).toLocaleString()}.`,
    );
    setSelected([]);
    setReview(false);
  };
  const legend = (
    <div className={chrome.legend}>
      <b>Available</b>
      <b>Pending</b>
      <b>Confirmed</b>
      <b>Your selection / hold</b>
    </div>
  );
  const footer = (hover?: Stall) => {
    const st = hover || g.stalls.find((v) => v.id === inspected),
      booking = st && bookings.find((b) => b.stallIds.includes(st.id));
    return (
      <footer className={chrome.footer} data-map-footer>
        <div className={chrome.selectionSummary} aria-live="polite">
          <span className={chrome.selectionIcon}>{selected.length ? <Check size={18} /> : <MousePointer2 size={18} />}</span>
          <div>
            <strong title={picked.map((st) => st.code).join(', ')}>{selected.length
              ? `${selected.length} ${selected.length === 1 ? 'booth' : 'booths'} · ${area.toFixed(2)} m² · ${money(price, currency)}`
              : 'Select booths to begin'}</strong>
            <p title={booking ? `${booking.company}${booking.expiresAt ? ` · expires ${new Date(booking.expiresAt).toLocaleString()}` : ''}` : undefined}>
              {st ? `${st.code} · ${measuredLabel(st)} · ${booking ? (ownedIds.includes(st.id) ? 'Your preview hold' : booking.status === 'confirmed' ? 'Confirmed' : 'Pending') : 'Available'}` : 'Select adjoining booths on the map'}
            </p>
          </div>
        </div>
        <div className={chrome.actions}>
          <details ref={legendMenu} className={chrome.legendMenu}>
            <summary aria-label="Map legend"><Info size={16} /><span>Legend</span></summary>
            {legend}
          </details>
          <button
            aria-label="Review selection"
            disabled={!selected.length}
            onClick={() => {
              if (legendMenu.current) legendMenu.current.open = false;
              setReview(!review);
            }}
          >
            Review
          </button>
          <button
            className={chrome.hold}
            aria-label="Hold stalls · preview"
            title="Simulate a 24-hour hold"
            disabled={!selected.length || readOnly || loadedKey !== key}
            onClick={() => {
              if (legendMenu.current) legendMenu.current.open = false;
              hold();
            }}
          >
            Hold booths
          </button>
        </div>
        {message && <p className={chrome.feedback} role="status" title={message}>{message}</p>}
      </footer>
    );
  };
  if (!editions.length)
    return <p>No editions are available within your current permissions.</p>;
  return (
    <MapWorkspace accountId={c.accountId}>
      <div className={`${styles.viewer} ${chrome.viewer}`}>
        <PreviewHeader>
            <select
              aria-label="Preview expo"
              value={eid}
              onChange={(e) => setEdition(e.target.value)}
            >
              {editions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.series} {e.year}
                </option>
              ))}
            </select>
        </PreviewHeader>
        <FloorCanvas
          geometry={g}
          bookings={bookings}
          selected={selected}
          onSelect={select}
          preview
          ownedIds={ownedIds}
          toolbar={toolbar}
          footer={footer}
          focus={focus}
          target={target}
          highlight={highlight}
        />
        {review && (
          <section
            className={styles.review}
            role="dialog"
            aria-label="Review preview selection"
          >
            <h3>Preview selection</h3>
            <p>{picked.map((st) => st.code).join(", ")}</p>
            <p>
              {selected.length} stalls · {area.toFixed(2)} m² ·{" "}
              {money(price, currency)}
            </p>
            <p>
              Simulated hold only. No booking, confirmation or payment is
              created. Hold duration: {s.policy.holdHours} hours.
            </p>
            <button onClick={() => setReview(false)}>Close</button>{" "}
            <button
              onClick={() => {
                setSelected([]);
                setReview(false);
              }}
            >
              Clear selection
            </button>
          </section>
        )}
      </div>
    </MapWorkspace>
  );
}
