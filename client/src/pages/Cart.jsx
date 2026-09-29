import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCartItems,
  updateQty,
  removeItem,
  clearCart,
  fetchCart,
} from "../store/cartSlice.js";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function Cart() {
  const items = useSelector(selectCartItems);
  const { subtotal, tax, shippingFee, totalAmount } = useSelector(
    (state) => state.cart,
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const setQty = async (id, q) => {
    try {
      await dispatch(updateQty({ itemId: id, quantity: q })).unwrap();
    } catch (err) {
      toast.error(err?.message || "Could not update quantity");
    }
  };

  const remove = async (id) => {
    try {
      await dispatch(removeItem(id)).unwrap();
      toast.success("Item removed from cart");
    } catch (err) {
      toast.error(err?.message || "Could not remove item");
    }
  };

  const clear = async () => {
    if (!confirm("Clear entire cart?")) return;
    try {
      await dispatch(clearCart()).unwrap();
      toast.success("Cart cleared");
    } catch (err) {
      toast.error(err?.message || "Could not clear cart");
    }
  };

  return (
    <div className="page-container py-10">
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-8">
        Your <span className="gradient-text">Cart</span>
      </h1>
      {!items.length ? (
        <div className="card p-14 text-center">
          <ShoppingBag size={48} className="mx-auto mb-4 text-brand-300" />
          <h2 className="font-display text-xl mb-2">Your cart is empty</h2>
          <p className="text-ink-400 mb-6 text-sm max-w-md mx-auto">
            Add some experimental voxel-powered goods to get started.
          </p>
          <Link to="/shop" className="btn-primary">
            Browse shop
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="card divide-y divide-ink-800">
            {items.map((it) => (
              <div key={it._id || it.product} className="p-5 flex gap-4">
                <div className="h-24 w-24 rounded-xl bg-white grid place-items-center shrink-0 overflow-hidden">
                  {it.productMeta?.images?.[0]?.url ? (
                    <img
                      src={it.productMeta.images[0].url}
                      alt={it.productMeta.name || ""}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <ShoppingBag size={22} className="text-brand-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${it.productMeta?.slug || ""}`}
                    className="font-medium truncate block"
                  >
                    {it.productMeta?.name || "Unavailable product"}
                  </Link>
                  <div className="text-sm text-ink-400 mt-0.5">
                    {it.productMeta?.stock === 0
                      ? "Out of stock"
                      : `In stock: ${it.productMeta?.stock ?? 0}`}
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="inline-flex items-center border border-ink-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          setQty(it._id, Math.max(1, (it.quantity || 1) - 1))
                        }
                        disabled={it.quantity <= 1}
                        className="h-8 w-8 grid place-items-center hover:bg-ink-800 disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <div className="h-8 w-10 grid place-items-center font-medium text-sm">
                        {it.quantity || 1}
                      </div>
                      <button
                        onClick={() => setQty(it._id, (it.quantity || 1) + 1)}
                        disabled={it.quantity >= (it.productMeta?.stock ?? 0)}
                        className="h-8 w-8 grid place-items-center hover:bg-ink-800 disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => remove(it._id)}
                      className="text-rose-300 hover:text-rose-200 text-sm inline-flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold">
                    ₹
                    {(
                      it.lineTotal ?? (it.unitPrice ?? 0) * it.quantity
                    ).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <aside className="card p-6 self-start lg:sticky lg:top-20">
            <h3 className="font-display text-xl font-semibold mb-4">
              Order summary
            </h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-ink-400">Subtotal</dt>
                <dd>₹{subtotal.toLocaleString("en-IN")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Tax (18%)</dt>
                <dd>₹{tax.toLocaleString("en-IN")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Shipping</dt>
                <dd className={shippingFee === 0 ? "text-emerald-300" : ""}>
                  {shippingFee === 0
                    ? "Free"
                    : `₹${shippingFee.toLocaleString("en-IN")}`}
                </dd>
              </div>
            </dl>
            <div className="h-px bg-ink-800 my-4" />
            <div className="flex justify-between mb-4 font-semibold text-lg">
              <span>Total</span>
              <span>₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="btn-primary w-full mb-3"
            >
              Proceed to checkout
            </button>
            <button onClick={clear} className="btn-ghost w-full text-sm">
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
