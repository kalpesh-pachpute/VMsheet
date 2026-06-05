const dotenv = require("dotenv");
dotenv.config();
const sequelize = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const spcRoutes = require("./routes/spcRoutes");

// Load models to ensure they are registered
require("./models/users");
require("./models/singleproductCalculation");
require("./models/MultiproductCalculationSheet");
require("./models/multiproductCalculationItem");
require("./models/multiproductCalculationExpense");
require("./models/multiproductCalculationProfit");

const express = require("express");
const cors = require("cors");
const app = express();
// CORS configuration
app.use(cors());

// Body parsing middleware - must be before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * @author Sandhya Sapate
 * @version 1.0
 * @since 13-5-2026
 */

// Routes

app.use("/api/auth", authRoutes);
app.use("/api/sku-calculations", spcRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Backend OK" });
});

sequelize
  .sync({ alter: true})
  .then(() => {
    console.log("Database connected");

    const PORT = process.env.PORT || 5500;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB Error:", err);
  });