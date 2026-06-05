const SKUCalculation = require("../models/singleproductCalculation");
const MultiSKUCalculationSheet = require("../models/MultiproductCalculationSheet");
const MultiSKUCalculationItem = require("../models/multiproductCalculationItem");
const MultiSKUCalculationExpense = require("../models/multiproductCalculationExpense");
const MultiSKUCalculationProfit = require("../models/multiproductCalculationProfit");
const sequelize = require("../config/db");
const { Op } = require("sequelize");

/**
 * SKU Calculation Service
 * Contains all business logic for SKU calculations including buying, selling, profit, and expense calculations
 * @author Sandhya Sapate
 * @version 1.0
 * @since 13-05-2026
 */

class SKUCalculationService {
  /**
   * Accept `expenses` array or legacy single expense fields.
   */
  normalizeSingleProductExpenses(data = {}) {
    if (Array.isArray(data.expenses) && data.expenses.length > 0) {
      return data.expenses.map((entry, idx) => ({
        expense_particulars: entry.expense_particulars || "",
        expense_spc_percentage: parseFloat(entry.expense_spc_percentage || 0),
        row_order: entry.row_order ?? idx,
      }));
    }

    if (data.expense_particulars || parseFloat(data.expense_spc_percentage || 0) !== 0) {
      return [
        {
          expense_particulars: data.expense_particulars || "",
          expense_spc_percentage: parseFloat(data.expense_spc_percentage || 0),
          row_order: 0,
        },
      ];
    }

    return [];
  }

  calculateSingleProductExpenseRows(expenseInputs = [], sellTotal = 0) {
    const expenseRows = expenseInputs.map((entry, idx) => {
      const expenseAmount = this.calculateExpenseAmount(
        parseFloat(entry.expense_spc_percentage || 0),
        sellTotal
      );

      return {
        expense_particulars: entry.expense_particulars || "",
        expense_spc_percentage: parseFloat(entry.expense_spc_percentage || 0),
        expense_amount: expenseAmount,
        row_order: entry.row_order ?? idx,
      };
    });

    const totalExpense = expenseRows.reduce(
      (sum, row) => sum + parseFloat(row.expense_amount || 0),
      0
    );

    return {
      expenseRows,
      totalExpense: parseFloat(totalExpense.toFixed(2)),
    };
  }

  parseStoredExpenses(record = {}) {
    if (Array.isArray(record.expenses) && record.expenses.length > 0) {
      return record.expenses;
    }

    if (record.expense_particulars || parseFloat(record.expense_spc_percentage || 0) !== 0) {
      return [
        {
          expense_particulars: record.expense_particulars || "",
          expense_spc_percentage: parseFloat(record.expense_spc_percentage || 0),
          expense_amount: parseFloat(record.expense_amount || record.total_expense_amount || 0),
          row_order: 0,
        },
      ];
    }

    return [];
  }

  formatExpensesForApi(expenseList = []) {
    return expenseList.map((row, idx) => ({
      row_order: row.row_order ?? idx,
      expense_particulars: row.expense_particulars || "",
      expense_spc_percentage: parseFloat(row.expense_spc_percentage || 0),
      expense_amount: parseFloat(row.expense_amount || 0),
    }));
  }

  /**
   * Standard single-SKU API response (create / get / update / preview).
   */
  formatSingleSKUApiResponse(fields = {}) {
    const expenses = this.formatExpensesForApi(
      Array.isArray(fields.expenses) ? fields.expenses : this.parseStoredExpenses(fields)
    );

    const totalExpenseAmount = parseFloat(
      fields.total_expense_amount ?? fields.expense_amount ?? 0
    );

    const response = {
      sku_id: fields.sku_id,
      product_name_buy: fields.product_name_buy,
      buy_amount: fields.buy_amount,
      buy_gst_percentage: fields.buy_gst_percentage,
      buy_quantity: fields.buy_quantity,
      buy_unit_price: fields.buy_unit_price,
      buy_total: fields.buy_total,
      product_name_sell: fields.product_name_sell,
      sell_amount: fields.sell_amount,
      sell_gst_percentage: fields.sell_gst_percentage,
      sell_quantity: fields.sell_quantity,
      sell_unit_price: fields.sell_unit_price,
      sell_total: fields.sell_total,
      profit: fields.profit,
      gst_payable: fields.gst_payable,
      expenses,
      total_expense_amount: totalExpenseAmount,
      net_profit: fields.net_profit,
      income_tax_percentage: fields.income_tax_percentage,
      income_tax: fields.income_tax,
      final_profit: fields.final_profit,
      created_by: fields.created_by,
      created_at: fields.created_at,
      updated_at: fields.updated_at,
      updated_by: fields.updated_by,
    };

    if (response.sku_id === undefined || response.sku_id === null) {
      delete response.sku_id;
    }
    if (response.created_by === undefined) {
      delete response.created_by;
    }
    if (response.created_at === undefined) {
      delete response.created_at;
    }
    if (response.updated_at === undefined) {
      delete response.updated_at;
    }
    if (response.updated_by === undefined) {
      delete response.updated_by;
    }

    return response;
  }

  buildSingleSKUResponse(calculationRecord) {
    const plainCalculation =
      typeof calculationRecord?.get === "function"
        ? calculationRecord.get({ plain: true })
        : calculationRecord;

    return this.formatSingleSKUApiResponse({
      ...plainCalculation,
      expenses: this.parseStoredExpenses(plainCalculation),
      total_expense_amount: plainCalculation.total_expense_amount,
    });
  }

  buildSingleSKUPreviewResponse(data = {}) {
    const preview = this.calculateSKUPreview(data);

    return this.formatSingleSKUApiResponse({
      product_name_buy: data.product_name_buy,
      buy_amount: data.buy_amount,
      buy_gst_percentage: data.buy_gst_percentage,
      buy_quantity: data.buy_quantity,
      buy_unit_price: preview.buy_unit_price,
      buy_total: preview.buy_total,
      product_name_sell: data.product_name_sell,
      sell_amount: data.sell_amount,
      sell_gst_percentage: data.sell_gst_percentage,
      sell_quantity: data.sell_quantity,
      sell_unit_price: preview.sell_unit_price,
      sell_total: preview.sell_total,
      profit: preview.profit,
      gst_payable: preview.gst_payable,
      expenses: preview.expenses,
      total_expense_amount: preview.total_expense_amount,
      net_profit: preview.net_profit,
      income_tax_percentage: data.income_tax_percentage,
      income_tax: preview.income_tax,
      final_profit: preview.final_profit,
    });
  }

  isMultiProductItemRow(item = {}) {
    const buyName = item.buy?.name ?? item.product_name_buy ?? "";
    const sellName = item.sell?.name ?? item.product_name_sell ?? "";
    return Boolean(String(buyName).trim() || String(sellName).trim());
  }

  normalizeSheetExpenseInputs(expenses = []) {
    return expenses
      .map((entry) => ({
        multi_expense_id: entry.multi_expense_id ?? null,
        expense_particulars:
          entry.expense_particulars ?? entry.particulars ?? "",
        expense_spc_percentage: parseFloat(
          entry.expense_spc_percentage ??
            entry.percentage ??
            entry.spc_percentage ??
            0
        ),
      }))
      .filter(
        (entry) =>
          String(entry.expense_particulars || "").trim() ||
          parseFloat(entry.expense_spc_percentage || 0) !== 0
      );
  }

  /** Legacy: expense/tax rows embedded in `items`. */
  splitMultiSheetPayload(items = []) {
    const productItems = [];
    const expenseInputs = [];
    let incomeTaxPercentage = 0;

    for (const item of items) {
      if (this.isMultiProductItemRow(item)) {
        productItems.push(item);
        continue;
      }

      const particulars = String(item.expense_particulars || "").trim();
      const spc = parseFloat(item.expense_spc_percentage || 0);
      const taxPct = parseFloat(item.income_tax_percentage || 0);

      if (taxPct > 0 || particulars.toLowerCase() === "income tax") {
        incomeTaxPercentage = taxPct;
        continue;
      }

      if (particulars || spc !== 0) {
        expenseInputs.push({
          multi_expense_id: item.multi_expense_id ?? null,
          expense_particulars: particulars,
          expense_spc_percentage: spc,
        });
      }
    }

    return { productItems, expenseInputs, incomeTaxPercentage };
  }

