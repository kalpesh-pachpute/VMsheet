
import axios from "axios";
import BASE_URL from "../config/urlConfig";

const API_BASE_URL = `${BASE_URL}/api`;

export const loginUser = async (loginData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      loginData
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || {
      message: "Something went wrong",
    };
  }
};
export const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.put(
      `${API_BASE_URL}/auth/profile`,
      profileData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || {
      message: "Failed to update profile",
    };
  }
};