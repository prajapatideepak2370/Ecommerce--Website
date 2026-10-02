import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  Power,
  Play,
  Pause,
  Edit3,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Boxes,
} from "lucide-react";
import {
  adminProductsApi,
  adminCategoriesApi,
} from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import DataTable from "../components/DataTable.jsx";
import TableSkeleton from "../components/TableSkeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import AdminDeleteProductModal from "./AdminDeleteProductModal.jsx";
import toast from "react-hot-toast";
import { cn } from "../../utils/cn.js";

function StockBadge({ availability, stock }) {
  const map = {
    "out-of-stock": "bg-rose-500/15 text-rose-300 border-rose-500/30",
    "low-stock": "bg-amber-500/15 text-amber-300 border-amber-500/30",
    "in-stock": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
  return (
    <span className={`chip border ${map[availability] || map["in-stock"]}`}>
      {stock} ·{" "}
      {String(availability || "in-stock")
        .split("-")
        .map((s) => s[0]?.toUpperCase() + s.slice(1))
        .join(" ")}
    </span>
  );
}

function StatusToggle({ isActive, deletedAt, onChange, disabled }) {
  const state =
    deletedAt ? "deleted" : isActive ? "active" : "inactive";
  const chipClass =
    state === "active"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : state === "inactive"
        ? "bg-ink-700/60 text-ink-200 border-ink-600/70"
        : "bg-rose-500/15 text-rose-300 border-rose-500/30";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!isActive)}
      className={cn("chip border", chipClass)}
    >
      {state === "deleted" ? "🗑 Deleted" : isActive ? "● Active" : "○ Inactive"}
    </button>
  );
}

const DEFAULT_LIMIT = 25;

