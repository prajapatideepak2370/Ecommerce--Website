import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { addressApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/authSlice.js";

const EMPTY_ADDRESS = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  isDefault: false,
};

const ADDRESS_FORM_FIELDS = Object.keys(EMPTY_ADDRESS);

const addressFields = [
  ["fullName", "Full name", "text"],
  ["phone", "Phone number", "tel"],
  ["line1", "House / flat and street", "text"],
  ["line2", "Locality, landmark (optional)", "text"],
  ["city", "City", "text"],
  ["state", "State / region", "text"],
  ["postalCode", "Postal code", "text"],
  ["country", "Country", "text"],
];

export default function Addresses() {
  const user = useSelector(selectUser);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ADDRESS);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const result = await addressApi.list();
      setAddresses(Array.isArray(result) ? result : []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't load your saved addresses."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const startNewAddress = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_ADDRESS,
      fullName: user?.name || "",
      phone: user?.phone || "",
      isDefault: addresses.length === 0,
    });
    setShowForm(true);
  };

  const startEditing = (address) => {
    setEditingId(address._id);
    setForm(
      Object.fromEntries(
        ADDRESS_FORM_FIELDS.map((field) => [
          field,
          address[field] ?? EMPTY_ADDRESS[field],
        ]),
      ),
    );
    setShowForm(true);
  };

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await addressApi.update(editingId, form);
        toast.success("Address updated.");
      } else {
        await addressApi.create(form);
        toast.success("Address saved.");
      }
      setShowForm(false);
      setEditingId(null);
      await loadAddresses();
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't save this address."));
    } finally {
      setSaving(false);
    }
  };

  const removeAddress = async (address) => {
    if (!window.confirm(`Remove the ${address.label || "saved"} address?`)) {
      return;
    }
    try {
      await addressApi.remove(address._id);
      toast.success("Address removed.");
      await loadAddresses();
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't remove this address."));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="font-display text-2xl font-semibold">Saved Addresses</h2>
        <button
          type="button"
          onClick={startNewAddress}
          className="btn-primary !py-2 text-sm"
        >
          <Plus size={16} /> Add address
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveAddress} className="card p-5 md:p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {editingId ? "Edit address" : "Add an address"}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close address form"
              className="btn-ghost !p-2"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label>
              <span className="input-label">Address label</span>
              <input
                required
                name="label"
                value={form.label}
                onChange={updateField}
                maxLength={50}
                className="w-full"
              />
            </label>
            {addressFields.map(([name, label, type]) => (
              <label
                key={name}
                className={name === "line1" || name === "line2" ? "md:col-span-2" : ""}
              >
                <span className="input-label">{label}</span>
                <input
                  required={name !== "line2"}
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={updateField}
                  minLength={name === "phone" ? 8 : name === "line1" ? 3 : undefined}
                  maxLength={name === "line1" || name === "line2" ? 255 : undefined}
                  className="w-full"
                />
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={updateField}
              className="h-4 w-4"
            />
            Set as my default address
          </label>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Save address"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-ink-400" role="status">Loading addresses…</p>
      ) : addresses.length === 0 ? (
        <div className="card p-8 text-center">
          <MapPin size={28} className="mx-auto mb-3 text-brand-300" />
          <h3 className="font-semibold">No address added yet</h3>
          <p className="text-sm text-ink-400 mt-1 mb-4">
            Add a shipping address to use it at checkout.
          </p>
          <button
            type="button"
            onClick={startNewAddress}
            className="btn-primary !py-2 text-sm"
          >
            <Plus size={16} /> Add address
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <article key={address._id} className="card p-5 relative">
              {address.isDefault && (
                <span className="absolute top-4 right-4 chip !py-0.5 text-xs border-brand-500/30 bg-brand-500/10 text-brand-200">
                  Default
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-brand-300" />
                <span className="font-medium">{address.label || "Address"}</span>
              </div>
              <div className="text-sm text-ink-200 space-y-1">
                <div>{address.fullName} · {address.phone}</div>
                <div className="text-ink-400">
                  {address.line1}
                  {address.line2 && <><br />{address.line2}</>}
                  <br />
                  {[address.city, address.state, address.postalCode, address.country]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => startEditing(address)}
                  className="btn-ghost !py-1.5 text-xs"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeAddress(address)}
                  className="btn-ghost !py-1.5 text-xs text-rose-300"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
