const request = require("supertest");
const mongoose = require("mongoose");
const User = require("../models/user");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const Review = require("../models/review");
const { makeTestApp, teardown } = require("./helpers/testApp");

let app;
let product;
let purchasedProduct;
let customer;
let customerAgent;
let otherCustomerAgent;
let createdReviewId;

const makeProduct = async (category, name, slug) =>
  Product.create({
    name,
    slug,
    description: "A product created to test customer review details.",
    price: 1200,
    category: category._id,
    stock: 3,
    isActive: true,
  });

const makePaidOrder = (user, productId) =>
  Order.create({
    user: user._id,
    items: [
      {
        product: productId,
        name: "Review Test Product",
        quantity: 1,
        priceAtPurchase: 1200,
      },
    ],
    shippingAddress: {
      fullName: "Review Customer",
      phone: "+919876543210",
      line1: "123 Review Street",
      city: "Jaipur",
      state: "Rajasthan",
      postalCode: "302001",
      country: "India",
    },
    subtotal: 1200,
    tax: 0,
    shippingFee: 0,
    totalAmount: 1200,
    payment: { status: "Paid" },
    orderStatus: "Delivered",
  });

const reviewPayload = {
  rating: 4,
  title: "Works as expected",
  comment: "The product arrived quickly and works just as described.",
};

beforeAll(async () => {
  app = await makeTestApp();
  customer = await User.register(
    new User({
      name: "Review Customer",
      username: "review-customer",
      email: "review-customer@tryvoxel.test",
      role: "customer",
    }),
    "ReviewCustomer!123",
  );
  const otherCustomer = await User.register(
    new User({
      name: "Another Customer",
      username: "another-customer",
      email: "another-customer@tryvoxel.test",
      role: "customer",
    }),
    "AnotherCustomer!123",
  );
  const category = await Category.create({
    name: "Review Test Category",
    slug: "review-test-category",
  });
  product = await makeProduct(category, "Review Test Product", "review-test-product");
  purchasedProduct = await makeProduct(
    category,
    "Purchased Review Product",
    "purchased-review-product",
  );
  await Review.create({
    user: customer._id,
    product: product._id,
    rating: 5,
    title: "Exactly right",
    comment: "Exactly as described.",
  });
  const olderReview = await Review.create({
    user: otherCustomer._id,
    product: product._id,
    rating: 3,
    title: "A fair option",
    comment: "It is fine, though there is room to improve.",
  });
  await Review.updateOne(
    { _id: olderReview._id },
    { $set: { createdAt: new Date("2020-01-01T00:00:00.000Z") } },
  );
  await makePaidOrder(customer, purchasedProduct._id);

  customerAgent = request.agent(app);
  const loginResponse = await customerAgent
    .post("/api/v1/users/login")
    .send({ username: "review-customer", password: "ReviewCustomer!123" });
  expect(loginResponse.statusCode).toBe(200);

  otherCustomerAgent = request.agent(app);
  const otherLoginResponse = await otherCustomerAgent
    .post("/api/v1/users/login")
    .send({
      username: "another-customer",
      password: "AnotherCustomer!123",
    });
  expect(otherLoginResponse.statusCode).toBe(200);
});

afterAll(async () => {
  await teardown();
});

