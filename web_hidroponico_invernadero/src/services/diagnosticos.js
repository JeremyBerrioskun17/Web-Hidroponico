// src/services/diagnosticos.js
const API_BASE = import.meta.env.VITE_API_URL || "https://localhost:7001";

async function sendJson(url, method, body) {
    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
    }
    // 204 No Content no tiene body
    if (res.status === 204) return null;
    return res.json();
}

// POST /api/diagnosticos
export async function createDiagnostico(payload) {
    return sendJson(`${API_BASE}/api/diagnosticos`, "POST", payload);
}

// (Opcionales para tu CRUD)
// GET /api/diagnosticos?page=1&pageSize=20&tipo=plaga ...
export async function listDiagnosticos(params = {}) {
    const url = new URL(`${API_BASE}/api/diagnosticos`);
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

// GET /api/diagnosticos/{id}
export async function getDiagnostico(id) {
    return sendJson(`${API_BASE}/api/diagnosticos/${id}`, "GET");
}

// PUT /api/diagnosticos/{id}
export async function updateDiagnostico(id, patch) {
    return sendJson(`${API_BASE}/api/diagnosticos/${id}`, "PUT", patch);
}

// DELETE /api/diagnosticos/{id}
export async function deleteDiagnostico(id) {
    return sendJson(`${API_BASE}/api/diagnosticos/${id}`, "DELETE");
}
