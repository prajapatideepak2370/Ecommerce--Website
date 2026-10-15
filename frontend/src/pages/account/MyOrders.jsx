import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, AlertTriangle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { orderApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import {
  formatPrice,
  formatDate,
  timeAgo,
  orderStatusColor,
  formatOrderNumber,
} from "../../utils/format.js";

const STEPS = [
  { key: "Pending", color: "bg-sky-400" },
  { key: "Confirmed", color: "bg-indigo-400" },
  { key: "Processing", color: "bg-amber-300" },
  { key: "Shipped", color: "bg-violet-400" },
  { key: "Delivered", color: "bg-emerald-400" },
];

function Tracker({ status = "Processing" }) {
  const idx = STEPS.findIndex((s) => s.key === status);
  const terminated = status === "Cancelled" || status === "Refunded";
  return (
    <div className="flex items-start w-full overflow-x-auto no-scrollbar">
      {STEPS.map((s, i) => {
        const active = !terminated && i <= idx;
        const last = i === STEPS.length - 1;
        return (
          <div
            key={s.key}
            className="flex items-start min-w-[80px] flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center text-center flex-1">
              <div
                className={`h-7 w-7 rounded-full grid place-items-center text-xs font-semibold shrink-0 ${
                  active
                    ? `${s.color} text-ink-950`
                    : "bg-ink-800 text-ink-400"
                }`}
              >
                {active ? "✓" : i + 1}
              </div>
              <div
                className={`mt-2 text-[11px] ${
                  active ? "text-white" : "text-ink-400"
                }`}
              >
                {s.key}
              </div>
            </div>
            {!last && (
              <div
                className={`h-0.5 w-full my-3 -mx-1 ${
                  terminated
                    ? "bg-rose-500/30"
                    : i < idx
                      ? s.color
                      : "bg-ink-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    orderApi
      .mine()
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : data?.items || [];
        setOrders(list);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(getErrorMessage(e, "Could not load your orders."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h2 className="font-display text-2xl font-semibold">My Orders</h2>
        <button
          onClick={() => {
            setReloadKey((k) => k + 1);
            toast.success("Refreshed.");
          }}
          className="btn-ghost !py-1.5 text-xs"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading && (
        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="card p-6 h-40 animate-pulse bg-ink-800/30"
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="card p-4 border-amber-500/30 bg-amber-500/5 text-amber-300 text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 ? (
        <div className="card p-10 text-center text-ink-400 text-sm">
          <Package size={36} className="mx-auto mb-2 text-brand-300" />
          <div className="font-medium text-ink-200 mb-1">No orders yet</div>
          <Link to="/shop" className="text-brand-300 hover:underline">
            Start shopping →
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((o) => (
            <div key={o._id || o.orderNumber} className="card p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <div className="text-xs uppercase tracking-wider text-ink-400">
                    Order
                  </div>
                  <div className="font-mono font-semibold text-lg">
                    {formatOrderNumber(o)}
                  </div>
                  <div className="text-xs text-ink-400 mt-1">
                    Placed {formatDate(o.createdAt)} · {timeAgo(o.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-ink-400">
                    Total
                  </div>
                  <div className="font-semibold text-lg">
                    {formatPrice(o.totalAmount)}
                  </div>
                  <span
                    className={`chip !py-0.5 text-xs mt-1 inline-flex border ${orderStatusColor(
                      o.orderStatus,
                    )}`}
                  >
                    {o.orderStatus || "Pending"}
                  </span>
                </div>
              </div>
              <Tracker status={o.orderStatus || "Processing"} />
              {o.items?.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-3">
                  {o.items.slice(0, 3).map((it) => (
                    <li
                      key={it._id || `${it.product}-${it.name}`}
                      className="flex items-center gap-2 rounded-lg bg-ink-800/50 px-2.5 py-1.5 text-xs"
                    >
                      <div className="h-7 w-7 rounded overflow-hidden shrink-0 bg-ink-900 grid place-items-center">
                        {it.image ? (
                          <img src={it.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={12} className="text-ink-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate max-w-[160px]">{it.name}</div>
                        <div className="text-ink-400">Qty {it.quantity}</div>
                      </div>
                    </li>
                  ))}
                  {o.items.length > 3 && (
                    <li className="flex items-center px-2.5 text-xs text-ink-400">
                      +{o.items.length - 3} more
                    </li>
                  )}
                </ul>
              )}
              <div className="mt-5 flex items-center justify-end">
                <Link
                  to={`/account/orders/${o._id || o.orderNumber}`}
                  className="btn-ghost !py-1.5 text-sm"
                >
                  View details <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
