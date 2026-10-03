const request = require("supertest");
const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const { makeTestApp, teardown } = require("./helpers/testApp");

const ADMIN = {
  name: "Order Admin",
  username: "order-admin",
  email: "order-admin@tryvoxel.test",
  password: "OrderAdmin!123",
};

const CUSTOMER = {
  name: "Order Customer",
  username: "order-customer",
  email: "order-customer@tryvoxel.test",
  password: "OrderCustomer!123",
};

let app;
let testProduct;
let testCategory;

beforeAll(async () => {
  app = await makeTestApp();
  await User.register(new User({ ...ADMIN, role: "admin" }), ADMIN.password);
  await User.register(new User(CUSTOMER), CUSTOMER.password);
  testCategory = await Category.create({
    name: "Order Test Category",
    slug: "order-test-category",
    isActive: true,
  });
  testProduct = await Product.create({
    name: "Order Test Voxel Lamp",
    slug: "order-test-voxel-lamp",
    description: "Product used for order flow integration tests.",
    price: 2499,
    discountPrice: 2199,
    category: testCategory._id,
    stock: 25,
    isActive: true,
    images: [
      {
        publicId: "test/lamp-v1",
        url: "https://cdn.test/lamp.jpg",
        alt: "Lamp",
        isPrimary: true,
      },
    ],
    weightG: 350,
  });
});

afterAll(async () => {
  await teardown();
});

const agent = () => request.agent(app);

const loginCustomer = async () => {
  const cust = agent();
  const r = await cust
    .post("/api/v1/users/login")
    .send({ email: CUSTOMER.email, password: CUSTOMER.password });
  expect(r.statusCode).toBe(200);
  return cust;
};

const loginAdmin = async () => {
  const adm = agent();
  const r = await adm
    .post("/api/admin/auth/login")
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ email: ADMIN.email, password: ADMIN.password });
  expect(r.statusCode).toBe(200);
  return adm;
};

const SHIPPING = {
  fullName: "Order Customer",
  phone: "+919876543210",
  line1: "123 Test Street, Voxel Colony",
  line2: "Near Cyber Tower",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
  country: "India",
};

const makeItem = (overrides = {}) => ({
  product: String(testProduct._id),
  name: testProduct.name,
  image: testProduct.images[0].url,
  quantity: 2,
  unitPrice: testProduct.discountPrice || testProduct.price,
  productMeta: { slug: testProduct.slug },
  ...overrides,
});

