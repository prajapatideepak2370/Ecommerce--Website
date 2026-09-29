import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export default function AdminProducts() {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-2xl md:text-3xl font-semibold">Products</h1>
        <button onClick={() => setShow(true)} className="btn-primary text-sm"><Plus size={16} /> New product</button>
      </div>

      <div className="card p-4 mb-6 flex items-center gap-3">
        <Search size={16} className="text-ink-400" />
        <input placeholder="Search products, SKU, brand…" className="flex-1 !bg-transparent !border-0 !p-0 focus:!ring-0" />
        <select className="text-sm"><option>All categories</option></select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/70 text-left text-ink-400 uppercase text-xs">
              <tr>
                <th className="p-4 font-normal">Product</th>
                <th className="p-4 font-normal">Category</th>
                <th className="p-4 font-normal">Price</th>
                <th className="p-4 font-normal">Stock</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {[
                ["Voxel One Speaker", "Audio", 9999, 12, "Active"],
                ["Glow Lamp Mini", "Lighting", 3499, 2, "Active"],
                ["Haptic Mousepad XL", "Desk", 1999, 5, "Draft"],
                ["Concrete Planter 180", "Decor", 2499, 0, "Out of Stock"],
              ].map((r) => (
                <tr key={r[0]}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-500/30 to-accent/20" />
                      <div>
                        <div className="font-medium">{r[0]}</div>
                        <div className="text-xs text-ink-500">SKU TVX-000-0000</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{r[1]}</td>
                  <td className="p-4">₹{r[2].toLocaleString("en-IN")}</td>
                  <td className="p-4">{r[3]}</td>
                  <td className="p-4"><span className="chip !py-0.5 !px-2 text-xs">{r[4]}</span></td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-2 justify-end">
                      <button className="btn-ghost !py-1.5 text-xs"><Pencil size={14} /> Edit</button>
                      <button className="btn-ghost !py-1.5 text-xs text-rose-300"><Trash2 size={14} /></button>
                    </div>
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
