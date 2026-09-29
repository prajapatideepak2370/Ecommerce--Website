import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CreditCard, QrCode, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { clearCart, selectCartItems } from "../store/cartSlice.js";

const ORDERS_STORAGE_KEY = "tryvoxel-demo-orders";
const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

const formatPrice = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function TestBarcode({ bars, reference }) {
  let x = 8;
  const marks = bars.map((width, index) => {
    const mark = { x, width, key: index };
    x += width + (index % 4 === 0 ? 3 : 2);
    return mark;
  });

  return (
    <div className="border border-ink-700 bg-white p-3 rounded-lg text-center">
      <svg
        role="img"
        aria-label="Random test barcode, not a scannable UPI payment code"
        viewBox={`0 0 ${Math.max(x, 320)} 96`}
        className="w-full h-24"
        preserveAspectRatio="none"
      >
        <rect width="100%" height="100%" fill="white" />
        {marks.map((mark) => (
          <rect
            key={mark.key}
            x={mark.x}
            y={8}
            width={mark.width}
            height={80}
            fill="#111827"
          />
        ))}
      </svg>
      <div className="font-mono text-xs tracking-widest text-ink-950">
        {reference}
      </div>
    </div>
  );
}

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const { subtotal, tax, shippingFee, totalAmount } = useSelector(
    (state) => state.cart,
  );
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [upiStatus, setUpiStatus] = useState("waiting");
  const [error, setError] = useState("");
  const [paymentReference] = useState(
    () => `TVX${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
  );
  const [barcode] = useState(() =>
    Array.from({ length: 96 }, () => Math.floor(Math.random() * 4) + 1),
  );

  const updateAddress = (event) => {
    setAddress((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const simulateUpiPayment = (result) => {
    setUpiStatus(result);
    if (result === "paid") toast.success("Test UPI payment marked successful");
    else toast.error("Test UPI payment failed. Order was not placed.");
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setError("");
    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }
    if (paymentMethod === "UPI" && upiStatus !== "paid") {
      setError(
        "Complete the UPI test payment successfully before placing the order.",
      );
      return;
    }

    const orderId = `TVX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      items: items.map((item) => ({
        name: item.productMeta?.name || "Product",
        quantity: item.quantity || 1,
        price: Number(
          item.unitPrice ||
            item.productMeta?.discountPrice ||
            item.productMeta?.price ||
            0,
        ),
      })),
      shippingAddress: address,
      subtotal,
      tax,
      shippingFee,
      totalAmount,
      payment: {
        provider: paymentMethod,
        status: paymentMethod === "UPI" ? "Paid" : "Pending",
        reference: paymentMethod === "UPI" ? paymentReference : "",
      },
      orderStatus: "Confirmed",
    };

    try {
      const savedOrders = JSON.parse(
        localStorage.getItem(ORDERS_STORAGE_KEY) || "[]",
      );
      localStorage.setItem(
        ORDERS_STORAGE_KEY,
        JSON.stringify([order, ...savedOrders]),
      );
      await dispatch(clearCart()).unwrap();
      navigate(`/order/confirmation/${orderId}`, { state: { order } });
    } catch {
      setError("Could not save your order in this browser. Please try again.");
    }
  };

  if (!items.length) {
    return (
      <div className="page-container py-16 text-center">
        <h1 className="font-display text-3xl font-semibold mb-3">
          Your cart is empty
        </h1>
        <p className="text-ink-400 mb-6">Add an item before checking out.</p>
        <button
          type="button"
          onClick={() => navigate("/shop")}
          className="btn-primary"
        >
          Browse shop
        </button>
      </div>
    );
  }

  return (
    <div className="page-container py-10">
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-8">
        <span className="gradient-text">Checkout</span>
      </h1>
      <form
        onSubmit={placeOrder}
        className="grid lg:grid-cols-[1fr_380px] gap-6"
      >
        <div className="space-y-6">
          <section className="card p-6 md:p-8">
            <h2 className="font-semibold flex items-center gap-2 mb-5">
              <Truck size={17} /> Shipping address
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ["fullName", "Full name", "text"],
                ["phone", "Phone", "tel"],
                ["line1", "Address line 1", "text"],
                ["line2", "Address line 2 (optional)", "text"],
                ["city", "City", "text"],
                ["state", "State", "text"],
                ["postalCode", "Postal code", "text"],
                ["country", "Country", "text"],
              ].map(([name, label, type]) => (
                <label
                  key={name}
                  className={
                    name === "line1" || name === "line2" ? "md:col-span-2" : ""
                  }
                >
                  <span className="input-label">{label}</span>
                  <input
                    name={name}
                    type={type}
                    value={address[name]}
                    onChange={updateAddress}
                    required={name !== "line2"}
                    minLength={name === "phone" ? 8 : undefined}
                    className="w-full"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="card p-6 md:p-8">
            <h2 className="font-semibold mb-4">Payment method</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  id: "COD",
                  label: "Cash on delivery",
                  icon: Truck,
                  detail: "Pay when your order arrives",
                },
                {
                  id: "UPI",
                  label: "UPI test payment",
                  icon: QrCode,
                  detail: "Use a simulated payment result",
                },
              ].map(({ id, label, icon: Icon, detail }) => (
                <label
                  key={id}
                  className={`cursor-pointer border rounded-lg p-4 flex gap-3 ${paymentMethod === id ? "border-brand-400 bg-brand-500/10" : "border-ink-700"}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={id}
                    checked={paymentMethod === id}
                    onChange={() => {
                      setPaymentMethod(id);
                      setUpiStatus("waiting");
                    }}
                    className="mt-1"
                  />
                  <span>
                    <span className="flex items-center gap-2 font-medium">
                      <Icon size={17} /> {label}
                    </span>
                    <span className="block text-xs text-ink-400 mt-1">
                      {detail}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {paymentMethod === "UPI" && (
              <div className="mt-5 grid sm:grid-cols-[220px_1fr] gap-5 items-center">
                <TestBarcode bars={barcode} reference={paymentReference} />
                <div>
                  <div className="text-sm font-medium mb-1">
                    Test payment reference
                  </div>
                  <p className="font-mono text-brand-200 mb-2">
                    {paymentReference}
                  </p>
                  <p className="text-xs text-ink-400 mb-4">
                    This random barcode is for demo testing only. It is not a
                    scannable UPI QR and does not transfer money.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => simulateUpiPayment("paid")}
                      className="btn-primary !py-2 text-sm"
                    >
                      Simulate success
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateUpiPayment("failed")}
                      className="btn-ghost !py-2 text-sm"
                    >
                      Simulate failure
                    </button>
                  </div>
                  <p
                    role="status"
                    className={`text-sm mt-3 ${upiStatus === "paid" ? "text-emerald-300" : upiStatus === "failed" ? "text-rose-300" : "text-ink-400"}`}
                  >
                    {upiStatus === "paid"
                      ? "Payment test successful. You can place the order."
                      : upiStatus === "failed"
                        ? "Payment test failed. The order will not be confirmed."
                        : "Waiting for test payment result."}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="card p-6 self-start lg:sticky lg:top-20">
          <h2 className="font-display text-xl font-semibold mb-4">
            Order summary
          </h2>
          <ul className="space-y-2 mb-5 text-sm">
            {items.map((item) => (
              <li
                key={item._id || item.product}
                className="flex justify-between gap-4"
              >
                <span className="text-ink-300">
                  {item.productMeta?.name || "Product"} × {item.quantity}
                </span>
                <span>
                  {formatPrice(
                    item.lineTotal ?? item.unitPrice * item.quantity,
                  )}
                </span>
              </li>
            ))}
          </ul>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-ink-400">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">Tax</dt>
              <dd>{formatPrice(tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">Shipping</dt>
              <dd>{shippingFee ? formatPrice(shippingFee) : "Free"}</dd>
            </div>
          </dl>
          <div className="h-px bg-ink-800 my-4" />
          <div className="flex justify-between mb-5 font-semibold text-lg">
            <span>Total</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
          {error && (
            <p role="alert" className="text-sm text-rose-300 mb-3">
              {error}
            </p>
          )}
          <p className="text-xs text-ink-500 mb-4 flex gap-2">
            <CreditCard size={14} className="shrink-0" /> Demo checkout stores
            this test order in this browser only.
          </p>
          <button type="submit" className="btn-primary w-full !py-3">
            {paymentMethod === "COD"
              ? "Confirm cash on delivery"
              : "Confirm UPI order"}
          </button>
        </aside>
      </form>
    </div>
  );
}
