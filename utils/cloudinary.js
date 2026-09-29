const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const envSuffix =
  process.env.NODE_ENV === "production" ? "tryvoxel_PROD" : "tryvoxel_DEV";

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: `${envSuffix}/products`,
    allowedFormats: ["png", "jpg", "jpeg", "webp", "avif"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: `${envSuffix}/categories`,
    allowedFormats: ["png", "jpg", "jpeg", "webp", "avif"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

const model3DStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: `${envSuffix}/3d-models`,
    resource_type: "raw",
    allowedFormats: ["glb", "gltf"],
  },
});

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (err) {
    console.warn("Cloudinary delete failed:", err.message);
    return null;
  }
};

const extractPublicId = (url) => {
  if (!url) return null;
  try {
    const parts = new URL(url).pathname.split("/");
    const fileName = parts[parts.length - 1];
    return fileName ? path.parse(fileName).name : null;
  } catch {
    return null;
  }
};

module.exports = {
  cloudinary,
  imageStorage,
  categoryStorage,
  model3DStorage,
  deleteFromCloudinary,
  extractPublicId,
};
