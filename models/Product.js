const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slugify = require("slugify");
const { generateSKU, getStockStatus } = require("../utils/helpers");

const imageSchema = new Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
}, { _id: false });

const model3DSchema = new Schema({
  url: { type: String, required: true },
  format: { type: String, enum: ["glb", "gltf"], required: true },
}, { _id: false });

const productSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  slug: { type: String, unique: true, index: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0, default: null },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
  images: [imageSchema],
  model3D: model3DSchema,
  stock: { type: Number, required: true, min: 0, default: 0, index: true },
  sku: { type: String, unique: true, index: true },
  brand: { type: String, default: "", index: true },
  specifications: { type: Map, of: Schema.Types.Mixed, default: {} },
  colorOptions: [{ type: String }],
  dimensions: { type: String, default: "" },
  material: { type: String, default: "" },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0, min: 0 },
  featured: { type: Boolean, default: false, index: true },
  isActive: { type: Boolean, default: true, index: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

productSchema.index(
  { name: "text", description: "text", brand: "text", "specifications.$**": "text" },
  { name: "product_text_idx", weights: { name: 10, brand: 5, description: 3 } }
);

productSchema.pre("validate", function () {
  if (!this.slug || (this.isModified("name") && !this.isModified("slug"))) {
    this.slug = slugify(this.name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
  }
  if (!this.sku) {
    this.sku = generateSKU();
  }
});

productSchema.virtual("availability").get(function () {
  return getStockStatus(this.stock);
});

module.exports = mongoose.model("Product", productSchema);
