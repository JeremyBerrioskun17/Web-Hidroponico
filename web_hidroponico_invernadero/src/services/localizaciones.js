// src/services/localizaciones.js
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

  // Para PUT / DELETE
  if (res.status === 204) return null;

  return res.json();
}

/**
 * GET api/localizaciones
 * Lista todas las localizaciones
 */
export async function listLocalizaciones() {
  const res = await fetch(`${API_BASE}/api/localizaciones`);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json(); // LocalizacionDto[]
}

/**
 * GET api/localizaciones/{id}
 */
export async function getLocalizacion(id) {
  return sendJson(`${API_BASE}/api/localizaciones/${id}`, "GET");
}

/**
 * POST api/localizaciones
 * payload: { nombre, descripcion }
 */
export async function createLocalizacion(payload) {
  return sendJson(`${API_BASE}/api/localizaciones`, "POST", payload);
}

/**
 * PUT api/localizaciones/{id}
 * payload: { nombre, descripcion }
 */
export async function updateLocalizacion(id, payload) {
  return sendJson(`${API_BASE}/api/localizaciones/${id}`, "PUT", payload);
}

/**
 * DELETE api/localizaciones/{id}
 */
export async function deleteLocalizacion(id) {
  return sendJson(`${API_BASE}/api/localizaciones/${id}`, "DELETE");
}
 