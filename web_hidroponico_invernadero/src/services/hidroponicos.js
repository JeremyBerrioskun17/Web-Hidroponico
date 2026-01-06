const API_BASE = import.meta.env.VITE_API_URL || "https://localhost:7001";

async function sendJson(url, method = "GET", body) {
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

// ✅ TU API DEVUELVE UN ARRAY
export async function listHydroponicos() {
  const res = await fetch(`${API_BASE}/api/hidroponicos`);
  if (!res.ok) throw new Error("Error al cargar hidropónicos");
  return res.json(); // <-- ARRAY DIRECTO
}

export const createHydroponico = (payload) =>
  sendJson(`${API_BASE}/api/hidroponicos`, "POST", payload);

export const deleteHydroponico = (id) =>
  sendJson(`${API_BASE}/api/hidroponicos/${id}`, "DELETE");

export const updateHydroponico = (id, payload) =>
  sendJson(`${API_BASE}/api/hidroponicos/${id}`, "PUT", payload);
