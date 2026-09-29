import { AlertTriangle, Package, ArrowUpDown } from "lucide-react";

export default function AdminInventory() {
  const rows = [
    ["Voxel One Speaker", "TVX-AUD-001", 12, "In Stock"],
    ["Glow Lamp Mini", "TVX-LGT-009", 2, "Low Stock"],
    ["Haptic Mousepad XL", "TVX-DSK-014", 5, "Low Stock"],
    ["Concrete Planter 180", "TVX-DCR-022", 0, "Out of Stock"],
    ["Wearable Ring V1", "TVX-WEAR-003", 34, "In Stock"],
  ];
  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-semibold mb-6">Inventory</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-xs text-ink-400 uppercase tracking-wider mb-2">Total SKUs</div>
          <div className="font-display text-2xl font-semibold">128</div>
        </div>
        <div className="card p-5 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-300 grid place-items-center shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="text-xs text-ink-400 uppercase tracking-wider">Low stock</div>
            <div className="font-display text-2xl font-semibold">9</div>
          </div>
        </div>
        <div className="card p-5 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500/15 text-rose-300 grid place-items-center shrink-0">
            <Package size={18} />
          </div>
          <div>
            <div className="text-xs text-ink-400 uppercase tracking-wider">Out of stock</div>
            <div className="font-display text-2xl font-semibold">3</div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/70 text-left text-ink-400 uppercase text-xs">
              <tr>
                <th className="p-4 font-normal">Product <ArrowUpDown size={12} className="inline ml-1" /></th>
                <th className="p-4 font-normal">SKU</th>
                <th className="p-4 font-normal">Stock</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {rows.map((r) => (
                <tr key={r[1]}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-500/30 to-accent/20" />
                      <div className="font-medium">{r[0]}</div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs">{r[1]}</td>
                  <td className="p-4"><input defaultValue={r[2]} type="number" min="0" className="w-24" /></td>
                  <td className="p-4"><span className={`chip !py-0.5 !px-2 text-xs ${r[3] === "Out of Stock" ? "text-rose-300 border-rose-500/30 bg-rose-500/10" : r[3] === "Low Stock" ? "text-amber-300 border-amber-500/30 bg-amber-500/10" : "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"}`}>{r[3]}</span></td>
                  <td className="p-4 text-right"><button className="btn-primary !py-1.5 text-xs">Save</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