  /**
   * Sheet-level payload: products in `items`, expenses in `expenses`, tax in `profit`.
   * Still accepts legacy mixed `items` for backward compatibility.
   */
  parseMultiSheetPayload(data = {}) {
    const items = Array.isArray(data.items) ? data.items : [];
    const productItems = items.filter((item) => this.isMultiProductItemRow(item));

    let expenseInputs = [];
    let incomeTaxPercentage = 0;

    if (Array.isArray(data.expenses)) {
      expenseInputs = this.normalizeSheetExpenseInputs(data.expenses);
    }

    if (data.profit && data.profit.income_tax_percentage !== undefined) {
      incomeTaxPercentage = parseFloat(data.profit.income_tax_percentage || 0);
    } else if (data.income_tax_percentage !== undefined) {
      incomeTaxPercentage = parseFloat(data.income_tax_percentage || 0);
    }

    const legacy = this.splitMultiSheetPayload(items);
    if (expenseInputs.length === 0) {
      expenseInputs = legacy.expenseInputs;
    }
    if (!incomeTaxPercentage) {
      incomeTaxPercentage = legacy.incomeTaxPercentage;
    }

    return { productItems, expenseInputs, incomeTaxPercentage };
  }

  async validateUniqueMultiSKUCalculationSheetName(
    sheetName,
    createdBy = null,
    excludeSheetId = null
  ) {
    const normalizedName = String(sheetName || "").trim();
    if (!normalizedName) {
      return;
    }

    const whereClause = {
      sheet_name: normalizedName,
      is_deleted: false,
    };

    if (createdBy !== null && createdBy !== undefined) {
      whereClause.created_by = createdBy;
    }

    if (excludeSheetId) {
      whereClause.multi_sku_sheet_id = { [Op.ne]: excludeSheetId };
    }

    const existingSheet = await MultiSKUCalculationSheet.findOne({
      where: whereClause,
    });

    if (existingSheet) {
      throw new Error(
        `A sheet named "${normalizedName}" already exists. Please choose a different sheet name.`
      );
    }
  }

  /**
   * Ensure product names within a multi-product sheet are unique across rows.
   * Within a single row, buying and selling names can be the same.
   * (case-insensitive, trimmed comparison)
   */
  validateUniqueProductNames(productItems = []) {
    const seen = new Map();

    for (let idx = 0; idx < productItems.length; idx++) {
      const item = productItems[idx] || {};
      const buyName = String(item.buy?.name || item.product_name_buy || "").trim();
      const sellName = String(item.sell?.name || item.product_name_sell || "").trim();

      const rowProductNames = new Set();
      if (buyName) {
        rowProductNames.add(buyName.toLowerCase());
      }
      if (sellName) {
        rowProductNames.add(sellName.toLowerCase());
      }

      for (const productName of rowProductNames) {
        if (seen.has(productName)) {
          const prev = seen.get(productName);
          const label =
            productName.charAt(0).toUpperCase() + productName.slice(1);
          throw new Error(
            `Duplicate product name "${label}" found in rows ${prev} and ${idx + 1}. Each product name must be unique across rows.`
          );
        }
        seen.set(productName, idx + 1);
      }
    }
  }

  prepareMultiSheetPreview(data = {}) {
    const { productItems, expenseInputs, incomeTaxPercentage } =
      this.parseMultiSheetPayload(data);
    const previewInput = this.buildMultiPreviewInputItems(
      productItems,
      expenseInputs,
      incomeTaxPercentage
    );
    return this.calculateMultiSKUPreview({ items: previewInput });
  }

  /**
   * Sheet totals for multi-product (sum across product rows only):
   * - selling_amount = Σ(sell.amount)
   * - buying_amount = Σ(buy.amount)
   * - total_selling_unit_price = Σ(sell.unit_price)
   * - total_buying_unit_price = Σ(buy.unit_price)
   * - total_selling_quantity = Σ(sell.quantity)
   * - total_buying_quantity = Σ(buy.quantity)
   */
  summarizeMultiProductSheetTotals(productItems = [], preview = {}) {
    const productPreviewRows = (preview.rows || []).slice(0, productItems.length);

    let totalBuyingAmount = 0;
    let totalSellingAmount = 0;
    let totalBuyingUnitPrice = 0;
    let totalSellingUnitPrice = 0;
    let totalBuyingQuantity = 0;
    let totalSellingQuantity = 0;

    productItems.forEach((item, index) => {
      totalBuyingAmount += parseFloat(item.buy?.amount ?? item.buy_amount ?? 0);
      totalSellingAmount += parseFloat(item.sell?.amount ?? item.sell_amount ?? 0);

      const row = productPreviewRows[index] || {};
      totalBuyingUnitPrice += parseFloat(row.buy?.unit_price || item.buy_unit_price || 0);
      totalSellingUnitPrice += parseFloat(row.sell?.unit_price || item.sell_unit_price || 0);

      totalBuyingQuantity += parseInt(item.buy?.quantity ?? item.buy_quantity ?? 0, 10);
      totalSellingQuantity += parseInt(item.sell?.quantity ?? item.sell_quantity ?? 0, 10);
    });

    return {
      total_buying_amount: parseFloat(totalBuyingAmount.toFixed(2)),
      total_selling_amount: parseFloat(totalSellingAmount.toFixed(2)),
      total_buying_unit_price: parseFloat(totalBuyingUnitPrice.toFixed(2)),
      total_selling_unit_price: parseFloat(totalSellingUnitPrice.toFixed(2)),
      total_buying_quantity: totalBuyingQuantity,
      total_selling_quantity: totalSellingQuantity,
    };
  }

  buildMultiPreviewInputItems(productItems = [], expenseInputs = [], incomeTaxPercentage = 0) {
    const emptySide = { name: "", amount: 0, gst: 0, quantity: 0 };

    const products = productItems.map((item) => ({
      buy: item.buy || {
        name: item.product_name_buy || "",
        amount: item.buy_amount || 0,
        gst: item.buy_gst_percentage || 0,
        quantity: item.buy_quantity || 0,
      },
      sell: item.sell || {
        name: item.product_name_sell || "",
        amount: item.sell_amount || 0,
        gst: item.sell_gst_percentage || 0,
        quantity: item.sell_quantity || 0,
      },
      expense_particulars: "",
      expense_spc_percentage: 0,
      income_tax_percentage: 0,
    }));

    const expenses = expenseInputs.map((entry) => ({
      buy: { ...emptySide },
      sell: { ...emptySide },
      expense_particulars: entry.expense_particulars || "",
      expense_spc_percentage: parseFloat(entry.expense_spc_percentage || 0),
      income_tax_percentage: 0,
    }));

    const taxRows =
      parseFloat(incomeTaxPercentage || 0) > 0
        ? [
            {
              buy: { ...emptySide },
              sell: { ...emptySide },
              expense_particulars: "Income Tax",
              expense_spc_percentage: 0,
              income_tax_percentage: parseFloat(incomeTaxPercentage || 0),
            },
          ]
        : [];

    return [...products, ...expenses, ...taxRows];
  }

  mergeMultiItemsForApiResponse(
    productRecords = [],
    expenseRecords = [],
    profitRecord = null
  ) {
    const merged = productRecords.map((item) => ({ ...item }));

    for (const expense of expenseRecords) {
      merged.push({
        multi_sku_sheet_id: expense.multi_sku_sheet_id,
        product_name_buy: "",
        product_name_sell: "",
        buy_amount: 0,
        buy_gst_percentage: 0,
        buy_quantity: 0,
        buy_unit_price: 0,
        buy_total: 0,
        sell_amount: 0,
        sell_gst_percentage: 0,
        sell_quantity: 0,
        sell_unit_price: 0,
        sell_total: 0,
        profit: 0,
        gst_payable: 0,
        net_profit: 0,
        expense_particulars: expense.expense_particulars || "",
        expense_spc_percentage: parseFloat(expense.expense_spc_percentage || 0),
        expense_amount: parseFloat(expense.expense_amount || 0),
        income_tax_percentage: 0,
        income_tax: 0,
        final_profit: 0,
      });
    }

    if (profitRecord && parseFloat(profitRecord.income_tax_percentage || 0) > 0) {
      merged.push({
        multi_sku_sheet_id: profitRecord.multi_sku_sheet_id,
        product_name_buy: "",
        product_name_sell: "",
        buy_amount: 0,
        buy_gst_percentage: 0,
        buy_quantity: 0,
        buy_unit_price: 0,
        buy_total: 0,
        sell_amount: 0,
        sell_gst_percentage: 0,
        sell_quantity: 0,
        sell_unit_price: 0,
        sell_total: 0,
        profit: 0,
        gst_payable: 0,
        net_profit: 0,
        expense_particulars: "Income Tax",
        expense_spc_percentage: 0,
        expense_amount: 0,
        income_tax_percentage: parseFloat(profitRecord.income_tax_percentage || 0),
        income_tax: parseFloat(profitRecord.income_tax || 0),
        final_profit: parseFloat(profitRecord.final_profit || 0),
      });
    }

    return merged;
  }

