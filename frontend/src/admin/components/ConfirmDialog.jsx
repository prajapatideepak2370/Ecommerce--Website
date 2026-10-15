import { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "../../utils/cn.js";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = null,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  disabled = false,
  icon: Icon = AlertTriangle,
  children = null,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toneClass =
    tone === "danger"
      ? "bg-rose-500 hover:bg-rose-400"
      : tone === "warning"
        ? "bg-amber-500 hover:bg-amber-400"
        : "bg-brand-500 hover:bg-brand-400";
  const toneIcon =
    tone === "danger"
      ? "text-rose-300 bg-rose-500/10 border-rose-500/30"
      : tone === "warning"
        ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
        : "text-brand-300 bg-brand-500/10 border-brand-500/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative card w-full max-w-lg p-6 space-y-5 animate-[fadeIn_.15s_ease-out]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "h-11 w-11 rounded-xl grid place-items-center border shrink-0",
                toneIcon,
              )}
            >
              <Icon size={20} />
            </div>
            <div>
              <h3 className="font-display text-lg leading-tight">{title}</h3>
              {description && (
                <p className="text-sm text-ink-400 mt-1">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg grid place-items-center text-ink-300 hover:bg-ink-800/60"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        {children && <div className="space-y-3 text-sm">{children}</div>}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            className={cn("btn text-white", toneClass)}
            disabled={disabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
