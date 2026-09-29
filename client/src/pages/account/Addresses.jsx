import { Plus, MapPin, Pencil, Trash2 } from "lucide-react";

export default function Addresses() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold">Saved Addresses</h2>
        <button className="btn-primary !py-2 text-sm"><Plus size={16} /> Add new</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {["Home", "Work"].map((l, i) => (
          <div key={l} className="card p-5 relative">
            {i === 0 && <span className="absolute top-4 right-4 chip !py-0.5 text-xs border-brand-500/30 bg-brand-500/10 text-brand-200">Default</span>}
            <div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-brand-300" /><span className="font-medium">{l}</span></div>
            <div className="text-sm text-ink-200 space-y-1">
              <div>Jasvinder Singh · +91 98765 43210</div>
              <div className="text-ink-400">123 Voxel Lane, Sector 7<br />Chandigarh, Punjab, 160017, India</div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="btn-ghost !py-1.5 text-xs"><Pencil size={14} /> Edit</button>
              <button className="btn-ghost !py-1.5 text-xs text-rose-300"><Trash2 size={14} /> Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
