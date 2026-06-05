import BASE_URL from "../config/urlConfig";

const API_BASE_URL = `${BASE_URL}/api/sku-calculations`;

// ==========================================
// GET ALL SKU CALCULATIONS
// ==========================================
export const getSkuCalculations = async () => {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(API_BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch calculations"
      );
    }

    return data;
  } catch (error) {
    console.error("GET SKU ERROR:", error);
    throw error;
  }
};

// ==========================================
// CREATE SKU CALCULATION
// ==========================================
export const createSkuCalculation = async (payload) => {
  const token = localStorage.getItem("token");

  try {
    console.log("CREATE PAYLOAD =>", payload);

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("CREATE RESPONSE =>", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to create calculation");
    }

    return data;
  } catch (error) {
    console.error("CREATE SKU ERROR:", error);
    throw error;
  }
};

// ==========================================
// UPDATE SKU CALCULATION
// ==========================================
export const updateSkuCalculation = async (
  sku_id,
  payload
) => {
  const token = localStorage.getItem("token");

  try {
    console.log("UPDATE PAYLOAD =>", payload);

    const response = await fetch(
      `${API_BASE_URL}/${sku_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    console.log("UPDATE RESPONSE =>", data);

    if (!response.ok) {
      throw new Error(data.message || "Update failed");
    }

    return data;
  } catch (error) {
    console.error("UPDATE SKU ERROR:", error);
    throw error;
  }
};

// ==========================================
// DELETE SKU CALCULATION
// ==========================================
export const deleteSkuCalculation = async (sku_id) => {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `${API_BASE_URL}/${sku_id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    console.log("DELETE RESPONSE =>", data);

    if (!response.ok) {
      throw new Error(data.message || "Delete failed");
    }

    return data;
  } catch (error) {
    console.error("DELETE SKU ERROR:", error);
    throw error;
  }
};

// ==========================================
// GET SINGLE SKU CALCULATION
// ==========================================
export const getSingleSkuCalculation = async (sku_id) => {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `${API_BASE_URL}/${sku_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch calculation"
      );
    }

    return data;
  } catch (error) {
    console.error("GET SINGLE SKU ERROR:", error);
    throw error;
  }
};