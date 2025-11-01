// src/services/catalogos.js
const API_BASE = import.meta.env.VITE_API_URL || "https://localhost:7001";

async function getJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
    }
    return res.json();
}

export async function getPlagas(q = "", top = 200) {
    const url = new URL(`${API_BASE}/api/catalogos/plagas`);
    if (q) url.searchParams.set("q", q);
    url.searchParams.set("top", String(top));
    return getJson(url); // -> [{ id, nombre, extra }]
}

export async function getEnfermedades(q = "", top = 200) {
    const url = new URL(`${API_BASE}/api/catalogos/enfermedades`);
    if (q) url.searchParams.set("q", q);
    url.searchParams.set("top", String(top));
    return getJson(url); // -> [{ id, nombre, extra }]
}