  buildMultiSheetResponse(
    sheetRecord,
    itemRecords = [],
    expenseRecords = [],
    profitRecords = []
  ) {
    const plainSheet =
      typeof sheetRecord?.get === "function" ? sheetRecord.get({ plain: true }) : sheetRecord;
    const plainProducts = itemRecords.map((item) =>
      typeof item?.get === "function" ? item.get({ plain: true }) : item
    );
    const plainExpenses = expenseRecords.map((row) =>
      typeof row?.get === "function" ? row.get({ plain: true }) : row
    );
    const plainProfit =
      profitRecords.length > 0
        ? typeof profitRecords[0]?.get === "function"
          ? profitRecords[0].get({ plain: true })
          : profitRecords[0]
        : null;

    const previewInputItems = plainProducts.map((item) => ({
      buy: {
        name: item.product_name_buy,
        amount: parseFloat(item.buy_amount || 0),
        gst: parseFloat(item.buy_gst_percentage || 0),
        quantity: parseInt(item.buy_quantity || 0, 10),
      },
      sell: {
        name: item.product_name_sell,
        amount: parseFloat(item.sell_amount || 0),
        gst: parseFloat(item.sell_gst_percentage || 0),
        quantity: parseInt(item.sell_quantity || 0, 10),
      },
      buy_amount: parseFloat(item.buy_amount || 0),
      buy_unit_price: parseFloat(item.buy_unit_price || 0),
      buy_quantity: parseInt(item.buy_quantity || 0, 10),
      sell_amount: parseFloat(item.sell_amount || 0),
      sell_unit_price: parseFloat(item.sell_unit_price || 0),
      sell_quantity: parseInt(item.sell_quantity || 0, 10),
    }));

    const preview = this.prepareMultiSheetPreview({
      items: previewInputItems,
      expenses: plainExpenses,
      profit: plainProfit,
    });

    const sumTotals = this.summarizeMultiProductSheetTotals(previewInputItems, preview);
    const formattedTotals = {
      ...sumTotals,
      total_buy_total: preview.totals.totalBuyTotal,
      total_sell_total: preview.totals.totalSellTotal,
      total_profit: preview.totals.totalProfit,
      total_gst_payable: preview.totals.totalGSTPayable,
      total_net_profit: preview.totals.totalNetProfit,
      total_expense_amount: preview.totals.expense_amount,
      total_income_tax: preview.totals.income_tax,
      total_final_profit: preview.totals.final_profit,
    };

    const shapedItems = plainProducts.map((item, index) => ({
      multi_sku_item_id: item.multi_sku_item_id,
      row_order: item.row_order,
      product_name_buy: item.product_name_buy || "",
      buy_amount: parseFloat(item.buy_amount || 0),
      buy_gst_percentage: parseFloat(item.buy_gst_percentage || 0),
      buy_quantity: parseInt(item.buy_quantity || 0, 10),
      buy_unit_price: parseFloat(item.buy_unit_price || preview.rows?.[index]?.buy?.unit_price || 0),
      buy_total: parseFloat(item.buy_total || preview.rows?.[index]?.buy?.total || 0),
      product_name_sell: item.product_name_sell || "",
      sell_amount: parseFloat(item.sell_amount || 0),
      sell_gst_percentage: parseFloat(item.sell_gst_percentage || 0),
      sell_quantity: parseInt(item.sell_quantity || 0, 10),
      sell_unit_price: parseFloat(item.sell_unit_price || preview.rows?.[index]?.sell?.unit_price || 0),
      sell_total: parseFloat(item.sell_total || preview.rows?.[index]?.sell?.total || 0),
      profit: parseFloat(item.profit || preview.rows?.[index]?.profit || 0),
      gst_payable: parseFloat(item.gst_payable || preview.rows?.[index]?.gst_payable || 0),
      net_profit: parseFloat(item.net_profit || preview.rows?.[index]?.net_profit || 0),
      final_profit: parseFloat(preview.rows?.[index]?.final_profit || 0),
    }));

    return {
      multi_sku_sheet_id: plainSheet.multi_sku_sheet_id,
      sheet_name: plainSheet.sheet_name,
      items: shapedItems,
      expenses: plainExpenses.map((row) => ({
        multi_expense_id: row.multi_expense_id,
        row_order: row.row_order,
        expense_particulars: row.expense_particulars || "",
        expense_spc_percentage: parseFloat(row.expense_spc_percentage || 0),
        expense_amount: parseFloat(row.expense_amount || 0),
      })),
      profit: plainProfit
        ? {
            multi_profit_id: plainProfit.multi_profit_id,
            income_tax_percentage: parseFloat(plainProfit.income_tax_percentage || 0),
            income_tax: parseFloat(plainProfit.income_tax || 0),
            final_profit: parseFloat(plainProfit.final_profit || 0),
          }
        : null,
      totals: formattedTotals,
      created_by: plainSheet.created_by ?? null,
      updated_by: plainSheet.updated_by ?? null,
      created_at: plainSheet.created_at,
      updated_at: plainSheet.updated_at,
    };
  }

  async persistMultiSheetExpensesAndProfit({
    sheetId,
    sheetName,
    productCount = 0,
    expenseInputs = [],
    incomeTaxPercentage = 0,
    createdBy = null,
    updatedBy = null,
    preview,
    transaction,
  }) {
    const deletedAt = new Date();
    const deletedBy = updatedBy || createdBy || null;

    const existingExpenses = await MultiSKUCalculationExpense.findAll({
      where: { multi_sku_sheet_id: sheetId, is_deleted: false },
      transaction,
    });
    const keptExpenseIds = new Set();

    let expensePreviewIndex = productCount;
    for (let idx = 0; idx < expenseInputs.length; idx++) {
      const entry = expenseInputs[idx];
      const previewRow = preview.rows[expensePreviewIndex] || {};
      expensePreviewIndex += 1;

      const expensePayload = {
        sheet_name: sheetName,
        row_order: idx + 1,
        expense_particulars: entry.expense_particulars || "",
        expense_spc_percentage: parseFloat(entry.expense_spc_percentage || 0),
        expense_amount: parseFloat(previewRow.expense_amount || 0),
        updated_by: updatedBy,
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      };

      if (entry.multi_expense_id) {
        keptExpenseIds.add(entry.multi_expense_id);
        await MultiSKUCalculationExpense.update(expensePayload, {
          where: {
            multi_expense_id: entry.multi_expense_id,
            multi_sku_sheet_id: sheetId,
            is_deleted: false,
          },
          transaction,
        });
      } else {
        const created = await MultiSKUCalculationExpense.create(
          {
            ...expensePayload,
            multi_sku_sheet_id: sheetId,
            created_by: createdBy || null,
          },
          { transaction }
        );
        keptExpenseIds.add(created.multi_expense_id);
      }
    }

    for (const existing of existingExpenses) {
      if (!keptExpenseIds.has(existing.multi_expense_id)) {
        await existing.update(
          {
            is_deleted: true,
            deleted_at: deletedAt,
            deleted_by: deletedBy,
          },
          { transaction }
        );
      }
    }

    const existingProfit = await MultiSKUCalculationProfit.findOne({
      where: { multi_sku_sheet_id: sheetId, is_deleted: false },
      transaction,
    });

    const taxPct = parseFloat(incomeTaxPercentage || 0);
    if (taxPct > 0) {
      const profitPayload = {
        sheet_name: sheetName,
        income_tax_percentage: taxPct,
        income_tax: parseFloat(preview.totals.income_tax || 0),
        final_profit: parseFloat(preview.totals.final_profit || 0),
        updated_by: updatedBy,
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      };

      if (existingProfit) {
        await existingProfit.update(profitPayload, { transaction });
      } else {
        await MultiSKUCalculationProfit.create(
          {
            ...profitPayload,
            multi_sku_sheet_id: sheetId,
            created_by: createdBy || null,
          },
          { transaction }
        );
      }
    } else if (existingProfit) {
      await existingProfit.update(
        {
          is_deleted: true,
          deleted_at: deletedAt,
          deleted_by: deletedBy,
        },
        { transaction }
      );
    }
  }

