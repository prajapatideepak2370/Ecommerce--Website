jest.mock("razorpay", () =>
  jest.fn(() => ({
    orders: {
      create: (params) => global.__razorpayTestState.createOrder(params),
      fetch: (orderId) => global.__razorpayTestState.fetchOrder(orderId),
    },
    payments: {
      fetch: (paymentId) =>
        global.__razorpayTestState.fetchPayment(paymentId),
    },
  })),
);
jest.mock("express-rate-limit", () => () => (_req, _res, next) => next());

const crypto = require("crypto");
const request = require("supertest");
const User = require("../models/user");
const Product = require("../models/Product");
const Order = require("../models/Order");
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
  let orderCounter = 0;
  global.__razorpayTestState = {
    orders: new Map(),
    payments: new Map(),
    createOrder: jest.fn(async (params) => {
      const id = `order_test_${++orderCounter}`;
      const order = { id, ...params };
      global.__razorpayTestState.orders.set(id, order);
      return order;
    }),
    fetchOrder: jest.fn(async (id) => global.__razorpayTestState.orders.get(id)),
    fetchPayment: jest.fn(async (id) =>
      global.__razorpayTestState.payments.get(id),
    ),
  };
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
  delete global.__razorpayTestState;
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

const createRazorpayOrder = async (customer, items = [makeItem()]) => {
  const response = await customer
    .post("/api/v1/orders/razorpay/create-order")
    .send({ shippingAddress: SHIPPING, items })
    .expect(200);
  return response.body.data;
};

