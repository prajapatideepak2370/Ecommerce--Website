import { TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "../../utils/cn.js";

export default function StatCard({
  label,
  value,
  hint = null,
  icon: Icon = TrendingUp,
  tone = "default",
  delta = null,
}) {
  const tones = {
    default: "text-brand-300 bg-brand-500/10 border-brand-500/20",
    success: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    warning: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    danger: "text-rose-300 bg-rose-500/10 border-rose-500/20",
    ink: "text-ink-200 bg-ink-800/70 border-ink-700",
  };
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-xl grid place-items-center border",
            tones[tone] || tones.default,
          )}
        >
          <Icon size={18} />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
            {label}
          </div>
          <div className="font-display text-2xl leading-none mt-1">{value}</div>
        </div>
      </div>
      {(hint || delta !== null) && (
        <div className="flex items-center gap-2 text-xs text-ink-400">
          {delta !== null && (
            <span
              className={cn(
                "chip",
                delta >= 0 ? "text-emerald-300" : "text-rose-300",
              )}
            >
              {delta >= 0 ? `+${delta}` : delta}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  );
}
