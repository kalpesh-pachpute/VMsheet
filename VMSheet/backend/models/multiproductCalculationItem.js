const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const MultiSKUCalculationSheet = require("./MultiproductCalculationSheet");

const MultiSKUCalculationItem = sequelize.define(
  "MultiSKUCalculationItem",
  {
    multi_sku_item_id: {
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
    // Stored for quick UI/exports; primary linkage is `multi_sku_sheet_id`
    sheet_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
    },
    row_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
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
      allowNull: false,
      defaultValue: 0,
    },
    buy_total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
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
      allowNull: false,
      defaultValue: 0,
    },
    sell_total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    profit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    gst_payable: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    net_profit: {
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
    tableName: "Multi_SKU_Calculation_Items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

MultiSKUCalculationSheet.hasMany(MultiSKUCalculationItem, {
  foreignKey: "multi_sku_sheet_id",
  as: "items",
  onDelete: "CASCADE",
});

MultiSKUCalculationItem.belongsTo(MultiSKUCalculationSheet, {
  foreignKey: "multi_sku_sheet_id",
  as: "sheet",
  onDelete: "CASCADE",
});

module.exports = MultiSKUCalculationItem;