describe("POST /api/v1/orders (create order from Checkout)", () => {
  it("creates a COD order with shippingAddress + items and returns 201 + orderNumber", async () => {
    const cust = await loginCustomer();
    const stockBefore = (await Product.findById(testProduct._id)).stock;
    const payload = {
      shippingAddress: SHIPPING,
      paymentMethod: "COD",
      paymentReference: "",
      paymentStatus: "Pending",
      items: [makeItem({ quantity: 2 })],
    };

    const res = await cust.post("/api/v1/orders").send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    const order = res.body.data;
    expect(order).toBeDefined();
    expect(order._id).toBeDefined();
    expect(order.orderNumber).toMatch(/^TVX-[0-9A-F]{6}$/);
    expect(order.orderStatus).toBe("Pending");
    expect(order.payment.provider).toBe("COD");
    expect(order.payment.status).toBe("Pending");
    expect(order.items.length).toBe(1);
    expect(order.items[0].name).toBe(testProduct.name);
    expect(order.items[0].quantity).toBe(2);
    expect(order.totalAmount).toBeGreaterThan(0);
    expect(order.shippingAddress.fullName).toBe(SHIPPING.fullName);
    expect(order.shippingAddress.phone).toBe(SHIPPING.phone);

    const stockAfter = (await Product.findById(testProduct._id)).stock;
    expect(stockAfter).toBe(stockBefore - 2);
  });

  it("creates a UPI Paid order and auto-sets orderStatus = Confirmed", async () => {
    const cust = await loginCustomer();
    const stockBefore = (await Product.findById(testProduct._id)).stock;
    const payload = {
      shippingAddress: SHIPPING,
      paymentMethod: "UPI",
      paymentReference: "TVXTESTUPI123",
      paymentStatus: "Paid",
      items: [makeItem({ quantity: 1 })],
    };

    const res = await cust.post("/api/v1/orders").send(payload);

    expect(res.statusCode).toBe(201);
    const order = res.body.data;
    expect(order.orderStatus).toBe("Confirmed");
    expect(order.payment.provider).toBe("UPI");
    expect(order.payment.status).toBe("Paid");
    expect(order.payment.reference).toBe("TVXTESTUPI123");

    const stockAfter = (await Product.findById(testProduct._id)).stock;
    expect(stockAfter).toBe(stockBefore - 1);
  });

  it("rejects order with invalid address (missing required fields) with 400", async () => {
    const cust = await loginCustomer();
    const payload = {
      shippingAddress: { fullName: "X", phone: "Y" },
      paymentMethod: "COD",
      items: [makeItem()],
    };
    const res = await cust.post("/api/v1/orders").send(payload);
    expect(res.statusCode).toBe(400);
  });

  it("rejects order with out-of-stock quantity with 400", async () => {
    const cust = await loginCustomer();
    const payload = {
      shippingAddress: SHIPPING,
      paymentMethod: "COD",
      items: [makeItem({ quantity: 99999 })],
    };
    const res = await cust.post("/api/v1/orders").send(payload);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/stock/);
  });

  it("rejects 401 without session", async () => {
    const res = await agent()
      .post("/api/v1/orders")
      .send({
        shippingAddress: SHIPPING,
        paymentMethod: "COD",
        items: [makeItem()],
      });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/v1/orders (customer My Orders)", () => {
  it("returns orders created by current customer with pagination envelope", async () => {
    const cust = await loginCustomer();
    await cust
      .post("/api/v1/orders")
      .send({
        shippingAddress: SHIPPING,
        paymentMethod: "COD",
        items: [makeItem({ quantity: 1 })],
      })
      .expect(201);

    const res = await cust.get("/api/v1/orders?page=1&limit=10");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const { items, total, page, limit } = res.body.data;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(total).toBeGreaterThanOrEqual(1);
    expect(page).toBe(1);
    expect(limit).toBe(10);
    const first = items[0];
    expect(first._id).toBeDefined();
    expect(first.orderNumber).toMatch(/^TVX-/);
    expect(first.totalAmount).toBeGreaterThan(0);
    expect(first.items.length).toBeGreaterThan(0);
  });

  it("does not leak orders between two different customers", async () => {
    const userA = agent();
    await User.register(
      new User({
        name: "A",
        username: "user-a-order",
        email: "a-order@tryvoxel.test",
      }),
      "UserAOrder!123",
    );
    await userA
      .post("/api/v1/users/login")
      .send({ email: "a-order@tryvoxel.test", password: "UserAOrder!123" })
      .expect(200);

    await userA
      .post("/api/v1/orders")
      .send({
        shippingAddress: { ...SHIPPING, fullName: "USER A ONLY" },
        paymentMethod: "COD",
        items: [makeItem({ quantity: 1 })],
      })
      .expect(201);

    const userB = await loginCustomer();
    const bList = await userB.get("/api/v1/orders?page=1&limit=100");
    const bHasUserAOrder = bList.body.data.items.some(
      (o) => o.shippingAddress && o.shippingAddress.fullName === "USER A ONLY",
    );
    expect(bHasUserAOrder).toBe(false);
  });
});

describe("GET /api/v1/orders/:id (Order Detail)", () => {
  it("loads a single order by ID with details", async () => {
    const cust = await loginCustomer();
    const created = await cust
      .post("/api/v1/orders")
      .send({
        shippingAddress: SHIPPING,
        paymentMethod: "UPI",
        paymentStatus: "Paid",
        items: [makeItem({ quantity: 1 })],
      })
      .expect(201);

    const orderId = created.body.data._id;
    const res = await cust.get(`/api/v1/orders/${orderId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(orderId);
    expect(res.body.data.shippingAddress.city).toBe(SHIPPING.city);
  });

  it("forbids a customer from viewing another customer's order", async () => {
    const owner = await loginCustomer();
    const created = await owner
      .post("/api/v1/orders")
      .send({
        shippingAddress: SHIPPING,
        paymentMethod: "COD",
        items: [makeItem({ quantity: 1 })],
      })
      .expect(201);

    const other = agent();
    await User.register(
      new User({
        name: "Other",
        username: "other-cust-order",
        email: "other-order@tryvoxel.test",
      }),
      "OtherCust!123",
    );
    await other
      .post("/api/v1/users/login")
      .send({ email: "other-order@tryvoxel.test", password: "OtherCust!123" })
      .expect(200);

    const res = await other.get(`/api/v1/orders/${created.body.data._id}`);
    expect(res.statusCode).toBe(403);
  });
});

describe("POST /api/v1/orders/:id/cancel (customer cancel)", () => {
  it("cancels a pending order and restocks inventory atomically", async () => {
    const cust = await loginCustomer();
    const stockBefore = (await Product.findById(testProduct._id)).stock;
    const qty = 3;
    const created = await cust
      .post("/api/v1/orders")
      .send({
        shippingAddress: SHIPPING,
        paymentMethod: "COD",
        items: [makeItem({ quantity: qty })],
      })
      .expect(201);

    const stockAfterCreate = (await Product.findById(testProduct._id)).stock;
    expect(stockAfterCreate).toBe(stockBefore - qty);

    const cancel = await cust.post(
      `/api/v1/orders/${created.body.data._id}/cancel`,
    );
    expect(cancel.statusCode).toBe(200);
    expect(cancel.body.data.orderStatus).toBe("Cancelled");

    const stockAfterCancel = (await Product.findById(testProduct._id)).stock;
    expect(stockAfterCancel).toBe(stockBefore);
  });
});

describe("GET /api/admin/orders (admin orders list - fixes 404 from screenshots)", () => {
  it("returns 200 (not 404) with pagination + items + summary stats", async () => {
    const adm = await loginAdmin();
    const cust = await loginCustomer();
    await cust
      .post("/api/v1/orders")
      .send({
        shippingAddress: SHIPPING,
        paymentMethod: "COD",
        items: [makeItem({ quantity: 1 })],
      })
      .expect(201);

    const res = await adm.get(
      "/api/admin/orders?page=1&limit=25&search=&status=&payment=&sort=newest",
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const { items, total, page, limit, summary } = res.body.data;
    expect(Array.isArray(items)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(1);
    expect(page).toBe(1);
    expect(limit).toBe(25);
    expect(summary.totalOrders).toBeGreaterThanOrEqual(1);
    expect(typeof summary.totalRevenue).toBe("number");
    expect(summary.statusCounts).toBeDefined();
    expect(summary.paymentCounts).toBeDefined();
    const order = items.find(
      (o) => o.shippingAddress.fullName === SHIPPING.fullName,
    );
    expect(order).toBeDefined();
    expect(order.orderNumber).toMatch(/^TVX-/);
    expect(order.user).toBeDefined();
    expect(order.user.email).toBe(CUSTOMER.email);
  });

  it("returns 401 without valid admin session", async () => {
    const res = await agent().get("/api/admin/orders?page=1&limit=25");
    expect(res.statusCode).toBe(401);
  });

  it("filters by order status query param", async () => {
    const adm = await loginAdmin();
    const cust = await loginCustomer();
    await cust
      .post("/api/v1/orders")
      .send({
        shippingAddress: SHIPPING,
        paymentMethod: "UPI",
        paymentStatus: "Paid",
        items: [makeItem({ quantity: 1 })],
      })
      .expect(201);

    const res = await adm.get(
      "/api/admin/orders?page=1&limit=25&status=Confirmed",
    );
    expect(res.statusCode).toBe(200);
    for (const o of res.body.data.items) {
      expect(o.orderStatus).toBe("Confirmed");
    }
  });
});

describe("GET /api/admin/orders/:id (admin order detail)", () => {
  it("loads full order detail including user snapshot as admin", async () => {
    const adm = await loginAdmin();
    const cust = await loginCustomer();
    const created = await cust
      .post("/api/v1/orders")
      .send({
        shippingAddress: SHIPPING,
        paymentMethod: "UPI",
        paymentReference: "TVXADMIN123",
        paymentStatus: "Paid",
        items: [makeItem({ quantity: 2 })],
      })
      .expect(201);

    const res = await adm.get(`/api/admin/orders/${created.body.data._id}`);
    expect(res.statusCode).toBe(200);
    const o = res.body.data;
    expect(o._id).toBe(created.body.data._id);
    expect(o.orderStatus).toBe("Confirmed");
    expect(o.payment.reference).toBe("TVXADMIN123");
    expect(o.user.email).toBe(CUSTOMER.email);
    expect(o.items.length).toBe(1);
    expect(o.shippingAddress.postalCode).toBe(SHIPPING.postalCode);
  });
});
