const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slugify = require("slugify");

const categorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  slug: { type: String, unique: true, index: true, trim: true },
  description: { type: String, default: "", maxlength: 1000 },
  image: {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

categorySchema.pre("validate", function () {
  if (this.isModified("name") || this.isNew) {
    this.slug = slugify(this.name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
  }
});

module.exports = mongoose.model("Category", categorySchema);
