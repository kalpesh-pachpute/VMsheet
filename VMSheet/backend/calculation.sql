
CREATE DATABASE "ProductCalculation_db";
CREATE SCHEMA auth;
CREATE SCHEMA calculation;

CREATE TABLE auth.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(10) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calculation.SKU_Calculations (
  sku_id SERIAL PRIMARY KEY,
  -- Buying
  product_name_buy VARCHAR(255) NOT NULL,
  buy_amount DECIMAL(15,2) NOT NULL,
  buy_gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  buy_quantity INT NOT NULL,
  buy_unit_price DECIMAL(15,2),
  buy_total DECIMAL(15,2),
  -- Selling
  product_name_sell VARCHAR(255) NOT NULL,
  sell_amount DECIMAL(15,2) NOT NULL,
  sell_gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  sell_quantity INT NOT NULL,
  sell_unit_price DECIMAL(15,2),
  sell_total DECIMAL(15,2),
  -- Profit
  profit DECIMAL(15,2),
  gst_payable DECIMAL(15,2),
  net_profit DECIMAL(15,2),
  -- Expense (first line kept for backward compatibility; all lines in expenses JSON)
  expense_particulars VARCHAR(500),
  expense_spc_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  expense_amount DECIMAL(15,2),
  expenses JSONB DEFAULT '[]'::jsonb,
  -- Income Tax
  income_tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  income_tax DECIMAL(15,2),
  -- Final Profit
  final_profit DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT
);

CREATE INDEX idx_product_name ON calculation.SKU_Calculations (product_name_buy, product_name_sell);

CREATE TABLE IF NOT EXISTS calculation.Multi_SKU_Calculation_Sheets (
  multi_sku_sheet_id SERIAL PRIMARY KEY,
  sheet_name VARCHAR(255) NOT NULL DEFAULT 'Multi Product Sheet',
  total_buy_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_sell_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_gst_payable DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_net_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_expense_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_income_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_final_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL
);

CREATE TABLE IF NOT EXISTS calculation.Multi_SKU_Calculation_Items (
  multi_sku_item_id SERIAL PRIMARY KEY,
  multi_sku_sheet_id INT NOT NULL REFERENCES calculation.Multi_SKU_Calculation_Sheets(multi_sku_sheet_id) ON DELETE CASCADE,
  sheet_name VARCHAR(255) NOT NULL DEFAULT '',
  row_order INT NOT NULL DEFAULT 0,
  product_name_buy VARCHAR(255) NOT NULL,
  buy_amount DECIMAL(15,2) NOT NULL,
  buy_gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  buy_quantity INT NOT NULL,
  buy_unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  buy_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  product_name_sell VARCHAR(255) NOT NULL,
  sell_amount DECIMAL(15,2) NOT NULL,
  sell_gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  sell_quantity INT NOT NULL,
  sell_unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  sell_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  profit DECIMAL(15,2) NOT NULL DEFAULT 0,
  gst_payable DECIMAL(15,2) NOT NULL DEFAULT 0,
  net_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL
);

CREATE TABLE IF NOT EXISTS calculation.Multi_SKU_Calculation_Expenses (
  multi_expense_id SERIAL PRIMARY KEY,
  multi_sku_sheet_id INT NOT NULL REFERENCES calculation.Multi_SKU_Calculation_Sheets(multi_sku_sheet_id) ON DELETE CASCADE,
  sheet_name VARCHAR(255) NOT NULL,
  row_order INT NOT NULL DEFAULT 0,
  expense_particulars VARCHAR(500),
  expense_spc_percentage DECIMAL(10,6) NOT NULL DEFAULT 0,
  expense_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL
);

CREATE TABLE IF NOT EXISTS calculation.Multi_SKU_Calculation_Profits (
  multi_profit_id SERIAL PRIMARY KEY,
  multi_sku_sheet_id INT NOT NULL REFERENCES calculation.Multi_SKU_Calculation_Sheets(multi_sku_sheet_id) ON DELETE CASCADE,
  sheet_name VARCHAR(255) NOT NULL,
  income_tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  income_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
  final_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL
);

-- One-time: move legacy expense/tax rows from items into new tables (run before dropping columns)
INSERT INTO calculation.Multi_SKU_Calculation_Expenses (
  multi_sku_sheet_id, sheet_name, row_order, expense_particulars, expense_spc_percentage, expense_amount
)
SELECT
  i.multi_sku_sheet_id,
  s.sheet_name,
  i.row_order,
  i.expense_particulars,
  COALESCE(i.expense_spc_percentage, 0),
  COALESCE(i.expense_amount, 0)
