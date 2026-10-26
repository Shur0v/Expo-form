"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { mapCssVariables } from "@/lib/floorplan/map-colors";
import { ArrowLeft } from "lucide-react";
import styles from "./experience.module.css";
const memory = new Map<string, number>();
export function introduction(key: string, limit: number) {
  let n = memory.get(key) || 0;
  try {
    n = Math.max(n, Number(localStorage.getItem(key)) || 0);
  } catch {}
  if (n >= limit) return false;
  memory.set(key, n + 1);
  try {
    localStorage.setItem(key, String(n + 1));
  } catch {}
  return true;
}
interface Workspace {
  expanded: boolean;
  expand: () => void;
  back: () => void;
  activity: () => void;
  enter: () => void;
  leave: () => void;
  start: () => void;
  cancel: () => void;
  reduced: boolean;
}
const Context = createContext<Workspace | null>(null);
export const useMapWorkspace = () => useContext(Context);
export default function MapWorkspace({
  accountId,
  automatic = true,
  children,
  editor = false,
}: {
  accountId: string;
  automatic?: boolean;
  children: ReactNode;
  editor?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null),
    origin = useRef<DOMRect | null>(null),
    focus = useRef<HTMLElement | null>(null),
    hover = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    timers = useRef<ReturnType<typeof setTimeout>[]>([]),
    busy = useRef(false),
    active = useRef(false),
    blockedHover = useRef(false);
  const [expanded, setExpanded] = useState(false),
    [stage, setStage] = useState("inline"),
    [box, setBox] = useState<CSSProperties>(),
    [placeholder, setPlaceholder] = useState(0),
    [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setReduced(
        q.matches ||
          !!root.current?.closest('[data-reduced-motion="true"]') ||
          getComputedStyle(root.current!)
            .getPropertyValue("--map-reduced-motion")
            .trim() === "1",
      );
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  const clear = () => {
    clearTimeout(hover.current);
    clearTimeout(idle.current);
  };
  const back = useCallback(() => {
    if (!active.current || !origin.current) return;
    clear();
    timers.current.forEach(clearTimeout);
    timers.current = [];
    blockedHover.current = true;
    active.current = false;
    setStage("closing");
    const r = origin.current;
    setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    timers.current.push(
      setTimeout(
        () => {
          setExpanded(false);
          setStage("inline");
          setBox(undefined);
          requestAnimationFrame(() =>
            focus.current?.focus({ preventScroll: true }),
          );
        },
        reduced ? 0 : 550,
      ),
    );
  }, [reduced]);
  const expand = useCallback(() => {
    if (active.current || !root.current) return;
    clear();
    active.current = true;
    origin.current = root.current.getBoundingClientRect();
    focus.current = document.activeElement as HTMLElement;
    const r = origin.current;
    setPlaceholder(r.height);
    setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    setExpanded(true);
    setStage("preparing");
    timers.current.push(
      setTimeout(
        () => {
          setStage("width");
          setBox({ top: r.top, left: 0, width: "100%", height: r.height });
        },
        reduced ? 0 : 24,
      ),
    );
    timers.current.push(
      setTimeout(
        () => {
          setStage("height");
          setBox({ top: 0, left: 0, width: "100%", height: "100dvh" });
        },
        reduced ? 0 : 324,
      ),
    );
    timers.current.push(setTimeout(() => setStage("open"), reduced ? 0 : 574));
  }, [reduced]);
  const auto = () => {
    const focused = document.activeElement;
    if (
      focused &&
      root.current?.contains(focused) &&
      focused.closest(
        "input,select,textarea,[contenteditable=true],[data-no-auto-expand],[data-map-footer]",
      )
    )
      return;
    if (
      automatic &&
      !active.current &&
      !busy.current &&
      introduction(`ecoexpo-formstudio-map-expand-v1-${accountId}`, 2)
    )
      expand();
  };
  const activity = () => {
    clearTimeout(idle.current);
    idle.current = setTimeout(auto, 180);
  };
  useEffect(() => {
    if (!expanded) return;
    const savedOverflow = document.body.style.overflow,
      scrollX = window.scrollX,
      scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    const inerted: { el: HTMLElement; inert: boolean }[] = [];
    let child: HTMLElement | null = root.current;
    while (child?.parentElement) {
      for (const sibling of Array.from(child.parentElement.children)) {
        if (
          sibling !== child &&
          sibling instanceof HTMLElement &&
          !["SCRIPT", "STYLE", "LINK"].includes(sibling.tagName)
        ) {
          inerted.push({ el: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      child = child.parentElement;
      if (child === document.body) break;
    }
    const shell = root.current?.closest("[data-dashboard-shell]");
    shell?.setAttribute("data-map-expanded", "true");
    const key = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const controls = Array.from(
          root.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),select,input,a[href],[tabindex="0"]',
          ) || [],
        ).filter((el) => el.getBoundingClientRect().width > 0);
        const first = controls[0],
          last = controls.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = savedOverflow;
      inerted.forEach(({ el, inert }) => (el.inert = inert));
      shell?.removeAttribute("data-map-expanded");
      window.removeEventListener("keydown", key);
      window.scrollTo(scrollX, scrollY);
    };
  }, [expanded, back]);
  useEffect(
    () => () => {
      clear();
      timers.current.forEach(clearTimeout);
    },
    [],
  );
  return (
    <Context.Provider
      value={{
        expanded,
        expand,
        back,
        activity,
        start: () => {
          busy.current = true;
          clearTimeout(hover.current);
        },
        cancel: () => {
          busy.current = false;
          clear();
        },
        enter: () => {
          if (!blockedHover.current && !active.current) {
            clearTimeout(hover.current);
            hover.current = setTimeout(auto, 3000);
          }
        },
        leave: () => {
          clearTimeout(hover.current);
          blockedHover.current = false;
        },
        reduced,
      }}
    >
      <style>{`[data-dashboard-shell]>aside{transition:transform .3s ease,opacity .3s ease}[data-dashboard-shell][data-map-expanded=true]>aside{transform:translateX(-100%);opacity:0}[data-dashboard-shell][data-reduced-motion=true]>aside{transition:none}@media(prefers-reduced-motion:reduce){[data-dashboard-shell]>aside{transition:none}}`}</style>
      <div
        style={expanded ? { height: placeholder } : undefined}
        className={styles.anchor}
      >
        <div
          ref={root}
          data-map-workspace
          data-expanded={expanded}
          data-stage={stage}
          data-editor-workspace={editor || undefined}
          data-reduced-motion={reduced}
          className={`${styles.workspace} ${expanded ? styles.expanded : ""}`}
          style={{ ...mapCssVariables, ...box } as CSSProperties}
          onFocusCapture={(e) => {
            if (
              (e.target as Element).closest(
                "input,select,textarea,[contenteditable=true],[data-no-auto-expand],[data-map-footer]",
              )
            )
              clear();
          }}
          onPointerUpCapture={() => {
            busy.current = false;
          }}
        >
          {expanded && (
            <button
              data-map-back
              className={styles.back}
              onClick={back}
              autoFocus
            >
              <ArrowLeft size={17} /> Back to dashboard
            </button>
          )}
          {children}
        </div>
      </div>
    </Context.Provider>
  );
}
