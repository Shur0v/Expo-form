"use client";
import { useEffect, useState } from "react";
import { readLocalImage } from "@/lib/offerletter/media";
/** Create/revoke view URLs independently of the persisted blob; deletion keeps admin evidence. */
export function useLocalImage(id?: string) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let alive = true,
      objectUrl = "";
    queueMicrotask(() => {
      if (alive) setUrl("");
    });
    if (id)
      readLocalImage(id)
        .then((blob) => {
          if (blob && alive) {
            objectUrl = URL.createObjectURL(blob);
            setUrl(objectUrl);
          }
        })
        .catch(() => {});
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  return url;
}
export function LocalImage({
  id,
  alt,
  className = "",
  onOpen,
}: {
  id: string;
  alt: string;
  className?: string;
  onOpen?: (url: string) => void;
}) {
  const url = useLocalImage(id);
  return url ? (
    <button
      type="button"
      aria-label={`Open image ${alt}`}
      className={`block overflow-hidden rounded-xl ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.(url);
      }}
    >
      <img src={url} alt={alt} className="h-full max-h-80 w-full object-contain" />
    </button>
  ) : (
    <div className="rounded-xl border border-[#ebedf5] bg-[#f7f7fc] p-5 text-sm text-[#4b5d73]">
      {alt} · Image unavailable in this browser
    </div>
  );
}
