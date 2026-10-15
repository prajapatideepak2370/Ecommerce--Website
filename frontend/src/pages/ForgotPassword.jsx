import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const result = await authApi.requestPasswordReset({ email });
      const confirmation =
        result.message ||
        "If an account exists for this email, a password reset link will be sent.";
      setMessage(confirmation);
      toast.success("If an account exists, a reset link will be sent.");
    } catch (error) {
      const message = getErrorMessage(error, "Couldn't request a password reset.");
      setMessage(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container min-h-[80vh] grid place-items-center py-14">
      <div className="w-full max-w-md card p-8">
        <h1 className="font-display text-2xl font-semibold gradient-text text-center">
          Reset your password
        </h1>
        <p className="text-sm text-ink-400 text-center mt-2 mb-6">
          Enter the email address linked to your account.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="input-label">Email address</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full !py-3 disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
        {message && (
          <p role="status" className="text-sm text-ink-300 mt-4">{message}</p>
        )}
        <p className="text-sm text-center text-ink-400 mt-6">
          Remembered it?{" "}
          <Link to="/login" className="text-brand-300 link-underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
