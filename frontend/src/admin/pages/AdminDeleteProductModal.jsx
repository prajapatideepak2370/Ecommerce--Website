import { useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Archive, AlertTriangle, ShieldCheck } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { adminProductsApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";

export default function AdminDeleteProductModal({
  product,
  open,
  onClose,
  onSuccess,
}) {
  const [mode, setMode] = useState("soft");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [permFailed, setPermFailed] = useState(false);
  const [permError, setPermError] = useState("");

  const reset = () => {
    setMode("soft");
    setReason("");
    setPermFailed(false);
    setPermError("");
  };

  const run = async () => {
    if (!product?._id) return;
    setSubmitting(true);
    setPermFailed(false);
    setPermError("");
    try {
      if (mode === "soft") {
        await adminProductsApi.softDelete(product._id, reason || undefined);
        toast.success("Product soft-deleted.");
      } else {
        await adminProductsApi.permanentDelete(product._id, reason || undefined);
        toast.success("Product permanently deleted.");
      }
      onSuccess && onSuccess(mode);
      reset();
    } catch (e) {
      const msg = getErrorMessage(
        e,
        mode === "permanent"
          ? "Permanent delete failed."
          : "Delete failed.",
      );
      if (mode === "permanent") {
        setPermFailed(true);
        setPermError(msg);
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={() => {
        reset();
        onClose && onClose();
      }}
      onConfirm={run}
      title={
        mode === "permanent" ? "Permanently delete this product?" : "Delete this product?"
      }
      confirmLabel={
        mode === "permanent" ? "Permanently delete" : "Soft delete"
      }
      cancelLabel="Cancel"
      tone={mode === "permanent" ? "danger" : "warning"}
      icon={mode === "permanent" ? Trash2 : Archive}
      disabled={submitting}
    >
      {product && (
        <div className="rounded-lg bg-ink-900/50 border border-ink-800 p-3 text-sm">
          <div className="font-medium">{product.name}</div>
          {product.sku && (
            <div className="text-xs text-ink-400 mt-0.5">SKU {product.sku}</div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => setMode("soft")}
          className={`rounded-lg border p-3 text-left transition-colors ${
            mode === "soft"
              ? "border-brand-500/50 bg-brand-500/10"
              : "border-ink-700 hover:bg-ink-800/40"
          }`}
        >
          <div className="flex items-center gap-2 text-amber-300">
            <Archive size={16} /> <span className="font-medium">Soft delete</span>
          </div>
          <p className="text-xs text-ink-400 mt-1.5">
            Hides the product from customers. It can be restored later.
          </p>
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            setMode("permanent");
            setPermFailed(false);
          }}
          className={`rounded-lg border p-3 text-left transition-colors ${
            mode === "permanent"
              ? "border-rose-500/50 bg-rose-500/10"
              : "border-ink-700 hover:bg-ink-800/40"
          }`}
        >
          <div className="flex items-center gap-2 text-rose-300">
            <Trash2 size={16} />{" "}
            <span className="font-medium">Permanent delete</span>
          </div>
          <p className="text-xs text-ink-400 mt-1.5">
            Remove from database, images, and carts. Blocked if any order
            references this product.
          </p>
        </button>
      </div>

      {permFailed && permError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-200 text-xs p-3 flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-medium text-rose-300 mb-0.5">
              Permanent delete blocked
            </div>
            <div>{permError}</div>
            <div className="mt-1 text-rose-300/80">
              Try soft delete instead, or contact the lead to resolve order references.
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="input-label">Reason (optional)</label>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input w-full text-sm"
          placeholder="e.g. Discontinued, customer feedback, duplicate SKU."
        />
      </div>

      {mode === "permanent" && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-200 text-xs p-3 flex items-start gap-2">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-rose-300" />
          <div>
            This action is <strong>irreversible</strong>. Cloudinary images and
            the 3D model file (if present) will be deleted too.
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
