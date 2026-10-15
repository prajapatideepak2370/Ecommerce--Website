import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { authApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";

export default function AccountSettings() {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{5,128}$/.test(form.newPassword)) {
      toast.error("Use at least 5 characters with at least one letter and one number.");
      return;
    }

    setSaving(true);
    try {
      const result = await authApi.changePassword(form);
      toast.success(result.message || "Password updated successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't update your password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold mb-6">Settings</h2>
      <section className="space-y-4 mb-10">
        <h3 className="font-semibold">Change password</h3>
        <form onSubmit={changePassword} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ["currentPassword", "Current password", "current-password"],
              ["newPassword", "New password", "new-password"],
              ["confirmPassword", "Confirm new password", "new-password"],
            ].map(([name, label, autoComplete]) => (
              <label key={name} className="block">
                <span className="input-label">{label}</span>
                <div className="relative">
                  <input
                    required
                    name={name}
                    type={show ? "text" : "password"}
                    value={form[name]}
                    onChange={updateField}
                    autoComplete={autoComplete}
                    className="w-full pr-10"
                  />
                  {name === "currentPassword" && (
                    <button
                      type="button"
                      onClick={() => setShow((visible) => !visible)}
                      aria-label={show ? "Hide passwords" : "Show passwords"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-md text-ink-400 hover:text-white"
                    >
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-ink-400">
            Use at least 5 characters, including a letter and a number.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? "Updating…" : "Update password"}
          </button>
        </form>
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
