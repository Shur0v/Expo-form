"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  X,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
export function Button({
  children,
  onClick,
  disabled,
  type = "button",
  secondary = false,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  secondary?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold transition-all active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 ${secondary ? "border border-[#ebedf5] bg-white text-[#102a43] hover:bg-[#f7f7fc]" : "bg-[#7562ef] text-white shadow-[0_4px_12px_rgba(117,98,239,.2)] hover:bg-[#6752dd] hover:shadow-md"}`}
    >
      {children}
    </button>
  );
}
export function Card({
  title,
  children,
  action,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      data-workspace-card
      className={`min-w-0 rounded-2xl border border-white/90 bg-gradient-to-br from-white/95 via-white/95 to-violet-50/45 p-5 shadow-[0_3px_18px_rgba(16,42,67,0.04)] backdrop-blur-sm ${className}`}
    >
      {title && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  const value = String(children).toLowerCase();
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[13px] font-semibold ${/approved|verified|confirmed|ready|valid|active|suitable|published|completed/.test(value) && !value.includes("incompatible") ? "bg-emerald-50 text-emerald-700" : /rejected|declined|expired|blocked|incompatible|revoked|deleted/.test(value) ? "bg-red-50 text-red-600" : "bg-[#f0eefb] text-[#6054dc]"}`}
    >
      {children}
    </span>
  );
}
export function Field({
  label,
  help,
  children,
  className = "",
}: {
  label: string;
  className?: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block min-w-0 space-y-2 text-[15px] ${className}`}>
      <span className="font-medium">{label}</span>
      {children}
      {help && (
        <span className="block text-sm leading-5 text-[#4b5d73]">{help}</span>
      )}
    </label>
  );
}
export const inputClass =
  "min-h-11 w-full rounded-xl border border-[#ebedf5] bg-[#f7f7fc] px-3 py-2 text-[15px] outline-none focus:border-[#6054dc] focus:ring-2 focus:ring-purple-100 disabled:opacity-60";
export function Empty({
  title = "No matching records",
  detail = "Change your filters or create a new record.",
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#ebedf5] p-10 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-[15px] text-[#4b5d73]">{detail}</p>
    </div>
  );
}
/** Accessible dialog restores focus and closes only the topmost dialog on Escape. */
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
  size = "default",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  size?: "default" | "medium";
}) {
  const ref = useRef<HTMLDivElement>(null),
    titleId = useId(),
    closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = ref.current;
    root?.focus();
    const key = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll("[data-modal]");
      if (dialogs[dialogs.length - 1] !== root) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const elements = Array.from(
          root?.querySelectorAll<HTMLElement>(
            'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
          ) || [],
        ).filter((el) => el.offsetParent !== null);
        const first = elements[0],
          last = elements.at(-1);
        if (!first) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === root)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last || document.activeElement === root)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-2 backdrop-blur-sm sm:p-5">
      <div
        ref={ref}
        data-modal
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[94dvh] flex-col overflow-hidden rounded-2xl border border-[#ebedf5] bg-white text-[#102a43] shadow-2xl outline-none ${wide ? "h-[90dvh] w-[90vw] max-sm:w-full" : size === "medium" ? "w-full max-w-3xl" : "w-full max-w-4xl"}`}
      >
        <div className="relative flex shrink-0 items-center justify-between gap-4 border-b border-[#ebedf5] bg-gradient-to-r from-purple-50/80 via-surface to-surface px-6 py-5 dark:from-purple-950/30">
          <h2 id={titleId} className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded p-2 hover:bg-[#f7f7fc]"
          >
            <X size={20} />
          </button>
        </div>
        <div
          data-dialog-content
          className={
            wide
              ? "min-h-0 flex-1 overflow-hidden"
              : "min-h-0 flex-1 overflow-auto bg-[#f7f7fc]/40 p-6 sm:p-8 [&_form]:grid [&_form]:grid-cols-1 [&_form]:gap-5 [&_form]:space-y-0 sm:[&_form]:grid-cols-2 [&_form>button]:col-span-full [&_form>h3]:col-span-full [&_form>p]:col-span-full [&_form>div]:col-span-full"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
export function exportCsv(name: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${v.replaceAll('"', '""')}"`;
  const blob = new Blob(
    [
      "\uFEFF" +
        [headers, ...rows]
          .map((row) =>
            row.map((v) => escape(/^[=+@-]/.test(v) ? `'${v}` : v)).join(","),
          )
          .join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
export function Table({
  title,
  headers,
  rows,
  actions,
  initialSearch = "",
  initialPage = 1,
  onFilter,
  onRowClick,
}: {
  title: string;
  headers: string[];
  rows: { id: string; cells: ReactNode[]; search?: string }[];
  actions?: (id: string) => ReactNode;
  initialSearch?: string;
  initialPage?: number;
  onFilter?: (q: string, page: number) => void;
  onRowClick?: (id: string) => void;
}) {
  const [query, setQuery] = useState(initialSearch),
    [page, setPage] = useState(initialPage),
    [sort, setSort] = useState(-1),
    [descending, setDescending] = useState(false),
    [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    queueMicrotask(() => {
      setQuery(initialSearch);
      setPage(initialPage);
    });
  }, [initialSearch, initialPage]);
  const filtered = rows
    .filter((r) =>
      (r.search || r.cells.map(String).join(" "))
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort < 0
        ? 0
        : String(a.cells[sort]).localeCompare(
            String(b.cells[sort]),
            undefined,
            { numeric: true },
          ) * (descending ? -1 : 1),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 8)),
    current = Math.min(page, pages),
    shown = filtered.slice((current - 1) * 8, current * 8);
  const change = (q: string, p: number) => {
    setQuery(q);
    setPage(p);
    onFilter?.(q, p);
  };
  return (
    <Card
      title={title}
      action={
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-3" />
            <input
              aria-label={`Search ${title}`}
              value={query}
              onChange={(e) => change(e.target.value, 1)}
              className={`${inputClass} max-w-52 pl-9`}
              placeholder="Search records"
            />
          </div>
          <Button
            secondary
            ariaLabel={`Export ${title}`}
            onClick={() =>
              exportCsv(
                title,
                headers,
                filtered
                  .filter((r) => !selected.length || selected.includes(r.id))
                  .map((r) =>
                    r.cells.map((c) =>
                      typeof c === "string" || typeof c === "number"
                        ? String(c)
                        : r.search || "",
                    ),
                  ),
              )
            }
          >
            <Download size={15} /> Export
            {selected.length ? ` (${selected.length})` : ""}
          </Button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[15px]">
          <thead className="bg-[#f7f7fc] text-sm text-[#4b5d73]">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  aria-label="Select visible rows"
                  checked={
                    !!shown.length &&
                    shown.every((r) => selected.includes(r.id))
                  }
                  onChange={(e) =>
                    setSelected(e.target.checked ? shown.map((r) => r.id) : [])
                  }
                />
              </th>
              {headers.map((h, i) => (
                <th key={h} className="whitespace-nowrap px-3 py-3">
                  <button
                    onClick={() => {
                      setSort(i);
                      setDescending(sort === i ? !descending : false);
                    }}
                    className="flex items-center gap-2"
                  >
                    {h}
                    <ArrowUpDown size={12} />
                  </button>
                </th>
              ))}
              {actions && <th className="p-3">Action</th>}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr
                key={r.id}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={e=>{if(onRowClick && !(e.target as HTMLElement).closest("button,select,input,a,textarea"))onRowClick(r.id);}}
                onKeyDown={e=>{if(onRowClick && e.target===e.currentTarget && e.key==="Enter")onRowClick(r.id);}}
                className={`border-b border-[#ebedf5] hover:bg-[#f7f7fc] ${onRowClick ? "cursor-pointer" : ""}`}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    aria-label={`Select ${r.id}`}
                    checked={selected.includes(r.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, r.id]
                          : selected.filter((id) => id !== r.id),
                      )
                    }
                  />
                </td>
                {r.cells.map((cell, i) => (
                  <td key={i} className="px-3 py-4">
                    {cell}
                  </td>
                ))}
                {actions && (
                  <td className="whitespace-nowrap p-3">{actions(r.id)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!shown.length && <Empty />}
      <div className="mt-5 flex items-center justify-between gap-3 text-sm text-[#4b5d73]">
        <span>
          {filtered.length} records · Page {current} / {pages}
        </span>
        <div className="flex gap-2">
          <Button
            secondary
            ariaLabel="Previous page"
            disabled={current === 1}
            onClick={() => change(query, current - 1)}
          >
            <ChevronLeft size={15} />
          </Button>
          <Button
            secondary
            disabled={current >= pages}
            ariaLabel="Next page"
            onClick={() => change(query, current + 1)}
          >
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
