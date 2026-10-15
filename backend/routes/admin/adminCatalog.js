const express = require("express");
const router = express.Router();

const adminCatalogController = require("../../controllers/adminCatalog");
const adminInventoryController = require("../../controllers/adminInventory");
const catchAsync = require("../../utils/catchAsync");
const { validate } = require("../../middleware/validate");
const { adminCatalogSchemas } = require("../../schema");
const { csrfHeaderCheck } = require("../../middleware/adminAuth");

router.get("/summary", catchAsync(adminCatalogController.getCatalogSummary));

router.get("/inventory", catchAsync(adminInventoryController.getInventoryList));

router.patch(
  "/inventory/:id",
  csrfHeaderCheck,
  validate(adminCatalogSchemas.productStock),
  catchAsync(adminInventoryController.patchInventoryStock),
);

router.get(
  "/inventory/:id/history",
  catchAsync(adminInventoryController.getStockChangeHistory),
);

module.exports = router;
