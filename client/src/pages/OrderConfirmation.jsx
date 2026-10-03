import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Package, ArrowRight, AlertTriangle } from "lucide-react";
import { orderApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { state } = useLocation();
  const [order, setOrder] = useState(state?.order || null);
  const [loading, setLoading] = useState(!state?.order);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (order || !orderId) return;
    let mounted = true;
    setLoading(true);
    setErr("");
    (async () => {
      try {
        const fetched = await orderApi.byId(orderId);
        if (mounted) setOrder(fetched);
      } catch (e) {
        if (mounted) setErr(getErrorMessage(e, "Could not load order details."));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) {
    return (
      <div className="page-container py-16 max-w-2xl mx-auto text-center">
        <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-emerald-500/10 grid place-items-center animate-pulse">
          <CheckCircle2 size={56} className="text-emerald-400/60" />
        </div>
        <div className="h-10 w-3/4 mx-auto bg-ink-800/50 rounded-lg animate-pulse mb-3" />
        <div className="h-5 w-1/2 mx-auto bg-ink-800/30 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="page-container py-16 max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="mx-auto mb-6 h-24 w-24 rounded-full bg-emerald-500/20 grid place-items-center"
      >
        <CheckCircle2 size={56} className="text-emerald-400" />
      </motion.div>
      <h1 className="font-display text-3xl md:text-5xl font-bold mb-2">
        Order{" "}
        <span className="gradient-text">
          {order ? "confirmed" : "status unavailable"}
        </span>
      </h1>
      <p className="text-ink-300 mt-2 mb-6">
        {order
          ? "Thank you! Your order has been placed and saved to your account."
          : err || "Order details were not found. Please check your account orders."}
      </p>
      {err && !order && (
        <div className="card p-4 border-amber-500/30 bg-amber-500/5 text-amber-300 text-sm inline-flex items-center gap-2 mb-6">
          <AlertTriangle size={16} /> {err}
        </div>
      )}
      <div className="card p-6 text-left mb-8 inline-block mx-auto">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-ink-400">Order ID</div>
            <div className="font-mono">
              {order?.orderNumber || order?._id || orderId}
            </div>
          </div>
          <div>
            <div className="text-emerald-300">
              {order?.payment?.status === "Pending" &&
              order?.payment?.provider === "COD"
                ? "Pending on delivery"
                : order?.payment?.status || "Unknown"}
            </div>
            <div className="text-brand-300 font-medium">
              {order?.orderStatus || "Unknown"}
            </div>
          </div>
          <div>
            <div className="text-ink-400">Payment</div>
            <div className="text-emerald-300">
              {order?.payment?.provider || "Unavailable"}
            </div>
          </div>
          <div>
            <div className="text-ink-400">Payment status</div>
            <div className="text-emerald-300">
              {order?.payment?.status || "Unknown"}
            </div>
          </div>
          <div>
            <div className="text-ink-400">Estimated</div>
            <div>3–5 business days</div>
          </div>
          {order?.totalAmount && (
            <div>
              <div className="text-ink-400">Total</div>
              <div className="font-semibold">
                ₹{Number(order.totalAmount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/account/orders" className="btn-primary inline-flex">
          <Package size={16} /> Track your order
        </Link>
        <Link to="/shop" className="btn-ghost inline-flex">
          Keep shopping <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