const verifyCapturedPayment = async (
  customer,
  razorpayOrder,
  { paymentId = "pay_test_success", status = "captured", amount } = {},
) => {
  const order = global.__razorpayTestState.orders.get(razorpayOrder.orderId);
  const quantity = Math.round(
    order.amount / (testProduct.discountPrice * 100),
  );
  global.__razorpayTestState.payments.set(paymentId, {
    id: paymentId,
    order_id: razorpayOrder.orderId,
    amount: amount ?? order.amount,
    currency: order.currency,
    status,
  });
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrder.orderId}|${paymentId}`)
    .digest("hex");
  return customer
    .post("/api/v1/orders/razorpay/verify")
    .send({
      shippingAddress: SHIPPING,
      items: [makeItem({ quantity, unitPrice: 1 })],
      razorpay_order_id: razorpayOrder.orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });
};

beforeEach(() => {
  global.__razorpayTestState.orders.clear();
  global.__razorpayTestState.payments.clear();
  global.__razorpayTestState.createOrder.mockClear();
  global.__razorpayTestState.fetchOrder.mockClear();
  global.__razorpayTestState.fetchPayment.mockClear();
});

describe("POST /api/v1/orders (create order from Checkout)", () => {
  it("creates a Razorpay order with shippingAddress + items and returns 201 + orderNumber", async () => {
    const cust = await loginCustomer();
    const stockBefore = (await Product.findById(testProduct._id)).stock;
    const payload = {
      shippingAddress: SHIPPING,
      paymentMethod: "Razorpay",
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
    expect(order.payment.provider).toBe("Razorpay");
    expect(order.payment.status).toBe("Pending");
    expect(order.items.length).toBe(1);
    expect(order.items[0].name).toBe(testProduct.name);
    expect(order.items[0].quantity).toBe(2);
    expect(order.subtotal).toBe(testProduct.discountPrice * 2);
    expect(order.tax).toBe(0);
    expect(order.shippingFee).toBe(0);
    expect(order.totalAmount).toBe(order.subtotal);
    expect(order.shippingAddress.fullName).toBe(SHIPPING.fullName);
    expect(order.shippingAddress.phone).toBe(SHIPPING.phone);

    const stockAfter = (await Product.findById(testProduct._id)).stock;
    expect(stockAfter).toBe(stockBefore - 2);
  });

  it("rejects a client request that tries to mark an unpaid order as Paid", async () => {
    const cust = await loginCustomer();
    const stockBefore = (await Product.findById(testProduct._id)).stock;
    const payload = {
      shippingAddress: SHIPPING,
      paymentMethod: "Razorpay",
      paymentReference: "TVXTESTRAZOR123",
      paymentStatus: "Paid",
      items: [makeItem({ quantity: 1 })],
    };

    const res = await cust.post("/api/v1/orders").send(payload);

    expect(res.statusCode).toBe(400);

    const stockAfter = (await Product.findById(testProduct._id)).stock;
    expect(stockAfter).toBe(stockBefore);
  });

  it("rejects order with invalid address (missing required fields) with 400", async () => {
    const cust = await loginCustomer();
    const payload = {
      shippingAddress: { fullName: "X", phone: "Y" },
      paymentMethod: "Razorpay",
      items: [makeItem()],
    };
    const res = await cust.post("/api/v1/orders").send(payload);
    expect(res.statusCode).toBe(400);
  });

  describe("Razorpay checkout and payment verification", () => {
    it("creates a gateway order in paise using the server product price", async () => {
      const customer = await loginCustomer();
      const item = makeItem({ quantity: 1, unitPrice: 1 });
      const gatewayOrder = await createRazorpayOrder(customer, [item]);

      expect(global.__razorpayTestState.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: testProduct.discountPrice * 100,
          currency: "INR",
          notes: expect.objectContaining({ userId: expect.any(String) }),
        }),
      );
      expect(gatewayOrder.amountPaise).toBe(testProduct.discountPrice * 100);
      expect(gatewayOrder.amount).toBe(testProduct.discountPrice);
      expect(gatewayOrder.isTestMode).toBe(true);
    });

    it("sends exactly 100 paise to Razorpay for a one-rupee product", async () => {
      const customer = await loginCustomer();
      const originalDiscountPrice = testProduct.discountPrice;
      await Product.findByIdAndUpdate(testProduct._id, { discountPrice: 1 });

      try {
        const gatewayOrder = await createRazorpayOrder(customer, [
          makeItem({ quantity: 1, unitPrice: 200.05 }),
        ]);
        expect(global.__razorpayTestState.createOrder).toHaveBeenCalledWith(
          expect.objectContaining({ amount: 100 }),
        );
        expect(gatewayOrder.amountPaise).toBe(100);
        expect(gatewayOrder.amount).toBe(1);
      } finally {
        await Product.findByIdAndUpdate(testProduct._id, {
          discountPrice: originalDiscountPrice,
        });
      }
    });

    it("returns a safe retry message if Razorpay order creation fails", async () => {
      const customer = await loginCustomer();
      const gatewayFailure = new Error("private gateway detail");
      gatewayFailure.code = "ETIMEDOUT";
      global.__razorpayTestState.createOrder.mockRejectedValueOnce(gatewayFailure);
      const log = jest.spyOn(console, "error").mockImplementation(() => {});

      const response = await customer
        .post("/api/v1/orders/razorpay/create-order")
        .send({ shippingAddress: SHIPPING, items: [makeItem()] })
        .expect(502);

      expect(response.body.error.message).toMatch(/temporarily unavailable/i);
      expect(JSON.stringify(response.body)).not.toContain("private gateway detail");
      expect(log).toHaveBeenCalledWith(
        "[payments] Razorpay request failed",
        expect.objectContaining({ stage: "create_order", code: "ETIMEDOUT" }),
      );
      log.mockRestore();
    });

    it("requires authentication before creating a Razorpay order", async () => {
      await agent()
        .post("/api/v1/orders/razorpay/create-order")
        .send({ shippingAddress: SHIPPING, items: [makeItem()] })
        .expect(401);
    });

    it("requires authentication before verifying a payment", async () => {
      await agent()
        .post("/api/v1/orders/razorpay/verify")
        .send({
          shippingAddress: SHIPPING,
          items: [makeItem()],
          razorpay_order_id: "order_test",
          razorpay_payment_id: "pay_test",
          razorpay_signature: "0".repeat(64),
        })
        .expect(401);
    });

    it("rejects invalid checkout order requests", async () => {
      const customer = await loginCustomer();
      await customer
        .post("/api/v1/orders/razorpay/create-order")
        .send({ shippingAddress: SHIPPING, items: [] })
        .expect(400);
    });

    it("creates a confirmed order only for a captured payment and safely handles concurrent retries", async () => {
      const customer = await loginCustomer();
      const stockBefore = (await Product.findById(testProduct._id)).stock;
      const gatewayOrder = await createRazorpayOrder(customer, [
        makeItem({ quantity: 1, unitPrice: 1 }),
      ]);

      const first = await verifyCapturedPayment(customer, gatewayOrder);
      expect(first.status).toBe(201);
      expect(first.body.data.payment.status).toBe("Paid");
      expect(first.body.data.orderStatus).toBe("Confirmed");
      expect(first.body.data.totalAmount).toBe(testProduct.discountPrice);

      const retries = await Promise.all([
        verifyCapturedPayment(customer, gatewayOrder),
        verifyCapturedPayment(customer, gatewayOrder),
      ]);
      expect(retries.map((retry) => retry.status).sort()).toEqual([200, 200]);
      expect(retries[0].body.data._id).toBe(first.body.data._id);
      expect(retries[1].body.data._id).toBe(first.body.data._id);
      expect(
        await Order.countDocuments({
          "payment.razorpayPaymentId": "pay_test_success",
        }),
      ).toBe(1);
      expect((await Product.findById(testProduct._id)).stock).toBe(stockBefore - 1);
    });

    it("returns a safe message when fetching the gateway payment fails", async () => {
      const customer = await loginCustomer();
      const gatewayOrder = await createRazorpayOrder(customer);
      const gatewayFailure = new Error("private payment response");
      gatewayFailure.code = "ETIMEDOUT";
      global.__razorpayTestState.fetchPayment.mockRejectedValueOnce(gatewayFailure);
      const log = jest.spyOn(console, "error").mockImplementation(() => {});

      const response = await verifyCapturedPayment(customer, gatewayOrder, {
        paymentId: "pay_test_network_error",
      });

      expect(response.status).toBe(502);
      expect(response.body.error.message).toMatch(/temporarily unavailable/i);
      expect(JSON.stringify(response.body)).not.toContain("private payment response");
      expect(log).toHaveBeenCalledWith(
        "[payments] Razorpay request failed",
        expect.objectContaining({ stage: "fetch_payment", code: "ETIMEDOUT" }),
      );
      log.mockRestore();
    });

    it("does not create an order for an invalid payment signature", async () => {
      const customer = await loginCustomer();
      const gatewayOrder = await createRazorpayOrder(customer);
      const stockBefore = (await Product.findById(testProduct._id)).stock;
      const ordersBefore = await Order.countDocuments();

      await customer
        .post("/api/v1/orders/razorpay/verify")
        .send({
          shippingAddress: SHIPPING,
          items: [makeItem()],
          razorpay_order_id: gatewayOrder.orderId,
          razorpay_payment_id: "pay_test_bad_signature",
          razorpay_signature: "0".repeat(64),
        })
        .expect(400);

      expect(global.__razorpayTestState.fetchPayment).not.toHaveBeenCalled();
      expect(await Order.countDocuments()).toBe(ordersBefore);
      expect((await Product.findById(testProduct._id)).stock).toBe(stockBefore);
    });

    it.each([
      ["failed", 400, /declined/i],
      ["authorized", 409, /still processing/i],
    ])("does not mark a %s payment as successful", async (status, code, message) => {
      const customer = await loginCustomer();
      const gatewayOrder = await createRazorpayOrder(customer);
      const stockBefore = (await Product.findById(testProduct._id)).stock;
      const ordersBefore = await Order.countDocuments();

      const response = await verifyCapturedPayment(customer, gatewayOrder, {
        paymentId: `pay_test_${status}`,
        status,
      });

      expect(response.status).toBe(code);
      expect(response.body.error.message).toMatch(message);
      expect(await Order.countDocuments()).toBe(ordersBefore);
      expect((await Product.findById(testProduct._id)).stock).toBe(stockBefore);
    });

    it("rejects a captured payment whose amount differs from the product total", async () => {
      const customer = await loginCustomer();
      const gatewayOrder = await createRazorpayOrder(customer);
      const stockBefore = (await Product.findById(testProduct._id)).stock;
      const ordersBefore = await Order.countDocuments();

      const response = await verifyCapturedPayment(customer, gatewayOrder, {
        paymentId: "pay_test_wrong_amount",
        amount: 100,
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toMatch(/do not match/i);
      expect(await Order.countDocuments()).toBe(ordersBefore);
      expect((await Product.findById(testProduct._id)).stock).toBe(stockBefore);
    });
  });

  it("rejects order with out-of-stock quantity with 400", async () => {
    const cust = await loginCustomer();
    const payload = {
      shippingAddress: SHIPPING,
      paymentMethod: "Razorpay",
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
        paymentMethod: "Razorpay",
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
        paymentMethod: "Razorpay",
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
        paymentMethod: "Razorpay",
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
        paymentMethod: "Razorpay",
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
        paymentMethod: "Razorpay",
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
        paymentMethod: "Razorpay",
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
        paymentMethod: "Razorpay",
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
    const gatewayOrder = await createRazorpayOrder(cust, [
      makeItem({ quantity: 1 }),
    ]);
    const createdOrder = await verifyCapturedPayment(cust, gatewayOrder, {
      paymentId: "pay_test_admin_filter",
    });
    expect(createdOrder.status).toBe(201);

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
    const gatewayOrder = await createRazorpayOrder(cust, [
      makeItem({ quantity: 2 }),
    ]);
    const created = await verifyCapturedPayment(cust, gatewayOrder, {
      paymentId: "pay_test_admin_details",
    });
    expect(created.status).toBe(201);

    const res = await adm.get(`/api/admin/orders/${created.body.data._id}`);
    expect(res.statusCode).toBe(200);
    const o = res.body.data;
    expect(o._id).toBe(created.body.data._id);
    expect(o.orderStatus).toBe("Confirmed");
    expect(o.payment.reference).toBe("pay_test_admin_details");
    expect(o.user.email).toBe(CUSTOMER.email);
    expect(o.items.length).toBe(1);
    expect(o.shippingAddress.postalCode).toBe(SHIPPING.postalCode);
  });
});
