"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
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
import MapWorkspace, { introduction } from "./workspace";
import FloorCanvas from "./canvas";
import styles from "./experience.module.css";
const sessionFallback = new Map<string, PreviewHold[]>();
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
  const [detailsOpen, setDetailsOpen] = useState(true);
  useEffect(() => {
    const q = matchMedia("(max-width:700px)");
    const update = () => setDetailsOpen(!q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  const appeared = useRef(false),
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
      className={`${styles.nav} ${intro ? styles.intro : ""}`}
      data-alignment-introduction={intro}
    >
      {alignmentControls.map(([axis, value, label, Icon], i) => (
        <button
          key={label}
          aria-label={label}
          title={`${label} · 40 m viewing context`}
          aria-pressed={aligned && alignment[axis] === value}
          style={{ "--order": 5 - i } as CSSProperties}
          onClick={() => align(axis, value)}
        >
          <Icon size={17} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  ) : (
    <nav className={styles.nav} aria-label="Exhibition and pavilion navigation">
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
    <div className={styles.legend}>
      <b>Available · pavilion colors</b>
      <b>Other pending · dotted</b>
      <b>Other confirmed · outlined</b>
      <b>Your selection / holds · dashed</b>
    </div>
  );
  const footer = (hover?: Stall) => {
    const st = hover || g.stalls.find((v) => v.id === inspected),
      booking = st && bookings.find((b) => b.stallIds.includes(st.id));
    return (
      <footer className={styles.footer} data-map-footer>
        <div aria-live="polite">
          <strong>{st ? st.code : "Explore the exhibition"}</strong>
          <p>
            {st
              ? `${measuredLabel(st)} · ${footprintArea(st).toFixed(2)} m² · ${booking ? (ownedIds.includes(st.id) ? "Your preview hold" : booking.status === "confirmed" ? "Confirmed" : "Pending verification") : "Available"}`
              : "Drag to explore · Select adjoining stalls"}
          </p>
          {booking && (
            <p>
              {booking.company}
              {booking.expiresAt
                ? ` · expires ${new Date(booking.expiresAt).toLocaleTimeString()}`
                : ""}
            </p>
          )}
        </div>
        <div>
          <strong>
            {selected.length
              ? `${selected.length} stalls · ${area.toFixed(2)} m² · ${money(price, currency)}`
              : "375 stalls · Design preview"}
          </strong>
          <details
            open={detailsOpen}
            onToggle={(e) => setDetailsOpen(e.currentTarget.open)}
            className={styles.selectionDetails}
          >
            <summary className={styles.mobileSummary}>
              Selection details and legend
            </summary>
            <div>
              <p
                className={styles.selectedCodes}
                title={picked.map((st) => st.code).join(", ")}
              >
                {picked.map((st) => st.code).join(" · ") ||
                  "Select available stalls to try a simulated hold."}
              </p>
              {legend}
              {message && <p role="status">{message}</p>}
            </div>
          </details>
        </div>
        <div className={styles.actions}>
          <button
            disabled={!selected.length}
            onClick={() => setReview(!review)}
          >
            Review selection
          </button>
          <button
            className={styles.hold}
            disabled={!selected.length || readOnly || loadedKey !== key}
            onClick={hold}
          >
            Hold stalls · preview
          </button>
        </div>
      </footer>
    );
  };
  if (!editions.length)
    return <p>No editions are available within your current permissions.</p>;
  return (
    <MapWorkspace accountId={c.accountId}>
      <div className={styles.viewer}>
        <div className={styles.previewBadge}>
          <strong>Design preview · simulated bookings</strong>
          <label>
            Expo{" "}
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
          </label>
        </div>
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