FROM calculation."Multi_SKU_Calculation_Items" i
JOIN calculation."Multi_SKU_Calculation_Sheets" s ON s.multi_sku_sheet_id = i.multi_sku_sheet_id
WHERE COALESCE(TRIM(i.product_name_buy), '') = ''
  AND COALESCE(TRIM(i.product_name_sell), '') = ''
  AND COALESCE(i.income_tax_percentage, 0) = 0
  AND (COALESCE(TRIM(i.expense_particulars), '') <> '' OR COALESCE(i.expense_spc_percentage, 0) <> 0);

INSERT INTO calculation.Multi_SKU_Calculation_Profits (
  multi_sku_sheet_id, sheet_name, income_tax_percentage, income_tax, final_profit
)
SELECT DISTINCT ON (i.multi_sku_sheet_id)
  i.multi_sku_sheet_id,
  s.sheet_name,
  COALESCE(i.income_tax_percentage, 0),
  COALESCE(i.income_tax, 0),
  COALESCE(i.final_profit, 0)
FROM calculation."Multi_SKU_Calculation_Items" i
JOIN calculation."Multi_SKU_Calculation_Sheets" s ON s.multi_sku_sheet_id = i.multi_sku_sheet_id
WHERE COALESCE(TRIM(i.product_name_buy), '') = ''
  AND COALESCE(TRIM(i.product_name_sell), '') = ''
  AND COALESCE(i.income_tax_percentage, 0) > 0
ORDER BY i.multi_sku_sheet_id, i.row_order DESC;

DELETE FROM calculation."Multi_SKU_Calculation_Items" i
WHERE COALESCE(TRIM(i.product_name_buy), '') = ''
  AND COALESCE(TRIM(i.product_name_sell), '') = '';

ALTER TABLE calculation."Multi_SKU_Calculation_Items"
DROP COLUMN IF EXISTS expense_particulars,
DROP COLUMN IF EXISTS expense_spc_percentage,
DROP COLUMN IF EXISTS expense_amount,
DROP COLUMN IF EXISTS income_tax_percentage,
DROP COLUMN IF EXISTS income_tax,
DROP COLUMN IF EXISTS final_profit;

ALTER TABLE calculation."Multi_SKU_Calculation_Items"
ALTER COLUMN expense_spc_percentage TYPE DECIMAL(10,6);

ALTER TABLE calculation."SKU_Calculations"
ALTER COLUMN expense_spc_percentage TYPE DECIMAL(10,6);

-- Multiple expenses on one SKU row (same table, JSON array)
ALTER TABLE calculation."SKU_Calculations"
ADD COLUMN IF NOT EXISTS expenses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE calculation."SKU_Calculations"
DROP COLUMN IF EXISTS expenses;

ALTER TABLE calculation."SKU_Calculations"
DROP COLUMN IF EXISTS expense_particulars,
DROP COLUMN IF EXISTS expense_spc_percentage,
DROP COLUMN IF EXISTS expense_amount;

ALTER TABLE calculation."SKU_Calculations" 
ADD COLUMN total_expense_amount DECIMAL(15, 2) DEFAULT 0;

ALTER TABLE calculation."Multi_SKU_Calculation_Sheets"
ADD COLUMN IF NOT EXISTS total_buy_unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0;

ALTER TABLE calculation."Multi_SKU_Calculation_Sheets"
ADD COLUMN IF NOT EXISTS total_buy_quantity INT NOT NULL DEFAULT 0;

ALTER TABLE calculation."Multi_SKU_Calculation_Sheets"
ADD COLUMN IF NOT EXISTS total_sell_unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0;

ALTER TABLE calculation."Multi_SKU_Calculation_Sheets"
ADD COLUMN IF NOT EXISTS total_sell_quantity INT NOT NULL DEFAULT 0;

ALTER TABLE calculation."Multi_SKU_Calculation_Sheets"
ADD COLUMN IF NOT EXISTS buying_amount DECIMAL(15, 2) NOT NULL DEFAULT 0;

ALTER TABLE calculation."Multi_SKU_Calculation_Sheets"
ADD COLUMN IF NOT EXISTS selling_amount DECIMAL(15, 2) NOT NULL DEFAULT 0;