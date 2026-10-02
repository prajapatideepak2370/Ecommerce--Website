const express = require("express");
const router = express.Router();
const multer = require("multer");

const adminCategoriesController = require("../../controllers/adminCategories");
const catchAsync = require("../../utils/catchAsync");
const { validate } = require("../../middleware/validate");
const { adminCatalogSchemas } = require("../../schema");
const { csrfHeaderCheck } = require("../../middleware/adminAuth");
const { categoryStorage } = require("../../utils/cloudinary");

const uploadCategoryImage = multer({
  storage: categoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router
  .route("/")
  .get(catchAsync(adminCategoriesController.listCategories))
  .post(
    csrfHeaderCheck,
    validate(adminCatalogSchemas.categoryCreate),
    catchAsync(adminCategoriesController.createCategory),
  );

router
  .route("/:id")
  .get(catchAsync(adminCategoriesController.getCategory))
  .put(
    csrfHeaderCheck,
    validate(adminCatalogSchemas.categoryUpdate),
    catchAsync(adminCategoriesController.updateCategory),
  )
  .delete(
    csrfHeaderCheck,
    validate(adminCatalogSchemas.categoryDelete),
    catchAsync(adminCategoriesController.deleteCategory),
  );

router.post(
  "/:id/image",
  csrfHeaderCheck,
  uploadCategoryImage.single("image"),
  catchAsync(adminCategoriesController.uploadImage),
);

router.delete(
  "/:id/image",
  csrfHeaderCheck,
  catchAsync(adminCategoriesController.deleteImage),
);

module.exports = router;