describe("GET /api/v1/products/:productId/reviews", () => {
  it("returns reviews, public customer details, and rating statistics", async () => {
    const response = await request(app).get(
      `/api/v1/products/${product._id}/reviews`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.items[0]).toMatchObject({
      rating: 5,
      title: "Exactly right",
      comment: "Exactly as described.",
      user: { name: "Review Customer", username: "review-customer" },
    });
    expect(response.body.data.items[0].user.hash).toBeUndefined();
    expect(response.body.data.items[0].user.salt).toBeUndefined();
    expect(response.body.data.summary).toMatchObject({
      averageRating: 4,
      totalReviews: 2,
      distribution: [
        { rating: 5, count: 1 },
        { rating: 4, count: 0 },
        { rating: 3, count: 1 },
        { rating: 2, count: 0 },
        { rating: 1, count: 0 },
      ],
    });
  });

  it("sorts reviews by oldest and highest rating", async () => {
    const oldestResponse = await request(app)
      .get(`/api/v1/products/${product._id}/reviews`)
      .query({ sort: "oldest" });
    const highestResponse = await request(app)
      .get(`/api/v1/products/${product._id}/reviews`)
      .query({ sort: "highest" });

    expect(oldestResponse.statusCode).toBe(200);
    expect(oldestResponse.body.data.items[0].rating).toBe(3);
    expect(highestResponse.statusCode).toBe(200);
    expect(highestResponse.body.data.items[0].rating).toBe(5);
  });

  it("rejects a malformed product ID", async () => {
    const response = await request(app).get(
      "/api/v1/products/not-an-id/reviews",
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns an empty list and zeroed summary when there are no reviews", async () => {
    const category = await Category.create({
      name: "No Reviews Category",
      slug: `no-reviews-${new mongoose.Types.ObjectId()}`,
    });
    const productWithoutReviews = await makeProduct(
      category,
      "No Reviews Product",
      `no-reviews-product-${new mongoose.Types.ObjectId()}`,
    );

    const response = await request(app).get(
      `/api/v1/products/${productWithoutReviews._id}/reviews`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.data.items).toEqual([]);
    expect(response.body.data.summary).toMatchObject({
      averageRating: 0,
      totalReviews: 0,
    });
  });
});

describe("Review creation and ownership", () => {
  const reviewUrl = () =>
    `/api/v1/products/${purchasedProduct._id}/reviews`;

  it("requires authentication and a paid purchase", async () => {
    const unauthenticated = await request(app)
      .post(reviewUrl())
      .send(reviewPayload);
    const noPurchaseProduct = await makeProduct(
      await Category.findOne({ slug: "review-test-category" }),
      "No Purchase Product",
      "no-purchase-product",
    );
    const notPurchased = await customerAgent
      .post(`/api/v1/products/${noPurchaseProduct._id}/reviews`)
      .send(reviewPayload);

    expect(unauthenticated.statusCode).toBe(401);
    expect(notPurchased.statusCode).toBe(403);
  });

  it("validates rating and required review text", async () => {
    const response = await customerAgent
      .post(reviewUrl())
      .send({ ...reviewPayload, rating: 6, title: "" });

    expect(response.statusCode).toBe(400);
  });

  it("rejects unsupported image types before upload", async () => {
    const response = await customerAgent
      .post(reviewUrl())
      .field("rating", "4")
      .field("title", reviewPayload.title)
      .field("comment", reviewPayload.comment)
      .attach("images", Buffer.from("not an image"), {
        filename: "review.svg",
        contentType: "image/svg+xml",
      });

    expect(response.statusCode).toBe(400);
  });

  it("creates reviews for verified purchasers and prevents duplicates", async () => {
    const viewerResponse = await customerAgent.get(reviewUrl());
    expect(viewerResponse.body.data.viewer.canReview).toBe(true);

    const response = await customerAgent.post(reviewUrl()).send(reviewPayload);
    createdReviewId = response.body.data.review?._id;

    expect(response.statusCode).toBe(201);
    expect(response.body.data.review).toMatchObject({
      rating: 4,
      title: reviewPayload.title,
      verifiedPurchase: true,
    });
    expect(response.body.data.summary).toMatchObject({
      averageRating: 4,
      totalReviews: 1,
    });
    const productAfterCreate = await Product.findById(purchasedProduct._id);
    expect(productAfterCreate).toMatchObject({ rating: 4, numReviews: 1 });

    const duplicateResponse = await customerAgent
      .post(reviewUrl())
      .send(reviewPayload);
    expect(duplicateResponse.statusCode).toBe(409);
    const viewerAfterReview = await customerAgent.get(reviewUrl());
    expect(viewerAfterReview.body.data.viewer.canReview).toBe(false);
  });

  it("allows owners to edit and delete reviews, but not other customers", async () => {
    const reviewPath = `${reviewUrl()}/${createdReviewId}`;
    const unauthorizedUpdate = await otherCustomerAgent
      .put(reviewPath)
      .send({ ...reviewPayload, rating: 1 });
    const updateResponse = await customerAgent
      .put(reviewPath)
      .send({ ...reviewPayload, rating: 5 });

    expect(unauthorizedUpdate.statusCode).toBe(404);
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.data.review.rating).toBe(5);
    expect(updateResponse.body.data.summary.averageRating).toBe(5);
    const productAfterUpdate = await Product.findById(purchasedProduct._id);
    expect(productAfterUpdate).toMatchObject({ rating: 5, numReviews: 1 });

    const unauthorizedDelete = await otherCustomerAgent.delete(reviewPath);
    expect(unauthorizedDelete.statusCode).toBe(404);

    const deleteResponse = await customerAgent.delete(reviewPath);
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.body.data.summary).toMatchObject({
      averageRating: 0,
      totalReviews: 0,
    });
    const productAfterDelete = await Product.findById(purchasedProduct._id);
    expect(productAfterDelete).toMatchObject({ rating: 0, numReviews: 0 });
  });
});
