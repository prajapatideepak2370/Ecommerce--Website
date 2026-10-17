const mongoose = require("mongoose");
const Product = require("../models/Product");
const { productSchemas } = require("../schema");

const productData = (discountPrice) => ({
  name: "Validation Test Lamp",
  description: "A test product with a sufficiently long description.",
  price: 100,
  discountPrice,
  category: new mongoose.Types.ObjectId(),
  stock: 1,
});

describe("product discount validation", () => {
  it("rejects discounts that are zero or not lower than the regular price", async () => {
    for (const discountPrice of [0, 100, 120]) {
      const product = new Product(productData(discountPrice));
      await expect(product.validate()).rejects.toMatchObject({
        name: "ValidationError",
      });
    }
  });

  it("accepts an absent discount and a lower positive price", async () => {
    await expect(new Product(productData(null)).validate()).resolves.toBeUndefined();
    await expect(new Product(productData(75)).validate()).resolves.toBeUndefined();
  });

  it("rejects an invalid discount in create payload validation", () => {
    const invalid = productSchemas.create.validate({
      ...productData(120),
      category: String(new mongoose.Types.ObjectId()),
    });

    expect(invalid.error).toBeDefined();
  });
});
