export function formatPrice(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function formatDate(value, withTime = true) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const date = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

export function timeAgo(value) {
  if (!value) return "—";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return String(value);
  const diffMs = Date.now() - d;
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  return formatDate(value, false);
}

export function orderStatusColor(status) {
  const key = String(status || "Pending").toLowerCase();
  const map = {
    pending: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    confirmed: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    processing: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    shipped: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    cancelled: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    refunded: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  };
  return map[key] || "bg-ink-700 text-ink-200 border-ink-600";
}

export function paymentStatusColor(status) {
  const key = String(status || "Pending").toLowerCase();
  const map = {
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    paid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    failed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    refunded: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  };
  return map[key] || "bg-ink-700 text-ink-200 border-ink-600";
}

export function formatOrderNumber(order) {
  if (!order) return "—";
  if (order.orderNumber) return order.orderNumber;
  const hex = String(order._id || "").slice(-6).toUpperCase() || "000000";
  return `TVX-${hex}`;
}
