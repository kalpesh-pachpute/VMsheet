const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/**
 * SKU Calculations Model
 * Handles buying, selling, profit, and expense calculations
 * @author Sandhya Sapate
 * @version 1.0
 * @since 13-05-2026
 */

const SKUCalculation = sequelize.define(
  "SKUCalculation",
  {
    sku_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // ===== BUYING (Input Pricing) Section =====
    product_name_buy: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    buy_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    buy_gst_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    buy_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    buy_unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    buy_total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },

    // ===== SELLING (Output Pricing) Section =====
    product_name_sell: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sell_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    sell_gst_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    sell_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sell_unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    sell_total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },

    // ===== PROFIT Calculation Section =====
    profit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    // profit_gst_percentage: {
    //   type: DataTypes.DECIMAL(5, 2),
    //   allowNull: false,
    //   defaultValue: 0,
    // },
    gst_payable: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    net_profit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },

    // ===== EXPENSE Section =====
    /** Multiple expense lines stored on the same row (no separate table). */
    expenses: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    total_expense_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
    },
    // ===== INCOME TAX Section =====
    income_tax_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    income_tax: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },

    // ===== FINAL PROFIT =====
    final_profit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Soft delete fields
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
   schema: "calculation",
   tableName: "SKU_Calculations",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = SKUCalculation;
