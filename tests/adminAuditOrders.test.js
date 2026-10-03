const request = require("supertest");
const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const AdminAuditLog = require("../models/AdminAuditLog");
const { makeTestApp, teardown } = require("./helpers/testApp");

const ADMIN = {
  name: "Audit Admin",
  username: "audit-admin",
  email: "audit-admin@tryvoxel.test",
  password: "AuditAdmin!123",
};

const CUSTOMER = {
  name: "Audit Customer",
  username: "audit-customer",
  email: "audit-customer@tryvoxel.test",
  password: "AuditCustomer!123",
};

let app;
let testProduct;
let testCategory;

beforeAll(async () => {
  app = await makeTestApp();
  await User.register(new User({ ...ADMIN, role: "admin" }), ADMIN.password);
  await User.register(new User(CUSTOMER), CUSTOMER.password);
  testCategory = await Category.create({
    name: "Audit Test Cat",
    slug: "audit-test-cat",
    isActive: true,
  });
  testProduct = await Product.create({
    name: "Audit Test Lamp",
    slug: "audit-test-lamp",
    description: "For audit log tests",
    price: 1899,
    category: testCategory._id,
    stock: 50,
    isActive: true,
    images: [{ publicId: "audit/lamp-v1", url: "https://cdn.test/lamp.jpg", alt: "Lamp", isPrimary: true }],
    weightG: 300,
  });
});

afterAll(async () => {
  await teardown();
});

const agent = () => request.agent(app);

const loginCustomer = async () => {
  const cust = agent();
  await cust
    .post("/api/v1/users/login")
    .send({ email: CUSTOMER.email, password: CUSTOMER.password })
    .expect(200);
  return cust;
};

const loginAdmin = async () => {
  const adm = agent();
  await adm
    .post("/api/admin/auth/login")
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ email: ADMIN.email, password: ADMIN.password })
    .expect(200);
  return adm;
};

const SHIPPING = {
  fullName: "Audit Test",
  phone: "+919000000001",
  line1: "221B Baker Street",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400001",
  country: "India",
};

describe("Admin audit logs - order mutations write AdminAuditLog (fixes action/entityType required errors)", () => {
  it("writes an audit log for PUT /api/admin/orders/:id/status (order.status.updated) without validation errors", async () => {
    const cust = await loginCustomer();
    const adm = await loginAdmin();

    const created = await cust
      .post("/api/v1/orders")
      .send({
        shippingAddress: SHIPPING,
        paymentMethod: "COD",
        items: [
          {
            product: String(testProduct._id),
            name: testProduct.name,
            image: testProduct.images[0].url,
            quantity: 1,
            unitPrice: testProduct.price,
            productMeta: { slug: testProduct.slug },
          },
        ],
      })
      .expect(201);

    const logsBefore = await AdminAuditLog.countDocuments({});

    const res = await adm
      .put(`/api/admin/orders/${created.body.data._id}/status`)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ orderStatus: "Processing" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderStatus).toBe("Processing");

    const logsAfter = await AdminAuditLog.countDocuments({});
    expect(logsAfter).toBeGreaterThan(logsBefore);

    const auditEntry = await AdminAuditLog.findOne({
      entityType: "order",
      entityId: String(created.body.data._id),
      action: "order.status.updated",
    }).sort({ createdAt: -1 });

    expect(auditEntry).not.toBeNull();
    expect(auditEntry.adminUsername).toBe(ADMIN.username);
    expect(auditEntry.afterSnapshot.orderStatus).toBe("Processing");
    expect(auditEntry.diff).toBeDefined();
  });

  it("writes an audit log for PUT /api/admin/orders/:id/payment (order.payment.updated)", async () => {
    const cust = await loginCustomer();
    const adm = await loginAdmin();

    const created = await cust
      .post("/api/v1/orders")
      .send({
        shippingAddress: SHIPPING,
        paymentMethod: "COD",
        items: [
          {
            product: String(testProduct._id),
            name: testProduct.name,
            quantity: 1,
            unitPrice: testProduct.price,
            productMeta: { slug: testProduct.slug },
          },
        ],
      })
      .expect(201);

    const res = await adm
      .put(`/api/admin/orders/${created.body.data._id}/payment`)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ paymentStatus: "Paid", reference: "CASH-ON-DELIVERY-PAID" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.payment.status).toBe("Paid");

    const auditEntry = await AdminAuditLog.findOne({
      entityType: "order",
      entityId: String(created.body.data._id),
      action: "order.payment.updated",
    }).sort({ createdAt: -1 });

    expect(auditEntry).not.toBeNull();
    expect(auditEntry.afterSnapshot.reference).toBe("CASH-ON-DELIVERY-PAID");
  });

  it("writes an audit log for PUT /api/admin/orders/:id/refund (order.refunded) and restocks", async () => {
    const cust = await loginCustomer();
    const adm = await loginAdmin();
    const stockBefore = (await Product.findById(testProduct._id)).stock;
    const qty = 2;

    const created = await cust
      .post("/api/v1/orders")
      .send({
        shippingAddress: SHIPPING,
        paymentMethod: "UPI",
        paymentReference: "UPI-REFUND-TEST",
        paymentStatus: "Paid",
        items: [
          {
            product: String(testProduct._id),
            name: testProduct.name,
            quantity: qty,
            unitPrice: testProduct.price,
            productMeta: { slug: testProduct.slug },
          },
        ],
      })
      .expect(201);

    const stockAfterCreate = (await Product.findById(testProduct._id)).stock;
    expect(stockAfterCreate).toBe(stockBefore - qty);

    const res = await adm
      .put(`/api/admin/orders/${created.body.data._id}/refund`)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ note: "Customer requested refund via support" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.orderStatus).toBe("Refunded");
    expect(res.body.data.payment.status).toBe("Refunded");

    const stockAfterRefund = (await Product.findById(testProduct._id)).stock;
    expect(stockAfterRefund).toBe(stockBefore);

    const auditEntry = await AdminAuditLog.findOne({
      entityType: "order",
      entityId: String(created.body.data._id),
      action: "order.refunded",
    }).sort({ createdAt: -1 });

    expect(auditEntry).not.toBeNull();
    expect(auditEntry.reason).toBe("Customer requested refund via support");
    expect(auditEntry.beforeSnapshot.orderStatus).toBe("Confirmed");
    expect(auditEntry.afterSnapshot.orderStatus).toBe("Refunded");
  });
});
