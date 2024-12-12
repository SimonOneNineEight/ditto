import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("Response Error: ", error.response.data);
      console.error("Status: ", error.response.status);
    } else if (error.request) {
      console.error("Request Error: ", error.resquest);
    } else {
      console.error("Error: ", error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