export default function AdminProductsList() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(Number(params.get("page") || 1));
  const [search, setSearch] = useState(params.get("search") || "");
  const [status, setStatus] = useState(params.get("status") || "all");
  const [category, setCategory] = useState(params.get("category") || "");
  const [stockLevel, setStockLevel] = useState(params.get("stockLevel") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState(params.get("sort") || "createdAt");
  const [sortDir, setSortDir] = useState(params.get("dir") || "desc");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({});
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [err, setErr] = useState("");

  const [bulkConfirm, setBulkConfirm] = useState({
    open: false,
    action: null,
  });
  const [deleteForId, setDeleteForId] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await adminCategoriesApi.list({
        limit: 200,
        includeInactive: true,
      });
      setCategories(data?.docs || []);
    } catch (_e) {
      setCategories([]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const qp = {
        page,
        limit: DEFAULT_LIMIT,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
        category: category || undefined,
        stockLevel: stockLevel || undefined,
        sort: sortKey,
        dir: sortDir,
        includeDeleted: true,
      };
      const res = await adminProductsApi.list(qp);
      setRows(res?.docs || []);
      setPagination(res?.pagination || {});
    } catch (e) {
      setErr(getErrorMessage(e, "Failed to load products."));
      setRows([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  }, [page, search, status, category, stockLevel, sortKey, sortDir]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParams = () => {
    const next = new URLSearchParams();
    if (page > 1) next.set("page", String(page));
    if (search) next.set("search", search);
    if (status && status !== "all") next.set("status", status);
    if (category) next.set("category", category);
    if (stockLevel) next.set("stockLevel", stockLevel);
    if (sortKey) next.set("sort", sortKey);
    if (sortDir) next.set("dir", sortDir);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    updateParams();
  }, [page, search, status, category, stockLevel, sortKey, sortDir]);

  const applyFilters = () => {
    setPage(1);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setCategory("");
    setStockLevel("");
    setSortKey("createdAt");
    setSortDir("desc");
    setPage(1);
  };

  const toggleStatus = async (row, nextActive) => {
    try {
      await adminProductsApi.patchStatus(row._id, nextActive);
      toast.success(nextActive ? "Product activated." : "Product deactivated.");
      fetchProducts();
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to update status."));
    }
  };

  const onBulk = async () => {
    const ids = Array.from(selected);
    if (!ids.length || !bulkConfirm.action) return;
    try {
      const action = bulkConfirm.action;
      await adminProductsApi.bulk({
        ids,
        action,
        payload: action === "stockAdd" ? { delta: 25 } : undefined,
      });
      toast.success(`Bulk ${action} applied to ${ids.length} items.`);
      setSelected(new Set());
      setBulkConfirm({ open: false, action: null });
      fetchProducts();
    } catch (e) {
      toast.error(getErrorMessage(e, "Bulk operation failed."));
    }
  };

  const columns = useMemo(
    () => [
      {
        label: "Product",
        accessor: "name",
        cell: (row) => (
          <div className="flex items-center gap-3 min-w-0 max-w-md">
            <div className="h-11 w-11 rounded-lg overflow-hidden bg-ink-800 grid place-items-center shrink-0">
              {row.images?.[0]?.url ? (
                <img
                  src={row.images[0].url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Boxes size={16} className="text-ink-500" />
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
        label: "Category",
        accessor: "category.name",
        sortKey: "category",
        width: "160px",
        cell: (row) => (
          <span className="chip bg-ink-800/50 border border-ink-700">
            {row.category?.name || "—"}
          </span>
        ),
      },
      {
        label: "Price",
        accessor: "price",
        sortKey: "price",
        width: "120px",
        align: "right",
        cell: (row) => {
          const p = Number(row.discountPrice || row.price);
          return (
            <div className="flex flex-col items-end">
              <span className="font-medium">
                {p.toLocaleString(undefined, {
                  style: "currency",
                  currency: "INR",
                })}
              </span>
              {row.discountPrice && (
                <span className="text-xs text-ink-500 line-through">
                  {Number(row.price).toLocaleString(undefined, {
                    style: "currency",
                    currency: "INR",
                  })}
                </span>
              )}
            </div>
          );
        },
      },
      {
        label: "Stock",
        accessor: "stock",
        sortKey: "stock",
        width: "160px",
        cell: (row) => (
          <StockBadge availability={row.availability} stock={row.stock} />
        ),
      },
      {
        label: "Status",
        accessor: "isActive",
        sortKey: "isActive",
        width: "130px",
        cell: (row) => (
          <StatusToggle
            isActive={row.isActive}
            deletedAt={row.deletedAt}
            onChange={(nextActive) => toggleStatus(row, nextActive)}
          />
        ),
      },
      {
        label: "",
        width: "90px",
        align: "right",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`/products/${row._id}`}
              className="h-8 w-8 rounded-md grid place-items-center text-ink-300 hover:bg-brand-500/10 hover:text-brand-300"
              aria-label="Edit"
            >
              <Edit3 size={14} />
            </Link>
            <button
              onClick={() => setDeleteForId(row)}
              className="h-8 w-8 rounded-md grid place-items-center text-ink-300 hover:bg-rose-500/10 hover:text-rose-300"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    [rows],
  );

  const totalPages = Math.max(1, pagination?.totalPages || 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Products</h1>
          <p className="text-sm text-ink-400 mt-1">
            {pagination.totalDocs ?? 0} total products
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "btn-ghost gap-2",
              showFilters && "bg-ink-800/80",
            )}
          >
            <Filter size={14} /> Filters
          </button>
          <Link to="/products/new" className="btn btn-primary gap-2">
            <Plus size={14} /> New Product
          </Link>
        </div>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, brand, slug…"
              className="input w-full pl-9"
            />
          </div>
          {!showFilters && (
            <select
              className="input md:w-52"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="deleted">Deleted</option>
            </select>
          )}
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-t border-ink-800 pt-4">
            <div>
              <label className="input-label">Status</label>
              <select
                className="input w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
            <div>
              <label className="input-label">Category</label>
              <select
                className="input w-full"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Stock Level</label>
              <select
                className="input w-full"
                value={stockLevel}
                onChange={(e) => setStockLevel(e.target.value)}
              >
                <option value="">Any</option>
                <option value="out">Out of stock</option>
                <option value="low">Low stock</option>
                <option value="ok">In stock</option>
              </select>
            </div>
            <div>
              <label className="input-label">Sort</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="input"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                >
                  <option value="createdAt">Created</option>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="stock">Stock</option>
                  <option value="updatedAt">Updated</option>
                </select>
                <select
                  className="input"
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value)}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-4 flex items-center justify-end gap-2">
              <button className="btn-ghost" onClick={resetFilters}>
                Reset
              </button>
              <button className="btn btn-primary" onClick={applyFilters}>
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <div className="card p-4 flex items-center justify-between flex-wrap gap-3 border-brand-500/40 bg-brand-500/5">
          <div className="text-sm">
            <span className="chip bg-brand-500/20 text-brand-200 border-brand-500/40 mr-2">
              {selected.size} selected
            </span>
            Bulk actions apply to selected items.
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost gap-2"
              onClick={() => setBulkConfirm({ open: true, action: "activate" })}
            >
              <Play size={14} /> Activate
            </button>
            <button
              className="btn-ghost gap-2"
              onClick={() =>
                setBulkConfirm({ open: true, action: "deactivate" })
              }
            >
              <Pause size={14} /> Deactivate
            </button>
            <button
              className="btn-ghost gap-2"
              onClick={() =>
                setBulkConfirm({ open: true, action: "softDelete" })
              }
            >
              <Power size={14} /> Soft Delete
            </button>
            <button
              className="btn-ghost gap-2 text-rose-300 hover:text-rose-200"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {err && (
        <div className="card p-4 border-rose-500/30 bg-rose-500/5 text-rose-300 text-sm">
          {err}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={10} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No products match your filters."
          description="Try clearing filters or add a new product to begin."
          action={
            <div className="flex gap-2 justify-center">
              <button className="btn-ghost" onClick={resetFilters}>
                Clear filters
              </button>
              <Link to="/products/new" className="btn btn-primary">
                + New Product
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey="_id"
            selectable
            selected={selected}
            onSelectChange={setSelected}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(key, dir) => {
              setSortKey(key);
              setSortDir(dir);
            }}
          />
          <div className="flex items-center justify-between text-sm">
            <div className="text-ink-400">
              Showing {pagination.pagingCounter ?? 1}–
              {(pagination.page || 1) * (pagination.limit || DEFAULT_LIMIT)} of{" "}
              {pagination.totalDocs ?? 0}
            </div>
            <div className="flex items-center gap-1">
              <button
                className="h-9 w-9 rounded-md grid place-items-center hover:bg-ink-800 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 text-ink-300">
                {page} / {totalPages}
              </span>
              <button
                className="h-9 w-9 rounded-md grid place-items-center hover:bg-ink-800 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={bulkConfirm.open}
        onClose={() => setBulkConfirm({ open: false, action: null })}
        onConfirm={onBulk}
        title={`Bulk ${bulkConfirm.action ?? ""}`}
        description={`Apply bulk ${bulkConfirm.action} to ${selected.size} selected items?`}
        confirmLabel={
          bulkConfirm.action === "softDelete"
            ? "Soft Delete"
            : bulkConfirm.action === "deactivate"
              ? "Deactivate"
              : "Activate"
        }
      />
      {deleteForId && (
        <AdminDeleteProductModal
          product={{
            _id: deleteForId._id,
            name: deleteForId.name,
            sku: deleteForId.sku,
          }}
          open
          onClose={() => setDeleteForId(null)}
          onSuccess={() => {
            setDeleteForId(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}
