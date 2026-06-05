import axios from "axios";
import BASE_URL from "../config/urlConfig";

/**
 * Multi SKU Calculation API Service
 * Handles API calls for multi SKU calculations and sheets
 * @author Finance Team
 * @version 1.0
 * @since 24-04-2026
 */

const API_BASE_URL = `${BASE_URL}/api/sku-calculations`;

/**
 * Helper function to get authorization headers
 */
const getAuthHeaders = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("userToken");

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

/**
 * Preview single-product SKU calculation without saving
 * Body:
 * {
 *   buy_amount, buy_gst_percentage, buy_quantity,
 *   sell_amount, sell_gst_percentage, sell_quantity,
 *   expense_spc_percentage, income_tax_percentage
 * }
 */
// export const previewSKUCalculation = async (data) => {
//   try {
//     const response = await axios.post(
//       `${API_BASE_URL}/preview`,
//       data,
//       {
//         headers: getAuthHeaders(),
//       }
//     );

//     return response.data;
//   } catch (error) {
//     throw error.response?.data || error.message;
//   }
// };

/**
 * Preview multi-product SKU calculation without saving
 * Body:
 * {
 *   buyProducts: [{ name, amount, gst, quantity }],
 *   sellProducts: [{ name, amount, gst, quantity }],
 *   expense_spc_percentage,
 *   income_tax_percentage
 * }
 */
// export const previewMultiSKUCalculation = async (data) => {
//   try {
//     const response = await axios.post(
//       `${API_BASE_URL}/preview/multi`,
//       data,
//       {
//         headers: getAuthHeaders(),
//       }
//     );

//     return response.data;
//   } catch (error) {
//     throw error.response?.data || error.message;
//   }
// };

/**
 * Create Multi SKU Calculation Sheet
 */
export const createMultiSKUCalculationSheet = async (data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/multi`,
      data,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get all Multi SKU Calculation Sheets
 */
export const getAllMultiSKUCalculationSheets = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/multi`,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Get Multi SKU Calculation Sheet by ID
 */
export const getMultiSKUCalculationSheetById = async (sheetId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/multi/${sheetId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Update Multi SKU Calculation Sheet
 */
export const updateMultiSKUCalculationSheet = async (
  sheetId,
  data
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/multi/${sheetId}`,
      data,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Delete Multi SKU Calculation Sheet
 */
// export const deleteMultiSKUCalculationSheet = async (
//   sheetId
// ) => {
//   try {
//     const response = await axios.delete(
//       `${API_BASE_URL}/multi/${sheetId}`,
//       {
//         headers: getAuthHeaders(),
//       }
//     );

//     return response.data;
//   } catch (error) {
//     throw error.response?.data || error.message;
//   }
// };
/**
 * Delete single expense row
 */
export const deleteMultiSKUExpense = async (expenseId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/multi/expenses/${expenseId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Delete single product item row
 */
export const deleteMultiSKUItem = async (itemId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/multi/items/${itemId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Export for backward compatibility - alias for previewMultiSKUCalculation
 */
// export { previewMultiSKUCalculation as previewMultiProductCalculation };