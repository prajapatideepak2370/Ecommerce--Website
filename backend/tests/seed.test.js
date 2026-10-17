jest.mock("../models/user", () => ({
  findOne: jest.fn(),
  register: jest.fn(),
}));

jest.mock("../models/Product", () => ({
  estimatedDocumentCount: jest.fn(),
}));

const User = require("../models/user");
const Product = require("../models/Product");
const {
  assertSeedAllowed,
  seedAdmin,
  seedProducts,
} = require("../seeders/seed");

describe("development seed safeguards", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAdminEmail = process.env.ADMIN_EMAIL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAIL = "seed-admin@example.test";
  });

  afterAll(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;

    if (originalAdminEmail === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = originalAdminEmail;
  });

  it("blocks development sample seeding in production", async () => {
    process.env.NODE_ENV = "production";

    expect(() => assertSeedAllowed()).toThrow(
      "Refusing to seed development sample data in production.",
    );
    await expect(seedProducts([])).rejects.toThrow(
      "Refusing to seed development sample data in production.",
    );
    expect(Product.estimatedDocumentCount).not.toHaveBeenCalled();
  });

  it("does not promote an existing customer during admin seeding", async () => {
    process.env.NODE_ENV = "test";
    const customer = {
      role: "customer",
      save: jest.fn(),
    };
    User.findOne.mockResolvedValue(customer);

    await expect(seedAdmin()).rejects.toThrow(
      "The configured admin email belongs to a non-admin account. Refusing to change its role.",
    );
    expect(customer.save).not.toHaveBeenCalled();
    expect(User.register).not.toHaveBeenCalled();
  });

  it("leaves an existing admin account unchanged", async () => {
    process.env.NODE_ENV = "test";
    const admin = {
      role: "admin",
      isBlocked: true,
      save: jest.fn(),
    };
    User.findOne.mockResolvedValue(admin);

    await expect(seedAdmin()).resolves.toBe(admin);
    expect(admin.save).not.toHaveBeenCalled();
    expect(User.register).not.toHaveBeenCalled();
  });
});
