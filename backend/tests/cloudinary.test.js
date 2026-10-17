const { extractRawPublicId } = require("../utils/cloudinary");

describe("extractRawPublicId", () => {
  it("preserves the complete folder path and file extension", () => {
    expect(
      extractRawPublicId(
        "https://res.cloudinary.com/demo/raw/upload/v123456/tryvoxel_PROD/3d-models/lamp.glb",
      ),
    ).toBe("tryvoxel_PROD/3d-models/lamp.glb");
  });

  it("handles raw upload URLs without an explicit version", () => {
    expect(
      extractRawPublicId(
        "https://res.cloudinary.com/demo/raw/upload/tryvoxel_DEV/3d-models/lamp.gltf",
      ),
    ).toBe("tryvoxel_DEV/3d-models/lamp.gltf");
  });

  it("returns null for invalid or unrelated URLs", () => {
    expect(extractRawPublicId("not a URL")).toBeNull();
    expect(
      extractRawPublicId(
        "https://res.cloudinary.com/demo/image/upload/v123/folder/image.png",
      ),
    ).toBeNull();
  });
});
