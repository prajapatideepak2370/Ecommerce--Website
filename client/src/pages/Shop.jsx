import { Link } from "react-router-dom";
import { Search, Filter, SlidersHorizontal, Box, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { addToCart } from "../store/cartSlice.js";
import { categoryApi, productApi } from "../api/endpoints.js";
import { filterDemoProducts } from "../data/demoProducts.js";

export default function Shop() {
  const dispatch = useDispatch();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState("newest");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showingDemoProducts, setShowingDemoProducts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;
    categoryApi
      .list()
      .then((data) => {
        if (mounted) setCategories(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (mounted) {
          toast.error(
            err?.response?.data?.error?.message ||
              err?.message ||
              "Could not load categories.",
          );
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddToCart = async (product) => {
    try {
      await dispatch(
        addToCart({ product: product._id, quantity: 1, productMeta: product }),
      ).unwrap();
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(err?.message || "Could not add to cart");
    }
  };

  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(
      () => {
        setLoading(true);
        setLoadError("");
        const params = {
          search: q.trim() || undefined,
          category: category || undefined,
          minPrice: minPrice === "" ? undefined : Number(minPrice),
          maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
          minRating: minRating || undefined,
          inStock: inStock ? true : undefined,
          sort,
          limit: 100,
        };
        productApi
          .list(params)
          .then((data) => {
            if (mounted) {
              const items = data.items || [];
              const useDemoProducts = items.length === 0;
              setProducts(
                useDemoProducts ? filterDemoProducts(params) : items,
              );
              setShowingDemoProducts(useDemoProducts);
            }
          })
          .catch((err) => {
            if (mounted) {
              setProducts([]);
              setShowingDemoProducts(false);
              setLoadError(
                err?.response?.data?.error?.message ||
                  err?.message ||
                  "Could not load products.",
              );
            }
          })
          .finally(() => {
            if (mounted) setLoading(false);
          });
      },
      q ? 250 : 0,
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [q, category, minPrice, maxPrice, minRating, inStock, sort]);

  const displayProducts = products;
  const resetFilters = () => {
    setQ("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setInStock(false);
    setSort("newest");
  };

  return (
    <div className="page-container py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
          The <span className="gradient-text">Shop</span>
        </h1>
        <p className="text-ink-400">
          Browse our experimental, 3D-enabled collection.
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="card p-5 self-start lg:sticky lg:top-20 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <SlidersHorizontal size={16} /> Filters
            </h3>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-brand-300 link-underline"
            >
              Reset
            </button>
          </div>

          <div>
            <label className="input-label">Search</label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-10"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Category</label>
            <div className="space-y-2 text-sm">
              {[{ _id: "", name: "All" }, ...categories].map((c) => (
                  <label
                    key={c._id || "all"}
                    className="flex items-center gap-2 text-ink-200"
                  >
                    <input
                      type="radio"
                      name="cat"
                      value={c._id ? c.slug : ""}
                      checked={category === (c._id ? c.slug : "")}
                      onChange={() => setCategory(c._id ? c.slug : "")}
                      className="w-4 h-4"
                    />
                    {c.name}
                  </label>
                ))}
            </div>
          </div>

          <div>
            <label className="input-label">Price range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                aria-label="Minimum price"
                className="w-full"
              />
              <span className="text-ink-500">—</span>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                aria-label="Maximum price"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Min rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={minRating === String(n)}
                  onClick={() =>
                    setMinRating((current) => (current === String(n) ? "" : String(n)))
                  }
                  className="flex-1 btn-ghost !px-0 !py-2 text-xs"
                >
                  {n}★+
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Availability</label>
            <label className="flex items-center gap-2 text-sm text-ink-200">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4"
              />{" "}
              In stock only
            </label>
          </div>
        </aside>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="text-sm text-ink-300">
              <span className="font-semibold text-white">
                {displayProducts.length}
              </span>{" "}
              products
              {showingDemoProducts && (
                <span className="ml-2 text-xs text-amber-300">
                  Temporary preview
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-ink-400" />
              <select
                className="text-sm"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort products"
              >
                <option value="newest">Newest first</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="rating-desc">Top rated</option>
                <option value="name-asc">Name A→Z</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-ink-400">
              Loading products...
            </div>
          ) : loadError ? (
            <div role="alert" className="py-12 text-center text-rose-300">
              {loadError}
            </div>
          ) : displayProducts.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {displayProducts.map((product) => {
                const image = product.images?.[0]?.url;
                const price =
                  product.discountPrice && product.discountPrice > 0
                    ? product.discountPrice
                    : product.price;
                return (
                  <div
                    key={product._id}
                    className="card group p-3 transition hover:-translate-y-1 hover:shadow-glow"
                  >
                    <Link to={`/product/${product.slug}`} className="block">
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-ink-800 to-ink-950 grid place-items-center overflow-hidden relative">
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Box size={32} className="text-brand-300" />
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
                          <span className="text-xs text-ink-400">
                            {product.stock > 0 ? "In stock" : "Sold out"}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="btn-primary w-full mt-3 !py-2 text-sm"
                    >
                      <ShoppingBag size={14} /> Add to cart
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-ink-400">
              No products found.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
