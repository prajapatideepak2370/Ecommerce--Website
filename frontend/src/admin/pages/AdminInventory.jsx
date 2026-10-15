import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  ArrowUpRight,
  Edit3,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import {
  adminInventoryApi,
  adminProductsApi,
} from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import DataTable from "../components/DataTable.jsx";
import TableSkeleton from "../components/TableSkeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import toast from "react-hot-toast";
import { cn } from "../../utils/cn.js";
import { Link } from "react-router-dom";

function StockBadge({ availability, stock, threshold }) {
  const map = {
    "out-of-stock": "bg-rose-500/15 text-rose-300 border-rose-500/30",
    "low-stock": "bg-amber-500/15 text-amber-300 border-amber-500/30",
    "in-stock": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
  const highlight =
    availability === "out-of-stock" || availability === "low-stock";
  return (
    <div className="flex items-center gap-2">
      <span className={`chip border ${map[availability] || map["in-stock"]}`}>
        {availability === "out-of-stock"
          ? "Out of stock"
          : availability === "low-stock"
            ? "Low stock"
            : "In stock"}
      </span>
      {highlight && threshold && (
        <span className="text-[11px] text-ink-400">
          threshold ≤ {threshold}
        </span>
      )}
    </div>
  );
}

function RowEditor({ row, onCommit, onCancel }) {
  const [mode, setMode] = useState("absolute");
  const [value, setValue] = useState(String(row.stock));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const commit = async () => {
    setBusy(true);
    try {
      const payload = { reason: reason || undefined };
      if (mode === "absolute") {
        const v = Number(value);
        if (Number.isNaN(v) || v < 0)
          throw new Error("Stock value must be ≥ 0.");
        payload.stock = v;
      } else {
        const d = Number(value);
        if (Number.isNaN(d)) throw new Error("Delta must be a number.");
        payload.delta = d;
      }
      await adminInventoryApi.patchStock(row._id, payload);
      toast.success("Stock updated.");
      onCommit && onCommit();
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to update stock."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="bg-amber-500/5 border-y border-amber-500/30">
      <td colSpan={100} className="px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="input-label">Mode</label>
            <select
              className="input w-full"
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setValue(
                  e.target.value === "delta" ? "0" : String(row.stock),
                );
              }}
            >
              <option value="absolute">Set value</option>
              <option value="delta">Add / Subtract</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="input-label">
              {mode === "absolute" ? "New stock" : "Delta"}
            </label>
            <input
              className="input w-full"
              type="number"
              step="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode === "absolute" ? "0" : "-5 or +10"}
            />
          </div>
          <div className="md:col-span-6">
            <label className="input-label">
              Reason <span className="text-ink-500">(recommended)</span>
            </label>
            <input
              className="input w-full"
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Damaged returns processed, restock PO #2024-10, sample giveaways."
            />
          </div>
          <div className="md:col-span-2 flex items-end justify-end gap-2">
            <button
              className="btn-ghost"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={commit}
              disabled={busy}
            >
              {busy && <Loader2 size={14} className="animate-spin mr-2 inline" />}
              Save
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function HistoryPanel({ productId, productName, onClose }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await adminInventoryApi.history(productId, { page, limit: 20 });
        setList(data?.docs || []);
        setTotal(data?.pagination?.totalDocs || 0);
      } catch (e) {
        setErr(getErrorMessage(e, "Failed to load history."));
      } finally {
        setLoading(false);
      }
    })();
  }, [productId, page]);

  const iconForDelta = (before, after) => {
    const d = Number(after) - Number(before);
    if (d > 0) return <TrendingUp size={14} className="text-emerald-300" />;
    if (d < 0) return <TrendingDown size={14} className="text-rose-300" />;
    return <Minus size={14} className="text-ink-400" />;
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="ml-auto relative h-full w-full sm:w-[520px] card rounded-none sm:rounded-l-2xl overflow-y-auto border-l border-ink-800 bg-ink-950/95 p-6 space-y-5 animate-[slideInRight_.2s_ease-out]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-ink-400 flex items-center gap-1">
              <History size={12} /> Stock change history
            </div>
            <h3 className="font-display text-xl mt-1">
              {productName || "Product"}
            </h3>
          </div>
          <button
            className="h-9 w-9 rounded-lg grid place-items-center hover:bg-ink-800/70"
            onClick={onClose}
            aria-label="Close history"
          >
            <X size={16} />
          </button>
        </div>
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-ink-800/60 animate-pulse"
              />
            ))}
          </div>
        )}
        {!loading && err && (
          <div className="rounded-lg bg-rose-500/5 border border-rose-500/30 text-rose-200 text-sm p-3">
            {err}
          </div>
        )}
        {!loading && !err && list.length === 0 && (
          <EmptyState
            icon={History}
            title="No stock changes logged."
            description="Adjustments made with a reason are tracked here."
          />
        )}
        {!loading && !err && list.length > 0 && (
          <div className="space-y-3">
            {list.map((entry, i) => {
              const md = entry.metadata || {};
              const before = md.beforeStock ?? "—";
              const after = md.afterStock ?? "—";
              const delta = md.delta;
              const d = new Date(entry.createdAt);
              return (
                <article
                  key={entry._id || i}
                  className="rounded-xl border border-ink-800 bg-ink-900/40 p-4 space-y-2"
                >
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-ink-300">
                      <div className="h-8 w-8 rounded-lg bg-brand-500/10 grid place-items-center border border-brand-500/20 text-brand-300">
                        {iconForDelta(before, after)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {entry.adminId?.name || entry.adminId?.username || "System"}
                        </div>
                        <div className="text-[11px] text-ink-400">
                          {d.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {delta !== undefined && delta !== null ? (
                      <span
                        className={cn(
                          "chip",
                          Number(delta) >= 0
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-rose-500/10 text-rose-300",
                        )}
                      >
                        {Number(delta) >= 0 ? `+${delta}` : delta}
                      </span>
                    ) : null}
                  </header>
                  <div className="flex items-center gap-2 text-sm text-ink-200">
                    <span className="chip bg-ink-800/60 border border-ink-700">
                      {before} → {after}
                    </span>
                  </div>
                  {entry.reason && (
                    <p className="text-xs text-ink-300 bg-ink-800/40 rounded-lg p-2.5 border border-ink-700/60">
                      “{entry.reason}”
                    </p>
                  )}
                </article>
              );
            })}
            {total > 20 && (
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-ink-400">{total} entries</div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="btn-ghost"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-ink-400">Page {page}</span>
                  <button
                    disabled={page * 20 >= total}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-ghost"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

export default function AdminInventory() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({});
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState("all");
  const [sortKey, setSortKey] = useState("stock");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await adminInventoryApi.list({
        page,
        limit: 25,
        search: search || undefined,
        stockLevel: highlight !== "all" ? highlight : undefined,
        sort: sortKey,
        dir: sortDir,
      });
      setRows(res?.docs || []);
      setPagination(res?.pagination || {});
    } catch (e) {
      setErr(getErrorMessage(e, "Failed to load inventory."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, highlight, sortKey, sortDir]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const columns = useMemo(
    () => [
      {
        label: "Product",
        accessor: "name",
        cell: (row) => (
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-lg overflow-hidden bg-ink-800 grid place-items-center shrink-0">
              {row.images?.[0]?.url ? (
                <img
                  src={row.images[0].url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <AlertTriangle size={16} className="text-ink-500" />
              )}
            </div>
            <div className="min-w-0">
              <Link
                to={`/products/${row._id}`}
                className="font-medium hover:text-brand-300 block truncate"
              >
                {row.name}
              </Link>
              <div className="text-xs text-ink-400 truncate">
                SKU {row.sku}
              </div>
            </div>
          </div>
        ),
      },
      {
        label: "Stock",
        accessor: "stock",
        sortKey: "stock",
        width: "160px",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-display text-lg",
                row.availability === "out-of-stock"
                  ? "text-rose-300"
                  : row.availability === "low-stock"
                    ? "text-amber-300"
                    : "text-emerald-300",
              )}
            >
              {row.stock}
            </span>
          </div>
        ),
      },
      {
        label: "Status",
        accessor: "availability",
        width: "210px",
        cell: (row) => (
          <StockBadge
            availability={row.availability}
            stock={row.stock}
            threshold={row.lowStockThreshold ?? 5}
          />
        ),
      },
      {
        label: "Updated",
        accessor: "updatedAt",
        sortKey: "updatedAt",
        width: "160px",
        cell: (row) => (
          <span className="text-xs text-ink-400">
            {new Date(row.updatedAt).toLocaleString()}
          </span>
        ),
      },
      {
        label: "",
        align: "right",
        width: "150px",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              className="btn-ghost gap-1"
              onClick={() =>
                setHistoryFor({ _id: row._id, name: row.name })
              }
              title="Stock change history"
            >
              <History size={14} /> Log
            </button>
            <button
              className={cn(
                "btn-ghost gap-1",
                editingId === row._id &&
                  "bg-brand-500/10 text-brand-300 border-brand-500/30",
              )}
              onClick={() =>
                setEditingId((v) => (v === row._id ? null : row._id))
              }
            >
              <Edit3 size={14} /> Edit
            </button>
          </div>
        ),
      },
    ],
    [editingId],
  );

  const renderRows = rows.map((row) => {
    if (editingId === row._id) {
      return [
        <DataTable
          key={`wrapper-${row._id}`}
          columns={columns}
          rows={[row]}
          rowKey="_id"
          compact
        />,
        <RowEditor
          key={`editor-${row._id}`}
          row={row}
          onCommit={() => {
            setEditingId(null);
            fetchInventory();
          }}
          onCancel={() => setEditingId(null)}
        />,
      ];
    }
    return null;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Inventory</h1>
          <p className="text-sm text-ink-400 mt-1">
            Adjust stock and review change history with audit trail.
          </p>
        </div>
        <Link to="/products" className="btn-ghost">
          Open catalog <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, SKU, brand…"
            className="input w-full pl-9"
          />
        </div>
        <div className="md:col-span-3">
          <select
            className="input w-full"
            value={highlight}
            onChange={(e) => {
              setHighlight(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All stock levels</option>
            <option value="out">🟥 Out of stock</option>
            <option value="low">🟨 Low stock</option>
            <option value="ok">🟩 In stock</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              className="input"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
            >
              <option value="stock">Stock</option>
              <option value="name">Name</option>
              <option value="updatedAt">Updated</option>
            </select>
            <select
              className="input"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value)}
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
      </div>

      {err && (
        <div className="card p-4 border-rose-500/30 bg-rose-500/5 text-rose-300 text-sm">
          {err}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={12} cols={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No inventory matches."
          description="Adjust filters or create your first product."
          action={
            <Link to="/products/new" className="btn btn-primary">
              + New Product
            </Link>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey="_id"
            selectable={false}
            compact
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(key, dir) => {
              setSortKey(key);
              setSortDir(dir);
            }}
          />
          {editingId && (
            <div className="card overflow-hidden p-0">
              {rows
                .filter((r) => r._id === editingId)
                .map((row) => (
                  <RowEditor
                    key={row._id}
                    row={row}
                    onCommit={() => {
                      setEditingId(null);
                      fetchInventory();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ))}
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <div className="text-ink-400">
              Page {page} of {pagination.totalPages || 1} (
              {pagination.totalDocs || 0} items)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-ghost"
              >
                Prev
              </button>
              <button
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost"
              >
                Next <ChevronRight size={14} className="inline" />
              </button>
            </div>
          </div>
        </>
      )}

      {historyFor && (
        <HistoryPanel
          productId={historyFor._id}
          productName={historyFor.name}
          onClose={() => setHistoryFor(null)}
        />
      )}
    </div>
  );
}
