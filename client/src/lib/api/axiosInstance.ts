import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach guest token
axiosInstance.interceptors.request.use(
  (config) => {
    // Guest token is automatically sent via cookies (withCredentials: true)
    // But we can also attach it from localStorage as a fallback
    if (typeof window !== "undefined") {
      const guestToken = localStorage.getItem("guest_token");
      if (guestToken && config.headers) {
        config.headers["X-Guest-Token"] = guestToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle guest token updates
axiosInstance.interceptors.response.use(
  (response) => {
    // Check if response contains a new guest token
    const newGuestToken = response.data?.guestToken;
    if (newGuestToken && typeof window !== "undefined") {
      localStorage.setItem("guest_token", newGuestToken);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axiosInstance;
