jest.mock("../models/User", () => {
  function MockUser(values) {
    Object.assign(this, values);
  }

  MockUser.findOne = jest.fn();
  MockUser.prototype.save = jest.fn(function save() {
    MockUser.records.push(this);
    return Promise.resolve(this);
  });
  MockUser.records = [];
  return MockUser;
});

const User = require("../models/User");
const { GoogleAuthError, resolveGoogleUser } = require("../utils/googleAuth");

const verifiedProfile = (overrides = {}) => ({
  id: "google-user-123",
  displayName: "Google User",
  emails: [{ value: "Google.User@example.com" }],
  photos: [{ value: "https://lh3.googleusercontent.com/avatar" }],
  _json: { email_verified: true },
  ...overrides,
});

beforeEach(() => {
  User.records = [];
  User.findOne.mockReset();
  User.findOne.mockImplementation(async (query) => {
    if (query.googleId) {
      return User.records.find((user) => user.googleId === query.googleId) || null;
    }
    if (query.email) {
      return User.records.find((user) => user.email === query.email) || null;
    }
    if (query.username) {
      return User.records.find((user) => user.username === query.username) || null;
    }
    if (query.$or) {
      return (
        User.records.find((user) =>
          query.$or.some(
            (condition) =>
              (condition.googleId && user.googleId === condition.googleId) ||
              (condition.email && user.email === condition.email),
          ),
        ) || null
      );
    }
    return null;
  });
  User.prototype.save.mockClear();
});

describe("resolveGoogleUser", () => {
  it("creates a customer with verified Google identity and avatar", async () => {
    const user = await resolveGoogleUser(verifiedProfile());

    expect(user).toMatchObject({
      name: "Google User",
      email: "google.user@example.com",
      username: "ggoogleuser123",
      googleId: "google-user-123",
      avatar: "https://lh3.googleusercontent.com/avatar",
      authProvider: "google",
      role: "customer",
    });
    expect(User.prototype.save).toHaveBeenCalledTimes(1);
  });

  it("links a verified Google identity to an existing local account by email", async () => {
    const localUser = {
      name: "Local User",
      email: "google.user@example.com",
      username: "localuser",
      authProvider: "local",
      googleId: null,
      avatar: "",
      role: "customer",
      isBlocked: false,
      save: jest.fn().mockResolvedValue(),
    };
    User.records.push(localUser);

    const user = await resolveGoogleUser(verifiedProfile());

    expect(user).toBe(localUser);
    expect(user.googleId).toBe("google-user-123");
    expect(user.authProvider).toBe("local");
    expect(user.avatar).toBe("https://lh3.googleusercontent.com/avatar");
    expect(localUser.save).toHaveBeenCalledTimes(1);
  });

  it("rejects an unverified email without creating or linking an account", async () => {
    await expect(
      resolveGoogleUser(
        verifiedProfile({ _json: { email_verified: false } }),
      ),
    ).rejects.toMatchObject({
      name: "GoogleAuthError",
      code: "email_not_verified",
    });
    expect(User.records).toHaveLength(0);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it("does not link an email already linked to another Google account", async () => {
    const existingUser = {
      email: "google.user@example.com",
      googleId: "another-google-id",
      role: "customer",
      isBlocked: false,
      save: jest.fn(),
    };
    User.records.push(existingUser);

    await expect(resolveGoogleUser(verifiedProfile())).rejects.toEqual(
      expect.objectContaining({
        name: "GoogleAuthError",
        code: "account_conflict",
      }),
    );
    expect(existingUser.save).not.toHaveBeenCalled();
  });

  it("rejects blocked accounts", async () => {
    User.records.push({
      email: "google.user@example.com",
      googleId: "google-user-123",
      role: "customer",
      isBlocked: true,
    });

    await expect(resolveGoogleUser(verifiedProfile())).rejects.toBeInstanceOf(
      GoogleAuthError,
    );
  });
});
