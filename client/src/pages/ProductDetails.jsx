import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Minus,
  Plus,
  Star,
  ChevronLeft,
  Box,
  RotateCcw,
} from "lucide-react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { addToCart } from "../store/cartSlice.js";
import { productApi } from "../api/endpoints.js";
import { demoProducts } from "../data/demoProducts.js";

export default function ProductDetails() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const demoProduct = demoProducts.find((item) => item.slug === slug);
    if (demoProduct) {
      setProduct(demoProduct);
      setLoadError(false);
      return;
    }

    productApi
      .bySlug(slug)
      .then((data) => {
        if (mounted) setProduct(data);
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (!product && !loadError) {
    return (
      <div className="page-container py-16">
        <div className="card p-10 text-center text-ink-400">
          Loading product...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-container py-16">
        <div className="card p-10 text-center">
          <h1 className="font-display text-2xl font-semibold mb-2">
            Product not found
          </h1>
          <p className="text-ink-400 mb-6">
            This product may have been removed or is not available.
          </p>
          <Link to="/shop" className="btn-primary">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const displayPrice =
    product.discountPrice && product.discountPrice > 0
      ? product.discountPrice
      : product.price;

  const handleAdd = async () => {
    try {
      await dispatch(
        addToCart({
          product: product._id,
          quantity: qty,
          productMeta: product,
        }),
      ).unwrap();
      toast.success(`Added ${qty} × ${product.name.slice(0, 28)}… to cart`);
    } catch (e) {
      toast.error(e?.message || "Could not add to cart");
    }
  };

  const handleBuyNow = async () => {
    try {
      await dispatch(
        addToCart({
          product: product._id,
          quantity: qty,
          productMeta: product,
        }),
      ).unwrap();
      navigate("/cart");
    } catch (e) {
      toast.error(e?.message || "Could not add to cart");
    }
  };

  return (
    <div className="page-container py-10">
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-sm text-ink-300 hover:text-white mb-6"
      >
        <ChevronLeft size={16} /> Back to shop
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl card overflow-hidden grid place-items-center relative bg-white">
            {product.images?.[0]?.url ? (
              <img
                src={product.images[0].url}
                alt={product.name}
                className="w-full h-full object-contain p-6"
              />
            ) : (
              <Box
                size={96}
                className="relative text-brand-400 animate-float-slow"
              />
            )}
            <button className="absolute bottom-4 right-4 chip hover:bg-ink-800 !gap-2">
              <RotateCcw size={14} /> View in 3D · Phase 9
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(product.images || []).map((image, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl card overflow-hidden bg-white"
              >
                <img
                  src={image.url}
                  alt={`${product.name} view ${i + 1}`}
                  className="w-full h-full object-contain p-2"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm text-brand-300 uppercase tracking-wider mb-1">
            {product.brand || "TRYVOXEL"}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-0.5 text-amber-300">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={
                    i < Math.round(product.rating || 0)
                      ? "currentColor"
                      : "none"
                  }
                />
              ))}
            </div>
            <span className="text-sm text-ink-300">
              {product.rating || 0} · {product.numReviews || 0} reviews
            </span>
            <span className="chip !py-0.5 text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
              In Stock · {product.stock}
            </span>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <div className="font-display text-4xl font-semibold">
              ₹{displayPrice.toLocaleString("en-IN")}
            </div>
            {product.discountPrice &&
            product.discountPrice > 0 &&
            product.discountPrice < product.price ? (
              <div className="pb-1.5 text-ink-400 line-through">
                ₹{product.price.toLocaleString("en-IN")}
              </div>
            ) : null}
            <div className="pb-1.5 chip !py-0.5 !px-2 text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
              {product.discountPrice &&
              product.discountPrice > 0 &&
              product.price > product.discountPrice
                ? Math.round((1 - product.discountPrice / product.price) * 100)
                : 0}
              % OFF
            </div>
          </div>

          <p className="mt-5 text-ink-300 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-7 space-y-4">
            <div>
              <div className="input-label">Color</div>
              <div className="flex items-center gap-2">
                {["#0f172a", "#6355ff", "#00f5d4", "#e11d48", "#ffffff"].map(
                  (c) => (
                    <button
                      key={c}
                      aria-label="color"
                      className="h-9 w-9 rounded-full border-2 border-ink-700 hover:border-brand-400 transition"
                      style={{ background: c }}
                    />
                  ),
                )}
              </div>
            </div>

            <div>
              <div className="input-label">Quantity</div>
              <div className="inline-flex items-center border border-ink-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="h-10 w-10 grid place-items-center hover:bg-ink-800"
                >
                  <Minus size={16} />
                </button>
                <div className="h-10 w-14 grid place-items-center font-medium">
                  {qty}
                </div>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="h-10 w-10 grid place-items-center hover:bg-ink-800"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button onClick={handleAdd} className="btn-primary !px-6 !py-3">
              <ShoppingBag size={18} /> Add to cart
            </button>
            <button onClick={handleBuyNow} className="btn-ghost !px-6 !py-3">
              Buy now
            </button>
          </div>

          <div className="mt-10 grid md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-semibold mb-2">Specifications</h3>
              <dl className="text-sm space-y-1">
                {[
                  ["Dimensions", product.dimensions || "Custom fit"],
                  ["Material", product.material || "Aluminum / PLA+"],
                  ["Weight", "1.4 kg"],
                  ["Driver", product.brand || "Custom driver"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-ink-400">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold mb-2">Shipping & returns</h3>
              <ul className="text-sm text-ink-300 space-y-1.5 list-disc list-inside">
                <li>Free shipping above ₹1,999</li>
                <li>14-day no-questions return</li>
                <li>2-year limited warranty</li>
                <li>Dispatched within 48 hours</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold mb-4">
          Reviews{" "}
          <span className="text-ink-400 text-base font-normal">
            ({product.numReviews || 0})
          </span>
        </h2>
        <div className="card p-5 md:p-7 text-center text-ink-400">
          Reviews for this product will load in Phase 7.
        </div>
      </section>
    </div>
  );
}
