import axios from "axios";

import {
  clearStoredAuth,
  getStoredToken,
} from "../services/authStorage.js";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    "VITE_API_BASE_URL is not configured.",
  );
}

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization =
        `Token ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth();

      const currentPath =
        window.location.pathname;

      if (currentPath !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;