  /**
   * Calculate all derived values for a single SKU row
   * Reuses existing calculation functions (no new formulas).
   */
  calculateSKUPreview(data) {
    const {
      buy_amount,
      buy_gst_percentage,
      buy_quantity,
      sell_amount,
      sell_gst_percentage,
      sell_quantity,
      income_tax_percentage,
    } = data;

    const buyUnitPrice = this.calculateBuyUnitPrice(
      parseFloat(buy_amount || 0),
      parseFloat(buy_gst_percentage || 0)
    );
    const buyTotal = this.calculateBuyTotal(buyUnitPrice, parseInt(buy_quantity || 0, 10));

    const sellUnitPrice = this.calculateSellUnitPrice(
      parseFloat(sell_amount || 0),
      parseFloat(sell_gst_percentage || 0)
    );
    const sellTotal = this.calculateSellTotal(sellUnitPrice, parseInt(sell_quantity || 0, 10));

    const profit = this.calculateProfit(sellTotal, buyTotal);
    const gstPayable = this.calculateGSTPayable(profit, parseFloat(sell_gst_percentage || 0));
    const netProfit = this.calculateNetProfit(profit, gstPayable);

    const expenseInputs = this.normalizeSingleProductExpenses(data);
    const { expenseRows, totalExpense } = this.calculateSingleProductExpenseRows(
      expenseInputs,
      sellTotal
    );

    const incomeTax = this.calculateIncomeTax(
      parseFloat(income_tax_percentage || 0),
      netProfit
    );

    const finalProfit = this.calculateFinalProfit(netProfit, totalExpense, incomeTax);

    return {
      buy_unit_price: buyUnitPrice,
      buy_total: buyTotal,
      sell_unit_price: sellUnitPrice,
      sell_total: sellTotal,
      profit,
      gst_payable: gstPayable,
      net_profit: netProfit,
      total_expense_amount: totalExpense,
      expenses: expenseRows,
      income_tax: incomeTax,
      final_profit: finalProfit,
    };
  }

  /**
   * Calculate preview for multiple product rows and aggregated totals
   * Reuses existing calculation functions (no new formulas).
   */
  calculateMultiSKUPreview({
    items = [],
    buyProducts = [],
    sellProducts = [],
    expense_spc_percentage = 0,
    income_tax_percentage = 0,
    expense_particulars = "",
  }) {
    const normalizedItems =
      items.length > 0
        ? items
        : Array.from({ length: Math.max(buyProducts.length, sellProducts.length) }).map((_, idx) => ({
            buy: buyProducts[idx] || {},
            sell: sellProducts[idx] || {},
            expense_particulars,
            expense_spc_percentage,
            income_tax_percentage,
          }));

    const rows = normalizedItems.map((item, idx) => {
      const buy = item.buy || {};
      const sell = item.sell || {};

      const rowInput = {
        buy_amount: buy.amount || 0,
        buy_gst_percentage: buy.gst || 0,
        buy_quantity: buy.quantity || 0,
        sell_amount: sell.amount || 0,
        sell_gst_percentage: sell.gst || 0,
        sell_quantity: sell.quantity || 0,
        expense_spc_percentage: item.expense_spc_percentage || 0,
        income_tax_percentage: item.income_tax_percentage || 0,
      };

      const preview = this.calculateSKUPreview(rowInput);
      return {
        index: idx,
        expense_particulars: item.expense_particulars || "",
        expense_spc_percentage: parseFloat(item.expense_spc_percentage || 0),
        income_tax_percentage: parseFloat(item.income_tax_percentage || 0),
        buy: { ...buy, unit_price: preview.buy_unit_price, total: preview.buy_total },
        sell: { ...sell, unit_price: preview.sell_unit_price, total: preview.sell_total },
        profit: preview.profit,
        gst_payable: preview.gst_payable,
        net_profit: preview.net_profit,
        expense_amount: preview.expense_amount,
        income_tax: preview.income_tax,
        final_profit: preview.final_profit,
      };
    });

    const totals = rows.reduce(
      (acc, r) => {
        acc.totalBuyTotal += parseFloat(r.buy?.total || 0);
        acc.totalSellTotal += parseFloat(r.sell?.total || 0);
        acc.sumProfit += parseFloat(r.profit || 0);
        acc.sumGSTPayable += parseFloat(r.gst_payable || 0);
        acc.sumNetProfit += parseFloat(r.net_profit || 0);
        acc.sumExpense += parseFloat(r.expense_amount || 0);
        acc.sumIncomeTax += parseFloat(r.income_tax || 0);
        acc.sumFinalProfit += parseFloat(r.final_profit || 0);
        return acc;
      },
      {
        totalBuyTotal: 0,
        totalSellTotal: 0,
        sumProfit: 0,
        sumGSTPayable: 0,
        sumNetProfit: 0,
        sumExpense: 0,
        sumIncomeTax: 0,
        sumFinalProfit: 0,
      }
    );

    /**
     * FOR MULTI-PRODUCT: Calculate TOTALS FIRST to use in row-level calculations
     * This ensures each row uses TOTAL NET PROFIT for income tax calculation
     */
    const totalProfit = this.calculateProfit(totals.totalSellTotal, totals.totalBuyTotal);

    // Implied blended GST% from row GST totals (works for positive or negative profit / GST)
    const netBase = totalProfit - totals.sumGSTPayable;
    const effectiveGSTRate =
      Math.abs(netBase) > 1e-6
        ? parseFloat(((100 * totals.sumGSTPayable) / netBase).toFixed(2))
        : 0;
    const totalGSTPayable =
      Math.abs(netBase) > 1e-6 && effectiveGSTRate >= 0
        ? this.calculateGSTPayable(totalProfit, effectiveGSTRate)
        : parseFloat(Number(totals.sumGSTPayable || 0).toFixed(2));
    const totalNetProfit = this.calculateNetProfit(totalProfit, totalGSTPayable);

    /**
     * FOR MULTI-PRODUCT: Each row's expense = (row_spc% / 100) * TOTAL_sell_total
     * AND Each row's income_tax = (row_income_tax% / 100) * TOTAL_net_profit
     * (NOT individual row values)
     */
    const updatedRows = rows.map((row) => {
      const totalSellAmount = totals.totalSellTotal;
      // Each row uses its OWN SPC% but applied to TOTAL selling price
      const newExpenseAmount = this.calculateExpenseAmount(
        parseFloat(row.expense_spc_percentage || 0),
        totalSellAmount
      );
      
      // Each row uses its OWN income_tax% but applied to TOTAL net profit
      const newIncomeTax = this.calculateIncomeTax(
        parseFloat(row.income_tax_percentage || 0),
        totalNetProfit
      );

      // Recalculate final profit with new expense and new income tax
      const newFinalProfit = this.calculateFinalProfit(
        parseFloat(row.net_profit || 0),
        newExpenseAmount,
        newIncomeTax
      );

      return {
        ...row,
        expense_amount: newExpenseAmount,
        income_tax: newIncomeTax,
        final_profit: newFinalProfit,
      };
    });

    // Recalculate totals with updated expense, income tax, and final profit values
    const updatedTotals = updatedRows.reduce(
      (acc, r) => {
        acc.sumExpense += parseFloat(r.expense_amount || 0);
        acc.sumIncomeTax += parseFloat(r.income_tax || 0);
        acc.sumFinalProfit += parseFloat(r.final_profit || 0);
        return acc;
      },
      {
        totalBuyTotal: totals.totalBuyTotal,
        totalSellTotal: totals.totalSellTotal,
        sumProfit: totals.sumProfit,
        sumGSTPayable: totals.sumGSTPayable,
        sumNetProfit: totals.sumNetProfit,
        sumExpense: 0,
        sumIncomeTax: 0,
        sumFinalProfit: 0,
      }
    );

    // TOTAL EXPENSE = sum of all row expenses (each row uses its SPC% on total selling price)
    const totalExpense = updatedTotals.sumExpense;

    // TOTAL INCOME TAX = sum of all row income taxes (each row uses its rate on total net profit)
    const totalIncomeTax = updatedTotals.sumIncomeTax;

    const totalFinalProfit = this.calculateFinalProfit(
      totalNetProfit,
      totalExpense,
      totalIncomeTax
    );

    return {
      rows: updatedRows,
      expenseRows: updatedRows
        .filter((row) => row.expense_particulars || row.expense_amount)
        .map((row) => ({
          particulars: row.expense_particulars || "-",
          spc_percentage: row.expense_spc_percentage || 0,
          amount: row.expense_amount || 0,
        })),
      totals: {
        totalBuyTotal: updatedTotals.totalBuyTotal,
        totalSellTotal: updatedTotals.totalSellTotal,
        totalProfit,
        totalGSTPayable,
        totalNetProfit,
        expense_amount: totalExpense,
        income_tax: totalIncomeTax,
        final_profit: totalFinalProfit,
        sumProfit: updatedTotals.sumProfit,
        sumGSTPayable: updatedTotals.sumGSTPayable,
        sumNetProfit: updatedTotals.sumNetProfit,
        sumExpense: updatedTotals.sumExpense,
        sumIncomeTax: updatedTotals.sumIncomeTax,
        sumFinalProfit: updatedTotals.sumFinalProfit,
      },
    };
  }

