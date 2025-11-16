// src/services/hidroponicos.js
const API_BASE = import.meta.env.VITE_API_URL || "https://localhost:7001";

async function sendJson(url, method = "GET", body = undefined) {
  const opts = { method, headers: {} };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function listHydroponicos(params = {}) {
  const url = new URL(`${API_BASE}/api/hidroponicos`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json(); // { page, pageSize, total, items[] }
}

export async function listHydroponicosAll(params = {}) {
  // Útil para selects (no paginar): usa el endpoint /api/hidroponicos/list
  const url = new URL(`${API_BASE}/api/hidroponicos/list`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  return sendJson(url);
}

export async function getHydroponico(id) {
  return sendJson(`${API_BASE}/api/hidroponicos/${id}`, "GET");
}

export async function createHydroponico(payload) {
  return sendJson(`${API_BASE}/api/hidroponicos`, "POST", payload);
}

export async function updateHydroponico(id, payload) {
  return sendJson(`${API_BASE}/api/hidroponicos/${id}`, "PUT", payload);
}

export async function deleteHydroponico(id) {
  return sendJson(`${API_BASE}/api/hidroponicos/${id}`, "DELETE");
}
