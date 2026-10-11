import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CreditCard, Loader2, ShieldCheck, Truck } from "lucide-react";
import { clearCart, selectCartItems } from "../store/cartSlice.js";
import { orderApi } from "../api/endpoints.js";

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

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      return resolve(window.Razorpay);
    }
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      const timeout = window.setTimeout(
        () => reject(new Error("Failed to load Razorpay checkout")),
        15000,
      );
      const onLoad = () => {
        window.clearTimeout(timeout);
        if (window.Razorpay) resolve(window.Razorpay);
        else reject(new Error("Failed to load Razorpay checkout"));
      };
      const onError = () => {
        window.clearTimeout(timeout);
        existing.remove();
        reject(new Error("Failed to load Razorpay checkout"));
      };
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener(
        "error",
        onError,
        { once: true },
      );
      if (window.Razorpay) {
        window.clearTimeout(timeout);
        resolve(window.Razorpay);
      }
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error("Failed to load Razorpay checkout"));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("Failed to load Razorpay checkout"));
    };
    document.body.appendChild(script);
  });
}

function getPaymentErrorMessage(error) {
  const status = error?.response?.status;
  const code = error?.code;
  if (!error?.response) {
    return code === "ECONNABORTED"
      ? "The payment request timed out. Check your connection and try again."
      : "We couldn't reach the payment service. Check your connection and try again.";
  }
  if (status === 401) {
    return "Your session has expired. Sign in again before placing your order.";
  }
  if (status === 403) {
    return "You are not allowed to complete this payment. Please sign in and try again.";
  }
  if (status === 429) {
    return "Too many payment attempts. Please wait a moment and try again.";
  }
  if (status >= 500) {
    return "The payment service is temporarily unavailable. Your cart is safe; please try again shortly.";
  }
  if (status === 400 || status === 404 || status === 409 || status === 422) {
    return (
      error.response?.data?.error?.message ||
      "We couldn't confirm this payment. Please review your cart and try again."
    );
  }
  return "We couldn't start the payment. Please try again.";
}

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const { subtotal, tax, shippingFee, totalAmount } = useSelector(
    (state) => state.cart,
  );
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [error, setError] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");
  const [paying, setPaying] = useState(false);
  const paymentInProgress = useRef(false);

  const updateAddress = (event) => {
    setAddress((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const buildOrderItems = () =>
    items.map((item) => ({
      product: item.product || item._id,
      name: item.productMeta?.name || item.name || "Product",
      image: item.productMeta?.images?.[0]?.url || item.image || "",
      quantity: Number(item.quantity || 1),
      unitPrice: Number(
        item.unitPrice ||
          item.productMeta?.discountPrice ||
          item.productMeta?.price ||
          0,
      ),
      productMeta: item.productMeta || {},
    }));

  const handlePayment = async (event) => {
    event.preventDefault();
    setError("");
    setPaymentNotice("");

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    const required = ["fullName", "phone", "line1", "city", "state", "postalCode", "country"];
    const missing = required.find((field) => !address[field]?.trim());
    if (missing) {
      setError("Please fill in all required shipping address fields.");
      return;
    }
    if (paymentInProgress.current) return;

    const orderItems = buildOrderItems();

    try {
      paymentInProgress.current = true;
      setPaying(true);

      const Razorpay = await loadRazorpayScript();

      const razorpayOrder = await orderApi.createRazorpayOrder({
        shippingAddress: address,
        items: orderItems,
      });

      const amountPaise = Number(razorpayOrder.amountPaise);
      if (
        !razorpayOrder.key ||
        !razorpayOrder.orderId ||
        typeof razorpayOrder.isTestMode !== "boolean" ||
        !Number.isSafeInteger(amountPaise) ||
        amountPaise < 100
      ) {
        throw new Error("Invalid payment order response");
      }

      if (razorpayOrder.isTestMode) {
        setPaymentNotice(
          "Razorpay Test Mode is active. UPI QR codes cannot be scanned in Test Mode. Use another test payment method; UPI QR scanning requires Live Mode.",
        );
      }

      const options = {
        key: razorpayOrder.key,
        amount: amountPaise,
        currency: razorpayOrder.currency || "INR",
        name: "TRYVOXEL³",
        description: razorpayOrder.isTestMode
          ? "Test Mode — UPI QR scanning is unavailable"
          : "Order Payment",
        order_id: razorpayOrder.orderId,
        config: {
          display: {
            blocks: {
              paymentOptions: {
                name: "All Payment Options",
                instruments: [
                  { method: "upi" },
                  { method: "card" },
                  { method: "wallet" },
                  { method: "netbanking" },
                ],
              },
            },
            sequence: ["block.paymentOptions"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        prefill: {
          name: address.fullName,
          contact: address.phone,
        },
        notes: {
          receipt: razorpayOrder.receipt,
        },
        theme: {
          color: "#0f172a",
        },
        handler: async (response) => {
          try {
            const created = await orderApi.verifyRazorpayPayment({
              shippingAddress: address,
              items: orderItems,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            const orderId = created?._id || created?.orderNumber;
            if (!orderId) {
              throw new Error("The payment was not confirmed as an order");
            }
            try {
              await dispatch(clearCart()).unwrap();
            } catch (_clearErr) {
              // ignore cart clear errors after successful order
            }
            navigate(`/order/confirmation/${orderId}`, {
              state: { order: created },
            });
          } catch (verifyErr) {
            setError(
              verifyErr?.response?.status === 409
                ? "Your payment is still being confirmed. Check My Orders before trying to pay again."
                : "The payment may have gone through, but we couldn't confirm your order. Please check My Orders before trying again or contact support.",
            );
            paymentInProgress.current = false;
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            paymentInProgress.current = false;
            setPaying(false);
            setError("Payment was cancelled. You can try again.");
          },
        },
      };

      const rzp = new Razorpay(options);
      rzp.on("payment.failed", () => {
        paymentInProgress.current = false;
        setPaying(false);
        setError(
          "Your payment failed, or the UPI QR expired. Start a fresh checkout to get a new QR code, or try another payment method.",
        );
      });
      rzp.open();
    } catch (e) {
      paymentInProgress.current = false;
      setPaying(false);
      setError(
        e?.message === "Invalid payment order response"
          ? "We couldn't confirm the payment amount. Refresh your cart and try again."
          : e?.response
            ? getPaymentErrorMessage(e)
            : e?.message?.includes("Razorpay checkout")
              ? "The payment window couldn't load. Check your connection and try again."
              : e?.code === "ECONNABORTED"
                ? getPaymentErrorMessage(e)
                : "We couldn't start your payment. Please try again.",
      );
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
        onSubmit={handlePayment}
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
            <div className="border rounded-lg p-4 flex gap-3 border-brand-400 bg-brand-500/10">
              <CreditCard size={20} className="text-brand-300 mt-0.5" />
              <span>
                <span className="flex items-center gap-2 font-medium">
                  Razorpay
                </span>
                <span className="block text-xs text-ink-400 mt-1">
                  Pay with UPI apps like PhonePe, Paytm, or Google Pay, as well
                  as cards, net banking, or wallets. Choose your UPI app in the
                  Razorpay payment window.
                </span>
                {paymentNotice && (
                  <span
                    role="status"
                    className="block mt-2 text-xs text-amber-300"
                  >
                    {paymentNotice}
                  </span>
                )}
              </span>
            </div>
            <p className="flex items-center gap-2 mt-4 text-xs text-ink-400">
              <ShieldCheck size={14} className="text-emerald-400" />
              Payments are secured and verified by Razorpay.
            </p>
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
              <dt className="text-ink-400">Tax / GST</dt>
              <dd>{formatPrice(tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">Shipping</dt>
              <dd>{formatPrice(shippingFee)}</dd>
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
            <CreditCard size={14} className="shrink-0" /> By confirming, your
            order will be saved to your account and visible in My Orders.
          </p>
          <button
            type="submit"
            disabled={paying}
            className="btn-primary w-full !py-3 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {paying ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Processing
                payment…
              </>
            ) : (
              `Pay ${formatPrice(totalAmount)}`
            )}
          </button>
        </aside>
      </form>
    </div>
  );
}
