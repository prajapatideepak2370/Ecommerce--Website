import { motion } from "framer-motion";

const founders = [
  { name: "Jasvinder", role: "Design Systems & 3D", emoji: "🎨" },
  { name: "Shruti", role: "Product & Experience", emoji: "🧪" },
  { name: "Vishal", role: "Engineering & Platform", emoji: "⚙️" },
];

export default function About() {
  return (
    <div className="page-container py-14 md:py-20 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="chip mb-4 inline-flex">About TRYVOXEL³ᴰ</div>
        <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
          Three founders.
          <br />
          <span className="gradient-text">One uncompromising vision.</span>
        </h1>
        <p className="mt-6 text-ink-300 max-w-2xl mx-auto leading-relaxed">
          We started TRYVOXEL³ᴰ because we were tired of marketplaces that
          looked like spreadsheets. We wanted a store that looked like the
          inside of our heads — dimensional, slightly weird, and absolutely
          obsessed with craft.
        </p>
      </motion.div>

      <section className="grid md:grid-cols-3 gap-5 mb-20">
        {founders.map((f, i) => (
          <motion.div
            key={f.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="card p-6 text-center hover:-translate-y-1 transition"
          >
            <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-500/40 to-accent/30 grid place-items-center text-3xl border border-ink-700">
              {f.emoji}
            </div>
            <div className="font-display text-xl font-semibold">{f.name}</div>
            <div className="text-sm text-brand-300 mt-1">{f.role}</div>
          </motion.div>
        ))}
      </section>

      <section className="card p-8 md:p-10 space-y-5 text-ink-200 leading-relaxed">
        <h2 className="font-display text-2xl md:text-3xl font-semibold">
          Our <span className="gradient-text">philosophy</span>
        </h2>
        <p>
          Every pixel, every shadow, every frame of animation — it's all there
          on purpose. We believe the closer a product is to being experienced
          before purchase, the more trust a customer has when they click buy.
        </p>
        <p>
          That's why we built a 3D-first platform. Before you add something to
          your cart, you can look at it, rotate it, zoom in on the seam where
          two materials meet. This isn't a feature. It's how commerce should
          always have worked.
        </p>
      </section>
    </div>
  );
}