  async createMultiSKUCalculationSheet(data) {
    const transaction = await sequelize.transaction();
    try {
      const { sheet_name = "Multi Product Sheet", created_by, updated_by } = data;
      const normalizedSheetName = String(sheet_name || "Multi Product Sheet").trim() || "Multi Product Sheet";

      await this.validateUniqueMultiSKUCalculationSheetName(
        normalizedSheetName,
        created_by
      );

      const { productItems, expenseInputs, incomeTaxPercentage } =
        this.parseMultiSheetPayload(data);

      if (!Array.isArray(productItems) || productItems.length === 0) {
        throw new Error("At least one multi-product row is required");
      }

      this.validateUniqueProductNames(productItems);

      const previewInput = this.buildMultiPreviewInputItems(
        productItems,
        expenseInputs,
        incomeTaxPercentage
      );
      const preview = this.calculateMultiSKUPreview({ items: previewInput });
      const sheetSumTotals = this.summarizeMultiProductSheetTotals(productItems, preview);

      const sheet = await MultiSKUCalculationSheet.create(
        {
          sheet_name,
          total_buy_amount: preview.totals.totalBuyTotal,
          buying_amount: sheetSumTotals.total_buying_amount,
          total_buy_unit_price: sheetSumTotals.total_buying_unit_price,
          total_buy_quantity: sheetSumTotals.total_buying_quantity,
          total_sell_amount: preview.totals.totalSellTotal,
          selling_amount: sheetSumTotals.total_selling_amount,
          total_sell_unit_price: sheetSumTotals.total_selling_unit_price,
          total_sell_quantity: sheetSumTotals.total_selling_quantity,
          total_profit: preview.totals.totalProfit,
          total_gst_payable: preview.totals.totalGSTPayable,
          total_net_profit: preview.totals.totalNetProfit,
          total_expense_amount: preview.totals.expense_amount,
          total_income_tax: preview.totals.income_tax,
          total_final_profit: preview.totals.final_profit,
          created_by: created_by || null,
          updated_by: updated_by || null,
          is_deleted: false,
        },
        { transaction }
      );

      const itemPayload = productItems.map((item, index) => {
        const previewRow = preview.rows[index];

        return {
          multi_sku_sheet_id: sheet.multi_sku_sheet_id,
          sheet_name: sheet.sheet_name,
          row_order: index + 1,
          product_name_buy: item.buy?.name || "",
          buy_amount: parseFloat(item.buy?.amount || 0),
          buy_gst_percentage: parseFloat(item.buy?.gst || 0),
          buy_quantity: parseInt(item.buy?.quantity || 0, 10),
          buy_unit_price: previewRow.buy.unit_price,
          buy_total: previewRow.buy.total,
          product_name_sell: item.sell?.name || "",
          sell_amount: parseFloat(item.sell?.amount || 0),
          sell_gst_percentage: parseFloat(item.sell?.gst || 0),
          sell_quantity: parseInt(item.sell?.quantity || 0, 10),
          sell_unit_price: previewRow.sell.unit_price,
          sell_total: previewRow.sell.total,
          profit: previewRow.profit,
          gst_payable: previewRow.gst_payable,
          net_profit: previewRow.net_profit,
          created_by: created_by || null,
          updated_by: updated_by || null,
          is_deleted: false,
        };
      });

      await MultiSKUCalculationItem.bulkCreate(itemPayload, { transaction });
      await this.persistMultiSheetExpensesAndProfit({
        sheetId: sheet.multi_sku_sheet_id,
        sheetName: sheet.sheet_name,
        productCount: productItems.length,
        expenseInputs,
        incomeTaxPercentage,
        createdBy: created_by || null,
        updatedBy: updated_by || null,
        preview,
        transaction,
      });
      await transaction.commit();

      return this.getMultiSKUCalculationSheetById(sheet.multi_sku_sheet_id);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error creating multi SKU calculation sheet: ${error.message}`);
    }
  }

  async updateMultiSKUCalculationSheet(sheetId, data) {
    const transaction = await sequelize.transaction();
    try {
      const sheet = await MultiSKUCalculationSheet.findByPk(sheetId, { transaction });
      if (!sheet) {
        throw new Error(`Multi SKU calculation sheet with ID ${sheetId} not found`);
      }

      const { sheet_name, updated_by } = data;
      const { productItems, expenseInputs, incomeTaxPercentage } =
        this.parseMultiSheetPayload(data);

      if (!Array.isArray(productItems) || productItems.length === 0) {
        throw new Error("At least one multi-product row is required");
      }

      const resolvedSheetName = sheet_name
        ? String(sheet_name).trim()
        : sheet.sheet_name;

      if (resolvedSheetName && resolvedSheetName !== sheet.sheet_name) {
        await this.validateUniqueMultiSKUCalculationSheetName(
          resolvedSheetName,
          sheet.created_by,
          sheet.multi_sku_sheet_id
        );
      }

      this.validateUniqueProductNames(productItems);

      const previewInput = this.buildMultiPreviewInputItems(
        productItems,
        expenseInputs,
        incomeTaxPercentage
      );
      const preview = this.calculateMultiSKUPreview({ items: previewInput });
      const sheetSumTotals = this.summarizeMultiProductSheetTotals(productItems, preview);

      await sheet.update(
        {
          sheet_name: resolvedSheetName,
          total_buy_amount: preview.totals.totalBuyTotal,
          buying_amount: sheetSumTotals.total_buying_amount,
          total_buy_unit_price: sheetSumTotals.total_buying_unit_price,
          total_buy_quantity: sheetSumTotals.total_buying_quantity,
          total_sell_amount: preview.totals.totalSellTotal,
          selling_amount: sheetSumTotals.total_selling_amount,
          total_sell_unit_price: sheetSumTotals.total_selling_unit_price,
          total_sell_quantity: sheetSumTotals.total_selling_quantity,
          total_profit: preview.totals.totalProfit,
          total_gst_payable: preview.totals.totalGSTPayable,
          total_net_profit: preview.totals.totalNetProfit,
          total_expense_amount: preview.totals.expense_amount,
          total_income_tax: preview.totals.income_tax,
          total_final_profit: preview.totals.final_profit,
          updated_by: updated_by || sheet.updated_by,
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
        },
        { transaction }
      );

      const itemsToUpdate = productItems.filter((item) => item.multi_sku_item_id);
      const itemsToCreate = productItems.filter((item) => !item.multi_sku_item_id);
      
      // Get existing item IDs
      const existingItems = await MultiSKUCalculationItem.findAll({
        where: { multi_sku_sheet_id: sheet.multi_sku_sheet_id, is_deleted: false },
        transaction,
      });
      const existingItemIds = existingItems.map(item => item.multi_sku_item_id);
      const newItemIds = itemsToUpdate.map(item => item.multi_sku_item_id);
      
      // Delete items that are no longer in the list
      const itemsToDelete = existingItemIds.filter(id => !newItemIds.includes(id));
      if (itemsToDelete.length > 0) {
        await MultiSKUCalculationItem.update(
          {
            is_deleted: true,
            deleted_at: new Date(),
            deleted_by: updated_by || null,
          },
          {
            where: {
              multi_sku_item_id: { [Op.in]: itemsToDelete },
              is_deleted: false,
            },
            transaction,
          }
        );
      }

      /**
       * FOR MULTI-PRODUCT: Use preview.rows which has expenses calculated on TOTAL selling price
       * Update existing items using preview data
       */
      for (let i = 0; i < itemsToUpdate.length; i++) {
        const item = itemsToUpdate[i];
        const originalIndex = productItems.findIndex(
          (it) => it.multi_sku_item_id === item.multi_sku_item_id
        );
        const previewRow = preview.rows[originalIndex];

        await MultiSKUCalculationItem.update(
          {
            row_order: i + 1,
            sheet_name: resolvedSheetName,
            product_name_buy: item.buy?.name || "",
            buy_amount: parseFloat(item.buy?.amount || 0),
            buy_gst_percentage: parseFloat(item.buy?.gst || 0),
            buy_quantity: parseInt(item.buy?.quantity || 0, 10),
            buy_unit_price: previewRow.buy.unit_price,
            buy_total: previewRow.buy.total,
            product_name_sell: item.sell?.name || "",
            sell_amount: parseFloat(item.sell?.amount || 0),
            sell_gst_percentage: parseFloat(item.sell?.gst || 0),
            sell_quantity: parseInt(item.sell?.quantity || 0, 10),
            sell_unit_price: previewRow.sell.unit_price,
            sell_total: previewRow.sell.total,
            profit: previewRow.profit,
            gst_payable: previewRow.gst_payable,
            net_profit: previewRow.net_profit,
            updated_by: updated_by || null,
            is_deleted: false,
          },
          {
            where: { multi_sku_item_id: item.multi_sku_item_id, is_deleted: false },
            transaction,
          }
        );
      }

      /**
       * FOR MULTI-PRODUCT: Create new items using preview data
       */
      if (itemsToCreate.length > 0) {
        const createPayload = itemsToCreate.map((item, index) => {
          const originalIndex = productItems.findIndex(
            (it) => !it.multi_sku_item_id && it === item
          );
          const previewRow = preview.rows[originalIndex];

          return {
            multi_sku_sheet_id: sheet.multi_sku_sheet_id,
            sheet_name: resolvedSheetName,
            row_order: itemsToUpdate.length + index + 1,
            product_name_buy: item.buy?.name || "",
            buy_amount: parseFloat(item.buy?.amount || 0),
            buy_gst_percentage: parseFloat(item.buy?.gst || 0),
            buy_quantity: parseInt(item.buy?.quantity || 0, 10),
            buy_unit_price: previewRow.buy.unit_price,
            buy_total: previewRow.buy.total,
            product_name_sell: item.sell?.name || "",
            sell_amount: parseFloat(item.sell?.amount || 0),
            sell_gst_percentage: parseFloat(item.sell?.gst || 0),
            sell_quantity: parseInt(item.sell?.quantity || 0, 10),
            sell_unit_price: previewRow.sell.unit_price,
            sell_total: previewRow.sell.total,
            profit: previewRow.profit,
            gst_payable: previewRow.gst_payable,
            net_profit: previewRow.net_profit,
            created_by: updated_by || null,
            updated_by: updated_by || null,
            is_deleted: false,
          };
        });

        await MultiSKUCalculationItem.bulkCreate(createPayload, { transaction });
      }

      await this.persistMultiSheetExpensesAndProfit({
        sheetId: sheet.multi_sku_sheet_id,
        sheetName: resolvedSheetName,
        productCount: productItems.length,
        expenseInputs,
        incomeTaxPercentage,
        createdBy: updated_by || null,
        updatedBy: updated_by || null,
        preview,
        transaction,
      });

      await transaction.commit();
      return this.getMultiSKUCalculationSheetById(sheet.multi_sku_sheet_id);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error updating multi SKU calculation sheet: ${error.message}`);
    }
  }

  async getAllMultiSKUCalculationSheets(createdBy = null) {
    try {
      const whereClause = createdBy
        ? { created_by: createdBy, is_deleted: false }
        : { is_deleted: false };
      const sheets = await MultiSKUCalculationSheet.findAll({
        where: whereClause,
        include: [
          {
            model: MultiSKUCalculationItem,
            as: "items",
            where: { is_deleted: false },
            required: false,
          },
          {
            model: MultiSKUCalculationExpense,
            as: "expenses",
            where: { is_deleted: false },
            required: false,
          },
          {
            model: MultiSKUCalculationProfit,
            as: "profits",
            where: { is_deleted: false },
            required: false,
          },
        ],
        order: [
          ["created_at", "DESC"],
          [{ model: MultiSKUCalculationItem, as: "items" }, "row_order", "ASC"],
          [{ model: MultiSKUCalculationExpense, as: "expenses" }, "row_order", "ASC"],
        ],
      });

      return sheets.map((sheet) =>
        this.buildMultiSheetResponse(
          sheet,
          sheet.items || [],
          sheet.expenses || [],
          sheet.profits || []
        )
      );
    } catch (error) {
      throw new Error(`Error fetching multi SKU calculation sheets: ${error.message}`);
    }
  }

  async getMultiSKUCalculationSheetById(sheetId) {
    try {
      const sheet = await MultiSKUCalculationSheet.findByPk(sheetId, {
        where: { is_deleted: false },
        include: [
          {
            model: MultiSKUCalculationItem,
            as: "items",
            where: { is_deleted: false },
            required: false,
          },
          {
            model: MultiSKUCalculationExpense,
            as: "expenses",
            where: { is_deleted: false },
            required: false,
          },
          {
            model: MultiSKUCalculationProfit,
            as: "profits",
            where: { is_deleted: false },
            required: false,
          },
        ],
        order: [
          [{ model: MultiSKUCalculationItem, as: "items" }, "row_order", "ASC"],
          [{ model: MultiSKUCalculationExpense, as: "expenses" }, "row_order", "ASC"],
        ],
      });

      if (!sheet) {
        throw new Error(`Multi SKU calculation sheet with ID ${sheetId} not found`);
      }

      return this.buildMultiSheetResponse(
        sheet,
        sheet.items || [],
        sheet.expenses || [],
        sheet.profits || []
      );
    } catch (error) {
      throw new Error(`Error fetching multi SKU calculation sheet: ${error.message}`);
    }
  }

  async recalculateMultiSheetTotalsFromDb(sheetId, updatedBy = null, transaction) {
    const sheet = await MultiSKUCalculationSheet.findOne({
      where: { multi_sku_sheet_id: sheetId, is_deleted: false },
      include: [
        {
          model: MultiSKUCalculationItem,
          as: "items",
          where: { is_deleted: false },
          required: false,
        },
        {
          model: MultiSKUCalculationExpense,
          as: "expenses",
          where: { is_deleted: false },
          required: false,
        },
        {
          model: MultiSKUCalculationProfit,
          as: "profits",
          where: { is_deleted: false },
          required: false,
        },
      ],
      order: [
        [{ model: MultiSKUCalculationItem, as: "items" }, "row_order", "ASC"],
        [{ model: MultiSKUCalculationExpense, as: "expenses" }, "row_order", "ASC"],
      ],
      transaction,
    });

    if (!sheet) {
      throw new Error(`Multi SKU calculation sheet with ID ${sheetId} not found`);
    }

    const productItems = (sheet.items || []).map((item) => ({
      buy: {
        name: item.product_name_buy || "",
        amount: parseFloat(item.buy_amount || 0),
        gst: parseFloat(item.buy_gst_percentage || 0),
        quantity: parseInt(item.buy_quantity || 0, 10),
      },
      sell: {
        name: item.product_name_sell || "",
        amount: parseFloat(item.sell_amount || 0),
        gst: parseFloat(item.sell_gst_percentage || 0),
        quantity: parseInt(item.sell_quantity || 0, 10),
      },
    }));

    const expenses = sheet.expenses || [];
    const profitRecord = (sheet.profits || [])[0] || null;
    const incomeTaxPercentage = profitRecord
      ? parseFloat(profitRecord.income_tax_percentage || 0)
      : 0;

    const expenseInputs = expenses.map((entry) => ({
      expense_particulars: entry.expense_particulars || "",
      expense_spc_percentage: parseFloat(entry.expense_spc_percentage || 0),
    }));

    const previewInput = this.buildMultiPreviewInputItems(
      productItems,
      expenseInputs,
      incomeTaxPercentage
    );
    const preview = this.calculateMultiSKUPreview({ items: previewInput });
    const sheetSumTotals = this.summarizeMultiProductSheetTotals(productItems, preview);

    await sheet.update(
      {
        total_buy_amount: preview.totals.totalBuyTotal,
        buying_amount: sheetSumTotals.total_buying_amount,
        total_buy_unit_price: sheetSumTotals.total_buying_unit_price,
        total_buy_quantity: sheetSumTotals.total_buying_quantity,
        total_sell_amount: preview.totals.totalSellTotal,
        selling_amount: sheetSumTotals.total_selling_amount,
        total_sell_unit_price: sheetSumTotals.total_selling_unit_price,
        total_sell_quantity: sheetSumTotals.total_selling_quantity,
        total_profit: preview.totals.totalProfit,
        total_gst_payable: preview.totals.totalGSTPayable,
        total_net_profit: preview.totals.totalNetProfit,
        total_expense_amount: preview.totals.expense_amount,
        total_income_tax: preview.totals.income_tax,
        total_final_profit: preview.totals.final_profit,
        updated_by: updatedBy || sheet.updated_by,
      },
      { transaction }
    );

    let expensePreviewIndex = productItems.length;
    for (let idx = 0; idx < expenses.length; idx++) {
      const previewRow = preview.rows[expensePreviewIndex] || {};
      expensePreviewIndex += 1;
      await expenses[idx].update(
        {
          expense_amount: parseFloat(previewRow.expense_amount || 0),
          row_order: idx + 1,
          updated_by: updatedBy,
        },
        { transaction }
      );
    }

    if (profitRecord) {
      await profitRecord.update(
        {
          income_tax: parseFloat(preview.totals.income_tax || 0),
          final_profit: parseFloat(preview.totals.final_profit || 0),
          updated_by: updatedBy,
        },
        { transaction }
      );
    }
  }

  async deleteMultiSKUCalculationExpenseById(expenseId, deletedBy = null) {
    const parsedExpenseId = parseInt(expenseId, 10);
    if (!Number.isFinite(parsedExpenseId)) {
      throw new Error(`Invalid multi SKU expense ID: ${expenseId}`);
    }

    const transaction = await sequelize.transaction();
    try {
      const expense = await MultiSKUCalculationExpense.findByPk(parsedExpenseId, {
        transaction,
      });

      if (!expense) {
        throw new Error(
          `Multi SKU expense with ID ${parsedExpenseId} not found in calculation.Multi_SKU_Calculation_Expenses`
        );
      }

      if (expense.is_deleted) {
        throw new Error(
          `Multi SKU expense with ID ${parsedExpenseId} is already deleted. ` +
            `Each sheet save creates new expense rows — use the multi_expense_id from ` +
            `GET /api/sku-calculations/multi/:sheetId (active rows only).`
        );
      }

      const sheetId = expense.multi_sku_sheet_id;
      const deletedAt = new Date();
      const resolvedDeletedBy = deletedBy || null;

      await expense.update(
        {
          is_deleted: true,
          deleted_at: deletedAt,
          deleted_by: resolvedDeletedBy,
        },
        { transaction }
      );

      await this.recalculateMultiSheetTotalsFromDb(sheetId, resolvedDeletedBy, transaction);

      await transaction.commit();
      return this.getMultiSKUCalculationSheetById(sheetId);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error deleting multi SKU expense: ${error.message}`);
    }
  }

  async deleteMultiSKUCalculationProductById(itemId, deletedBy = null) {
    const parsedItemId = parseInt(itemId, 10);
    if (!Number.isFinite(parsedItemId)) {
      throw new Error(`Invalid multi SKU product ID: ${itemId}`);
    }

    const transaction = await sequelize.transaction();
    try {
      const item = await MultiSKUCalculationItem.findByPk(parsedItemId, { transaction });

      if (!item) {
        throw new Error(
          `Multi SKU product with ID ${parsedItemId} not found in calculation.Multi_SKU_Calculation_Items`
        );
      }

      if (item.is_deleted) {
        throw new Error(`Multi SKU product with ID ${parsedItemId} is already deleted`);
      }

      const sheetId = item.multi_sku_sheet_id;
      const deletedAt = new Date();
      const resolvedDeletedBy = deletedBy || null;

      await item.update(
        {
          is_deleted: true,
          deleted_at: deletedAt,
          deleted_by: resolvedDeletedBy,
        },
        { transaction }
      );

      const remainingItems = await MultiSKUCalculationItem.findAll({
        where: { multi_sku_sheet_id: sheetId, is_deleted: false },
        order: [["row_order", "ASC"]],
        transaction,
      });

      for (let idx = 0; idx < remainingItems.length; idx++) {
        await remainingItems[idx].update(
          { row_order: idx + 1, updated_by: resolvedDeletedBy },
          { transaction }
        );
      }

      await this.recalculateMultiSheetTotalsFromDb(sheetId, resolvedDeletedBy, transaction);

      await transaction.commit();
      return this.getMultiSKUCalculationSheetById(sheetId);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error deleting multi SKU product: ${error.message}`);
    }
  }

  async deleteMultiSKUCalculationSheet(sheetId, deletedBy = null) {
    const transaction = await sequelize.transaction();
    try {
      const sheet = await MultiSKUCalculationSheet.findOne({
        where: { multi_sku_sheet_id: sheetId, is_deleted: false },
        transaction,
      });
      if (!sheet) {
        throw new Error(`Multi SKU calculation sheet with ID ${sheetId} not found`);
      }

      const deletedAt = new Date();
      const resolvedDeletedBy = deletedBy || null;

      await MultiSKUCalculationItem.update(
        {
          is_deleted: true,
          deleted_at: deletedAt,
          deleted_by: resolvedDeletedBy,
        },
        {
          where: { multi_sku_sheet_id: sheetId, is_deleted: false },
          transaction,
        }
      );

      await MultiSKUCalculationExpense.update(
        {
          is_deleted: true,
          deleted_at: deletedAt,
          deleted_by: resolvedDeletedBy,
        },
        {
          where: { multi_sku_sheet_id: sheetId, is_deleted: false },
          transaction,
        }
      );

      await MultiSKUCalculationProfit.update(
        {
          is_deleted: true,
          deleted_at: deletedAt,
          deleted_by: resolvedDeletedBy,
        },
        {
          where: { multi_sku_sheet_id: sheetId, is_deleted: false },
          transaction,
        }
      );

      await MultiSKUCalculationSheet.update(
        {
          is_deleted: true,
          deleted_at: deletedAt,
          deleted_by: resolvedDeletedBy,
        },
        {
          where: { multi_sku_sheet_id: sheetId, is_deleted: false },
          transaction,
        }
      );

      await transaction.commit();
      return {
        message: `Multi SKU calculation sheet with ID ${sheetId} deleted successfully`,
      };
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error deleting multi SKU calculation sheet: ${error.message}`);
    }
  }
  /**
   * Calculate buying unit price
   * Formula: Buy Unit Price = Amount + (Amount × GST% / 100)
   */
  calculateBuyUnitPrice(amount, gstPercentage) {
    const gstAmount = (amount * gstPercentage) / 100;
    return parseFloat((amount + gstAmount).toFixed(2));
  }

  /**
   * Calculate buying total
   * Formula: Buy Total = Buy Unit Price × Quantity
   */
  calculateBuyTotal(buyUnitPrice, quantity) {
    return parseFloat((buyUnitPrice * quantity).toFixed(2));
  }

  /**
   * Calculate selling unit price
   * Formula: Sell Unit Price = Amount + (Amount × GST% / 100)
   */
  calculateSellUnitPrice(amount, gstPercentage) {
    const gstAmount = (amount * gstPercentage) / 100;
    return parseFloat((amount + gstAmount).toFixed(2));
  }

  /**
   * Calculate selling total
   * Formula: Sell Total = Sell Unit Price × Quantity
   */
  calculateSellTotal(sellUnitPrice, quantity) {
    return parseFloat((sellUnitPrice * quantity).toFixed(2));
  }

  /**
   * Calculate profit
   * Formula: Profit = Total Selling Amount - Total Buying Amount
   */
  calculateProfit(sellTotal, buyTotal) {
    return parseFloat((sellTotal - buyTotal).toFixed(2));
  }

  /**
   * GST embedded in profit margin (GST-inclusive profit).
   * gst = profit − profit × 100 / (100 + sellGst%).
   * For negative profit the result is negative (same formula; net profit = profit − gst).
   */
  calculateGSTPayable(profit, sellGstPercentage) {
    if (sellGstPercentage < 0) return 0;
    const denominator = 100 + sellGstPercentage;
    if (denominator <= 0) return 0;
    const gst = profit - (profit * 100 / denominator);
    if (isNaN(gst) || !isFinite(gst)) return 0;
    return parseFloat(gst.toFixed(2));
  }

  /**
   * Calculate net profit
   * Formula: Net Profit = Profit - GST Payable
   */
  calculateNetProfit(profit, gstPayable) {
    return parseFloat((profit - gstPayable).toFixed(2));
  }

  /**
   * Calculate expense amount
   * Formula: Expense = (SPC% / 100) × Total Selling Amount
   */
  calculateExpenseAmount(spcPercentage, sellTotal) {
    return parseFloat(((spcPercentage / 100) * sellTotal).toFixed(2));
  }

  /**
   * Calculate income tax
   * Formula: Income Tax = (Income Tax% / 100) × Net Profit
   */
  calculateIncomeTax(incomeTaxPercentage, netProfit) {
    if (netProfit > 0) {
      return parseFloat(((incomeTaxPercentage / 100) * netProfit).toFixed(2));
    }
    return 0;
  }

  /**
   * Calculate final profit
   * Formula: Final Profit = Net Profit - Expense - Income Tax
   */
  calculateFinalProfit(netProfit, expenseAmount, incomeTax) {
    return parseFloat((netProfit - expenseAmount - incomeTax).toFixed(2));
  }

  /**
   * Create SKU Calculation with all automatic calculations
   */
  async createSKUCalculation(data) {
    try {
      const {
        product_name_buy,
        buy_amount,
        buy_gst_percentage,
        buy_quantity,
        product_name_sell,
        sell_amount,
        sell_gst_percentage,
        sell_quantity,
        income_tax_percentage,
        created_by,
      } = data;

      if (
        !product_name_buy ||
        buy_amount === undefined ||
        buy_quantity === undefined ||
        !product_name_sell ||
        sell_amount === undefined ||
        sell_quantity === undefined
      ) {
        throw new Error(
          "Missing required fields: product_name_buy, buy_amount, buy_quantity, product_name_sell, sell_amount, sell_quantity"
        );
      }

      const preview = this.calculateSKUPreview({
        product_name_buy,
        buy_amount,
        buy_gst_percentage,
        buy_quantity,
        product_name_sell,
        sell_amount,
        sell_gst_percentage,
        sell_quantity,
        income_tax_percentage,
        expenses: this.normalizeSingleProductExpenses(data),
        expense_particulars: data.expense_particulars,
        expense_spc_percentage: data.expense_spc_percentage,
      });

      const expenseRows = preview.expenses || [];
      const firstExpense = expenseRows[0] || null;

      const skuCalculation = await SKUCalculation.create({
        product_name_buy,
        buy_amount: parseFloat(buy_amount),
        buy_gst_percentage: parseFloat(buy_gst_percentage || 0),
        buy_quantity: parseInt(buy_quantity, 10),
        buy_unit_price: preview.buy_unit_price,
        buy_total: preview.buy_total,
        product_name_sell,
        sell_amount: parseFloat(sell_amount),
        sell_gst_percentage: parseFloat(sell_gst_percentage || 0),
        sell_quantity: parseInt(sell_quantity, 10),
        sell_unit_price: preview.sell_unit_price,
        sell_total: preview.sell_total,
        profit: preview.profit,
        gst_payable: preview.gst_payable,
        net_profit: preview.net_profit,
        expense_particulars: firstExpense?.expense_particulars || null,
        expense_spc_percentage: firstExpense?.expense_spc_percentage || 0,
        total_expense_amount: preview.total_expense_amount,
        expenses: expenseRows,
        income_tax_percentage: parseFloat(income_tax_percentage || 0),
        income_tax: preview.income_tax,
        final_profit: preview.final_profit,
        created_by: parseInt(created_by || 0, 10),
      });

      return this.buildSingleSKUResponse(skuCalculation);
    } catch (error) {
      throw new Error(`Error creating SKU calculation: ${error.message}`);
    }
  }

  /**
   * Get all SKU calculations
   */
  async getAllSKUCalculations() {
    try {
      const calculations = await SKUCalculation.findAll({
        order: [["created_at", "DESC"]],
      });

      return calculations.map((calculation) => this.buildSingleSKUResponse(calculation));
    } catch (error) {
      throw new Error(`Error fetching SKU calculations: ${error.message}`);
    }
  }

  /**
   * Get SKU calculation by ID
   */
  async getSKUCalculationById(skuId) {
    try {
      const calculation = await SKUCalculation.findByPk(skuId);
      if (!calculation) {
        throw new Error(`SKU calculation with ID ${skuId} not found`);
      }
      return this.buildSingleSKUResponse(calculation);
    } catch (error) {
      throw new Error(`Error fetching SKU calculation: ${error.message}`);
    }
  }

  /**
   * Update SKU calculation with recalculation of all fields
   */
  async updateSKUCalculation(skuId, data) {
    try {
      const calculation = await SKUCalculation.findByPk(skuId);
      if (!calculation) {
        throw new Error(`SKU calculation with ID ${skuId} not found`);
      }

      const {
        product_name_buy = calculation.product_name_buy,
        buy_amount = calculation.buy_amount,
        buy_gst_percentage = calculation.buy_gst_percentage,
        buy_quantity = calculation.buy_quantity,
        product_name_sell = calculation.product_name_sell,
        sell_amount = calculation.sell_amount,
        sell_gst_percentage = calculation.sell_gst_percentage,
        sell_quantity = calculation.sell_quantity,
        income_tax_percentage = calculation.income_tax_percentage,
        updated_by,
      } = data;

      const expenseInputs =
        data.expenses !== undefined || data.expense_particulars !== undefined
          ? this.normalizeSingleProductExpenses(data)
          : this.parseStoredExpenses(calculation.get({ plain: true }));

      const preview = this.calculateSKUPreview({
        product_name_buy,
        buy_amount,
        buy_gst_percentage,
        buy_quantity,
        product_name_sell,
        sell_amount,
        sell_gst_percentage,
        sell_quantity,
        income_tax_percentage,
        expenses: expenseInputs,
      });

      const expenseRows = preview.expenses || [];
      const firstExpense = expenseRows[0] || null;

      await calculation.update({
        product_name_buy,
        buy_amount: parseFloat(buy_amount),
        buy_gst_percentage: parseFloat(buy_gst_percentage),
        buy_quantity: parseInt(buy_quantity, 10),
        buy_unit_price: preview.buy_unit_price,
        buy_total: preview.buy_total,
        product_name_sell,
        sell_amount: parseFloat(sell_amount),
        sell_gst_percentage: parseFloat(sell_gst_percentage),
        sell_quantity: parseInt(sell_quantity, 10),
        sell_unit_price: preview.sell_unit_price,
        sell_total: preview.sell_total,
        profit: preview.profit,
        gst_payable: preview.gst_payable,
        net_profit: preview.net_profit,
        expense_particulars: firstExpense?.expense_particulars || null,
        expense_spc_percentage: firstExpense?.expense_spc_percentage || 0,
        total_expense_amount: preview.total_expense_amount,
        expenses: expenseRows,
        income_tax_percentage: parseFloat(income_tax_percentage),
        income_tax: preview.income_tax,
        final_profit: preview.final_profit,
        updated_by: updated_by ? parseInt(updated_by, 10) : calculation.updated_by,
      });

      return this.buildSingleSKUResponse(calculation);
    } catch (error) {
      throw new Error(`Error updating SKU calculation: ${error.message}`);
    }
  }

  /**
   * Delete SKU calculation
   */
  async deleteSKUCalculation(skuId) {
    try {
      const calculation = await SKUCalculation.findByPk(skuId);
      if (!calculation) {
        throw new Error(`SKU calculation with ID ${skuId} not found`);
      }

      await calculation.destroy();
      return { message: `SKU calculation with ID ${skuId} deleted successfully` };
    } catch (error) {
      throw new Error(`Error deleting SKU calculation: ${error.message}`);
    }
  }

  /**
   * Get SKU calculations by product name
   */
  async getSKUCalculationsByProductName(productName) {
    try {
      const calculations = await SKUCalculation.findAll({
        where: {
          [Op.or]: [
            { product_name_buy: { [Op.like]: `%${productName}%` } },
            { product_name_sell: { [Op.like]: `%${productName}%` } },
          ],
        },
        order: [["created_at", "DESC"]],
      });

      return calculations.map((calculation) => this.buildSingleSKUResponse(calculation));
    } catch (error) {
      throw new Error(`Error fetching SKU calculations by product name: ${error.message}`);
    }
  }

  /**
   * Get SKU calculations summary/statistics
   */
  async getSKUCalculationsSummary() {
    try {
      const calculations = await SKUCalculation.findAll();

      if (calculations.length === 0) {
        return {
          totalRecords: 0,
          totalBuyAmount: 0,
          totalSellAmount: 0,
          totalProfit: 0,
          totalNetProfit: 0,
          totalExpense: 0,
          totalIncomeTax: 0,
          totalFinalProfit: 0,
          averageProfitMargin: 0,
        };
      }

      const summary = calculations.reduce(
        (acc, calc) => {
          acc.totalBuyAmount += parseFloat(calc.buy_total || 0);
          acc.totalSellAmount += parseFloat(calc.sell_total || 0);
          acc.totalProfit += parseFloat(calc.profit || 0);
          acc.totalNetProfit += parseFloat(calc.net_profit || 0);
          acc.totalExpense += parseFloat(calc.expense_amount || 0);
          acc.totalIncomeTax += parseFloat(calc.income_tax || 0);
          acc.totalFinalProfit += parseFloat(calc.final_profit || 0);
          return acc;
        },
        {
          totalBuyAmount: 0,
          totalSellAmount: 0,
          totalProfit: 0,
          totalNetProfit: 0,
          totalExpense: 0,
          totalIncomeTax: 0,
          totalFinalProfit: 0,
        }
      );

      const profitMargin =
        summary.totalSellAmount > 0
          ? parseFloat(((summary.totalProfit / summary.totalSellAmount) * 100).toFixed(2))
          : 0;

      return {
        totalRecords: calculations.length,
        ...summary,
        averageProfitMargin: profitMargin,
      };
    } catch (error) {
      throw new Error(`Error fetching SKU calculations summary: ${error.message}`);
    }
  }
}

module.exports = new SKUCalculationService();
