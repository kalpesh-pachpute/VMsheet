const express = require("express");
const skuCalculationController = require("../controllers/spcController");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * SKU Calculation Routes
 * @author Sandhya Sapate
 * @version 1.0
 * @since 13-05-2026
 */

const router = express.Router();

// Multi-product saved sheets
router.post("/multi", authMiddleware, (req, res) => {
  skuCalculationController.createMultiSKUCalculationSheet(req, res);
});

router.get("/multi", authMiddleware, (req, res) => {
  skuCalculationController.getAllMultiSKUCalculationSheets(req, res);
});

router.get("/multi/:sheetId", authMiddleware, (req, res) => {
  skuCalculationController.getMultiSKUCalculationSheetById(req, res);
});

router.put("/multi/:sheetId", authMiddleware, (req, res) => {
  skuCalculationController.updateMultiSKUCalculationSheet(req, res);
});

router.delete("/multi/expenses/:expenseId", authMiddleware, (req, res) => {
  skuCalculationController.deleteMultiSKUCalculationExpenseById(req, res);
});

router.delete("/multi/items/:itemId", authMiddleware, (req, res) => {
  skuCalculationController.deleteMultiSKUCalculationProductById(req, res);
});

router.delete("/multi/:sheetId", authMiddleware, (req, res) => {
  skuCalculationController.deleteMultiSKUCalculationSheet(req, res);
});

// Create new SKU calculation
router.post("/", authMiddleware, (req, res) => {
  skuCalculationController.createSKUCalculation(req, res);
});

// Get all SKU calculations
router.get("/", authMiddleware, (req, res) => {
  skuCalculationController.getAllSKUCalculations(req, res);
});

// Get SKU calculations summary
router.get("/summary/all", authMiddleware, (req, res) => {
  skuCalculationController.getSKUCalculationsSummary(req, res);
});

// Get SKU calculation by ID
router.get("/:skuId", authMiddleware, (req, res) => {
  skuCalculationController.getSKUCalculationById(req, res);
});

// Search SKU calculations by product name
router.get("/search/product/:productName", authMiddleware, (req, res) => {
  skuCalculationController.getSKUCalculationsByProductName(req, res);
});

// Update SKU calculation
router.put("/:skuId", authMiddleware, (req, res) => {
  skuCalculationController.updateSKUCalculation(req, res);
});

// Delete SKU calculation
router.delete("/:skuId", authMiddleware, (req, res) => {
  skuCalculationController.deleteSKUCalculation(req, res);
});

module.exports = router;
