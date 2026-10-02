import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  FolderKanban,
  Upload,
  X,
  Box,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminCategoriesApi, adminProductsApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import DataTable from "../components/DataTable.jsx";
import TableSkeleton from "../components/TableSkeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { cn } from "../../utils/cn.js";

const MAX_IMG = 5 * 1024 * 1024;
const IMG_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/avif"];

function sanitizeSlug(v) {
  return String(v || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesManager() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [form, setForm] = useState({
    _id: null,
    name: "",
    slug: "",
    description: "",
    isActive: true,
    image: null,
    imageUrl: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteFor, setDeleteFor] = useState(null);
  const [reassignOptions, setReassignOptions] = useState([]);
  const [reassignTo, setReassignTo] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await adminCategoriesApi.list({
        limit: 200,
        search: search || undefined,
        includeInactive: true,
      });
      setRows(data?.docs || []);
      setReassignOptions(data?.docs || []);
    } catch (e) {
      setErr(getErrorMessage(e, "Failed to load categories."));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
    setSlugEdited(false);
    setFormErrors({});
    setForm({
      _id: null,
      name: "",
      slug: "",
      description: "",
      isActive: true,
      image: null,
      imageUrl: "",
    });
    setImagePreview(null);
  };

  const startEdit = (row) => {
    setCreating(false);
    setEditing(row._id);
    setSlugEdited(false);
    setFormErrors({});
    setForm({
      _id: row._id,
      name: row.name || "",
      slug: row.slug || "",
      description: row.description || "",
      isActive: row.isActive !== false,
      image: null,
      imageUrl: row.image?.url || "",
    });
    setImagePreview(row.image?.url || null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setCreating(false);
    setSlugEdited(false);
    setFormErrors({});
    setForm({
      _id: null,
      name: "",
      slug: "",
      description: "",
      isActive: true,
      image: null,
      imageUrl: "",
    });
    setImagePreview(null);
  };

  const onImagePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!IMG_TYPES.includes(f.type)) {
      toast.error("Unsupported image type.");
      return;
    }
    if (f.size > MAX_IMG) {
      toast.error("Image must be ≤ 5 MB.");
      return;
    }
    setForm((x) => ({ ...x, image: f, imageUrl: "" }));
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const removeImage = async () => {
    if (editing && form._id && form.imageUrl) {
      try {
        await adminCategoriesApi.deleteImage(form._id);
        toast.success("Image removed.");
      } catch (e) {
        toast.error(getErrorMessage(e, "Failed to remove image."));
        return;
      }
    }
    setForm((x) => ({ ...x, image: null, imageUrl: "" }));
    setImagePreview(null);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveForm = async () => {
    if (!validateForm()) {
      toast.error("Please correct the errors.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug ? sanitizeSlug(form.slug) : undefined,
        description: form.description?.trim() || undefined,
        isActive: form.isActive,
      };
      let saved;
      if (creating) {
        saved = await adminCategoriesApi.create(payload);
      } else {
        saved = await adminCategoriesApi.update(editing, payload);
      }
      const targetId = saved?._id || editing;
      if (form.image && targetId) {
        try {
          await adminCategoriesApi.uploadImage(targetId, form.image);
        } catch (e) {
          toast.error(getErrorMessage(e, "Failed to upload image."));
        }
      }
      toast.success(creating ? "Category created." : "Category updated.");
      cancelEdit();
      fetchCategories();
    } catch (e) {
      toast.error(getErrorMessage(e, "Save failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async () => {
    if (!deleteFor) return;
    setDeleteBusy(true);
    try {
      await adminCategoriesApi.delete(deleteFor._id, reassignTo || undefined);
      toast.success("Category deleted.");
      setDeleteFor(null);
      setReassignTo("");
      fetchCategories();
    } catch (e) {
      toast.error(getErrorMessage(e, "Delete failed."));
    } finally {
      setDeleteBusy(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        label: "Category",
        accessor: "name",
        cell: (row) => (
          <div className="flex items-center gap-3 min-w-0 max-w-sm">
            <div className="h-11 w-11 rounded-lg overflow-hidden bg-ink-800 grid place-items-center shrink-0">
              {row.image?.url ? (
                <img
                  src={row.image.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <FolderKanban size={16} className="text-ink-500" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{row.name}</div>
              <div className="text-xs text-ink-400 truncate">
                /{row.slug || row._id}
              </div>
            </div>
          </div>
        ),
      },
      {
        label: "Products",
        accessor: "productCount",
        sortKey: "productCount",
        width: "120px",
        align: "right",
        cell: (row) => (
          <span className="chip bg-ink-800/60 border border-ink-700">
            <Box size={12} className="inline mr-1" /> {row.productCount ?? 0}
          </span>
        ),
      },
      {
        label: "Status",
        accessor: "isActive",
        width: "110px",
        cell: (row) => (
          <span
            className={cn(
              "chip border",
              row.isActive
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : "bg-ink-700/60 text-ink-200 border-ink-600/70",
            )}
          >
            {row.isActive ? "● Active" : "○ Inactive"}
          </span>
        ),
      },
      {
        label: "",
        align: "right",
        width: "140px",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              className="btn-ghost gap-1"
              onClick={() => startEdit(row)}
            >
              <Edit3 size={14} /> Edit
            </button>
            <button
              className={cn(
                "btn-ghost gap-1",
                (row.productCount ?? 0) > 0
                  ? "text-amber-300"
                  : "text-rose-300",
              )}
              onClick={() => {
                setDeleteFor(row);
                setReassignTo("");
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Categories</h1>
          <p className="text-sm text-ink-400 mt-1">
            Organize products. Deletion is blocked when products exist unless
            you reassign them first.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(creating || editing) && (
            <button className="btn-ghost" onClick={cancelEdit}>
              Cancel edit
            </button>
          )}
          <button className="btn btn-primary gap-2" onClick={startCreate}>
            <Plus size={14} /> New Category
          </button>
        </div>
      </div>

      {(creating || editing) && (
        <div className="card p-5 space-y-4 border-brand-500/30 bg-brand-500/[.02]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">
              {creating ? "New Category" : "Edit Category"}
            </h2>
            <button
              className="btn btn-primary gap-2"
              onClick={saveForm}
              disabled={submitting}
            >
              <Save size={14} />
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label className="input-label">Name *</label>
              <input
                className={`input w-full ${formErrors.name ? "border-rose-500/50" : ""}`}
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((x) => ({
                    ...x,
                    name,
                    slug: slugEdited ? x.slug : sanitizeSlug(name),
                  }));
                }}
              />
              {formErrors.name && (
                <p className="text-xs text-rose-300 mt-1">{formErrors.name}</p>
              )}
            </div>
            <div className="md:col-span-1">
              <label className="input-label">Slug</label>
              <input
                className="input w-full"
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setForm((x) => ({ ...x, slug: sanitizeSlug(e.target.value) }))
                }}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((x) => ({ ...x, isActive: e.target.checked }))
                }
              />
              Active
            </label>
            <div className="md:col-span-2">
              <label className="input-label">Description</label>
              <textarea
                rows={2}
                className="input w-full"
                value={form.description}
                onChange={(e) =>
                  setForm((x) => ({ ...x, description: e.target.value }))
                }
                placeholder="Short summary for the collection page."
              />
            </div>
            <div className="md:col-span-2">
              <label className="input-label">Image</label>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                <div className="md:col-span-1">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden border border-ink-800 bg-ink-900 grid place-items-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FolderKanban size={28} className="text-ink-600" />
                    )}
                  </div>
                </div>
                <div className="md:col-span-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="btn-ghost cursor-pointer gap-2">
                      <Upload size={14} />
                      {imagePreview ? "Replace image" : "Upload image"}
                      <input
                        type="file"
                        accept={IMG_TYPES.join(",")}
                        onChange={onImagePick}
                        className="hidden"
                      />
                    </label>
                    {imagePreview && (
                      <button
                        className="btn-ghost gap-2 text-rose-300"
                        onClick={removeImage}
                      >
                        <X size={14} /> Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-ink-500">
                    PNG, JPG, WEBP, or AVIF — up to 5 MB.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="input w-full pl-9"
          />
        </div>
      </div>

      {err && (
        <div className="card p-4 border-rose-500/30 bg-rose-500/5 text-rose-300 text-sm">
          {err}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={8} cols={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No categories yet."
          description="Create a category to organize your products."
          action={
            <button className="btn btn-primary" onClick={startCreate}>
              + New Category
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="_id"
          compact
          sortKey="productCount"
          sortDir="desc"
        />
      )}

      <ConfirmDialog
        open={!!deleteFor}
        onClose={() => {
          setDeleteFor(null);
          setReassignTo("");
        }}
        onConfirm={doDelete}
        title="Delete category?"
        description={
          deleteFor
            ? `You are about to delete "${deleteFor.name}". ${
                (deleteFor.productCount ?? 0) > 0
                  ? "It still has products attached."
                  : "It has no products."
              }`
            : ""
        }
        confirmLabel={deleteBusy ? "Deleting…" : "Delete category"}
        disabled={deleteBusy}
        tone="danger"
      >
        {deleteFor && (deleteFor.productCount ?? 0) > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs space-y-2">
            <div className="text-amber-300 font-medium">
              ⚠ This category still has {deleteFor.productCount} product
              {deleteFor.productCount === 1 ? "" : "s"}.
            </div>
            <div className="space-y-1.5">
              <label className="block text-ink-200">
                Reassign products to a different category
              </label>
              <select
                className="input w-full"
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
              >
                <option value="">— Select target category —</option>
                {reassignOptions
                  .filter((r) => r._id !== deleteFor._id)
                  .map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
              </select>
              <p className="text-ink-400">
                If you skip reassignment, deletion will be blocked until the
                category is empty.
              </p>
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
