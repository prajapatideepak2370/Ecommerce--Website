const express = require("express");
const router = express.Router();
const productController = require("../controllers/product");
const catchAsync = require("../utils/catchAsync");
const { validate } = require("../middleware/validate");
const { productSchemas, adminSchemas } = require("../schema");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const multer = require("multer");
const { imageStorage, model3DStorage } = require("../utils/cloudinary");

const uploadImages = multer({ storage: imageStorage });
const upload3D = multer({ storage: model3DStorage });

router
  .route("/")
  .get(validate(productSchemas.query, "query"), catchAsync(productController.listProducts))
  .post(
    requireAuth,
    requireAdmin,
    validate(productSchemas.create),
    catchAsync(productController.createProduct),
  );

router
  .route("/:slug")
  .get(catchAsync(productController.getProductBySlug))
  .put(
    requireAuth,
    requireAdmin,
    validate(productSchemas.update),
    catchAsync(productController.updateProduct),
  )
  .delete(requireAuth, requireAdmin, catchAsync(productController.deleteProduct));

router.post(
  "/:slug/images",
  requireAuth,
  requireAdmin,
  uploadImages.array("images", 10),
  catchAsync(productController.uploadProductImages),
);

router.patch(
  "/:slug/stock",
  requireAuth,
  requireAdmin,
  validate(adminSchemas.stockUpdate),
  catchAsync(productController.updateStock),
);

module.exports = router;
