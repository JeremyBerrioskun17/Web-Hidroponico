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
    if (res.status === 204) return null;
    return res.json();
}

export async function listPlagas(params = {}) {
    const url = new URL(`${API_BASE}/api/plagas`);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
    const res = await fetch(url);
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
    }
    return res.json();
}

export async function createPlaga(payload) {
    return sendJson(`${API_BASE}/api/plagas`, "POST", payload);
}

export async function updatePlaga(id, payload) {
    return sendJson(`${API_BASE}/api/plagas/${id}`, "PUT", payload);
}

export async function deletePlaga(id) {
    return sendJson(`${API_BASE}/api/plagas/${id}`, "DELETE");
}
