import { PackageCheck, User, CreditCard } from "lucide-react";

export default function AdminOrders() {
  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-semibold mb-6">
        Orders
      </h1>
      <div className="card overflow-hidden mb-4">
        <div className="p-4 border-b border-ink-800 flex flex-wrap items-center gap-3">
          <select className="text-sm">
            <option>All statuses</option>
          </select>
          <select className="text-sm">
            <option>All dates</option>
          </select>
          <input placeholder="Search order, email…" />
          <div className="flex-1" />
          <span className="text-sm text-ink-400">128 orders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/70 text-left text-ink-400 uppercase text-xs">
              <tr>
                <th className="p-4 font-normal">Order</th>
                <th className="p-4 font-normal">Customer</th>
                <th className="p-4 font-normal">Items</th>
                <th className="p-4 font-normal">Payment</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {[
                [
                  "TVX-A3F9K2",
                  "Jasvinder S.",
                  "2 items",
                  "UPI · Paid",
                  "Processing",
                  "₹11,798",
                ],
                [
                  "TVX-QW01KK",
                  "Shruti T.",
                  "1 item",
                  "COD · Due on delivery",
                  "Shipped",
                  "₹7,299",
                ],
                [
                  "TVX-LL29S1",
                  "Vishal G.",
                  "3 items",
                  "COD · Due on delivery",
                  "Pending",
                  "₹3,499",
                ],
              ].map((r) => (
                <tr key={r[0]} className="hover:bg-ink-900/40">
                  <td className="p-4 font-mono text-xs">{r[0]}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-ink-400" />
                      {r[1]}
                    </div>
                  </td>
                  <td className="p-4">{r[2]}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} className="text-ink-400" />
                      {r[3]}
                    </div>
                  </td>
                  <td className="p-4">
                    <select defaultValue={r[4]} className="text-xs !py-1">
                      {[
                        "Pending",
                        "Confirmed",
                        "Processing",
                        "Shipped",
                        "Delivered",
                        "Cancelled",
                        "Refunded",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-right font-semibold">{r[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
