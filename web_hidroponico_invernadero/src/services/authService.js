// src/services/auth.js

const API_BASE = import.meta.env.VITE_API_URL || "https://localhost:7001";

// Helper para POST, similar a tu getJson
async function postJson(url, data) {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
    }

    return res.json().catch(() => ({})); // puede que no devuelva JSON
}

// ===============================
// 🚀 Registrar nuevo usuario
// ===============================
export async function registerUser(data) {
    const url = `${API_BASE}/api/auth/register`;
    return postJson(url, data);
}
