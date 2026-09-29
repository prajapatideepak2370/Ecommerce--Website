import { CreditCard, Search } from "lucide-react";

export default function AdminPayments() {
  const rows = [
    ["upi_TVX-A3F9K2", "TVX-A3F9K2", "Jasvinder S.", "₹11,798", "Paid", "UPI"],
    ["cod_TVX-QW01KK", "TVX-QW01KK", "Shruti T.", "₹7,299", "Pending", "COD"],
    ["cod_TVX-LL29S1", "TVX-LL29S1", "Vishal G.", "₹3,499", "Pending", "COD"],
    ["upi_TVX-RT0001", "TVX-RT0001", "Customer 9", "₹4,999", "Failed", "UPI"],
  ];
  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-semibold mb-6">
        Payments
      </h1>
      <div className="card p-4 mb-6 flex items-center gap-3">
        <Search size={16} className="text-ink-400" />
        <input
          placeholder="Search payment, order id, customer…"
          className="flex-1 !bg-transparent !border-0 !p-0 focus:!ring-0"
        />
        <select className="text-sm">
          <option>All statuses</option>
        </select>
        <select className="text-sm">
          <option>Last 30 days</option>
        </select>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/70 text-left text-ink-400 uppercase text-xs">
              <tr>
                <th className="p-4 font-normal">Payment ID</th>
                <th className="p-4 font-normal">Order</th>
                <th className="p-4 font-normal">Customer</th>
                <th className="p-4 font-normal text-right">Amount</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal">Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {rows.map((r) => (
                <tr key={r[0]}>
                  <td className="p-4 font-mono text-xs flex items-center gap-2">
                    <CreditCard size={14} className="text-ink-500" />
                    {r[0]}
                  </td>
                  <td className="p-4 font-mono text-xs">{r[1]}</td>
                  <td className="p-4">{r[2]}</td>
                  <td className="p-4 text-right font-semibold">{r[3]}</td>
                  <td className="p-4">
                    <span
                      className={`chip !py-0.5 !px-2 text-xs ${r[4] === "Paid" ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" : r[4] === "Pending" ? "text-amber-300 border-amber-500/30 bg-amber-500/10" : "text-brand-300 border-brand-500/30 bg-brand-500/10"}`}
                    >
                      {r[4]}
                    </span>
                  </td>
                  <td className="p-4">{r[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
