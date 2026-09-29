import { Link } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";

const STEPS = [
  { key: "Pending", color: "bg-brand-400" },
  { key: "Confirmed", color: "bg-accent" },
  { key: "Processing", color: "bg-yellow-300" },
  { key: "Shipped", color: "bg-brand-500" },
  { key: "Delivered", color: "bg-emerald-400" },
];

function Tracker({ status = "Processing" }) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-start w-full overflow-x-auto no-scrollbar">
      {STEPS.map((s, i) => {
        const active = i <= idx;
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
                  i < idx ? s.color : "bg-ink-800"
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
  const sample = [
    { id: "TVX-A3F9K2", status: "Processing", total: 11798, date: "2 days ago" },
    { id: "TVX-QW01KK", status: "Delivered", total: 7299, date: "3 weeks ago" },
  ];

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold mb-6">My Orders</h2>
      <div className="space-y-5">
        {sample.length === 0 ? (
          <div className="card p-10 text-center text-ink-400 text-sm">
            <Package size={36} className="mx-auto mb-2 text-brand-300" />
            No orders yet.
          </div>
        ) : (
          sample.map((o) => (
            <div key={o.id} className="card p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <div className="text-xs uppercase tracking-wider text-ink-400">
                    Order
                  </div>
                  <div className="font-mono font-semibold">{o.id}</div>
                  <div className="text-xs text-ink-400 mt-1">
                    Placed {o.date}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-ink-400">
                    Total
                  </div>
                  <div className="font-semibold text-lg">
                    ₹{o.total.toLocaleString("en-IN")}
                  </div>
                  <span className="chip !py-0.5 text-xs mt-1 inline-flex">
                    {o.status}
                  </span>
                </div>
              </div>
              <Tracker status={o.status} />
              <div className="mt-5 flex items-center justify-end">
                <Link
                  to={`/account/orders/${o.id}`}
                  className="btn-ghost !py-1.5 text-sm"
                >
                  View details <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
