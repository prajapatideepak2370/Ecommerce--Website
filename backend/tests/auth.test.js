const request = require("supertest");
const { makeTestApp, teardown } = require("./helpers/testApp");

let app;
const agent = () => request.agent(app);

beforeAll(async () => {
  app = await makeTestApp();
});
afterAll(async () => {
  await teardown();
});

const USER_A = {
  name: "Alice Customer",
  username: "alice123",
  email: "alice@tryvoxel.test",
  password: "AlicePass!1234",
  phone: "+919999999999",
};

describe("POST /api/v1/users/register", () => {
  it("creates a customer user + sets session + returns user without hash/salt", async () => {
    const a = agent();
    const res = await a.post("/api/v1/users/register").send(USER_A);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(USER_A.name);
    expect(res.body.data.email).toBe(USER_A.email);
    expect(res.body.data.role).toBe("customer");
    expect(res.body.data.isBlocked).toBe(false);
    expect(res.body.data.hash).toBeUndefined();
    expect(res.body.data.salt).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects duplicate email with 409", async () => {
    const res = await agent()
      .post("/api/v1/users/register")
      .send({ ...USER_A, username: "alice2" });
    expect(res.statusCode).toBe(409);
  });

  it("rejects duplicate username with 409", async () => {
    const res = await agent()
      .post("/api/v1/users/register")
      .send({ ...USER_A, email: "alice2@tryvoxel.test" });
    expect(res.statusCode).toBe(409);
  });

  it("rejects invalid payload (short password) with 400", async () => {
    const res = await agent()
      .post("/api/v1/users/register")
      .send({ ...USER_A, password: "x" });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/v1/users/login", () => {
  it("logs in by username + sets session", async () => {
    const a = agent();
    const res = await a
      .post("/api/v1/users/login")
      .send({ username: USER_A.username, password: USER_A.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.username).toBe(USER_A.username);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("logs in by email (normalized)", async () => {
    const a = agent();
    const res = await a
      .post("/api/v1/users/login")
      .send({ email: USER_A.email, password: USER_A.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe(USER_A.email);
  });

  it("rejects wrong password with 401", async () => {
    const res = await agent()
      .post("/api/v1/users/login")
      .send({ username: USER_A.username, password: "wrongpass" });
    expect(res.statusCode).toBe(401);
  });

  it("rejects unknown email with 401", async () => {
    const res = await agent()
      .post("/api/v1/users/login")
      .send({ email: "nope@tryvoxel.test", password: USER_A.password });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/v1/users/me", () => {
  it("401s when no session", async () => {
    const res = await agent().get("/api/v1/users/me");
    expect(res.statusCode).toBe(401);
  });

  it("200 with full user when session exists", async () => {
    const a = agent();
    await a
      .post("/api/v1/users/login")
      .send({ username: USER_A.username, password: USER_A.password });
    const res = await a.get("/api/v1/users/me");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe(USER_A.email);
    expect(res.body.data.username).toBe(USER_A.username);
  });
});

describe("PUT /api/v1/users/profile", () => {
  it("updates name + phone", async () => {
    const a = agent();
    await a
      .post("/api/v1/users/login")
      .send({ username: USER_A.username, password: USER_A.password });
    const res = await a
      .put("/api/v1/users/profile")
      .send({ name: "Alice Updated", phone: "+919876543210" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe("Alice Updated");
    expect(res.body.data.phone).toBe("+919876543210");
  });

  it("rejects 401 without auth", async () => {
    const res = await agent()
      .put("/api/v1/users/profile")
      .send({ name: "Nope" });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /api/v1/users/logout", () => {
  it("destroys session, /me then returns 401", async () => {
    const a = agent();
    await a
      .post("/api/v1/users/login")
      .send({ username: USER_A.username, password: USER_A.password });
    expect((await a.get("/api/v1/users/me")).statusCode).toBe(200);
    const logout = await a.post("/api/v1/users/logout");
    expect(logout.statusCode).toBe(200);
    expect(logout.body.data.loggedOut).toBe(true);
    expect((await a.get("/api/v1/users/me")).statusCode).toBe(401);
  });
});

describe("Addresses CRUD /api/v1/users/addresses", () => {
  const addr = {
    label: "Home",
    fullName: "Alice Customer",
    phone: "+919999999999",
    line1: "101, Voxel Heights",
    line2: "Near Cube Park",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "India",
    isDefault: true,
  };

  it("401 without auth", async () => {
    expect((await agent().get("/api/v1/users/addresses")).statusCode).toBe(401);
  });

  it("adds two addresses, sets default flag correctly on first", async () => {
    const a = agent();
    await a
      .post("/api/v1/users/login")
      .send({ username: USER_A.username, password: USER_A.password });

    const r1 = await a.post("/api/v1/users/addresses").send(addr);
    expect(r1.statusCode).toBe(201);
    expect(r1.data || r1.body.data);
    const a1 = r1.body.data;
    expect(a1.isDefault).toBe(true);

    const r2 = await a.post("/api/v1/users/addresses").send({
      ...addr,
      label: "Work",
      line1: "7th floor TRYVOXEL Tower",
      line2: "",
    });
    expect(r2.statusCode).toBe(201);
    const a2 = r2.body.data;

    const list = await a.get("/api/v1/users/addresses");
    expect(list.statusCode).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data.length).toBe(2);
    const firstDef = list.body.data.filter((x) => x.isDefault);
    expect(firstDef.length).toBe(1);
    expect(String(firstDef[0]._id)).toBe(String(a1._id));

    // update a2 to default — should flip a1 flag off
    const upd = await a
      .put(`/api/v1/users/addresses/${a2._id}`)
      .send({ ...addr, label: "Work HQ", isDefault: true });
    expect(upd.statusCode).toBe(200);
    const afterList = await a.get("/api/v1/users/addresses");
    const defs = afterList.body.data.filter((x) => x.isDefault);
    expect(defs.length).toBe(1);
    expect(String(defs[0]._id)).toBe(String(a2._id));
    expect(defs[0].label).toBe("Work HQ");

    // delete a1
    const del = await a.delete(`/api/v1/users/addresses/${a1._id}`);
    expect(del.statusCode).toBe(200);
    expect(del.body.data.deleted).toBe(true);
    const finalList = await a.get("/api/v1/users/addresses");
    expect(finalList.body.data.length).toBe(1);
    expect(finalList.body.data[0].isDefault).toBe(true);

    // delete 404 on unknown id
    const badDel = await a.delete(
      "/api/v1/users/addresses/000000000000000000000000",
    );
    expect(badDel.statusCode).toBe(404);
  });

  it("add address invalid payload → 400", async () => {
    const a = agent();
    await a
      .post("/api/v1/users/login")
      .send({ username: USER_A.username, password: USER_A.password });
    const res = await a.post("/api/v1/users/addresses").send({});
    expect(res.statusCode).toBe(400);
  });
});
