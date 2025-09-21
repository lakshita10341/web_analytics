import axios from "axios";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api";

async function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchJSON(path: string) {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE}${path}`, { headers: { "Content-Type": "application/json", ...headers } });
  return res.data;
}

export async function createSite(domain: string) {
  const res = await axios.post(
    "/api/create_site",
    { domain },
    { withCredentials: true, headers: { "Content-Type": "application/json" } }
  );
  return res.data;
}
