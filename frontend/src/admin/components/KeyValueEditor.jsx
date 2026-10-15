import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "../../utils/cn.js";

function sanitizeKey(k) {
  return String(k || "")
    .replace(/[^a-zA-Z0-9_ .-]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\.+/g, ".");
}

export default function KeyValueEditor({
  value = {},
  onChange = () => {},
  placeholderKey = "Key (e.g. Weight)",
  placeholderValue = "Value (e.g. 2.5 kg)",
  addLabel = "Add row",
}) {
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [error, setError] = useState("");

  const keys = Object.keys(value || {});

  const addRow = () => {
    const k = sanitizeKey(newKey);
    const v = String(newVal || "").trim();
    if (!k) {
      setError("Key is required.");
      return;
    }
    if (keys.includes(k)) {
      setError("Keys must be unique.");
      return;
    }
    setError("");
    onChange({ ...value, [k]: v });
    setNewKey("");
    setNewVal("");
  };

  const removeRow = (k) => {
    const next = { ...value };
    delete next[k];
    onChange(next);
  };

  const updateRow = (k, v) => {
    onChange({ ...value, [k]: v });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-ink-800 overflow-hidden">
        {keys.length === 0 ? (
          <div className="text-center text-xs text-ink-500 py-5">
            No specifications yet. Add your first row below.
          </div>
        ) : (
          <ul className="divide-y divide-ink-800">
            {keys.map((k) => (
              <li
                key={k}
                className="grid grid-cols-12 gap-2 items-center px-3 py-2.5"
              >
                <div className="col-span-4 flex items-center gap-2 text-sm text-ink-200 truncate">
                  <span className="text-ink-500">#</span>
                  <span className="truncate">{k}</span>
                </div>
                <div className="col-span-7">
                  <input
                    value={value[k]}
                    onChange={(e) => updateRow(k, e.target.value)}
                    className="w-full input-sm"
                    placeholder={placeholderValue}
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRow(k)}
                    className="h-8 w-8 rounded-md grid place-items-center text-ink-300 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid grid-cols-12 gap-2 items-center">
        <div className="col-span-4">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="w-full input-sm"
            placeholder={placeholderKey}
          />
        </div>
        <div className="col-span-7">
          <input
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRow())}
            className="w-full input-sm"
            placeholder={placeholderValue}
          />
        </div>
        <div className="col-span-1 flex justify-end">
          <button
            type="button"
            onClick={addRow}
            className="h-9 w-9 rounded-md grid place-items-center bg-brand-500 text-white hover:bg-brand-400"
            aria-label={addLabel}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      {error && (
        <div className="text-xs text-rose-300 pl-1 flex items-start gap-2">
          <X size={14} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
