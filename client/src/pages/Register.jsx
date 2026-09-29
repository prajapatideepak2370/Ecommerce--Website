import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { register } from "../store/authSlice.js";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", phone: "" });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await dispatch(register(form)).unwrap();
      toast.success("Account created. Welcome to TRYVOXEL³!");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Registration failed");
    }
  };

  return (
    <div className="page-container min-h-[80vh] grid place-items-center py-14">
      <div className="w-full max-w-lg card p-8">
        <div className="text-center mb-6">
          <div className="font-display text-2xl font-semibold gradient-text">Create account</div>
          <p className="text-sm text-ink-400 mt-1">Experiment. Create. Experience.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="input-label">Full name</label>
            <input required name="name" value={form.name} onChange={onChange} placeholder="Jasvinder Singh" className="w-full" autoComplete="name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Username</label>
              <input required name="username" value={form.username} onChange={onChange} placeholder="jasvinder" className="w-full" autoComplete="username" />
            </div>
            <div>
              <label className="input-label">Phone <span className="text-ink-500">(optional)</span></label>
              <input name="phone" value={form.phone} onChange={onChange} placeholder="+91…" className="w-full" autoComplete="tel" />
            </div>
          </div>
          <div>
            <label className="input-label">Email</label>
            <input required type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" className="w-full" autoComplete="email" />
          </div>
          <div>
            <label className="input-label">Password <span className="text-ink-500">(min 8 chars)</span></label>
            <div className="relative">
              <input required name="password" type={showPw ? "text" : "password"} value={form.password} onChange={onChange} className="w-full pr-10" autoComplete="new-password" minLength={8} />
              <button type="button" onClick={() => setShowPw(v => !v)} aria-label="Toggle password" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-md text-ink-400 hover:text-white">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full !py-3 mt-2">Create account</button>
        </form>
        <div className="mt-6 text-center text-sm text-ink-400">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-300 link-underline">Log in</Link>
        </div>
      </div>
    </div>
  );
}
