import axios from "axios";
import { API_BASE } from "./config";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl = err.config?.url || "";
    const isAuthRequest =
      requestUrl.includes("/users/login") ||
      requestUrl.includes("/users/signup") ||
      requestUrl.includes("/users/profile/change-password") ||
      requestUrl.includes("/users/session");

    if (err.response?.status === 401 && !isAuthRequest) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
