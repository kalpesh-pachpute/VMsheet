const { Sequelize } = require("sequelize");
require("dotenv").config();
const { SCHEMAS } = require("./dbConstant");

/**
 * @author Sandhya Sapate
 * @version 1.0
 * @since 13-5-2026
 */

// Default schema (change via .env if needed)
const DEFAULT_SCHEMA = process.env.DB_SCHEMA || SCHEMAS.AUTH;

const sequelize = new Sequelize(
  process.env.DB_NAME || "ProductCalculation_db",
  process.env.DB_ROOT_USER || "postgres",
  process.env.DB_ROOT_PASS || "admin",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    port: process.env.DB_PORT || 5432,
    logging: false,

    define: {
      schema: DEFAULT_SCHEMA
    },

    dialectOptions: {
      prependSearchPath: true
    },

    searchPath: DEFAULT_SCHEMA
  }
);

// Ensure Schemas Exist
(async () => {
  try {
    await sequelize.authenticate();

    const queryInterface = sequelize.getQueryInterface();

    for (const schema of Object.values(SCHEMAS)) {
      await queryInterface.createSchema(schema);
    }

    console.log("Database connected & schemas ensured");
  } catch (err) {
    // Ignore "schema already exists" error (Postgres: 42P06)
    if (err.original?.code !== "42P06") {
      console.error(" DB schema setup error:", err);
    }
  }
})();

module.exports = sequelize;
