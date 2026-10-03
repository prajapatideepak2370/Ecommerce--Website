import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AdminOrderDetails from "./AdminOrderDetails.jsx";
import {
  Search,
  RefreshCw,
  Filter,
  ShoppingBag,
  CreditCard,
  DollarSign,
  Package,
  ChevronDown,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminOrdersApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import DataTable from "../components/DataTable.jsx";
import StatCard from "../components/StatCard.jsx";
import TableSkeleton from "../components/TableSkeleton.jsx";
import {
  formatPrice,
  formatDate,
  timeAgo,
  orderStatusColor,
  paymentStatusColor,
  formatOrderNumber,
} from "../../utils/format.js";

const ORDER_STATUS_OPTIONS = [
  "",
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded",
];

const PAYMENT_STATUS_OPTIONS = ["", "Pending", "Paid", "Failed", "Refunded"];

function ChipSelect({ label, value, onChange, options, className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost !py-2 text-xs flex items-center gap-2 min-w-[150px] justify-between"
      >
        <span className="truncate">
          <span className="text-ink-400 mr-1">{label}:</span>
          {value || "All"}
        </span>
        {value ? (
          <X
            size={12}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          />
        ) : (
          <ChevronDown size={14} />
        )}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 z-40 mt-1 w-52 card !p-1.5 shadow-xl max-h-80 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt || "__all"}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                  (opt || "") === (value || "")
                    ? "bg-brand-500/20 text-brand-200"
                    : "hover:bg-ink-800/60"
                }`}
              >
                {opt || "All"}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AdminOrdersList({ onOpenOrder, selectedId, setSelectedId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 280);
    return () => clearTimeout(id);
  }, [search]);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await adminOrdersApi.list({
        page,
        limit,
        search: debouncedSearch,
        status,
        payment,
        sort,
      });
      setOrders(data.items || []);
      setTotal(data.total || 0);
      setSummary(data.summary || null);
    } catch (e) {
      setErr(getErrorMessage(e, "Could not load orders."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, status, payment, sort]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const columns = useMemo(
    () => [
      {
        id: "order",
        label: "Order",
        sortKey: "newest",
        cell: (row) => (
          <button
            onClick={() => onOpenOrder?.(row._id)}
            className="text-left"
          >
            <div className="font-mono font-semibold text-brand-200 hover:text-brand-300">
              {formatOrderNumber(row)}
            </div>
            <div className="text-[11px] text-ink-400 mt-0.5">
              {formatDate(row.createdAt)}
            </div>
          </button>
        ),
      },
      {
        id: "customer",
        label: "Customer",
        cell: (row) => (
          <div className="min-w-0">
            <div className="font-medium truncate max-w-[220px]">
              {row.user?.name ||
                row.shippingAddress?.fullName ||
                "—"}
            </div>
            <div className="text-[11px] text-ink-400 truncate max-w-[220px]">
              {row.user?.email || row.shippingAddress?.phone || "—"}
            </div>
          </div>
        ),
      },
      {
        id: "items",
        label: "Items",
        width: "96px",
        cell: (row) => {
          const qty = (row.items || []).reduce(
            (sum, it) => sum + Number(it.quantity || 0),
            0,
          );
          return (
            <div className="flex items-center gap-1.5 text-xs text-ink-300">
              <Package size={13} className="text-ink-400" />
              {(row.items || []).length} SKU · {qty} qty
            </div>
          );
        },
      },
      {
        id: "total",
        label: "Total",
        align: "right",
        sortKey: "total-desc",
        width: "120px",
        cell: (row) => (
          <div className="font-display font-semibold text-right">
            {formatPrice(row.totalAmount)}
          </div>
        ),
      },
      {
        id: "payment",
        label: "Payment",
        width: "130px",
        cell: (row) => (
          <div className="space-y-1">
            <span
              className={`chip border !text-[11px] !py-0 ${paymentStatusColor(
                row.payment?.status,
              )}`}
            >
              {row.payment?.status || "Pending"}
            </span>
            <div className="text-[11px] text-ink-400">
              {row.payment?.provider || "—"}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        label: "Status",
        width: "140px",
        cell: (row) => (
          <span
            className={`chip border !text-[11px] !py-0.5 ${orderStatusColor(
              row.orderStatus,
            )}`}
          >
            {row.orderStatus || "Pending"}
          </span>
        ),
      },
      {
        id: "placed",
        label: "Placed",
        width: "110px",
        cell: (row) => (
          <div className="text-xs">
            <div className="text-ink-300">{timeAgo(row.createdAt)}</div>
          </div>
        ),
      },
      {
        id: "action",
        label: "",
        align: "right",
        width: "88px",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onOpenOrder?.(row._id)}
              className="btn-ghost !py-1.5 !px-2.5 text-xs"
              title="View details"
            >
              <Eye size={14} />
            </button>
          </div>
        ),
      },
    ],
    [onOpenOrder],
  );

  const stats = summary || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="font-display text-3xl">Orders</div>
          <p className="text-sm text-ink-400 mt-1">
            Review, update, and manage every customer order.
          </p>
        </div>
        <button
          onClick={() => {
            setPage(1);
            load();
            toast.success("Refreshed.");
          }}
          className="btn-ghost self-start"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {summary && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Orders"
            value={stats.totalOrders || 0}
            icon={ShoppingBag}
            tone="ink"
          />
          <StatCard
            label="Revenue"
            value={formatPrice(stats.totalRevenue).replace(/\.00$/, "")}
            icon={DollarSign}
            tone="success"
          />
          <StatCard
            label="Paid"
            value={stats.paymentCounts?.Paid || 0}
            icon={CreditCard}
            tone="default"
          />
          <StatCard
            label="Pending Action"
            value={
              (stats.statusCounts?.Pending || 0) +
              (stats.statusCounts?.Processing || 0)
            }
            icon={Package}
            tone="warning"
          />
        </div>
      )}

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900/50 px-3 py-2 flex-1 min-w-[220px]">
          <Search size={14} className="text-ink-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search order #, customer, items, address…"
            className="bg-transparent outline-none text-sm w-full placeholder:text-ink-500"
          />
        </div>
        <ChipSelect
          label="Order status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={ORDER_STATUS_OPTIONS}
        />
        <ChipSelect
          label="Payment"
          value={payment}
          onChange={(v) => {
            setPayment(v);
            setPage(1);
          }}
          options={PAYMENT_STATUS_OPTIONS}
        />
        <div className="relative">
          <button
            onClick={() =>
              setSort((s) =>
                s === "newest" ? "oldest" : s === "oldest" ? "total-desc" : "newest",
              )
            }
            className="btn-ghost !py-2 text-xs flex items-center gap-1.5"
          >
            <ArrowUpDown size={13} />
            Sort:{" "}
            {sort === "newest"
              ? "Newest"
              : sort === "oldest"
                ? "Oldest"
                : sort === "total-desc"
                  ? "Highest total"
                  : "Lowest total"}
          </button>
        </div>
        {(search || status || payment) && (
          <button
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
              setStatus("");
              setPayment("");
              setPage(1);
            }}
            className="text-xs text-brand-300 hover:underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading && !orders.length && <TableSkeleton rows={10} cols={7} />}

      {err && !loading && (
        <div className="card p-4 border-amber-500/30 bg-amber-500/5 text-amber-300 text-sm">
          {err}
        </div>
      )}

      {!loading && (
        <>
          <DataTable
            columns={columns}
            rows={orders}
            rowKey="_id"
            empty={
              <div className="text-center py-10">
                <Package
                  size={32}
                  className="mx-auto mb-2 text-ink-500"
                />
                <div className="text-sm text-ink-400">
                  No orders match these filters.
                </div>
              </div>
            }
            sortKey={
              sort === "newest"
                ? "newest"
                : sort === "oldest"
                  ? "oldest"
                  : sort === "total-desc" || sort === "total-asc"
                    ? "total-desc"
                    : "status"
            }
            sortDir={sort.endsWith("asc") ? "asc" : "desc"}
            onSort={(key) => {
              if (key === "newest" || key === "oldest") {
                setSort(key);
              } else if (key === "total-desc") {
                setSort(sort === "total-desc" ? "total-asc" : "total-desc");
              }
            }}
          />
          {total > 0 && (
            <div className="flex items-center justify-between text-xs text-ink-400 card !py-3 !px-4 flex-wrap gap-2">
              <div>
                Showing {(page - 1) * limit + 1}–
                {Math.min(page * limit, total)} of {total}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-ghost !py-1.5 !px-2 text-xs disabled:opacity-40"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <div className="px-2">
                  Page {page} of {totalPages}
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-ghost !py-1.5 !px-2 text-xs disabled:opacity-40"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminOrders() {
  const { orderId: paramId } = useParams() || {};
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(paramId || null);

  useEffect(() => {
    setSelectedId(paramId || null);
  }, [paramId]);

  const openOrder = (id) => {
    setSelectedId(id);
    navigate(`/orders/${id}`, { replace: false });
  };
  const closeOrder = () => {
    setSelectedId(null);
    navigate("/orders", { replace: true });
  };

  const isSplitView = typeof window !== "undefined" && window.innerWidth >= 1280;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)] gap-6">
        {!selectedId || isSplitView ? (
          <AdminOrdersList
            onOpenOrder={openOrder}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        ) : null}

        {selectedId && !isSplitView && (
          <div className="space-y-4">
            <button
              onClick={closeOrder}
              className="btn-ghost !py-1.5 text-xs self-start"
            >
              <ChevronLeft size={14} /> Back to all orders
            </button>
            <div className="card">
              <AdminOrderDetails
                orderId={selectedId}
                onClose={closeOrder}
                onUpdated={() => {}}
              />
            </div>
          </div>
        )}
      </div>

      {selectedId && isSplitView && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeOrder}
          aria-hidden
        />
      )}
      {selectedId && isSplitView && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[620px] xl:max-w-[860px] bg-ink-950 border-l border-ink-800 shadow-2xl overflow-y-auto">
          <div className="p-6 xl:p-8 min-h-screen">
            <AdminOrderDetails
              orderId={selectedId}
              onClose={closeOrder}
              onUpdated={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
