const express = require("express");
const router = express.Router();
const multer = require("multer");

const adminCatalogController = require("../../controllers/adminCatalog");
const catchAsync = require("../../utils/catchAsync");
const { validate } = require("../../middleware/validate");
const { adminCatalogSchemas } = require("../../schema");
const { csrfHeaderCheck } = require("../../middleware/adminAuth");
const { imageStorage, model3DStorage } = require("../../utils/cloudinary");

const uploadImages = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
const upload3D = multer({
  storage: model3DStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

router
  .route("/")
  .get(catchAsync(adminCatalogController.listProducts))
  .post(
    csrfHeaderCheck,
    validate(adminCatalogSchemas.productCreate),
    catchAsync(adminCatalogController.createProduct),
  );

router.post(
  "/bulk",
  csrfHeaderCheck,
  validate(adminCatalogSchemas.productBulk),
  catchAsync(adminCatalogController.bulkAction),
);

router
  .route("/:id")
  .get(catchAsync(adminCatalogController.getProductById))
  .put(
    csrfHeaderCheck,
    validate(adminCatalogSchemas.productUpdate),
    catchAsync(adminCatalogController.updateProduct),
  )
  .delete(csrfHeaderCheck, catchAsync(adminCatalogController.deleteProduct));

router.patch(
  "/:id/status",
  csrfHeaderCheck,
  validate(adminCatalogSchemas.productStatus),
  catchAsync(adminCatalogController.patchStatus),
);

router.patch(
  "/:id/stock",
  csrfHeaderCheck,
  validate(adminCatalogSchemas.productStock),
  catchAsync(adminCatalogController.patchStock),
);

router.post(
  "/:id/images",
  csrfHeaderCheck,
  uploadImages.array("images", 15),
  catchAsync(adminCatalogController.uploadImages),
);

router.delete(
  "/:id/images/:publicId",
  csrfHeaderCheck,
  catchAsync(adminCatalogController.deleteImage),
);

router.put(
  "/:id/images",
  csrfHeaderCheck,
  validate(adminCatalogSchemas.productImageReorder),
  catchAsync(adminCatalogController.reorderImages),
);

router.post(
  "/:id/model3d",
  csrfHeaderCheck,
  upload3D.single("model3d"),
  catchAsync(adminCatalogController.upload3D),
);

router.delete(
  "/:id/model3d",
  csrfHeaderCheck,
  catchAsync(adminCatalogController.delete3D),
);

module.exports = router;
