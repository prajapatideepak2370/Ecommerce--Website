import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useAdminAuth } from "../store/AuthContext.jsx";

export default function AdminLogin() {
  const { login, authError } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!identifier || !password) {
      setErr("Please fill all fields.");
      return;
    }
    setSubmitting(true);
    const payload = /@/.test(identifier)
      ? { email: identifier.trim(), password }
      : { username: identifier.trim(), password };
    try {
      await login(payload);
      const to = location.state?.from?.pathname || "/";
      navigate(to, { replace: true });
      toast.success("Signed in.");
    } catch (e2) {
      setErr(e2.message || "Invalid credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink-950">
      <div className="hidden lg:flex relative items-center justify-center p-12 overflow-hidden border-r border-ink-800 bg-[radial-gradient(ellipse_at_top,rgba(101,94,255,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(7,209,199,0.15),transparent_60%)]">
        <div className="absolute top-12 left-12 font-display text-xs uppercase tracking-[0.3em] text-ink-500">
          TRYVOXEL³ Console
        </div>
        <div className="max-w-md space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-200 text-xs uppercase tracking-[0.2em]">
            <ShieldCheck size={14} /> Secure Access
          </div>
          <h1 className="font-display text-4xl leading-tight gradient-text">
            Experiment. Create. Experience.
          </h1>
          <p className="text-ink-400 text-sm leading-relaxed">
            Sign in to manage the catalog, inventory, and categories for the
            TRYVOXEL³ storefront. Access is restricted to authorized team
            members.
          </p>
          <div className="text-[11px] text-ink-600">
            All actions are logged.
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent grid place-items-center">
              <span className="font-display font-bold text-ink-950">T³</span>
            </div>
            <div>
              <div className="font-display font-semibold gradient-text">
                TRYVOXEL³
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">
                Console
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-2xl">Sign in</h2>
            <p className="text-ink-400 text-sm">
              Use your console credentials (username or email).
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="input-label">Username or Email</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                className="input w-full"
                placeholder="console@tryvoxel.ai"
              />
            </div>
            <div className="space-y-1.5">
              <label className="input-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="input w-full"
                placeholder="••••••••"
              />
            </div>
            {(err || authError) && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm px-3 py-2">
                {err || authError}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <div className="text-[11px] text-ink-600">
            Need an admin account? Create one with{" "}
            <code className="px-1 py-0.5 rounded bg-ink-900 border border-ink-800">
              npm run create-admin
            </code>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
