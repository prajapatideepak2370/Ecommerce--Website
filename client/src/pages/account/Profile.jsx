import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/authSlice.js";
import { Pencil, Package, MapPin } from "lucide-react";

export default function Profile() {
  const user = useSelector(selectUser);
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold mb-6">My Profile</h2>
      <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
        <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-brand-500/40 to-accent/30 grid place-items-center font-display text-3xl font-semibold">
          {user?.name?.[0] || "U"}
        </div>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Full name</label>
              <input defaultValue={user?.name || ""} className="w-full" />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input defaultValue={user?.email || ""} className="w-full" />
            </div>
            <div>
              <label className="input-label">Username</label>
              <input defaultValue={user?.username || ""} className="w-full" />
            </div>
            <div>
              <label className="input-label">Phone</label>
              <input defaultValue={user?.phone || ""} className="w-full" />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary inline-flex">
              <Pencil size={16} /> Save changes
            </button>
          </div>
        </div>
      </div>
      <div className="mt-10 grid md:grid-cols-2 gap-4">
        <Link
          to="/account/orders"
          className="card p-5 hover:shadow-glow transition"
        >
          <Package size={24} className="text-brand-300 mb-3" />
          <div className="font-semibold">My orders</div>
          <div className="text-xs text-ink-400 mt-1">
            Track orders, request returns
          </div>
        </Link>
        <Link
          to="/account/addresses"
          className="card p-5 hover:shadow-glow transition"
        >
          <MapPin size={24} className="text-brand-300 mb-3" />
          <div className="font-semibold">Addresses</div>
          <div className="text-xs text-ink-400 mt-1">
            Manage shipping addresses
          </div>
        </Link>
      </div>
    </div>
  );
}
