// src/services/sensors.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function getJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function getDhtLast() {
    // -> { tempC, hum, tsUtc }
    return getJson(`${API_BASE}/api/dht/last`);
}
