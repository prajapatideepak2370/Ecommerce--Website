import { motion } from "framer-motion";

const pillars = [
  { title: "Immersive discovery", description: "Turn product browsing into a sensory, confidence-building experience." },
  { title: "Crafted trust", description: "Show details, depth, and material story before the customer ever clicks buy." },
  { title: "Meaningful commerce", description: "Help customers feel informed, inspired, and ready to purchase with clarity." },
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
          Built for
          <br />
          <span className="gradient-text">better commerce.</span>
        </h1>
        <p className="mt-6 text-ink-300 max-w-2xl mx-auto leading-relaxed">
          TRYVOXEL³ᴰ exists to make shopping feel as immersive, tactile, and
          inspiring as the products themselves. We believe premium experiences
          should feel alive before a customer ever clicks buy.
        </p>
      </motion.div>

      <section className="grid md:grid-cols-3 gap-5 mb-20">
        {pillars.map((pillar, i) => (
          <motion.div
            key={pillar.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="card p-6 text-center hover:-translate-y-1 transition"
          >
            <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-500/40 to-accent/30 grid place-items-center text-3xl border border-ink-700">
              {i === 0 ? "✦" : i === 1 ? "◌" : "◎"}
            </div>
            <div className="font-display text-xl font-semibold">{pillar.title}</div>
            <p className="text-sm text-brand-300 mt-2 leading-relaxed">{pillar.description}</p>
          </motion.div>
        ))}
      </section>

      <section className="card p-8 md:p-10 space-y-5 text-ink-200 leading-relaxed">
        <h2 className="font-display text-2xl md:text-3xl font-semibold">
          Our <span className="gradient-text">mission</span>
        </h2>
        <p>
          We build digital shopping experiences that help people understand the
          value, craftsmanship, and emotion behind every product. When a customer
          can see, feel, and explore what makes something special, confidence grows
          naturally.
        </p>
        <p>
          Through beautiful design, interactive detail, and a more intentional
          buying journey, we aim to make commerce feel clear, inspiring, and human.
          That's the future we believe in — not just selling products, but helping
          people connect with them before they ever purchase.
        </p>
      </section>
    </div>
  );
}
