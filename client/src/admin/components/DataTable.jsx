import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn.js";

export default function DataTable({
  columns,
  rows = [],
  rowKey = "_id",
  selectable = false,
  selected = new Set(),
  onSelectChange = () => {},
  empty = null,
  sortKey = null,
  sortDir = "asc",
  onSort = null,
  compact = false,
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r[rowKey]));
  const someSelected = rows.some((r) => selected.has(r[rowKey]));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) rows.forEach((r) => next.delete(r[rowKey]));
    else rows.forEach((r) => next.add(r[rowKey]));
    onSelectChange(next);
  };

  const toggleOne = (key) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectChange(next);
  };

  const cols = useMemo(
    () =>
      columns.map((c) => ({
        ...c,
        width: c.width || "auto",
        align: c.align || "left",
      })),
    [columns],
  );

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-ink-900/70 border-b border-ink-800 text-left text-[11px] uppercase tracking-[0.16em] text-ink-400">
              {selectable && (
                <th className={cn(compact ? "px-3 py-2.5" : "px-4 py-3", "w-10")}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-ink-700 bg-ink-900"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allSelected && someSelected;
                    }}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {cols.map((col) => {
                const sortable = !!col.sortKey || !!col.accessor;
                const effectiveKey = col.sortKey || col.accessor || null;
                const isActive = sortKey && sortKey === effectiveKey;
                const canSort = sortable && typeof onSort === "function";
                const ClickWrap = ({ children }) =>
                  canSort ? (
                    <button
                      className="flex items-center gap-1 hover:text-ink-200 transition-colors"
                      onClick={() => {
                        let dir = "asc";
                        if (isActive) dir = sortDir === "asc" ? "desc" : "asc";
                        onSort(effectiveKey, dir);
                      }}
                    >
                      {children}
                      {isActive ? (
                        sortDir === "asc" ? (
                          <ChevronUp size={14} className="text-brand-300" />
                        ) : (
                          <ChevronDown size={14} className="text-brand-300" />
                        )
                      ) : sortable ? (
                        <ArrowUpDown size={14} className="text-ink-500" />
                      ) : null}
                    </button>
                  ) : (
                    <span>{children}</span>
                  );
                return (
                  <th
                    key={col.accessor || col.id}
                    style={col.width !== "auto" ? { width: col.width } : undefined}
                    className={cn(
                      compact ? "px-3 py-2.5" : "px-4 py-3",
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                      "whitespace-nowrap",
                    )}
                  >
                    <ClickWrap>{col.label}</ClickWrap>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={cols.length + (selectable ? 1 : 0)}
                  className="px-4 py-10"
                >
                  {empty || (
                    <div className="text-center text-ink-400 text-sm">
                      No data to display.
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const k = row[rowKey];
                const isSel = selected.has(k);
                return (
                  <tr
                    key={k}
                    className={cn(
                      "border-b border-ink-800/70 last:border-0 hover:bg-ink-800/30 transition-colors",
                      isSel ? "bg-brand-500/5" : "",
                    )}
                  >
                    {selectable && (
                      <td className={cn(compact ? "px-3 py-2.5" : "px-4 py-3", "align-top w-10")}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-ink-700 bg-ink-900"
                          checked={isSel}
                          onChange={() => toggleOne(k)}
                        />
                      </td>
                    )}
                    {cols.map((col) => {
                      const Cell = col.cell;
                      const val =
                        Cell !== undefined
                          ? Cell(row, { selected: isSel, toggle: () => toggleOne(k) })
                          : col.accessor
                            ? row[col.accessor]
                            : null;
                      return (
                        <td
                          key={col.accessor || col.id}
                          className={cn(
                            compact ? "px-3 py-2.5" : "px-4 py-3",
                            col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                            "align-top text-sm",
                          )}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
