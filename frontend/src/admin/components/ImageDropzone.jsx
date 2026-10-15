import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, AlertTriangle } from "lucide-react";
import { cn } from "../../utils/cn.js";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/avif"];

function filesToPreview(files) {
  return Promise.all(
    Array.from(files).map(
      (f) =>
        new Promise((res) => {
          const reader = new FileReader();
          reader.onload = (e) =>
            res({
              file: f,
              preview: e.target.result,
              name: f.name,
              size: f.size,
              type: f.type,
              key: `${f.name}_${f.size}_${Math.random().toString(36).slice(2)}`,
            });
          reader.readAsDataURL(f);
        }),
    ),
  );
}

export default function ImageDropzone({
  value = [],
  onChange = () => {},
  max = 15,
  hint = null,
  allowPrimary = true,
  primaryId = null,
  onSetPrimary = null,
  allowReorder = true,
}) {
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const addFiles = useCallback(
    async (list) => {
      setError("");
      const files = Array.from(list || []);
      if (value.length + files.length > max) {
        setError(`Up to ${max} images allowed (${value.length} already present).`);
        return;
      }
      const rejected = [];
      const accepted = [];
      files.forEach((f) => {
        if (!ALLOWED_TYPES.includes(f.type)) {
          rejected.push(`${f.name} — unsupported type`);
        } else if (f.size > MAX_BYTES) {
          rejected.push(`${f.name} — over 5 MB`);
        } else {
          accepted.push(f);
        }
      });
      if (rejected.length) {
        setError(`Rejected: ${rejected.join(", ")}`);
      }
      if (!accepted.length) return;
      const previews = await filesToPreview(accepted);
      onChange([...value, ...previews]);
    },
    [max, onChange, value],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  };

  const removeAt = (idx) => {
    const next = value.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const move = (idx, dir) => {
    if (!allowReorder) return;
    const to = idx + dir;
    if (to < 0 || to >= value.length) return;
    const next = value.slice();
    [next[idx], next[to]] = [next[to], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-xl2 border-2 border-dashed transition-colors p-6 flex flex-col items-center text-center gap-2",
          drag
            ? "border-brand-500 bg-brand-500/10"
            : "border-ink-700 hover:border-brand-500/60 hover:bg-ink-900/40",
        )}
        role="button"
        tabIndex={0}
      >
        <UploadCloud
          size={28}
          className={cn(drag ? "text-brand-300" : "text-ink-400")}
        />
        <div className="text-sm">
          <span className="text-brand-300 hover:underline">Click to upload</span>
          <span className="text-ink-400"> or drag & drop images</span>
        </div>
        <div className="text-xs text-ink-500">
          PNG, JPG, WEBP or AVIF — up to 5 MB each. Max {max}.
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {hint && !error && <div className="text-xs text-ink-400">{hint}</div>}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {value.map((p, idx) => (
            <div
              key={p.key || p.publicId || idx}
              className={cn(
                "group relative rounded-xl overflow-hidden border aspect-square",
                allowPrimary && (primaryId === p.publicId || (primaryId == null && idx === 0))
                  ? "border-brand-500 ring-2 ring-brand-500/40"
                  : "border-ink-800",
              )}
            >
              <img
                src={p.preview || p.url}
                alt={p.name || p.publicId || "preview"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 top-0 p-1.5 flex items-center justify-between gap-1 bg-gradient-to-b from-ink-950/90 to-transparent">
                {allowPrimary && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSetPrimary && p.publicId) onSetPrimary(p.publicId);
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider",
                      (primaryId === p.publicId || (primaryId == null && idx === 0))
                        ? "bg-brand-500 text-white"
                        : "bg-ink-800/80 text-ink-200 hover:bg-ink-700",
                    )}
                  >
                    Primary
                  </button>
                )}
                <button
                  type="button"
                  className="h-6 w-6 grid place-items-center rounded-full bg-ink-800/80 text-ink-100 hover:bg-rose-500/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(idx);
                  }}
                >
                  <X size={12} />
                </button>
              </div>
              {allowReorder && value.length > 1 && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-1.5 bg-gradient-to-t from-ink-950/90 to-transparent">
                  <button
                    type="button"
                    disabled={idx === 0}
                    className="px-2 py-1 rounded-md bg-ink-800/80 text-[11px] disabled:opacity-40 hover:bg-ink-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      move(idx, -1);
                    }}
                  >
                    ←
                  </button>
                  <span className="text-[10px] text-ink-300">#{idx + 1}</span>
                  <button
                    type="button"
                    disabled={idx === value.length - 1}
                    className="px-2 py-1 rounded-md bg-ink-800/80 text-[11px] disabled:opacity-40 hover:bg-ink-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      move(idx, +1);
                    }}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
