const request = require("supertest");
const mongoose = require("mongoose");
const User = require("../models/user");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { makeTestApp, teardown } = require("./helpers/testApp");

const ADMIN = {
  name: "Catalog Admin",
  username: "catalog-admin",
  email: "catalog-admin@tryvoxel.test",
  password: "CatalogAdmin!123",
};

const CUSTOMER = {
  name: "Catalog Customer",
  username: "catalog-customer",
  email: "catalog-customer@tryvoxel.test",
  password: "CatalogCustomer!123",
};

let app;

beforeAll(async () => {
  app = await makeTestApp();
  await User.register(new User({ ...ADMIN, role: "admin" }), ADMIN.password);
  await User.register(new User(CUSTOMER), CUSTOMER.password);
});

afterAll(async () => {
  await teardown();
});

const agent = () => request.agent(app);
const loginAsAdmin = async () => {
  const adminAgent = agent();
  const login = await adminAgent
    .post("/api/admin/auth/login")
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ email: ADMIN.email, password: ADMIN.password });
  expect(login.statusCode).toBe(200);
  return { adminAgent, login };
};

describe("separate admin console authentication", () => {
  it("requires an admin session for catalog APIs", async () => {
    const response = await agent().get("/api/admin/products");
    expect(response.statusCode).toBe(401);
  });

  it("rejects customer credentials on the admin login endpoint", async () => {
    const response = await agent()
      .post("/api/admin/auth/login")
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ username: CUSTOMER.username, password: CUSTOMER.password });

    expect(response.statusCode).toBe(401);
    expect(response.body.error.message).toBe("Invalid credentials.");
  });

  it("creates a separate, sanitized admin session", async () => {
    const { adminAgent, login } = await loginAsAdmin();
    expect(login.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("tryvoxel.admin.sid=")]),
    );

    const me = await adminAgent.get("/api/admin/auth/me");
    expect(me.statusCode).toBe(200);
    expect(me.body.data.email).toBe(ADMIN.email);
    expect(me.body.data.role).toBe("admin");
    expect(me.body.data.hash).toBeUndefined();
    expect(me.body.data.salt).toBeUndefined();

    const customerMe = await adminAgent.get("/api/v1/users/me");
    expect(customerMe.statusCode).toBe(401);

    const customerAgent = agent();
    await customerAgent
      .post("/api/v1/users/login")
      .send({ username: CUSTOMER.username, password: CUSTOMER.password });
    const adminMe = await customerAgent.get("/api/admin/auth/me");
    expect(adminMe.statusCode).toBe(401);
  });

  it("creates catalog data with the response shapes used by the console", async () => {
    const { adminAgent } = await loginAsAdmin();
    const category = await adminAgent
      .post("/api/admin/categories")
      .set("X-Requested-With", "XMLHttpRequest")
      .send({
        name: "Admin Console Category",
        slug: "admin-console-category",
        description: "Category created by the console integration test.",
        isActive: true,
      });

    expect(category.statusCode).toBe(201);
    expect(category.body.data.slug).toBe("admin-console-category");

    const categoryList = await adminAgent
      .get("/api/admin/categories")
      .query({ includeInactive: true });
    expect(categoryList.statusCode).toBe(200);
    expect(categoryList.body.data.docs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: category.body.data._id }),
      ]),
    );

    const product = await adminAgent
      .post("/api/admin/products")
      .set("X-Requested-With", "XMLHttpRequest")
      .send({
        name: "Console Test Product",
        slug: "console-test-product",
        description: "A product created by the admin console integration test.",
        price: 1299,
        category: category.body.data._id,
        stock: 0,
        colorOptions: ["Onyx", "Sand"],
      });

    expect(product.statusCode).toBe(201);
    expect(product.body.data.slug).toBe("console-test-product");

    const products = await adminAgent
      .get("/api/admin/products")
      .query({ status: "active", search: "Console Test Product" });
    expect(products.statusCode).toBe(200);
    expect(products.body.data.docs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: product.body.data._id,
          availability: "out-of-stock",
        }),
      ]),
    );
    expect(products.body.data.pagination.totalDocs).toBe(1);

    const summary = await adminAgent.get("/api/admin/catalog/summary");
    expect(summary.statusCode).toBe(200);
    expect(summary.body.data.totals.totalProducts).toBeGreaterThanOrEqual(1);
    expect(summary.body.data.totals.outOfStock).toBeGreaterThanOrEqual(1);

    const inventory = await adminAgent
      .get("/api/admin/catalog/inventory")
      .query({ stockLevel: "out" });
    expect(inventory.statusCode).toBe(200);
    expect(inventory.body.data.docs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: product.body.data._id,
          stock: 0,
          images: [],
          availability: "out-of-stock",
        }),
      ]),
    );

    const stockUpdate = await adminAgent
      .patch(`/api/admin/catalog/inventory/${product.body.data._id}`)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ stock: 4, reason: "Integration test restock" });
    expect(stockUpdate.statusCode).toBe(200);
    expect(stockUpdate.body.data.stock).toBe(4);

    const history = await adminAgent.get(
      `/api/admin/catalog/inventory/${product.body.data._id}/history`,
    );
    expect(history.statusCode).toBe(200);
    expect(history.body.data.docs[0].metadata).toMatchObject({
      beforeStock: 0,
      afterStock: 4,
      delta: 4,
    });
    expect(history.body.data.docs[0].reason).toBe("Integration test restock");
  });

  it("permanently deletes a product when unrelated orders exist", async () => {
    const { adminAgent } = await loginAsAdmin();
    const category = await Category.create({
      name: "Permanent Delete Test Category",
      slug: "permanent-delete-test-category",
    });
    const product = await Product.create({
      name: "Permanent Delete Test Product",
      slug: "permanent-delete-test-product",
      description: "Test product for permanent deletion.",
      price: 99,
      category: category._id,
      stock: 1,
    });

    await Order.create({
      user: new mongoose.Types.ObjectId(),
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          name: "Unrelated ordered product",
          quantity: 1,
          priceAtPurchase: 10,
        },
      ],
      shippingAddress: {
        fullName: "Test Customer",
        phone: "1234567890",
        line1: "1 Test Street",
        city: "Test City",
        state: "Test State",
        postalCode: "123456",
        country: "India",
      },
      subtotal: 10,
      tax: 0,
      shippingFee: 0,
      totalAmount: 10,
      payment: { provider: "COD", status: "Pending" },
    });

    const response = await adminAgent
      .delete(`/api/admin/products/${product._id}?permanent=true`)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ reason: "Permanent delete regression test" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toMatchObject({
      deleted: "permanent",
      id: String(product._id),
    });
    await expect(Product.findById(product._id)).resolves.toBeNull();
  });

  it("requires the AJAX header to log out the admin session", async () => {
    const { adminAgent } = await loginAsAdmin();

    const blockedLogout = await adminAgent.post("/api/admin/auth/logout");
    expect(blockedLogout.statusCode).toBe(403);

    const logout = await adminAgent
      .post("/api/admin/auth/logout")
      .set("X-Requested-With", "XMLHttpRequest");
    expect(logout.statusCode).toBe(200);
    expect(logout.body.data.loggedOut).toBe(true);

    const me = await adminAgent.get("/api/admin/auth/me");
    expect(me.statusCode).toBe(401);
  });
});
