const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminAuditLogSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    adminUsername: { type: String, trim: true },
    action: {
      type: String,
      enum: [
        "product.create",
        "product.update",
        "product.status",
        "product.softDelete",
        "product.permanentDelete",
        "product.stock",
        "product.images.upload",
        "product.images.delete",
        "product.images.reorder",
        "product.model3D.upload",
        "product.model3D.delete",
        "product.bulk",
        "category.create",
        "category.update",
        "category.delete",
        "category.image.upload",
        "category.image.delete",
        "login.success",
        "login.fail",
        "logout",
      ],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["product", "category", "auth"],
      required: true,
      index: true,
    },
    entityId: { type: String, default: "", index: true },
    beforeSnapshot: { type: Schema.Types.Mixed, default: null },
    afterSnapshot: { type: Schema.Types.Mixed, default: null },
    diff: { type: Schema.Types.Mixed, default: null },
    reason: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

adminAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
adminAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);
