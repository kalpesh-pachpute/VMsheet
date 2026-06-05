const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const MultiSKUCalculationSheet = require("./MultiproductCalculationSheet");

const MultiSKUCalculationExpense = sequelize.define(
  "MultiSKUCalculationExpense",
  {
    multi_expense_id: {
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
    row_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    expense_particulars: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    expense_spc_percentage: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      defaultValue: 0,
    },
    expense_amount: {
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
    tableName: "Multi_SKU_Calculation_Expenses",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

MultiSKUCalculationSheet.hasMany(MultiSKUCalculationExpense, {
  foreignKey: "multi_sku_sheet_id",
  as: "expenses",
  onDelete: "CASCADE",
});

MultiSKUCalculationExpense.belongsTo(MultiSKUCalculationSheet, {
  foreignKey: "multi_sku_sheet_id",
  as: "sheet",
  onDelete: "CASCADE",
});

module.exports = MultiSKUCalculationExpense;
