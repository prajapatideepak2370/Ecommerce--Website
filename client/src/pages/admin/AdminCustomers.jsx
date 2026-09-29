import { Ban, Check, Search } from "lucide-react";

export default function AdminCustomers() {
  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-semibold mb-6">Customers</h1>
      <div className="card p-4 mb-6 flex items-center gap-3">
        <Search size={16} className="text-ink-400" />
        <input placeholder="Search by name, email, phone…" className="flex-1 !bg-transparent !border-0 !p-0 focus:!ring-0" />
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/70 text-left text-ink-400 uppercase text-xs">
              <tr>
                <th className="p-4 font-normal">Customer</th>
                <th className="p-4 font-normal">Role</th>
                <th className="p-4 font-normal">Orders</th>
                <th className="p-4 font-normal">Spent</th>
                <th className="p-4 font-normal">Joined</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {[
                ["Jasvinder Singh", "customer", 14, "₹128,490", "Aug 2025", true],
                ["Shruti Taneja", "admin", 2, "₹7,299", "Jul 2025", true],
                ["Vishal Gupta", "admin", 5, "₹42,010", "Jul 2025", true],
                ["Spam User 091", "customer", 0, "₹0", "Sep 2025", false],
              ].map(([name, role, orders, spent, joined, active]) => (
                <tr key={name}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500/40 to-accent/30 grid place-items-center font-semibold">{name[0]}</div>
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-xs text-ink-500">{name.toLowerCase().replace(/\s+/g, ".")}@tryvoxel.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 capitalize">{role}</td>
                  <td className="p-4">{orders}</td>
                  <td className="p-4">{spent}</td>
                  <td className="p-4 text-ink-400">{joined}</td>
                  <td className="p-4">
                    <span className={`chip !py-0.5 !px-2 text-xs ${active ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" : "text-rose-300 border-rose-500/30 bg-rose-500/10"}`}>
                      {active ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className={`btn-ghost !py-1.5 text-xs ${active ? "text-rose-300" : "text-emerald-300"}`}>
                      {active ? <><Ban size={14} className="mr-1" /> Block</> : <><Check size={14} className="mr-1" /> Unblock</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
