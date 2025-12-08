// // src/services/cosechas.js
// const API_BASE = import.meta.env.VITE_API_URL || "https://localhost:7001";

// async function sendJson(url, method, body) {
//   const res = await fetch(url, {
//     method,
//     headers: { "Content-Type": "application/json" },
//     body: body ? JSON.stringify(body) : undefined,
//   });
//   if (!res.ok) {
//     const txt = await res.text().catch(() => "");
//     throw new Error(txt || `HTTP ${res.status}`);
//   }
//   if (res.status === 204) return null;
//   return res.json();
// }

// export async function listCosechas(params = {}) {
//   const url = new URL(`${API_BASE}/api/cosechas`);
//   Object.entries(params).forEach(([k, v]) => {
//     if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
//   });
//   const res = await fetch(url);
//   if (!res.ok) {
//     const txt = await res.text().catch(() => "");
//     throw new Error(txt || `HTTP ${res.status}`);
//   }
//   return res.json();
// }

// export async function getCosecha(id) {
//   return sendJson(`${API_BASE}/api/cosechas/${id}`, "GET");
// }

// export async function createCosecha(payload) {
//   return sendJson(`${API_BASE}/api/cosechas`, "POST", payload);
// }

// export async function updateCosecha(id, payload) {
//   return sendJson(`${API_BASE}/api/cosechas/${id}`, "PUT", payload);
// }

// export async function deleteCosecha(id) {
//   return sendJson(`${API_BASE}/api/cosechas/${id}`, "DELETE");
// }

// // Obtener resumen/lista por hidroponico
// export async function listCosechasByHydroponico(hidroId, params = {}) {
//   const url = new URL(`${API_BASE}/api/hidroponicos/${hidroId}/cosechas`);
//   Object.entries(params).forEach(([k, v]) => {
//     if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
//   });
//   const res = await fetch(url);
//   if (!res.ok) {
//     const txt = await res.text().catch(() => "");
//     throw new Error(txt || `HTTP ${res.status}`);
//   }
//   return res.json();
// }

// src/services/cosechas.js
import { api } from "../apiClient";

/**
 * params -> objeto simple { page:1, pageSize:20, filtro:'x' }
 */
export async function listCosechas(params = {}) {
  const res = await api.get("/api/cosechas", { params });
  return res.data;
}

export async function getCosecha(id) {
  const res = await api.get(`/api/cosechas/${id}`);
  return res.data;
}

export async function createCosecha(payload) {
  const res = await api.post("/api/cosechas", payload);
  return res.data;
}

export async function updateCosecha(id, payload) {
  const res = await api.put(`/api/cosechas/${id}`, payload);
  return res.data;
}

export async function deleteCosecha(id) {
  // devuelve 204 o 200
  const res = await api.delete(`/api/cosechas/${id}`);
  return res.data;
}

export async function listCosechasByHydroponico(hidroId, params = {}) {
  const res = await api.get(`/api/hidroponicos/${hidroId}/cosechas`, { params });
  return res.data;
}
