import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  Minus,
  Plus,
  Star,
  ChevronLeft,
  Box,
  RotateCcw,
  PackageCheck,
  ShieldCheck,
  Truck,
  AlertCircle,
} from "lucide-react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { addToCart } from "../store/cartSlice.js";
import { productApi, reviewApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import { demoProducts } from "../data/demoProducts.js";

const formatPrice = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const getReviewName = (review) =>
  review.user?.name || review.user?.username || "Verified customer";

export default function ProductDetails() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [cartAction, setCartAction] = useState("");

  useEffect(() => {
    let mounted = true;
    setProduct(null);
    setLoadError("");
    setActiveImage(0);
    setQty(1);

    const demoProduct = demoProducts.find((item) => item.slug === slug);
    if (demoProduct) {
      setProduct(demoProduct);
      return () => {
        mounted = false;
      };
    }

    productApi
      .bySlug(slug)
      .then((data) => {
        if (mounted) setProduct(data);
      })
      .catch((error) => {
        if (mounted) setLoadError(getErrorMessage(error, "Product not found."));
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!product?._id || String(product._id).startsWith("demo-")) {
      setReviews([]);
      setReviewsError("");
      setReviewsLoading(false);
      return undefined;
    }

    let mounted = true;
    setReviewsLoading(true);
    setReviewsError("");
    reviewApi
      .list(product._id)
      .then((result) => {
        if (mounted) setReviews(Array.isArray(result) ? result : result?.docs || []);
      })
      .catch((error) => {
        if (mounted) {
          setReviewsError(
            getErrorMessage(error, "Reviews could not be loaded."),
          );
        }
      })
      .finally(() => {
        if (mounted) setReviewsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [product?._id]);

  const images = useMemo(
    () => (product?.images || []).filter((image) => image?.url),
    [product?.images],
  );
  const displayPrice =
    product?.discountPrice > 0 && product.discountPrice < product.price
      ? product.discountPrice
      : product?.price || 0;
  const hasDiscount = displayPrice < (product?.price || 0);
  const stock = Math.max(0, Number(product?.stock) || 0);
  const soldOut = stock === 0;
  const specifications = useMemo(() => {
    const source =
      product?.specifications instanceof Map
        ? Object.fromEntries(product.specifications)
        : product?.specifications || {};
    const rows = Object.entries(source).filter(
      ([key, value]) =>
        key.trim() &&
        value !== null &&
        value !== undefined &&
        String(value).trim() !== "",
    );

    if (product?.sku) rows.unshift(["SKU", product.sku]);
    if (product?.material) rows.unshift(["Material", product.material]);
    if (product?.dimensions) rows.unshift(["Dimensions", product.dimensions]);
    return rows;
  }, [product]);

  const addProductToCart = async (goToCart = false) => {
    if (soldOut || cartAction) return;
    setCartAction(goToCart ? "buy" : "add");
    try {
      await dispatch(
        addToCart({
          product: product._id,
          quantity: qty,
          productMeta: product,
        }),
      ).unwrap();
      if (goToCart) {
        navigate("/cart");
      } else {
        toast.success(`${qty} × ${product.name} added to cart`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not add this product to cart."));
    } finally {
      setCartAction("");
    }
  };

  if (!product && !loadError) {
    return (
      <div className="page-container py-16" aria-live="polite">
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
            Product unavailable
          </h1>
          <p className="text-ink-400 mb-6">{loadError}</p>
          <Link to="/shop" className="btn-primary">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const rating = Math.max(0, Math.min(5, Number(product.rating) || 0));
  const reviewCount = Math.max(0, Number(product.numReviews) || 0);
  const colors = Array.isArray(product.colorOptions)
    ? product.colorOptions.filter(Boolean)
    : [];

  return (
    <div className="page-container py-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ink-400">
        <Link to="/shop" className="inline-flex items-center gap-1 hover:text-white">
          <ChevronLeft size={16} /> Shop
        </Link>
        {product.category?.name && (
          <>
            <span aria-hidden="true">/</span>
            <span>{product.category.name}</span>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="text-ink-200">{product.name}</span>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-3">
          <div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl border border-ink-800 bg-white">
            {images[activeImage]?.url ? (
              <img
                src={images[activeImage].url}
                alt={`${product.name}${images.length > 1 ? ` — image ${activeImage + 1}` : ""}`}
                className="h-full w-full object-contain p-5 md:p-8"
              />
            ) : (
              <Box
                size={96}
                aria-label="No product image"
                className="text-brand-400 animate-float-slow"
              />
            )}
            {product.model3D?.url && (
              <a
                href={product.model3D.url}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-950/90 px-3 py-2 text-sm text-white hover:bg-ink-800"
                aria-label={`Open 3D ${product.model3D.format.toUpperCase()} model file in a new tab`}
              >
                <RotateCcw size={15} /> Open 3D model file
              </a>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {images.map((image, index) => (
                <button
                  key={`${image.publicId || image.url}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`aspect-square overflow-hidden rounded-xl border bg-white transition ${
                    activeImage === index
                      ? "border-brand-400 ring-2 ring-brand-500/40"
                      : "border-ink-800 hover:border-ink-500"
                  }`}
                  aria-label={`Show product image ${index + 1}`}
                  aria-pressed={activeImage === index}
                >
                  <img
                    src={image.url}
                    alt=""
                    className="h-full w-full object-contain p-2"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <section aria-labelledby="product-title">
          <div className="mb-1 text-sm uppercase tracking-wider text-brand-300">
            {product.brand || "TRYVOXEL"}
          </div>
          <h1
            id="product-title"
            className="font-display text-3xl font-semibold leading-tight md:text-4xl"
          >
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <div
              className="flex items-center gap-0.5 text-amber-300"
              aria-label={`${rating.toFixed(1)} out of 5 stars`}
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={16}
                  fill={index < Math.round(rating) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <a
              href="#product-reviews"
              className="text-sm text-ink-300 underline-offset-4 hover:text-white hover:underline"
            >
              {reviewCount > 0
                ? `${rating.toFixed(1)} (${reviewCount} ${
                    reviewCount === 1 ? "review" : "reviews"
                  })`
                : "No reviews yet"}
            </a>
            <span
              className={`chip !py-0.5 ${
                soldOut
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  : stock <= 5
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}
              role="status"
            >
              {soldOut
                ? "Out of stock"
                : stock <= 5
                  ? `Only ${stock} left`
                  : "In stock"}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <div className="font-display text-4xl font-semibold">
              {formatPrice(displayPrice)}
            </div>
            {hasDiscount && (
              <>
                <div className="text-ink-400 line-through">
                  {formatPrice(product.price)}
                </div>
                <span className="chip !border-emerald-500/30 !bg-emerald-500/10 !px-2 !py-0.5 text-emerald-300">
                  {Math.round((1 - displayPrice / product.price) * 100)}% off
                </span>
              </>
            )}
          </div>
          <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-300">
            {product.description}
          </p>

          <div className="mt-7 space-y-5">
            {colors.length > 0 && (
              <fieldset>
                <legend className="input-label">
                  Available colors
                </legend>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <span
                      key={color}
                      className="rounded-lg border border-ink-700 px-3 py-2 text-sm text-ink-300"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </fieldset>
            )}

            <div>
              <label className="input-label" htmlFor="product-quantity">
                Quantity
              </label>
              <div className="inline-flex items-center overflow-hidden rounded-lg border border-ink-700">
                <button
                  type="button"
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  disabled={qty <= 1 || soldOut}
                  className="grid h-10 w-10 place-items-center hover:bg-ink-800 disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <input
                  id="product-quantity"
                  type="number"
                  min="1"
                  max={stock}
                  value={qty}
                  disabled={soldOut}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isInteger(value) && value >= 1) {
                      setQty(Math.min(stock, value));
                    }
                  }}
                  className="h-10 w-14 appearance-none border-0 bg-transparent p-0 text-center focus:ring-0"
                  aria-label="Quantity"
                />
                <button
                  type="button"
                  onClick={() => setQty((value) => Math.min(stock, value + 1))}
                  disabled={qty >= stock || soldOut}
                  className="grid h-10 w-10 place-items-center hover:bg-ink-800 disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
              {!soldOut && (
                <span className="ml-3 text-xs text-ink-500">
                  {stock} available
                </span>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => addProductToCart(false)}
              disabled={soldOut || Boolean(cartAction)}
              className="btn-primary !px-6 !py-3"
            >
              <ShoppingBag size={18} />
              {cartAction === "add" ? "Adding..." : "Add to cart"}
            </button>
            <button
              type="button"
              onClick={() => addProductToCart(true)}
              disabled={soldOut || Boolean(cartAction)}
              className="btn-ghost !px-6 !py-3"
            >
              {cartAction === "buy" ? "Adding..." : "Buy now"}
            </button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="card flex items-center gap-3 p-4 text-sm text-ink-300">
              <Truck size={18} className="shrink-0 text-brand-300" />
              Shipping options at checkout
            </div>
            <div className="card flex items-center gap-3 p-4 text-sm text-ink-300">
              <PackageCheck size={18} className="shrink-0 text-brand-300" />
              Stock checked when ordering
            </div>
            <div className="card flex items-center gap-3 p-4 text-sm text-ink-300">
              <ShieldCheck size={18} className="shrink-0 text-brand-300" />
              Secure checkout
            </div>
          </div>
        </section>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="card p-5 md:p-7" aria-labelledby="specifications-title">
          <h2 id="specifications-title" className="mb-4 font-display text-xl font-semibold">
            Product details
          </h2>
          {specifications.length ? (
            <dl className="divide-y divide-ink-800 text-sm">
              {specifications.map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-wrap justify-between gap-2 py-2.5"
                >
                  <dt className="text-ink-400">{label}</dt>
                  <dd className="max-w-[65%] text-right text-ink-100">
                    {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                  </dd>
                </div>
              ))}
              {colors.length > 0 && (
                <div className="flex flex-wrap justify-between gap-2 py-2.5">
                  <dt className="text-ink-400">Available colors</dt>
                  <dd className="max-w-[65%] text-right text-ink-100">
                    {colors.join(", ")}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-ink-400">
              Detailed specifications have not been provided for this product.
            </p>
          )}
        </section>

        <section
          id="product-reviews"
          className="card scroll-mt-24 p-5 md:p-7"
          aria-labelledby="reviews-title"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="reviews-title" className="font-display text-xl font-semibold">
              Customer reviews
            </h2>
            <span className="text-sm text-ink-400">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
          </div>
          {reviewCount > 0 && (
            <div className="mb-5 flex items-center gap-3 rounded-lg bg-ink-800/50 p-4">
              <span className="font-display text-3xl font-semibold">
                {rating.toFixed(1)}
              </span>
              <span className="text-sm text-ink-400">out of 5</span>
              <span className="flex text-amber-300" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={16}
                    fill={index < Math.round(rating) ? "currentColor" : "none"}
                  />
                ))}
              </span>
            </div>
          )}
          {reviewsLoading ? (
            <p className="text-sm text-ink-400" aria-live="polite">
              Loading reviews...
            </p>
          ) : reviewsError ? (
            <div className="flex items-start gap-2 text-sm text-rose-300" role="alert">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{reviewsError}</span>
            </div>
          ) : reviews.length ? (
            <div className="divide-y divide-ink-800">
              {reviews.map((review) => (
                <article key={review._id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium">{getReviewName(review)}</h3>
                    <time
                      className="text-xs text-ink-500"
                      dateTime={review.createdAt}
                    >
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </time>
                  </div>
                  <div
                    className="mt-1 flex text-amber-300"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={14}
                        fill={index < review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-300">
                      {review.comment}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400">
              No customer reviews yet.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
