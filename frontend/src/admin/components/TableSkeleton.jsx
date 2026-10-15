import { cn } from "../../utils/cn.js";

export default function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-800 px-4 py-3 space-y-2">
        <div className="h-4 w-40 rounded bg-ink-800 animate-pulse" />
        <div className="h-3 w-64 rounded bg-ink-800/70 animate-pulse" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-ink-800 bg-ink-900/50">
            {Array.from({ length: cols }).map((_, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-xs uppercase tracking-wider text-ink-400"
              >
                <div className="h-3 w-[70%] rounded bg-ink-800 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-ink-800/60 last:border-0">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <div
                    className={cn(
                      "h-4 rounded bg-ink-800 animate-pulse",
                      c === 0 ? "w-40" : c === 1 ? "w-48" : "w-[70%]",
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
