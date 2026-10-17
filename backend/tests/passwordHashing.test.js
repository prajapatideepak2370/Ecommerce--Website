const User = require("../models/user");

describe("existing user password hashing", () => {
  it("verifies password changes using the configured passport-local-mongoose hasher", async () => {
    const user = new User({
      name: "Password Test",
      username: "password-test",
      email: "password-test@example.test",
    });

    await user.setPassword("OriginalPassword123");
    const originalHash = user.hash;
    expect(originalHash).not.toBe("OriginalPassword123");
    expect((await user.authenticate("OriginalPassword123")).user).toBe(user);
    expect((await user.authenticate("incorrect-password")).user).toBe(false);

    await user.setPassword("UpdatedPassword123");
    expect(user.hash).not.toBe(originalHash);
    expect((await user.authenticate("OriginalPassword123")).user).toBe(false);
    expect((await user.authenticate("UpdatedPassword123")).user).toBe(user);
  });
});
