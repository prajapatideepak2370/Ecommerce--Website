import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { login, selectIsAuthenticated, selectAuthLoading } from "../store/authSlice.js";
import { fetchCart } from "../store/cartSlice.js";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authLoading = useSelector(selectAuthLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const from = location.state?.from?.pathname || "/";

  if (isAuthenticated) navigate(from, { replace: true });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(form)).unwrap();
      await dispatch(fetchCart());
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Login failed");
    }
  };

  return (
    <div className="page-container min-h-[80vh] grid place-items-center py-14">
      <div className="w-full max-w-md card p-8">
        <div className="text-center mb-6">
          <div className="font-display text-2xl font-semibold gradient-text">Welcome back</div>
          <p className="text-sm text-ink-400 mt-1">Log in to TRYVOXEL³</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="input-label">Username or email</label>
            <input required name="username" value={form.username} onChange={onChange} placeholder="you@example.com" className="w-full" autoComplete="username" />
          </div>
          <div>
            <label className="input-label">Password</label>
            <div className="relative">
              <input required name="password" type={showPw ? "text" : "password"} value={form.password} onChange={onChange} className="w-full pr-10" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(v => !v)} aria-label="Toggle password" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-md text-ink-400 hover:text-white">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={authLoading} className="btn-primary w-full !py-3 mt-2">
            {authLoading ? "Logging in…" : "Log in"}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-ink-400">
          New here?{" "}
          <Link to="/register" className="text-brand-300 link-underline">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
