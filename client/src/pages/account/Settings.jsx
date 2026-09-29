import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

export default function AccountSettings() {
  const [show, setShow] = useState(false);
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold mb-6">Settings</h2>
      <section className="space-y-4 mb-10">
        <h3 className="font-semibold">Change password</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Current password</label>
            <div className="relative">
              <input
                className="w-full pr-10"
                type={show ? "text" : "password"}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label="Toggle"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-md text-ink-400 hover:text-white"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="input-label">New password</label>
            <input className="w-full" />
          </div>
        </div>
        <button
          onClick={() => toast.success("Password updated (skeleton)")}
          className="btn-primary"
        >
          Update password
        </button>
      </section>

      <section>
        <h3 className="font-semibold mb-3">Notifications</h3>
        <div className="space-y-3 text-sm">
          {[
            ["Order updates", true],
            ["Shipping emails", true],
            ["Marketing drops", false],
          ].map(([k, v]) => (
            <label
              key={k}
              className="flex items-center justify-between p-3 rounded-lg border border-ink-800 bg-ink-900/40"
            >
              <span>{k}</span>
              <input type="checkbox" defaultChecked={v} className="h-5 w-5" />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
