const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const MultiSKUCalculationSheet = require("./MultiproductCalculationSheet");

const MultiSKUCalculationProfit = sequelize.define(
  "MultiSKUCalculationProfit",
  {
    multi_profit_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    multi_sku_sheet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: MultiSKUCalculationSheet,
        key: "multi_sku_sheet_id",
      },
    },
    sheet_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    income_tax_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    income_tax: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    final_profit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
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
    tableName: "Multi_SKU_Calculation_Profits",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

MultiSKUCalculationSheet.hasMany(MultiSKUCalculationProfit, {
  foreignKey: "multi_sku_sheet_id",
  as: "profits",
  onDelete: "CASCADE",
});

MultiSKUCalculationProfit.belongsTo(MultiSKUCalculationSheet, {
  foreignKey: "multi_sku_sheet_id",
  as: "sheet",
  onDelete: "CASCADE",
});

module.exports = MultiSKUCalculationProfit;
