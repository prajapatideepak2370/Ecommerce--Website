import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminCategories() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl md:text-3xl font-semibold">Categories</h1>
        <button className="btn-primary text-sm"><Plus size={16} /> New category</button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          ["Audio", "Soundbars, speakers, earbuds", 24],
          ["Lighting", "Desk lamps, ambient, strips", 16],
          ["Desk", "Pads, stands, organizers", 33],
          ["Wearables", "Glasses, rings, watches", 9],
          ["Decor", "Planters, wall, sculptures", 18],
          ["Limited", "Founder drops, 1-of-1s", 4],
        ].map(([n, d, c]) => (
          <div key={n} className="card p-5 group">
            <div className="h-32 rounded-xl mb-4 bg-gradient-to-br from-brand-500/20 via-ink-900 to-accent/10 grid place-items-center overflow-hidden">
              <span className="font-display text-4xl font-bold text-white/80">{n[0]}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{n}</div>
                <div className="text-xs text-ink-400 mt-1">{d}</div>
              </div>
              <span className="chip !py-0.5 !px-2 text-xs">{c} products</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="btn-ghost !py-1.5 text-xs flex-1"><Pencil size={14} /> Edit</button>
              <button className="btn-ghost !py-1.5 text-xs text-rose-300"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
