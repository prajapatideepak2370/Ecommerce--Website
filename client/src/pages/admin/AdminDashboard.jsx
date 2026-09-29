import { Package, Users, Truck, DollarSign, AlertTriangle } from "lucide-react";

const stats = [
  { k: "Products", v: "128", delta: "+12%", icon: Package, color: "from-brand-500 to-brand-700" },
  { k: "Customers", v: "3,412", delta: "+8.1%", icon: Users, color: "from-accent to-emerald-500" },
  { k: "Orders (30d)", v: "912", delta: "+24%", icon: Truck, color: "from-yellow-400 to-amber-600" },
  { k: "Revenue", v: "₹4.82M", delta: "+31%", icon: DollarSign, color: "from-fuchsia-500 to-brand-600" },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.k} className="card p-5 relative overflow-hidden">
            <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${s.color} opacity-20 blur-2xl`} />
            <div className="flex items-center justify-between mb-3">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center text-white shadow-glow`}>
                <s.icon size={18} />
              </div>
              <span className="text-xs text-emerald-300">{s.delta}</span>
            </div>
            <div className="text-2xl font-display font-semibold">{s.v}</div>
            <div className="text-xs text-ink-400 mt-1">{s.k}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Recent orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-ink-400 uppercase text-xs">
                <tr><th className="pb-3 font-normal">Order</th><th className="pb-3 font-normal">Customer</th><th className="pb-3 font-normal">Status</th><th className="pb-3 font-normal text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {[
                  ["TVX-A3F9K2", "Jasvinder S.", "Processing", "₹11,798"],
                  ["TVX-QW01KK", "Shruti T.", "Shipped", "₹7,299"],
                  ["TVX-LL29S1", "Vishal G.", "Pending", "₹3,499"],
                ].map((r) => (
                  <tr key={r[0]}>
                    <td className="py-3 font-mono text-xs">{r[0]}</td>
                    <td className="py-3">{r[1]}</td>
                    <td className="py-3"><span className="chip !py-0.5 !px-2 text-xs">{r[2]}</span></td>
                    <td className="py-3 text-right">{r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-300" /> Low-stock items
          </h3>
          <ul className="divide-y divide-ink-800">
            {[
              ["Voxel One Speaker", 4],
              ["Glow Lamp Mini", 2],
              ["Haptic Mousepad XL", 5],
              ["Concrete Planter 180", 0],
            ].map(([n, s]) => (
              <li key={n} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{n}</div>
                  <div className="text-xs text-ink-400">SKU TVX-000-0000</div>
                </div>
                <span className={`chip !py-0.5 !px-2 text-xs ${s === 0 ? "text-rose-300 border-rose-500/30 bg-rose-500/10" : s <= 3 ? "text-amber-300 border-amber-500/30 bg-amber-500/10" : ""}`}>
                  {s === 0 ? "Out of Stock" : `${s} left`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
