const skuCalculationService = require("../services/spcServices");

/**
 * SKU Calculation Controller
 * Handles HTTP requests for SKU calculations
 * @author Sandhya Sapate
 * @version 1.0
 * @since 13-05-2026
 */

class SKUCalculationController {
  async createMultiSKUCalculationSheet(req, res) {
    try {
      const { body } = req;
      const userId = req.user?.id || req.body.created_by;
      const sheet = await skuCalculationService.createMultiSKUCalculationSheet({
        ...body,
        created_by: userId,
        updated_by: userId,
      });

      res.status(201).json({
        success: true,
        message: "Multi SKU calculation sheet created successfully",
        data: sheet,
      });
    } catch (error) {
      console.error("Error in createMultiSKUCalculationSheet:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAllMultiSKUCalculationSheets(req, res) {
    try {
      const userId = req.user?.id || null;
      const sheets = await skuCalculationService.getAllMultiSKUCalculationSheets(userId);

      res.status(200).json({
        success: true,
        message: "Multi SKU calculation sheets retrieved successfully",
        data: sheets,
      });
    } catch (error) {
      console.error("Error in getAllMultiSKUCalculationSheets:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMultiSKUCalculationSheetById(req, res) {
    try {
      const { sheetId } = req.params;
      const sheet = await skuCalculationService.getMultiSKUCalculationSheetById(sheetId);

      res.status(200).json({
        success: true,
        message: "Multi SKU calculation sheet retrieved successfully",
        data: sheet,
      });
    } catch (error) {
      console.error("Error in getMultiSKUCalculationSheetById:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteMultiSKUCalculationSheet(req, res) {
    try {
      const { sheetId } = req.params;
      const deletedBy = req.user?.id || req.body.deleted_by || null;
      const result = await skuCalculationService.deleteMultiSKUCalculationSheet(sheetId, deletedBy);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in deleteMultiSKUCalculationSheet:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteMultiSKUCalculationExpenseById(req, res) {
    try {
      const { expenseId } = req.params;
      const deletedBy = req.user?.id || req.body.deleted_by || null;
      const sheet = await skuCalculationService.deleteMultiSKUCalculationExpenseById(
        expenseId,
        deletedBy
      );

      res.status(200).json({
        success: true,
        message: `Multi SKU expense with ID ${expenseId} deleted successfully`,
        data: sheet,
      });
    } catch (error) {
      console.error("Error in deleteMultiSKUCalculationExpenseById:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteMultiSKUCalculationProductById(req, res) {
    try {
      const { itemId } = req.params;
      const deletedBy = req.user?.id || req.body.deleted_by || null;
      const sheet = await skuCalculationService.deleteMultiSKUCalculationProductById(
        itemId,
        deletedBy
      );

      res.status(200).json({
        success: true,
        message: `Multi SKU product with ID ${itemId} deleted successfully`,
        data: sheet,
      });
    } catch (error) {
      console.error("Error in deleteMultiSKUCalculationProductById:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateMultiSKUCalculationSheet(req, res) {
    try {
      const { sheetId } = req.params;
      const { body } = req;
      const userId = req.user?.id || req.body.updated_by;
      const sheet = await skuCalculationService.updateMultiSKUCalculationSheet(sheetId, {
        ...body,
        updated_by: userId,
      });

      res.status(200).json({
        success: true,
        message: "Multi SKU calculation sheet updated successfully",
        data: sheet,
      });
    } catch (error) {
      console.error("Error in updateMultiSKUCalculationSheet:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Create new SKU calculation
   * POST /api/sku-calculations
   */
  async createSKUCalculation(req, res) {
    try {
      const { body } = req;
      const userId = req.user?.id || req.body.created_by;

      const skuCalculation = await skuCalculationService.createSKUCalculation({
        ...body,
        created_by: userId,
      });

      res.status(201).json({
        success: true,
        message: "SKU calculation created successfully",
        data: skuCalculation,
      });
    } catch (error) {
      console.error("Error in createSKUCalculation:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get all SKU calculations
   * GET /api/sku-calculations
   */
  async getAllSKUCalculations(req, res) {
    try {
      const calculations = await skuCalculationService.getAllSKUCalculations();

      res.status(200).json({
        success: true,
        message: "SKU calculations retrieved successfully",
        data: calculations,
      });
    } catch (error) {
      console.error("Error in getAllSKUCalculations:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get SKU calculation by ID
   * GET /api/sku-calculations/:skuId
   */
  async getSKUCalculationById(req, res) {
    try {
      const { skuId } = req.params;
      const calculation = await skuCalculationService.getSKUCalculationById(skuId);

      res.status(200).json({
        success: true,
        message: "SKU calculation retrieved successfully",
        data: calculation,
      });
    } catch (error) {
      console.error("Error in getSKUCalculationById:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update SKU calculation
   * PUT /api/sku-calculations/:skuId
   */
  async updateSKUCalculation(req, res) {
    try {
      const { skuId } = req.params;
      const { body } = req;
      const userId = req.user?.id || req.body.updated_by;

      const updatedCalculation = await skuCalculationService.updateSKUCalculation(skuId, {
        ...body,
        updated_by: userId,
      });

      res.status(200).json({
        success: true,
        message: "SKU calculation updated successfully",
        data: updatedCalculation,
      });
    } catch (error) {
      console.error("Error in updateSKUCalculation:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Delete SKU calculation
   * DELETE /api/sku-calculations/:skuId
   */
  async deleteSKUCalculation(req, res) {
    try {
      const { skuId } = req.params;
      const result = await skuCalculationService.deleteSKUCalculation(skuId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in deleteSKUCalculation:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get SKU calculations by product name
   * GET /api/sku-calculations/search/product/:productName
   */
  async getSKUCalculationsByProductName(req, res) {
    try {
      const { productName } = req.params;
      const calculations = await skuCalculationService.getSKUCalculationsByProductName(
        productName
      );

      res.status(200).json({
        success: true,
        message: "SKU calculations retrieved successfully",
        data: calculations,
      });
    } catch (error) {
      console.error("Error in getSKUCalculationsByProductName:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get SKU calculations summary
   * GET /api/sku-calculations/summary/all
   */
  async getSKUCalculationsSummary(req, res) {
    try {
      const summary = await skuCalculationService.getSKUCalculationsSummary();

      res.status(200).json({
        success: true,
        message: "SKU calculations summary retrieved successfully",
        data: summary,
      });
    } catch (error) {
      console.error("Error in getSKUCalculationsSummary:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new SKUCalculationController();
