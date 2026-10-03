import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Clock,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Truck,
  ClipboardList,
  Mail,
  Phone,
  User as UserIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { orderApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import {
  formatPrice,
  formatDate,
  timeAgo,
  orderStatusColor,
  paymentStatusColor,
  formatOrderNumber,
} from "../../utils/format.js";

const STEPS = [
  { key: "Pending", icon: Clock, label: "Pending" },
  { key: "Confirmed", icon: CheckCircle2, label: "Confirmed" },
  { key: "Processing", icon: ClipboardList, label: "Processing" },
  { key: "Shipped", icon: Truck, label: "Shipped" },
  { key: "Delivered", icon: Package, label: "Delivered" },
];

function Tracker({ status = "Processing" }) {
  const idx = STEPS.findIndex((s) => s.key === status);
  const cancelled = status === "Cancelled" || status === "Refunded";
  return (
    <div className="flex items-start w-full overflow-x-auto no-scrollbar py-2">
      {STEPS.map((s, i) => {
        const active = !cancelled && i <= idx;
        const Icon = s.icon;
        const last = i === STEPS.length - 1;
        return (
          <div
            key={s.key}
            className="flex items-start min-w-[88px] flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center text-center flex-1">
              <div
                className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${
                  cancelled
                    ? "bg-rose-500/20 text-rose-300"
                    : active
                      ? "bg-brand-500/20 text-brand-200 ring-2 ring-brand-500/40"
                      : "bg-ink-800 text-ink-400"
                }`}
              >
                <Icon size={16} />
              </div>
              <div
                className={`mt-2 text-[11px] ${
                  cancelled
                    ? "text-rose-300"
                    : active
                      ? "text-white"
                      : "text-ink-400"
                }`}
              >
                {s.key}
              </div>
            </div>
            {!last && (
              <div
                className={`h-0.5 w-full my-[18px] -mx-1 ${
                  cancelled
                    ? "bg-rose-500/30"
                    : i < idx
                      ? "bg-brand-500"
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

function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-ink-800/60 last:border-0">
      <div className="text-xs uppercase tracking-[0.16em] text-ink-400 min-w-[112px] w-28 shrink-0 pt-1">
        {label}
      </div>
      <div className={`flex-1 text-sm min-w-0 break-words ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await orderApi.byId(id);
      setOrder(data);
    } catch (e) {
      setError(getErrorMessage(e, "Could not load this order."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canCancel =
    order && !["Shipped", "Delivered", "Cancelled", "Refunded"].includes(order.orderStatus);

  const handleCancel = async () => {
    if (!order || busy) return;
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    setBusy(true);
    try {
      const data = await orderApi.cancel(order._id);
      setOrder(data);
      toast.success("Order cancelled.");
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to cancel order."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-8 bg-ink-800/60 rounded-lg w-1/2" />
        <div className="h-24 bg-ink-800/40 rounded-xl" />
        <div className="h-64 bg-ink-800/40 rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4 text-center py-10">
        <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/15 text-rose-300 grid place-items-center">
          <AlertTriangle size={22} />
        </div>
        <div className="font-display text-lg">Order not available</div>
        <div className="text-sm text-ink-400">{error || "Something went wrong."}</div>
        <button onClick={() => navigate(-1)} className="btn-ghost">
          <ArrowLeft size={14} /> Back to orders
        </button>
      </div>
    );
  }

  const items = order.items || [];
  const address = order.shippingAddress || {};
  const payment = order.payment || {};
  const history = (order.statusHistory || []).slice().reverse();
  const orderStatus = order.orderStatus || "Pending";
  const paymentStatus = payment.status || "Pending";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-1 text-xs text-ink-400 hover:text-brand-300 mb-2"
          >
            <ArrowLeft size={14} /> All orders
          </Link>
          <h2 className="font-display text-2xl font-semibold flex items-center gap-2 flex-wrap">
            <span className="font-mono">{formatOrderNumber(order)}</span>
            <span
              className={`chip border !text-xs ${orderStatusColor(orderStatus)}`}
            >
              {orderStatus}
            </span>
          </h2>
          <div className="text-xs text-ink-400 mt-1 flex flex-wrap gap-3">
            <span>Placed {formatDate(order.createdAt)} · {timeAgo(order.createdAt)}</span>
            {order.updatedAt && order.updatedAt !== order.createdAt && (
              <span>Updated {formatDate(order.updatedAt)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={busy}
              className="btn-ghost text-rose-300 hover:bg-rose-500/10 border-rose-500/30"
            >
              <XCircle size={15} /> {busy ? "Cancelling…" : "Cancel order"}
            </button>
          )}
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-ink-400 mb-3">
          Order progress
        </div>
        <Tracker status={orderStatus} />
        {orderStatus === "Cancelled" && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm p-3">
            This order was cancelled.
          </div>
        )}
        {orderStatus === "Refunded" && (
          <div className="mt-4 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-200 text-sm p-3">
            A refund has been processed for this order.
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5 md:p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-400 mb-4">
              <Package size={14} /> Items ({items.length})
            </div>
            {items.length === 0 ? (
              <div className="text-sm text-ink-400 py-6 text-center">
                No items on this order.
              </div>
            ) : (
              <ul className="divide-y divide-ink-800/60">
                {items.map((it) => {
                  const lineTotal = (it.priceAtPurchase || 0) * (it.quantity || 0);
                  return (
                    <li
                      key={it._id || `${it.product}-${it.name}`}
                      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-ink-800 grid place-items-center">
                        {it.image ? (
                          <img
                            src={it.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={16} className="text-ink-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{it.name}</div>
                        <div className="text-xs text-ink-400 mt-0.5">
                          Qty {it.quantity} × {formatPrice(it.priceAtPurchase)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold">{formatPrice(lineTotal)}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {history.length > 0 && (
            <div className="card p-5 md:p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-400 mb-4">
                <Clock size={14} /> Status history
              </div>
              <ol className="relative border-l border-ink-800 ml-2 space-y-4">
                {history.map((h, i) => (
                  <li key={`${h.status}-${i}`} className="ml-5">
                    <span className="absolute -left-[7px] mt-1 h-3.5 w-3.5 rounded-full bg-brand-500 ring-4 ring-ink-950" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`chip border !text-[11px] !py-0 ${orderStatusColor(
                          h.status,
                        )}`}
                      >
                        {h.status}
                      </span>
                      <span className="text-xs text-ink-400">
                        {formatDate(h.timestamp)}
                      </span>
                    </div>
                    {h.note && (
                      <div className="text-xs text-ink-400 mt-1">{h.note}</div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5 md:p-6">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400 mb-2">
              Summary
            </div>
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            <Row label="Taxes" value={formatPrice(order.tax)} />
            <Row label="Shipping" value={formatPrice(order.shippingFee)} />
            <Row
              label="Total"
              value={
                <span className="font-display text-lg font-semibold">
                  {formatPrice(order.totalAmount)}
                </span>
              }
            />
          </div>

          <div className="card p-5 md:p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-400 mb-3">
              <MapPin size={14} /> Shipping address
            </div>
            <div className="text-sm space-y-0.5">
              <div className="font-medium">
                {address.fullName || <span className="text-ink-400">—</span>}
              </div>
              <div className="text-ink-300">{address.line1}</div>
              {address.line2 && <div className="text-ink-300">{address.line2}</div>}
              <div className="text-ink-300">
                {address.city}, {address.state} {address.postalCode}
              </div>
              <div className="text-ink-300">{address.country}</div>
              <div className="mt-2 pt-2 border-t border-ink-800/60 space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-ink-400">
                  <UserIcon size={12} /> {address.label || "Home"}
                </div>
                {address.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-ink-400">
                    <Phone size={12} /> {address.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card p-5 md:p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-400 mb-3">
              <CreditCard size={14} /> Payment
            </div>
            <Row label="Method" value={payment.provider || "—"} />
            <Row
              label="Status"
              value={
                <span
                  className={`chip border !text-[11px] !py-0 ${paymentStatusColor(
                    paymentStatus,
                  )}`}
                >
                  {paymentStatus}
                </span>
              }
            />
            {payment.reference && (
              <Row mono label="Reference" value={payment.reference} />
            )}
          </div>

          {order.user && (
            <div className="card p-5 md:p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-400 mb-3">
                <Mail size={14} /> Customer
              </div>
              <Row label="Name" value={order.user.name || "—"} />
              <Row label="Email" value={order.user.email || "—"} />
              {order.user.phone && <Row label="Phone" value={order.user.phone} />}
              {order.user.username && <Row mono label="Username" value={order.user.username} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
