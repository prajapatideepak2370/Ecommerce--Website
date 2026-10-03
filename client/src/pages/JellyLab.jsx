import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  ArrowLeft,
  Hand,
  RotateCcw,
  ShoppingBag,
  X,
  Pause,
  Play,
  CircleHelp,
} from "lucide-react";
import toast from "react-hot-toast";
import JellyScene from "../components/jelly/JellyScene.jsx";
import { addToCart } from "../store/cartSlice.js";
import { productApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import { demoProducts } from "../data/demoProducts.js";

const formatPrice = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

function KnifeIcon({ size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m14.5 3.5-9 9 6 6 9-9a4.24 4.24 0 0 0-6-6Z" />
      <path d="m5.5 12.5 6 6-3 3-6-6 3-3Z" />
      <path d="m9.5 8.5 6 6" />
    </svg>
  );
}

function getProductColor(product) {
  const color = String(product?.colorOptions?.[0] || "").toLowerCase();
  const known = {
    white: "#f2eee8",
    black: "#393541",
    red: "#d85562",
    blue: "#5385c7",
    green: "#58a77c",
    pink: "#df9bb6",
    yellow: "#e6bd55",
    orange: "#dd8351",
    purple: "#9270bd",
  };
  const found = Object.entries(known).find(([name]) => color.includes(name));
  return found?.[1] || "#e8e1d6";
}

export default function JellyLab() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(location.state?.product || null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(!location.state?.product);
  const [tool, setTool] = useState("hand");
  const [colorMode, setColorMode] = useState("original");
  const [customColor, setCustomColor] = useState("#a58edb");
  const [firmness, setFirmness] = useState(0.55);
  const [damping, setDamping] = useState(0.62);
  const [autoRotate, setAutoRotate] = useState(false);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [nudgeKey, setNudgeKey] = useState(0);
  const [wireframe, setWireframe] = useState(false);
  const [pieceCount, setPieceCount] = useState(1);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    if (product) setCustomColor(getProductColor(product));
  }, [product]);

  useEffect(() => {
    if (product?.slug === slug) return undefined;
    let active = true;
    const demo = demoProducts.find((item) => item.slug === slug);
    if (demo) {
      setProduct(demo);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    productApi
      .bySlug(slug)
      .then((data) => {
        if (active) setProduct(data);
      })
      .catch((error) => {
        if (active) setLoadError(getErrorMessage(error, "Product not found."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [product?.slug, slug]);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const context =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setWebglAvailable(Boolean(context));
    } catch {
      setWebglAvailable(false);
    }
  }, []);

  useEffect(() => {
    const handleVisibility = () => setPaused(document.hidden);
    const handleKey = (event) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key.toLowerCase() === "r") setResetKey((key) => key + 1);
      if (event.key.toLowerCase() === "h") setTool("hand");
      if (event.key.toLowerCase() === "k") setTool("knife");
      if (event.key.toLowerCase() === "n") setNudgeKey((key) => key + 1);
      if (event.code === "Space") {
        event.preventDefault();
        setPaused((value) => !value);
      }
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("keydown", handleKey);
    };
  });

  const images = useMemo(
    () => (product?.images || []).filter((image) => image?.url),
    [product],
  );
  const price =
    product?.discountPrice > 0 && product.discountPrice < product.price
      ? product.discountPrice
      : product?.price || 0;
  const imageUrl = images[0]?.url || "/favicon.svg";
  const hasModel = Boolean(product?.model3D?.url);
  const canInteract = hasModel && webglAvailable;

  function handleClose() {
    if (window.history.state?.idx > 0) navigate(-1);
    else {
      navigate(
        location.state?.returnTo ||
          (product ? `/product/${product.slug}` : "/shop"),
      );
    }
  }

  const addProductToCart = async () => {
    if (!product || product.stock <= 0 || cartBusy) return;
    setCartBusy(true);
    try {
      await dispatch(
        addToCart({
          product: product._id,
          quantity: 1,
          productMeta: product,
        }),
      ).unwrap();
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not add this product to cart."));
    } finally {
      setCartBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#e8e5df] text-stone-700">
        Loading Jelly Lab…
      </main>
    );
  }

  if (!product || loadError) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#e8e5df] p-6 text-stone-800">
        <div className="max-w-md text-center">
          <div className="font-display text-3xl font-semibold">JELLY LAB</div>
          <p className="my-3 text-sm">{loadError || "Product unavailable."}</p>
          <Link to="/shop" className="btn-primary">
            Back to shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#e8e5df] text-stone-900">
      <header className="flex min-h-16 items-center justify-between border-b border-stone-300/80 bg-[#f5f3ee] px-4 md:px-8">
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex min-h-11 items-center gap-2 text-sm text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft size={17} />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="text-center">
          <div className="font-display text-sm font-semibold tracking-[0.22em]">
            TRYVOXEL³ᴰ
          </div>
          <div className="text-[9px] uppercase tracking-[0.28em] text-stone-500">
            Jelly Lab / Material Study
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="grid h-11 w-11 place-items-center rounded-full text-stone-600 hover:bg-stone-200"
          aria-label="Close Jelly Lab"
        >
          <X size={19} />
        </button>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-5 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                Object / {String(product._id || "001").slice(-4)}
              </div>
              <h1 className="mt-1 font-display text-xl font-semibold md:text-2xl">
                {product.name}
              </h1>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Product price
              </div>
              <div className="font-display text-lg font-semibold">
                {formatPrice(price)}
              </div>
            </div>
          </div>

          {canInteract ? (
            <JellyScene
              originalColor={getProductColor(product)}
              colorMode={colorMode}
              customColor={customColor}
              firmness={firmness}
              damping={damping}
              tool={tool}
              paused={paused}
              autoRotate={autoRotate}
              resetKey={resetKey}
              nudgeKey={nudgeKey}
              wireframe={wireframe}
              modelUrl={product.model3D.url}
              isGrabbing={isGrabbing}
              onGrabChange={setIsGrabbing}
              onPieceCount={setPieceCount}
              onPieceLimit={() => toast("That's plenty of pieces.")}
            />
          ) : webglAvailable ? (
            <div className="grid min-h-[55vh] place-items-center rounded-2xl bg-[#e8e5df] p-8 text-center text-stone-700">
              <div className="max-w-md">
                <div className="font-display text-2xl font-semibold">
                  A real 3D model is needed
                </div>
                <p className="my-3 text-sm leading-relaxed">
                  Jelly Lab now uses the product&apos;s actual geometry. This
                  product has no GLB model yet, so we won&apos;t replace it with
                  a fake sphere or a stretched product photo.
                </p>
                {imageUrl !== "/favicon.svg" && (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="mx-auto mt-5 max-h-64 max-w-full rounded-xl object-contain"
                  />
                )}
                <div className="mt-5 rounded-xl border border-stone-300 bg-white/70 p-4 text-left text-xs leading-relaxed">
                  Upload a <strong>.glb</strong> model in the product&apos;s
                  admin editor. Hand pick-up/drop and real mesh cutting will be
                  enabled when the model is available.
                </div>
              </div>
            </div>
          ) : (
            <div className="grid min-h-[55vh] place-items-center rounded-2xl bg-[#e8e5df] p-8 text-center text-stone-700">
              <div>
                <div className="font-display text-2xl font-semibold">
                  JELLY LAB
                </div>
                <p className="my-2 text-sm">
                  Interactive 3D is unavailable on this device.
                </p>
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="mx-auto mt-4 h-32 w-32 rounded-xl object-contain"
                />
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em] text-stone-500">
            <span className="rounded-full border border-stone-300 px-3 py-1.5">
              {hasModel
                ? `Simulation / ${paused ? "Paused" : "Live"}`
                : "Simulation / Waiting for model"}
            </span>
            <span className="rounded-full border border-stone-300 px-3 py-1.5">
              {hasModel
                ? tool === "hand"
                  ? "Hand study"
                  : "Cut study"
                : "Tools unavailable"}
            </span>
            <span className="rounded-full border border-stone-300 px-3 py-1.5">
              {canInteract
                ? "Product GLB mesh"
                : hasModel
                  ? "WebGL unavailable"
                  : "3D model required"}
            </span>
            <span className="rounded-full border border-stone-300 px-3 py-1.5">
              Pieces / {canInteract ? pieceCount : 0} of 14
            </span>
          </div>
        </section>

        <aside className="space-y-4">
          {!canInteract && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
              {hasModel
                ? "Hand and Knife need WebGL, which is unavailable in this browser."
                : "Hand and Knife are disabled until this product has a real GLB model. This avoids showing or cutting a made-up shape."}
            </div>
          )}
          <fieldset
            disabled={!canInteract}
            className="m-0 space-y-4 border-0 p-0 disabled:opacity-50"
          >
          <section className="rounded-2xl border border-stone-300 bg-[#f5f3ee] p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
              Tools
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTool("hand")}
                aria-pressed={tool === "hand"}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm ${tool === "hand" ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 hover:bg-stone-100"}`}
              >
                <Hand size={16} /> Hand
              </button>
              <button
                type="button"
                onClick={() => setTool("knife")}
                aria-pressed={tool === "knife"}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm ${tool === "knife" ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 hover:bg-stone-100"}`}
              >
                <KnifeIcon /> Knife
              </button>
            </div>
            <p className="mt-2 flex gap-1.5 text-xs text-stone-500">
              <CircleHelp size={14} className="mt-0.5 shrink-0" />
              {tool === "hand"
                ? "Pick up, move, and release the product. Drag the background to orbit."
                : "Swipe a line across the product mesh to cut it into pieces."}
            </p>
          </section>

          <section className="space-y-4 rounded-2xl border border-stone-300 bg-[#f5f3ee] p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
              Material / Simulation
            </div>
            <label className="block text-xs text-stone-600">
              Jelly color
              <select
                value={colorMode}
                onChange={(event) => setColorMode(event.target.value)}
                className="mt-1 w-full border-stone-300 bg-white text-stone-900"
              >
                <option value="original">Original product</option>
                <option value="clear">Clear</option>
                <option value="soft">Soft</option>
                <option value="dark">Dark</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            {colorMode === "custom" && (
              <label className="flex items-center justify-between text-xs text-stone-600">
                Custom tint
                <input
                  aria-label="Custom jelly color"
                  type="color"
                  value={customColor}
                  onChange={(event) => setCustomColor(event.target.value)}
                  className="h-9 w-14 cursor-pointer border-0 bg-transparent p-0"
                />
              </label>
            )}
            <label className="block text-xs text-stone-600">
              Firmness <span className="float-right">{Math.round(firmness * 100)}%</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={firmness}
                onChange={(event) => setFirmness(Number(event.target.value))}
                className="mt-2 w-full accent-violet-600"
              />
            </label>
            <label className="block text-xs text-stone-600">
              Damping <span className="float-right">{Math.round(damping * 100)}%</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={damping}
                onChange={(event) => setDamping(Number(event.target.value))}
                className="mt-2 w-full accent-violet-600"
              />
            </label>
          </section>

          <section className="rounded-2xl border border-stone-300 bg-[#f5f3ee] p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
              View
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResetKey((key) => key + 1)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 px-2 text-xs hover:bg-stone-100"
              >
                <RotateCcw size={15} /> Reset
              </button>
              <button
                type="button"
                onClick={() => setAutoRotate((value) => !value)}
                aria-pressed={autoRotate}
                className="min-h-11 rounded-lg border border-stone-300 px-2 text-xs hover:bg-stone-100"
              >
                Auto rotate {autoRotate ? "On" : "Off"}
              </button>
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 px-2 text-xs hover:bg-stone-100"
              >
                {paused ? <Play size={15} /> : <Pause size={15} />}
                {paused ? "Resume simulation" : "Pause simulation"}
              </button>
              <button
                type="button"
                onClick={() => setWireframe((value) => !value)}
                aria-pressed={wireframe}
                className="col-span-2 min-h-11 rounded-lg border border-stone-300 px-2 text-xs hover:bg-stone-100"
              >
                Wireframe {wireframe ? "On" : "Off"}
              </button>
              <button
                type="button"
                onClick={() => setNudgeKey((key) => key + 1)}
                className="col-span-2 min-h-11 rounded-lg border border-stone-300 px-2 text-xs hover:bg-stone-100"
              >
                Nudge object
              </button>
            </div>
          </section>
          </fieldset>

          <section className="rounded-2xl border border-stone-300 bg-white p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
              Real product / Unchanged
            </div>
            <div className="mt-2 flex items-center gap-3">
              {images[0]?.url && (
                <img
                  src={images[0].url}
                  alt=""
                  className="h-14 w-14 rounded-lg bg-stone-100 object-contain"
                />
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{product.name}</div>
                <div className="text-sm text-stone-500">{formatPrice(price)}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                to={`/product/${product.slug}`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-300 px-3 text-center text-xs hover:bg-stone-50"
              >
                View product
              </Link>
              <button
                type="button"
                onClick={addProductToCart}
                disabled={product.stock <= 0 || cartBusy}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                <ShoppingBag size={14} />
                {cartBusy ? "Adding…" : "Add to cart"}
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
              Jelly edits are temporary visual experiments. Product, price,
              stock, and orders are not changed.
            </p>
          </section>
        </aside>
      </div>
      <div className="px-5 pb-5 text-center text-[10px] uppercase tracking-[0.16em] text-stone-500">
        Keys: H hand · K knife · R reset · Space pause
      </div>
    </main>
  );
}
