// src/utils/api.js
import axios from "axios";

const API_URL = "http://localhost:9000"; // Your API base URL

// Create an instance of axios to include default headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// You can optionally set the token here if you store it in localStorage
const token = localStorage.getItem("token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export const fetchUsers = async () => {
  try {
    const response = await api.get("/api/users");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const updateUser = async (userId, updatedUser) => {
  try {
    const response = await api.put(`/api/users/${userId}`, updatedUser);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const addUser = async (newUser) => {
  try {
    const response = await api.post("/api/users", newUser);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// Authentication API Calls
export const loginUser = async (email, password) => {
  try {
    const response = await api.post("/api/users/login", { email, password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};
