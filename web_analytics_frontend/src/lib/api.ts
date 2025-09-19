export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api";

async function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchJSON(path: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, { headers: { "Content-Type": "application/json", ...headers } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function createSite(domain: string) {
  const res = await fetch("/api/create_site", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create site");
  return res.json();
}
