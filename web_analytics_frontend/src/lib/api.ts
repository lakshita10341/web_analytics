import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://lakshitajain.pythonanywhere.com/api";

// Create a dedicated axios instance
const api = axios.create({ baseURL: API_BASE });

// Attach Authorization header on each request from localStorage
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  }
  config.headers.set("Content-Type", "application/json");
  return config;
});

// On 401, try to refresh the access token once
let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

function onRefreshed(newToken: string | null) {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error?.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue requests while a refresh is in progress
        return new Promise((resolve, reject) => {
          pendingRequests.push((newToken) => {
            if (newToken) {
              originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      try {
        const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh") : null;
        if (!refresh) throw new Error("No refresh token");

        // Use a plain axios call to avoid interceptor recursion
        const refreshRes = await axios.post(`${API_BASE}/token/refresh/`, { refresh }, { headers: { "Content-Type": "application/json" } });
        const newAccess = refreshRes.data?.access;
        if (!newAccess) throw new Error("No access token from refresh");

        if (typeof window !== "undefined") {
          localStorage.setItem("token", newAccess);
        }

        onRefreshed(newAccess);

        // Retry the original request with the new token
        originalRequest.headers.set("Authorization", `Bearer ${newAccess}`);
        return api(originalRequest);
      } catch (e) {
        onRefreshed(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refresh");
        }
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export async function fetchJSON(path: string) {
  const res = await api.get(path);
  return res.data;
}

// New: GET with params helper
export async function fetchJSONWithParams(path: string, params?: Record<string, any>) {
  const res = await api.get(path, { params });
  return res.data;
}

export async function createSite(domain: string) {
  const res = await api.post(`/create_site/`, { domain });
  return res.data;
}
