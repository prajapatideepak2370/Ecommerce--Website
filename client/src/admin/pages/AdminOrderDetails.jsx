import { useEffect, useState } from "react";
import {
  X,
  Package,
  MapPin,
  CreditCard,
  Clock,
  AlertTriangle,
  Save,
  RefreshCw,
  Mail,
  Phone,
  User as UserIcon,
  ChevronDown,
  Undo2,
  ClipboardList,
  Truck,
  CheckCircle2,
  XCircle,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminOrdersApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import {
  formatPrice,
  formatDate,
  timeAgo,
  orderStatusColor,
  paymentStatusColor,
  formatOrderNumber,
} from "../../utils/format.js";

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded",
];

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"];
const PAYMENT_PROVIDERS = ["COD", "UPI", "Razorpay", "Card", "Bank Transfer"];

function Section({ title, icon: Icon, children, right }) {
  return (
    <section className="card p-5 md:p-6 space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-400">
          {Icon && <Icon size={14} />}
          <span>{title}</span>
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3 py-2 border-b border-ink-800/60 last:border-0">
      <div className="min-w-0 text-xs uppercase tracking-[0.16em] text-ink-400 pt-1">
        {label}
      </div>
      <div className={`min-w-0 text-right text-sm [overflow-wrap:anywhere] ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options, disabled = false }) {
  return (
    <label className="block text-xs text-ink-300">
      {label}
      <div className="relative mt-1">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-ink-700 bg-ink-900 px-3 py-2.5 pr-8 text-sm text-ink-100 focus:border-brand-500 focus:outline-none disabled:opacity-50"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
      </div>
    </label>
  );
}

export default function AdminOrderDetails({ orderId, onClose, onUpdated }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [note, setNote] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentProvider, setPaymentProvider] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const load = async () => {
    if (!orderId) return;
    setLoading(true);
    setErr("");
    try {
      const data = await adminOrdersApi.getById(orderId);
      setOrder(data);
      setOrderStatus(data.orderStatus || "Pending");
      setPaymentStatus(data.payment?.status || "Pending");
      setPaymentProvider(data.payment?.provider || "COD");
      setPaymentReference(data.payment?.reference || "");
    } catch (e) {
      setErr(getErrorMessage(e, "Could not load this order."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (!orderId) return null;

  const save = async () => {
    if (saving || !order) return;
    setSaving(true);
    try {
      const changes = [];
      let updated = order;
      const statusChanged = orderStatus !== order.orderStatus;
      const paymentChanged =
        paymentStatus !== order.payment?.status ||
        paymentProvider !== order.payment?.provider ||
        paymentReference !== (order.payment?.reference || "");
      if (statusChanged) {
        const data = await adminOrdersApi.updateStatus(order._id, {
          orderStatus,
          note: note || undefined,
        });
        updated = data;
        changes.push(`Status → ${orderStatus}`);
      }
      if (paymentChanged) {
        const data = await adminOrdersApi.updatePayment(order._id, {
          paymentStatus,
          provider: paymentProvider,
          reference: paymentReference,
        });
        updated = data;
        if (paymentStatus !== order.payment?.status) {
          changes.push(`Payment → ${paymentStatus}`);
        }
      }
      setOrder(updated);
      setOrderStatus(updated.orderStatus);
      setPaymentStatus(updated.payment?.status || "Pending");
      setPaymentProvider(updated.payment?.provider || "COD");
      setPaymentReference(updated.payment?.reference || "");
      setNote("");
      toast.success(
        changes.length ? `Saved: ${changes.join(", ")}.` : "No changes.",
      );
      onUpdated?.(updated);
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to save changes."));
    } finally {
      setSaving(false);
    }
  };

  const refund = async () => {
    if (!order || saving) return;
    if (
      !window.confirm(
        "Mark this order as refunded? Stock will be restored. This cannot be undone.",
      )
    )
      return;
    setSaving(true);
    try {
      const data = await adminOrdersApi.refund(order._id, {
        note: note || undefined,
      });
      setOrder(data);
      setOrderStatus(data.orderStatus);
      setPaymentStatus(data.payment?.status);
      toast.success("Refund applied.");
      onUpdated?.(data);
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to refund order."));
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    order &&
    (orderStatus !== order.orderStatus ||
      paymentStatus !== order.payment?.status ||
      paymentProvider !== order.payment?.provider ||
      paymentReference !== (order.payment?.reference || "") ||
      note.length > 0);

  if (loading && !order) {
    return (
      <div className="p-6 md:p-10 space-y-6 animate-pulse">
        <div className="h-10 bg-ink-800/60 rounded-lg w-2/3" />
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-5">
            <div className="card h-72 bg-ink-800/30" />
            <div className="card h-52 bg-ink-800/30" />
          </div>
          <div className="space-y-5">
            <div className="card h-44 bg-ink-800/30" />
            <div className="card h-44 bg-ink-800/30" />
          </div>
        </div>
      </div>
    );
  }

  if (err && !order) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/15 text-rose-300 grid place-items-center">
          <AlertTriangle size={22} />
        </div>
        <div className="font-display text-lg">{err}</div>
      </div>
    );
  }

  if (!order) return null;

  const items = order.items || [];
  const address = order.shippingAddress || {};
  const payment = order.payment || {};
  const history = (order.statusHistory || []).slice().reverse();
  const customer = order.user || {};
  const qtyTotal = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);

  return (
    <div className="grid grid-cols-1">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display text-2xl font-semibold flex items-center gap-2 flex-wrap">
              <span className="font-mono">{formatOrderNumber(order)}</span>
              <span
                className={`chip border !text-xs ${orderStatusColor(
                  order.orderStatus,
                )}`}
              >
                {order.orderStatus}
              </span>
              <span
                className={`chip border !text-xs ${paymentStatusColor(
                  payment.status,
                )}`}
              >
                {payment.status}
              </span>
            </h2>
          </div>
          <div className="text-xs text-ink-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
            <span>Placed {formatDate(order.createdAt)} · {timeAgo(order.createdAt)}</span>
            {order.updatedAt && order.updatedAt !== order.createdAt && (
              <span>Updated {formatDate(order.updatedAt)}</span>
            )}
            <span>{items.length} SKU · {qtyTotal} units</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={load}
            className="btn-ghost !py-1.5 text-xs"
            disabled={saving}
            title="Refresh"
          >
            <RefreshCw size={14} className={saving ? "animate-spin" : ""} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="btn-ghost !py-1.5 text-xs"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      <Section title="Manage status & payment" icon={ClipboardList}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Order status"
              value={orderStatus}
              onChange={setOrderStatus}
              options={ORDER_STATUSES}
              disabled={saving}
            />
            <Select
              label="Payment status"
              value={paymentStatus}
              onChange={setPaymentStatus}
              options={PAYMENT_STATUSES}
              disabled={saving}
            />
            <Select
              label="Payment method"
              value={paymentProvider}
              onChange={setPaymentProvider}
              options={PAYMENT_PROVIDERS}
              disabled={saving}
            />
            <label className="block text-xs text-ink-300">
              Payment reference
              <input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                disabled={saving}
                placeholder="Razorpay, COD slip…"
                className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none disabled:opacity-50"
              />
            </label>
          </div>
          <label className="block text-xs text-ink-300 md:col-span-2">
            Internal note (saved on status change)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={saving}
              rows={2}
              placeholder="Optional — e.g. courier AWB, out-for-dispatch confirmation, reason for cancel…"
              className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none disabled:opacity-50 resize-none"
            />
          </label>
          <div className="md:col-span-2 flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving || !hasChanges}
              className="btn btn-primary !py-2"
            >
              <Save size={14} /> {saving ? "Saving…" : "Save changes"}
            </button>
            {paymentStatus !== "Refunded" && order.orderStatus !== "Refunded" && (
              <button
                onClick={refund}
                disabled={saving}
                className="btn-ghost text-rose-300 hover:bg-rose-500/10 border-rose-500/30 !py-2"
              >
                <DollarSign size={14} /> Refund & restock
              </button>
            )}
            {!hasChanges && (
              <span className="text-xs text-ink-500 ml-auto">
                Make a change to enable save.
              </span>
            )}
          </div>
        </div>
      </Section>

      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        <div className="min-w-0 lg:col-span-2 space-y-5">
          <Section
            title={`Items · ${items.length} SKU / ${qtyTotal} units`}
            icon={Package}
          >
            {items.length === 0 ? (
              <div className="text-sm text-ink-400 py-4 text-center">
                No items on this order.
              </div>
            ) : (
              <ul className="divide-y divide-ink-800/60">
                {items.map((it) => {
                  const lineTotal = (it.priceAtPurchase || 0) * (it.quantity || 0);
                  return (
                    <li
                      key={it._id || `${it.product}-${it.name}`}
                      className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-ink-800 grid place-items-center">
                        {it.image ? (
                          <img
                            src={it.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={18} className="text-ink-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{it.name}</div>
                        <div className="text-xs text-ink-400 mt-0.5 flex flex-wrap gap-3">
                          <span>Qty {it.quantity}</span>
                          <span>Unit {formatPrice(it.priceAtPurchase)}</span>
                          {it.product && (
                            <span className="font-mono">
                              {String(it.product).slice(-6)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display font-semibold">
                          {formatPrice(lineTotal)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="Status history" icon={Clock}>
            {history.length === 0 ? (
              <div className="text-sm text-ink-400 py-4 text-center">
                No history available.
              </div>
            ) : (
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
                      <div className="text-xs text-ink-300 mt-1 bg-ink-800/40 rounded-md px-2.5 py-1.5 border border-ink-800 inline-block max-w-full">
                        {h.note}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>

        <div className="min-w-0 space-y-5">
          <Section title="Order summary" icon={CheckCircle2}>
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            <Row label="Taxes" value={formatPrice(order.tax)} />
            <Row label="Shipping" value={formatPrice(order.shippingFee)} />
            <Row
              label="Grand total"
              value={
                <span className="font-display text-lg font-semibold">
                  {formatPrice(order.totalAmount)}
                </span>
              }
            />
          </Section>

          <Section title="Customer" icon={UserIcon}>
            <Row label="Name" value={customer.name || address.fullName || "—"} />
            <Row
              label="Email"
              value={
                customer.email ? (
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-brand-300 hover:underline inline-flex items-start justify-end max-w-full gap-1"
                    title={customer.email}
                  >
                    <Mail size={12} className="mt-0.5 shrink-0" />
                    <span className="break-all min-w-0">{customer.email}</span>
                  </a>
                ) : (
                  "—"
                )
              }
            />
            {customer.username && (
              <Row mono label="Username" value={customer.username} />
            )}
            <Row
              label="Contact"
              value={
                customer.phone || address.phone ? (
                  <a
                    href={`tel:${customer.phone || address.phone}`}
                    className="text-brand-300 hover:underline inline-flex items-center justify-end max-w-full gap-1"
                  >
                    <Phone size={12} className="mt-0.5 shrink-0" />
                    <span className="break-all">{customer.phone || address.phone}</span>
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </Section>

          <Section title="Shipping to" icon={MapPin}>
            <div className="text-sm space-y-0.5 min-w-0">
              <div className="font-medium truncate" title={address.fullName || ""}>
                {address.fullName || "—"}
              </div>
              <div className="text-ink-300 break-words">{address.line1}</div>
              {address.line2 && <div className="text-ink-300 break-words">{address.line2}</div>}
              <div className="text-ink-300 break-words">
                {[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}
              </div>
              <div className="text-ink-300 break-words">{address.country}</div>
              <div className="mt-2 pt-2 border-t border-ink-800/60 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-400">
                <span className="inline-flex items-center gap-1.5 shrink-0">
                  <UserIcon size={12} /> {address.label || "Home"}
                </span>
                {address.phone && (
                  <a
                    href={`tel:${address.phone}`}
                    className="inline-flex items-center gap-1.5 text-brand-300/90 hover:underline shrink-0"
                  >
                    <Phone size={12} /> <span className="break-all">{address.phone}</span>
                  </a>
                )}
              </div>
            </div>
          </Section>

          <Section title="Payment info" icon={CreditCard}>
            <Row label="Method" value={payment.provider || "—"} />
            <Row
              label="Status"
              value={
                <span
                  className={`chip border !text-[11px] !py-0 inline-flex items-center ${paymentStatusColor(
                    payment.status,
                  )}`}
                >
                  {payment.status || "Pending"}
                </span>
              }
            />
            {payment.reference && (
              <Row
                mono
                label="Reference"
                value={
                  <span className="break-all" title={payment.reference}>
                    {payment.reference}
                  </span>
                }
              />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
