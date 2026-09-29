import { Link, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { state } = useLocation();
  const storedOrders = (() => {
    try {
      return JSON.parse(localStorage.getItem("tryvoxel-demo-orders") || "[]");
    } catch {
      return [];
    }
  })();
  const order =
    state?.order || storedOrders.find((item) => item.id === orderId);

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
          ? "Your demo order was saved in this browser."
          : "Order details were not found. Please check your account orders."}
      </p>
      <div className="card p-6 text-left mb-8 inline-block mx-auto">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-ink-400">Order ID</div>
            <div className="font-mono">{order?.id || orderId}</div>
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
