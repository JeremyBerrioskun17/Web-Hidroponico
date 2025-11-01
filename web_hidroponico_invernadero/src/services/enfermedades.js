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

export async function listEnfermedades(params = {}) {
    const url = new URL(`${API_BASE}/api/enfermedades`);
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

export async function createEnfermedad(payload) {
    return sendJson(`${API_BASE}/api/enfermedades`, "POST", payload);
}

export async function updateEnfermedad(id, payload) {
    return sendJson(`${API_BASE}/api/enfermedades/${id}`, "PUT", payload);
}

export async function deleteEnfermedad(id) {
    return sendJson(`${API_BASE}/api/enfermedades/${id}`, "DELETE");
}
