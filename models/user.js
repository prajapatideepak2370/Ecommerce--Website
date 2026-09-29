const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const addressSchema = new Schema(
  {
    label: { type: String, default: "Home", trim: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    isBlocked: { type: Boolean, default: false },
    phone: { type: String, default: "" },
    addresses: [addressSchema],
  },
  { timestamps: true },
);

userSchema.plugin(passportLocalMongoose.default || passportLocalMongoose, {
  usernameField: "username",
});

userSchema.pre("save", function () {
  if (!this.addresses || this.addresses.length !== 1) return;
  if (!this.addresses.some((a) => a.isDefault)) {
    this.addresses[0].isDefault = true;
  }
});

module.exports = mongoose.model("User", userSchema);
