jest.mock("../models/user", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
}));

jest.mock("../utils/email", () => ({
  isConfigured: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

const crypto = require("crypto");
const User = require("../models/user");
const emailService = require("../utils/email");
const userController = require("../controllers/user");
const { authSchemas } = require("../schema");

function response() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("password validation", () => {
  it("accepts five-character passwords with a letter and number and matching confirmation", () => {
    const valid = {
      currentPassword: "OldPassword1",
      newPassword: "Abc12",
      confirmPassword: "Abc12",
    };

    expect(authSchemas.changePassword.validate(valid).error).toBeUndefined();
    expect(
      authSchemas.changePassword.validate({
        ...valid,
        confirmPassword: "AnotherPassword123",
      }).error,
    ).toBeDefined();
    expect(
      authSchemas.resetPassword.validate({
        token: "a".repeat(64),
        newPassword: "Abc1",
        confirmPassword: "Abc1",
      }).error,
    ).toBeDefined();
    expect(
      authSchemas.resetPassword.validate({
        token: "a".repeat(64),
        newPassword: "weak",
        confirmPassword: "weak",
      }).error,
    ).toBeDefined();
  });
});

describe("changePassword controller", () => {
  it("checks and changes the authenticated user's password while rotating session version", async () => {
    const user = {
      _id: "user-1",
      authVersion: 2,
      changePassword: jest.fn().mockResolvedValue(),
    };
    User.findById.mockResolvedValue(user);
    const req = {
      user: { _id: user._id },
      body: {
        currentPassword: "OldPassword1",
        newPassword: "NewPassword1234",
      },
      login: (loggedInUser, callback) => callback(null),
    };
    const res = response();

    await userController.changePassword(req, res, jest.fn());

    expect(user.changePassword).toHaveBeenCalledWith(
      "OldPassword1",
      "NewPassword1234",
    );
    expect(user.authVersion).toBe(3);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { message: "Password updated successfully." },
    });
  });

  it("rejects a password update when the current password is wrong", async () => {
    const user = {
      _id: "user-1",
      authVersion: 0,
      changePassword: jest
        .fn()
        .mockRejectedValue(Object.assign(new Error("incorrect"), {
          name: "IncorrectPasswordError",
        })),
    };
    User.findById.mockResolvedValue(user);
    const next = jest.fn();

    await userController.changePassword(
      {
        user: { _id: user._id },
        body: {
          currentPassword: "wrong",
          newPassword: "NewPassword1234",
        },
      },
      response(),
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
  });
});

describe("password reset controller", () => {
  it("stores only a token hash and sends a reset link", async () => {
    emailService.isConfigured.mockReturnValue(true);
    emailService.sendPasswordResetEmail.mockResolvedValue();
    User.findOne.mockResolvedValue({
      _id: "user-1",
      email: "user@example.test",
    });
    User.updateOne.mockResolvedValue();
    const res = response();

    await userController.forgotPassword(
      { body: { email: "USER@example.test" } },
      res,
      jest.fn(),
    );

    const [recipient, rawToken] =
      emailService.sendPasswordResetEmail.mock.calls[0];
    const storedHash = User.updateOne.mock.calls[0][1].$set.resetTokenHash;
    expect(recipient).toBe("user@example.test");
    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(storedHash).toBe(
      crypto.createHash("sha256").update(rawToken).digest("hex"),
    );
    expect(storedHash).not.toBe(rawToken);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          message:
            "If an account exists for this email, a password reset link will be sent.",
        },
      }),
    );
  });

  it("returns the same generic response when the email is not registered", async () => {
    emailService.isConfigured.mockReturnValue(true);
    User.findOne.mockResolvedValue(null);
    const res = response();

    await userController.forgotPassword(
      { body: { email: "missing@example.test" } },
      res,
      jest.fn(),
    );

    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          message:
            "If an account exists for this email, a password reset link will be sent.",
        },
      }),
    );
  });

  it("keeps the response generic and clears the token after email delivery fails", async () => {
    emailService.isConfigured.mockReturnValue(true);
    User.findOne.mockResolvedValue({
      _id: "user-1",
      email: "user@example.test",
    });
    User.updateOne.mockResolvedValue();
    emailService.sendPasswordResetEmail.mockRejectedValue(
      Object.assign(new Error("delivery failed"), { code: "ESMTP" }),
    );
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = response();

    try {
      await userController.forgotPassword(
        { body: { email: "user@example.test" } },
        res,
        jest.fn(),
      );
      expect(log).toHaveBeenCalledWith(
        "[password-reset] Email delivery failed:",
        "ESMTP",
      );
    } finally {
      log.mockRestore();
    }

    expect(User.updateOne).toHaveBeenCalledTimes(2);
    expect(User.updateOne.mock.calls[1][1]).toEqual({
      $unset: { resetTokenHash: 1, resetTokenExpiresAt: 1 },
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          message:
            "If an account exists for this email, a password reset link will be sent.",
        },
      }),
    );
  });

  it("atomically consumes a valid token and increments the session version", async () => {
    const rawToken = "a".repeat(64);
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const user = {
      _id: "user-1",
      setPassword: jest.fn(async () => {
        user.hash = "hashed-password";
        user.salt = "random-salt";
      }),
    };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });
    User.findOneAndUpdate.mockResolvedValue(user);
    const res = response();

    await userController.resetPassword(
      {
        body: {
          token: rawToken,
          newPassword: "NewPassword1234",
        },
      },
      res,
      jest.fn(),
    );

    const [filter, update] = User.findOneAndUpdate.mock.calls[0];
    expect(filter.resetTokenHash).toBe(tokenHash);
    expect(update.$set).toMatchObject({
      hash: "hashed-password",
      salt: "random-salt",
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    });
    expect(update.$inc.authVersion).toBe(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("rejects an expired or already-consumed token", async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    const next = jest.fn();

    await userController.resetPassword(
      { body: { token: "b".repeat(64), newPassword: "NewPassword1234" } },
      response(),
      next,
    );

    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
  });
});
