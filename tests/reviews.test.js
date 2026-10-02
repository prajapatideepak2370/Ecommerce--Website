const request = require("supertest");
const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Review = require("../models/review");
const { makeTestApp, teardown } = require("./helpers/testApp");

let app;
let product;

beforeAll(async () => {
  app = await makeTestApp();
  const user = await User.register(
    new User({
      name: "Review Customer",
      username: "review-customer",
      email: "review-customer@tryvoxel.test",
      role: "customer",
    }),
    "ReviewCustomer!123",
  );
  const category = await Category.create({
    name: "Review Test Category",
    slug: "review-test-category",
  });
  product = await Product.create({
    name: "Review Test Product",
    slug: "review-test-product",
    description: "A product created to test customer review details.",
    price: 1200,
    category: category._id,
    stock: 3,
  });
  await Review.create({
    user: user._id,
    product: product._id,
    rating: 5,
    comment: "Exactly as described.",
  });
});

afterAll(async () => {
  await teardown();
});

describe("GET /api/v1/products/:productId/reviews", () => {
  it("returns product reviews with public customer details", async () => {
    const response = await request(app).get(
      `/api/v1/products/${product._id}/reviews`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      rating: 5,
      comment: "Exactly as described.",
      user: { name: "Review Customer", username: "review-customer" },
    });
    expect(response.body.data[0].user.hash).toBeUndefined();
    expect(response.body.data[0].user.salt).toBeUndefined();
  });

  it("rejects a malformed product ID", async () => {
    const response = await request(app).get(
      "/api/v1/products/not-an-id/reviews",
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns an empty list when a product has no reviews", async () => {
    const category = await Category.create({
      name: "No Reviews Category",
      slug: `no-reviews-${new mongoose.Types.ObjectId()}`,
    });
    const productWithoutReviews = await Product.create({
      name: "No Reviews Product",
      description: "A product with no customer reviews yet.",
      price: 500,
      category: category._id,
      stock: 1,
    });

    const response = await request(app).get(
      `/api/v1/products/${productWithoutReviews._id}/reviews`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual([]);
  });
});
