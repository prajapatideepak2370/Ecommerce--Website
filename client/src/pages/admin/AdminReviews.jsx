import { Star, ShieldCheck, Trash2 } from "lucide-react";

export default function AdminReviews() {
  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-semibold mb-6">Reviews Moderation</h1>
      <div className="card divide-y divide-ink-800">
        {[
          ["Voxel One Speaker", "Jasvinder S.", 5, "Absolutely beautiful build quality. The 3D preview on the product page matched the final product exactly."],
          ["Glow Lamp Mini", "Shruti T.", 4, "Love the ambience, wish the cable was USB-C on both ends though."],
          ["Haptic Mousepad XL", "Vishal G.", 3, "Mouse glides well, but the haptic clicks need tuning for left-handed users."],
        ].map(([product, user, rating, comment], i) => (
          <div key={i} className="p-5 md:p-6 grid md:grid-cols-[1fr_auto] gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="font-semibold">{user}</div>
                <span className="text-xs text-ink-500">reviewed</span>
                <div className="font-medium text-brand-300">{product}</div>
              </div>
              <div className="flex items-center gap-0.5 text-amber-300 mb-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={14} fill={j < rating ? "currentColor" : "none"} />
                ))}
              </div>
              <p className="text-ink-300 leading-relaxed text-sm">{comment}</p>
            </div>
            <div className="flex md:flex-col gap-2 self-start md:justify-self-end">
              <button className="btn-ghost !py-1.5 text-xs text-emerald-300"><ShieldCheck size={14} /> Approve</button>
              <button className="btn-ghost !py-1.5 text-xs text-rose-300"><Trash2 size={14} /> Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
