import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Box, Phone, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { productApi } from "../api/endpoints.js";
import { selectIsAuthenticated } from "../store/authSlice.js";
import {
  addProductToCartForCheckout,
  completePendingBuyNow,
  savePendingBuyNow,
} from "../utils/buyNow.js";
import { getErrorMessage } from "../api/client.js";

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [buyingProductId, setBuyingProductId] = useState("");

  const handleBuyNow = async (product) => {
    if (buyingProductId) return;
    if (!isAuthenticated) {
      try {
        savePendingBuyNow(product);
        navigate("/login", {
          state: { from: { pathname: "/checkout" } },
        });
      } catch (error) {
        toast.error(getErrorMessage(error, "Could not start checkout."));
      }
      return;
    }

    setBuyingProductId(String(product._id));
    try {
      await addProductToCartForCheckout(dispatch, product);
      navigate("/checkout");
    } catch (error) {
      toast.error(
        getErrorMessage(error, `Could not buy ${product.name}. Please try again.`),
      );
    } finally {
      setBuyingProductId("");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    completePendingBuyNow(dispatch)
      .then((hasPendingPurchase) => {
        if (hasPendingPurchase) navigate("/checkout", { replace: true });
      })
      .catch((error) => {
        toast.error(
          getErrorMessage(error, "Could not resume your selected purchase."),
        );
      });
  }, [dispatch, isAuthenticated, navigate]);

  useEffect(() => {
    let mounted = true;
    const loadFeaturedProducts = async () => {
      let products = [];
      try {
        const featured = await productApi.list({ featured: true, limit: 4 });
        products = featured.items || [];
      } catch (error) {
        console.error("Failed to load featured products:", error);
      }

      if (products.length < 3) {
        try {
          const catalog = await productApi.list({ limit: 4 });
          const knownIds = new Set(products.map((product) => product._id));
          products = [
            ...products,
            ...(catalog.items || []).filter(
              (product) => !knownIds.has(product._id),
            ),
          ].slice(0, 4);
        } catch (error) {
          console.error("Failed to load catalog products:", error);
        }
      }

      if (mounted) setFeaturedProducts(products);
    };
    loadFeaturedProducts();

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
          className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_65%)] bg-grid-fade [background-size:40px_40px] pointer-events-none opacity-30"
          aria-hidden
        />

        <div className="page-container pt-14 md:pt-20 pb-16 md:pb-20 grid md:grid-cols-2 gap-10 md:gap-16 items-center relative">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="chip border-brand-500/20 bg-brand-500/5 text-brand-700"
            >
              <Sparkles size={14} className="text-brand-600" />
              Thoughtfully designed. Made to be experienced.
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 font-display font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight"
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
              className="mt-6 text-ink-300 max-w-lg text-base md:text-lg leading-relaxed"
            >
              Discover distinctive objects and thoughtful design, with a
              closer look at what makes every piece special.
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

          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="relative aspect-square max-w-md mx-auto w-full"
          >
            <div className="absolute inset-8 rounded-full bg-brand-500/10 blur-3xl" />
            <div className="relative h-full rounded-3xl border border-ink-700 bg-ink-900/70 shadow-card overflow-hidden grid place-items-center">
              <div className="relative w-2/3 h-2/3">
                <svg viewBox="0 0 200 200" className="w-full h-full text-ink-400">
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
                    stroke="currentColor"
                    strokeOpacity="0.65"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="100,10 180,60 100,110 20,60"
                    fill="url(#faceB)"
                    fillOpacity="0.25"
                    stroke="currentColor"
                    strokeOpacity="0.55"
                  />
                  <polyline
                    points="100,110 100,190"
                    stroke="currentColor"
                    strokeOpacity="0.6"
                  />
                  <polyline
                    points="20,60 20,140"
                    stroke="currentColor"
                    strokeOpacity="0.5"
                  />
                  <polyline
                    points="180,60 180,140"
                    stroke="currentColor"
                    strokeOpacity="0.5"
                  />
                  <polyline
                    points="20,60 100,110 180,60"
                    stroke="currentColor"
                    strokeOpacity="0.35"
                    fill="none"
                  />
                  <circle cx="100" cy="100" r="3" fill="#00f5d4" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="page-container pt-8">
        <div className="card relative overflow-hidden p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div
            className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="font-display text-xl md:text-2xl font-semibold">
              Make it <span className="gradient-text">yours</span>
            </h2>
            <p className="mt-2 text-sm md:text-base text-ink-300">
              Want a product customized just for you? Call us and let us know
              what you have in mind.
            </p>
          </div>
          <a
            href="tel:+919599662490"
            className="btn-primary relative shrink-0"
            aria-label="Call us at +91 9599662490 to customize a product"
          >
            <Phone size={16} />
            Call +919599662490
          </a>
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
              Curated for a more thoughtful shopping experience.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((product) => {
            const image = product.images?.[0]?.url;
            const price =
              product.discountPrice && product.discountPrice > 0
                ? product.discountPrice
                : product.price;
            const soldOut = Number(product.stock) <= 0;
            return (
              <div
                key={product._id}
                className="card group p-3 transition-all hover:-translate-y-1 hover:shadow-glow"
              >
                <Link to={`/product/${product.slug}`} className="block">
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 grid place-items-center overflow-hidden relative">
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Box size={36} className="text-brand-300" />
                    )}
                  </div>
                  <div className="mt-3 px-1">
                    <div className="font-medium line-clamp-2 min-h-12">
                      {product.name}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-semibold">
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                      <ArrowRight size={16} className="text-ink-400" />
                    </div>
                  </div>
                </Link>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => handleBuyNow(product)}
                    disabled={Boolean(buyingProductId) || soldOut}
                    className="btn-primary h-9 w-full !px-2 !py-2 text-xs whitespace-nowrap sm:!px-4 sm:text-sm"
                  >
                    <ShoppingBag size={14} className="shrink-0" />
                    {soldOut
                      ? "Sold out"
                      : buyingProductId === String(product._id)
                        ? "Adding..."
                        : "Buy Now"}
                  </button>
                  <Link
                    to={`/jelly-lab/${product.slug}`}
                    state={{ product, returnTo: "/" }}
                    className="btn-ghost h-9 w-full !px-2 !py-2 text-xs whitespace-nowrap sm:!px-4 sm:text-sm"
                  >
                    <Sparkles size={14} className="shrink-0" /> Try Jelly Lab
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link to="/shop" className="btn-outline">
            Show more products <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  );
}
