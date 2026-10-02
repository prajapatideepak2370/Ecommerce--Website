import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Loader2,
  ArrowLeft,
  Save,
  Tag,
  DollarSign,
  Warehouse,
  Image as ImageIcon,
  FileCode2,
  Box,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import {
  adminProductsApi,
  adminCategoriesApi,
} from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import KeyValueEditor from "../components/KeyValueEditor.jsx";
import ImageDropzone from "../components/ImageDropzone.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import AdminDeleteProductModal from "./AdminDeleteProductModal.jsx";

const emptyProduct = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  category: "",
  brand: "",
  price: "",
  discountPrice: "",
  stock: "",
  isActive: true,
  featured: false,
  specifications: {},
  colors: "",
  material: "",
  dimensions: "",
};

function Section({ title, subtitle, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="card p-5 space-y-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/30 grid place-items-center text-brand-300">
            <Icon size={16} />
          </div>
          <div>
            <h2 className="font-display text-lg leading-tight">{title}</h2>
            <p className="text-xs text-ink-400">{subtitle}</p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="space-y-4 pt-2 border-t border-ink-800">{children}</div>}
    </section>
  );
}

function stringToArray(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToString(v) {
  if (Array.isArray(v)) return v.join(", ");
  return v;
}

const MAX_IMG_BYTES = 5 * 1024 * 1024;

export default function AdminProductForm({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit" && !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoryReload, setCategoryReload] = useState(0);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [images, setImages] = useState([]);
  const [primaryId, setPrimaryId] = useState(null);

  const [model3D, setModel3D] = useState(null); // { url, format, publicId } or null
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploading3D, setUploading3D] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setCategoriesLoading(true);
      setCategoriesError("");
      try {
        const data = await adminCategoriesApi.list({
          limit: 200,
          includeInactive: true,
        });
        const result = Array.isArray(data) ? data : data?.docs;
        if (!Array.isArray(result)) {
          throw new Error("The categories response was invalid.");
        }
        if (active) setCategories(result);
      } catch (e) {
        if (active) {
          setCategories([]);
          setCategoriesError(getErrorMessage(e, "Failed to load categories."));
        }
      } finally {
        if (active) setCategoriesLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [categoryReload]);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const p = await adminProductsApi.getById(id);
        if (!p) throw new Error("Product not found.");
        setForm({
          ...emptyProduct,
          ...p,
          category: p.category?._id || "",
          colors: arrayToString(p.colorOptions),
          price: p.price == null ? "" : String(p.price),
          discountPrice: p.discountPrice == null ? "" : String(p.discountPrice),
          stock: p.stock == null ? "" : String(p.stock),
        });
        setImages(
          (p.images || []).map((img) => ({
            ...img,
            key: img.publicId || img.url,
            preview: img.url,
          })),
        );
        setPrimaryId(p.images?.[0]?.publicId || null);
        setModel3D(p.model3D || null);
      } catch (e) {
        toast.error(getErrorMessage(e, "Failed to load product."));
        navigate("/products", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, navigate]);

  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const setField = (k, v) => {
    setDirty(true);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Name is required.";
    if (!form.description?.trim() || form.description.trim().length < 10)
      e.description = "Description must be at least 10 characters.";
    if (!form.category) e.category = "Category is required.";
    const price = Number(form.price);
    if (isNaN(price) || price <= 0) e.price = "Price must be greater than 0.";
    if (form.discountPrice !== "" && form.discountPrice != null) {
      const d = Number(form.discountPrice);
      if (isNaN(d) || d < 0) e.discountPrice = "Discount price must be ≥ 0.";
      else if (d >= price) e.discountPrice = "Discount must be less than price.";
    }
    const stock = Number(form.stock);
    if (form.stock === "" || isNaN(stock) || stock < 0)
      e.stock = "Stock must be ≥ 0.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      slug: form.slug?.trim() || undefined,
      sku: form.sku?.trim() || undefined,
      description: form.description?.trim() || undefined,
      category: form.category,
      brand: form.brand?.trim() || undefined,
      price: Number(form.price),
      discountPrice:
        form.discountPrice === "" || form.discountPrice == null
          ? undefined
          : Number(form.discountPrice),
      stock: Number(form.stock),
      isActive: !!form.isActive,
      featured: !!form.featured,
      specifications: form.specifications && Object.keys(form.specifications).length ? form.specifications : undefined,
      colorOptions: stringToArray(form.colors),
      material: form.material?.trim() || undefined,
      dimensions: form.dimensions?.trim() || undefined,
    };
    return payload;
  };

  const handleUploadImages = async (newDropped) => {
    if (!isEdit) {
      setImages([...images, ...newDropped]);
      return;
    }
    const oversized = newDropped.filter((p) => p.file && p.size > MAX_IMG_BYTES);
    if (oversized.length) {
      toast.error("One or more images exceed 5 MB.");
      return;
    }
    setUploadingImg(true);
    try {
      const files = newDropped.map((p) => p.file);
      const uploaded = await adminProductsApi.uploadImages(id, files);
      const merged = [
        ...images,
        ...(uploaded || []).map((img) => ({
          ...img,
          key: img.publicId || img.url,
          preview: img.url,
        })),
      ];
      setImages(merged);
      toast.success("Images uploaded.");
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to upload images."));
    } finally {
      setUploadingImg(false);
    }
  };

  const handleRemoveImage = async (idx) => {
    const img = images[idx];
    if (isEdit && img?.publicId) {
      try {
        await adminProductsApi.deleteImage(id, img.publicId);
      } catch (e) {
        toast.error(getErrorMessage(e, "Failed to remove image."));
        return;
      }
    }
    const next = images.slice();
    next.splice(idx, 1);
    setImages(next);
    if (img?.publicId === primaryId) setPrimaryId(next[0]?.publicId || null);
    setDirty(true);
  };

  const handleImageReorder = async (nextImages) => {
    setImages(nextImages);
    setDirty(true);
  };

  const applyImageOrder = async () => {
    if (!isEdit) return;
    const order = images.map((i) => i.publicId).filter(Boolean);
    try {
      await adminProductsApi.reorderImages(id, order, primaryId);
      toast.success("Image order saved.");
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to save image order."));
    }
  };

  const handle3DUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [".glb", ".gltf"];
    const name = file.name.toLowerCase();
    if (!allowed.some((ext) => name.endsWith(ext))) {
      toast.error("Only .glb or .gltf files are supported.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("3D model must be ≤ 100 MB.");
      return;
    }
    if (!isEdit) {
      setModel3D({
        format: name.endsWith(".glb") ? "glb" : "gltf",
        url: "",
        tempName: file.name,
        _file: file,
      });
      toast.success("File will be uploaded on save.");
      return;
    }
    setUploading3D(true);
    try {
      const format = name.endsWith(".glb") ? "glb" : "gltf";
      const data = await adminProductsApi.upload3D(id, file, format);
      setModel3D(data || { format, url: data?.url || "" });
      toast.success("3D model uploaded.");
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to upload 3D model."));
    } finally {
      setUploading3D(false);
    }
  };

  const handle3DRemove = async () => {
    if (isEdit && model3D?.url) {
      try {
        await adminProductsApi.delete3D(id);
      } catch (e) {
        toast.error(getErrorMessage(e, "Failed to remove 3D model."));
        return;
      }
    }
    setModel3D(null);
    setDirty(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please correct the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      let saved;
      if (isEdit) {
        saved = await adminProductsApi.update(id, payload);
      } else {
        saved = await adminProductsApi.create(payload);
      }
      toast.success(isEdit ? "Product updated." : "Product created.");

      if (!isEdit && images.length) {
        const savedId = saved._id;
        const files = images.map((i) => i.file).filter(Boolean);
        if (files.length) {
          try {
            setUploadingImg(true);
            await adminProductsApi.uploadImages(savedId, files);
          } catch (e) {
            toast.error(getErrorMessage(e, "Failed to upload images."));
          } finally {
            setUploadingImg(false);
          }
        }
        const modelFile = model3D?.tempName && model3D?._file;
        if (modelFile) {
          setUploading3D(true);
          try {
            await adminProductsApi.upload3D(savedId, modelFile, model3D.format);
          } catch (e) {
            toast.error(getErrorMessage(e, "Failed to upload 3D model."));
          } finally {
            setUploading3D(false);
          }
        }
      }
      setDirty(false);
      navigate("/products");
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to save product."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="card p-5 animate-pulse h-24 bg-ink-800/30" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-5 animate-pulse h-56 bg-ink-800/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (dirty ? setConfirmLeave(true) : navigate(-1))}
            className="btn-ghost gap-2"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 className="font-display text-3xl">
              {isEdit ? "Edit Product" : "New Product"}
            </h1>
            <p className="text-sm text-ink-400 mt-0.5">
              {isEdit ? `ID: ${id}` : "Create a new product for the catalog."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="btn-ghost text-rose-300"
            >
              Delete Product
            </button>
          )}
          <button
            type="button"
            onClick={applyImageOrder}
            disabled={!isEdit || images.length < 2}
            className="btn-ghost"
          >
            Save image order
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={saving || uploadingImg || uploading3D}
            className="btn btn-primary gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>

      <form id="product-form" onSubmit={onSubmit} className="space-y-6">
        <Section
          title="Basics"
          subtitle="Name, slug, category, brand, description."
          icon={Tag}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Name *</label>
              <input
                className={`input w-full ${errors.name ? "border-rose-500/50" : ""}`}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Aero 3D-Printed Vase"
              />
              {errors.name && (
                <p className="text-xs text-rose-300 mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="input-label">Slug</label>
              <input
                className="input w-full"
                value={form.slug}
                onChange={(e) => setField("slug", e.target.value)}
                placeholder="auto-generated if blank"
              />
            </div>
            <div>
              <label className="input-label">SKU</label>
              <input
                className="input w-full"
                value={form.sku}
                onChange={(e) => setField("sku", e.target.value)}
                placeholder="auto-generated if blank"
              />
            </div>
            <div>
              <label className="input-label">Brand</label>
              <input
                className="input w-full"
                value={form.brand}
                onChange={(e) => setField("brand", e.target.value)}
                placeholder="TRYVOXEL"
              />
            </div>
            <div>
              <label className="input-label">Category *</label>
              <select
                className={`input w-full ${errors.category ? "border-rose-500/50" : ""}`}
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                disabled={categoriesLoading || !!categoriesError || categories.length === 0}
              >
                <option value="">
                  {categoriesLoading
                    ? "Loading categories…"
                    : categoriesError
                      ? "Categories could not be loaded"
                      : categories.length === 0
                        ? "No categories available"
                        : "Select category…"}
                </option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categoriesError && (
                <div className="mt-1 flex items-center justify-between gap-3 text-xs text-rose-300">
                  <span>{categoriesError}</span>
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={() => setCategoryReload((count) => count + 1)}
                  >
                    Retry
                  </button>
                </div>
              )}
              {!categoriesLoading && !categoriesError && categories.length === 0 && (
                <p className="mt-1 text-xs text-ink-400">
                  Create a category from the Categories page, then return here.
                </p>
              )}
              {errors.category && (
                <p className="text-xs text-rose-300 mt-1">{errors.category}</p>
              )}
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 select-none cursor-pointer p-3 rounded-lg border border-ink-800 hover:bg-ink-800/40">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded"
                  checked={!!form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                />
                <span className="text-sm">
                  <span className="font-medium">Active</span>
                  <span className="block text-xs text-ink-400">
                    Visible to customers.
                  </span>
                </span>
              </label>
              <label className="flex items-center gap-2 select-none cursor-pointer p-3 rounded-lg border border-ink-800 hover:bg-ink-800/40">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded"
                  checked={!!form.featured}
                  onChange={(e) => setField("featured", e.target.checked)}
                />
                <span className="text-sm">
                  <span className="font-medium">Featured</span>
                  <span className="block text-xs text-ink-400">
                    Pin to homepage & collections.
                  </span>
                </span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="input-label">Description</label>
              <textarea
                rows={6}
                className={`input w-full ${errors.description ? "border-rose-500/50" : ""}`}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Long-form description for the product page."
              />
              {errors.description && (
                <p className="text-xs text-rose-300 mt-1">
                  {errors.description}
                </p>
              )}
            </div>
          </div>
        </Section>

        <Section
          title="Pricing"
          subtitle="Base price, optional discount, and promotional logic."
          icon={DollarSign}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Base Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`input w-full ${errors.price ? "border-rose-500/50" : ""}`}
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-xs text-rose-300 mt-1">{errors.price}</p>
              )}
            </div>
            <div>
              <label className="input-label">Discount Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`input w-full ${errors.discountPrice ? "border-rose-500/50" : ""}`}
                value={form.discountPrice}
                onChange={(e) => setField("discountPrice", e.target.value)}
                placeholder="Optional — must be less than base"
              />
              {errors.discountPrice && (
                <p className="text-xs text-rose-300 mt-1">
                  {errors.discountPrice}
                </p>
              )}
            </div>
            <div className="flex items-end">
              {form.discountPrice && form.price ? (
                <div className="chip bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  Sale{" "}
                  {Math.round(
                    (1 - Number(form.discountPrice) / Number(form.price)) * 100,
                  )}
                  % off
                </div>
              ) : null}
            </div>
          </div>
        </Section>

        <Section title="Inventory" subtitle="Stock count." icon={Warehouse}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Stock *</label>
              <input
                type="number"
                min="0"
                step="1"
                className={`input w-full ${errors.stock ? "border-rose-500/50" : ""}`}
                value={form.stock}
                onChange={(e) => setField("stock", e.target.value)}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-xs text-rose-300 mt-1">{errors.stock}</p>
              )}
            </div>
          </div>
        </Section>

        <Section
          title="Variants & Specifications"
          subtitle="Colors, dimensions, material, and arbitrary specs."
          icon={Sparkles}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Colors (comma-separated)</label>
              <input
                className="input w-full"
                value={form.colors}
                onChange={(e) => setField("colors", e.target.value)}
                placeholder="Onyx, Sand, Cobalt"
              />
            </div>
            <div>
              <label className="input-label">Material</label>
              <input
                className="input w-full"
                value={form.material}
                onChange={(e) => setField("material", e.target.value)}
                placeholder="Recycled PLA"
              />
            </div>
            <div>
              <label className="input-label">Dimensions</label>
              <input
                className="input w-full"
                value={form.dimensions}
                onChange={(e) => setField("dimensions", e.target.value)}
                placeholder="12 × 12 × 18 cm"
              />
            </div>
          </div>
          <div>
            <label className="input-label">Specifications</label>
            <KeyValueEditor
              value={form.specifications || {}}
              onChange={(v) => setField("specifications", v)}
              placeholderKey="e.g. Weight"
              placeholderValue="e.g. 250 g"
            />
          </div>
        </Section>

        <Section
          title="Images"
          subtitle="Upload product imagery. First image is the primary."
          icon={ImageIcon}
        >
          <div className="flex flex-col gap-3">
            <ImageDropzone
              value={images}
              onChange={(next) => {
                if (next.length < images.length) {
                  const removed = images.find(
                    (i, idx) => next[idx]?.key !== i.key,
                  );
                  const idx = images.findIndex((i) => i === removed);
                  if (idx >= 0) handleRemoveImage(idx);
                } else if (next.length > images.length) {
                  const added = next.slice(images.length);
                  handleUploadImages(added);
                } else {
                  handleImageReorder(next);
                }
              }}
              primaryId={primaryId}
              onSetPrimary={(pid) => {
                setPrimaryId(pid);
                setDirty(true);
              }}
              hint={
                uploadingImg
                  ? "Uploading images…"
                  : isEdit
                    ? "Order changes are applied when you click Save image order."
                    : "Images will upload after you create the product."
              }
            />
          </div>
        </Section>

        <Section
          title="3D Model"
          subtitle="Optional glTF / GLB file for 3D preview."
          icon={Box}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">File</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handle3DUpload}
                  className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-200 file:px-3 file:py-2 hover:file:bg-brand-500/30 cursor-pointer input w-full"
                />
                {model3D && (
                  <button
                    type="button"
                    className="btn-ghost text-rose-300"
                    onClick={handle3DRemove}
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-ink-500 mt-2">
                GLB or glTF, max 100 MB.
              </p>
            </div>
            <div>
              <label className="input-label">Current</label>
              <div className="card p-3 h-[110px] flex items-center gap-3 text-sm">
                <div className="h-10 w-10 rounded-lg bg-brand-500/10 border border-brand-500/20 grid place-items-center text-brand-300">
                  <FileCode2 size={18} />
                </div>
                <div className="min-w-0">
                  {model3D ? (
                    <>
                      <div className="truncate">
                        {model3D.format ? `.${model3D.format}` : "3D model"}
                      </div>
                      <div className="text-xs text-ink-400 truncate">
                        {model3D.url || model3D.tempName || "Saved."}
                      </div>
                    </>
                  ) : (
                    <span className="text-ink-500">No 3D model attached.</span>
                  )}
                </div>
                {uploading3D && (
                  <Loader2 size={16} className="ml-auto animate-spin" />
                )}
              </div>
            </div>
          </div>
        </Section>
      </form>

      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          setDirty(false);
          navigate(leaveTarget || -1);
        }}
        title="Leave without saving?"
        description="You have unsaved changes that will be lost. Are you sure?"
        confirmLabel="Leave"
        tone="warning"
      />
      {confirmDelete && (
        <AdminDeleteProductModal
          product={{ _id: id, name: form.name, sku: form.sku }}
          open
          onClose={() => setConfirmDelete(false)}
          onSuccess={() => {
            setConfirmDelete(false);
            navigate("/products");
          }}
        />
      )}
    </div>
  );
}
