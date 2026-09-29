import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Box, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { productApi } from "../api/endpoints.js";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    let mounted = true;
    productApi.list({ featured: true, limit: 4 })
      .then((data) => {
        if (mounted) setFeaturedProducts(data.items || []);
      })
      .catch(() => {
        if (mounted) setFeaturedProducts([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-hero-radial pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)] bg-grid-fade [background-size:36px_36px] pointer-events-none opacity-60"
          aria-hidden
        />

        <div className="page-container pt-16 md:pt-28 pb-20 grid md:grid-cols-2 gap-10 items-center relative">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="chip border-brand-500/30 bg-brand-500/10 text-brand-200"
            >
              <Sparkles size={14} className="text-brand-300" />
              Introducing TRYVOXEL³ᴰ — built for experimentation
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight"
            >
              <span className="gradient-text">Experiment.</span>
              <br />
              Create.
              <br />
              <span className="text-ink-200">Experience.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-6 text-ink-300 max-w-xl text-base md:text-lg"
            >
              A premium 3D-first marketplace for experimental physical and
              digital goods. <span className="text-brand-300">See it</span>,{" "}
              <span className="text-accent">spin it</span>, own it — before you
              checkout.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/shop" className="btn-primary text-base px-6 py-3">
                Shop the collection <ArrowRight size={18} />
              </Link>
              <Link to="/new" className="btn-ghost text-base px-6 py-3">
                New Arrivals
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 grid grid-cols-3 gap-6 max-w-md"
            >
              {[
                { k: "20+", v: "Curated drops" },
                { k: "4.9★", v: "Avg. rating" },
                { k: "3D", v: "View in room" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="font-display text-2xl md:text-3xl font-semibold text-white">
                    {s.k}
                  </div>
                  <div className="text-xs text-ink-400 mt-1">{s.v}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* 3D hero placeholder — @react-three/fiber viewer lands in Phase 9 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="relative aspect-square max-w-lg mx-auto w-full"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-600/30 via-brand-400/10 to-accent/20 blur-3xl animate-float-slow" />
            <div className="relative h-full rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-900 via-ink-900 to-ink-950 shadow-card overflow-hidden grid place-items-center">
              <div className="relative w-2/3 h-2/3 animate-float-slow [animation-duration:6s]">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="faceA" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6355ff" />
                      <stop offset="100%" stopColor="#3b26d8" />
                    </linearGradient>
                    <linearGradient id="faceB" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#00f5d4" />
                      <stop offset="100%" stopColor="#6355ff" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="100,10 180,60 180,140 100,190 20,140 20,60"
                    fill="url(#faceA)"
                    fillOpacity="0.25"
                    stroke="#ffffff"
                    strokeOpacity="0.6"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="100,10 180,60 100,110 20,60"
                    fill="url(#faceB)"
                    fillOpacity="0.25"
                    stroke="#ffffff"
                    strokeOpacity="0.45"
                  />
                  <polyline
                    points="100,110 100,190"
                    stroke="#ffffff"
                    strokeOpacity="0.5"
                  />
                  <polyline
                    points="20,60 20,140"
                    stroke="#ffffff"
                    strokeOpacity="0.4"
                  />
                  <polyline
                    points="180,60 180,140"
                    stroke="#ffffff"
                    strokeOpacity="0.4"
                  />
                  <polyline
                    points="20,60 100,110 180,60"
                    stroke="#ffffff"
                    strokeOpacity="0.35"
                    fill="none"
                  />
                  <circle cx="100" cy="100" r="3" fill="#00f5d4" />
                </svg>
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-ink-300">
                  <Box size={14} className="text-brand-300" />
                  Interactive 3D viewer · Phase 9
                </div>
                <div className="flex items-center gap-2 text-ink-400">
                  <Layers size={14} /> 6 faces · 12 edges
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="page-container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold">
              Featured <span className="gradient-text">Drops</span>
            </h2>
            <p className="text-ink-400 mt-1 text-sm">
              Hand-picked by Jasvinder, Shruti, and Vishal.
            </p>
          </div>
          <Link
            to="/shop"
            className="text-sm link-underline text-brand-300 hidden sm:inline-flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {featuredProducts.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => {
              const image = product.images?.[0]?.url;
              const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
              return (
                <Link key={product._id} to={`/product/${product.slug}`} className="card group p-3 transition-all hover:-translate-y-1 hover:shadow-glow">
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 grid place-items-center overflow-hidden relative">
                    {image ? <img src={image} alt={product.name} className="w-full h-full object-cover" /> : <Box size={36} className="text-brand-300" />}
                  </div>
                  <div className="mt-3 px-1">
                    <div className="font-medium line-clamp-2 min-h-12">{product.name}</div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-semibold">₹{price.toLocaleString("en-IN")}</span>
                      <ArrowRight size={16} className="text-ink-400" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="border-y border-ink-800 py-8 text-sm text-ink-400">
            No featured products yet. <Link to="/shop" className="text-brand-300 link-underline">Browse the shop</Link>
          </div>
        )}
      </section>

      {/* BUILT BY THREE */}
      <section className="page-container py-16">
        <div className="card p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="chip mb-4">The Founders</div>
              <h3 className="font-display text-3xl md:text-4xl font-semibold leading-tight">
                Built by three creators.
                <br />
                <span className="gradient-text">
                  Jasvinder × Shruti × Vishal
                </span>
              </h3>
              <p className="text-ink-300 mt-4 max-w-lg leading-relaxed">
                Three voices, one obsession: making commerce feel like play. We
                sweat the typography, the weight of the shadows, the way a
                product rotates in 3D — so that every visit feels like entering
                a room you want to stay in.
              </p>
              <Link to="/about" className="btn-outline mt-6">
                Meet the team <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {["Jasvinder", "Shruti", "Vishal"].map((n) => (
                <div key={n} className="text-center">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-600/40 to-accent/30 border border-ink-700 mb-3 grid place-items-center">
                    <span className="font-display text-2xl font-semibold">
                      {n[0]}
                    </span>
                  </div>
                  <div className="font-medium">{n}</div>
                  <div className="text-xs text-ink-400">Founder</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
