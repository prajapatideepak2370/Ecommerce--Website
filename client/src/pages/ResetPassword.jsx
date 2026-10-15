import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This password reset link is invalid or has expired.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{5,128}$/.test(form.newPassword)) {
      setError("Use at least 5 characters with at least one letter and one number.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await authApi.resetPassword({ token, ...form });
      toast.success(result.message || "Password reset successfully.");
      navigate("/login", { replace: true });
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Couldn't reset your password.");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container min-h-[80vh] grid place-items-center py-14">
      <div className="w-full max-w-md card p-8">
        <h1 className="font-display text-2xl font-semibold gradient-text text-center">
          Choose a new password
        </h1>
        {!token ? (
          <div className="mt-5 text-center">
            <p role="alert" className="text-sm text-rose-300">
              This password reset link is invalid or has expired.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block mt-4 text-sm text-brand-300 link-underline"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-6">
            {[
              ["newPassword", "New password"],
              ["confirmPassword", "Confirm new password"],
            ].map(([name, label]) => (
              <label key={name} className="block">
                <span className="input-label">{label}</span>
                <input
                  type="password"
                  name={name}
                  required
                  minLength={5}
                  maxLength={128}
                  autoComplete="new-password"
                  value={form[name]}
                  onChange={updateField}
                  className="w-full"
                />
              </label>
            ))}
            <p className="text-xs text-ink-400">
              Use at least 5 characters, including a letter and a number.
            </p>
            {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full !py-3 disabled:opacity-60"
            >
              {submitting ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
