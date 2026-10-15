const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category");
const catchAsync = require("../utils/catchAsync");
const { validate } = require("../middleware/validate");
const { categorySchemas } = require("../schema");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const multer = require("multer");
const { categoryStorage } = require("../utils/cloudinary");

const uploadImage = multer({ storage: categoryStorage });

router.get("/", catchAsync(categoryController.listCategories));

router.get("/:slug", catchAsync(categoryController.getCategory));

router.post(
  "/",
  requireAuth,
  requireAdmin,
  validate(categorySchemas.create),
  catchAsync(categoryController.createCategory),
);

router.put(
  "/:slug",
  requireAuth,
  requireAdmin,
  validate(categorySchemas.update),
  catchAsync(categoryController.updateCategory),
);

router.delete(
  "/:slug",
  requireAuth,
  requireAdmin,
  catchAsync(categoryController.deleteCategory),
);

router.post(
  "/:slug/image",
  requireAuth,
  requireAdmin,
  uploadImage.single("image"),
  catchAsync(categoryController.uploadCategoryImage),
);

module.exports = router;
