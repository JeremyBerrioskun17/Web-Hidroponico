// src/services/leds.js

// Usa la IP:puerto HTTP de tu backend (Kestrel) — ej: http://192.168.X.X:5000
// Si no defines VITE_API_URL, caerá a http://localhost:5000
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

const TIMEOUT_MS = 7000; // corta requests colgados

function withTimeout(promise, ms = TIMEOUT_MS) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort("timeout"), ms);
    return {
        signal: ctrl.signal,
        run: promise.finally(() => clearTimeout(t)),
    };
}

async function getJson(url, opts = {}) {
    const { signal, run } = withTimeout(Promise.resolve());
    const res = await fetch(url, {
        ...opts,
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
        credentials: "include",
        signal,
    });
    // Nota: usamos `run` para limpiar el timeout; no await aquí porque ya resolvió
    run;
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
    }
    return res.json();
}

async function postJson(url, body, opts = {}) {
    return getJson(url, { method: "POST", body: JSON.stringify(body), ...(opts || {}) });
}

async function putJson(url, body, opts = {}) {
    return getJson(url, { method: "PUT", body: JSON.stringify(body), ...(opts || {}) });
}

/* =========================
   Actuadores (1=Luces, 2=Bomba, 3=Ventilador)
   Endpoints:
   GET  /api/leds/{id}/state         -> { on: bool }
   PUT  /api/leds/{id}/state         -> { on: bool } (body { on: bool })
   POST /api/leds/{id}/toggle        -> { on: bool }
   GET  /api/leds/ping               -> { ok: true }
   ========================= */

export async function pingApi() {
    return getJson(`${API_BASE}/api/leds/ping`);
}

// Genéricos por id
export async function getActuatorState(id) {
    return getJson(`${API_BASE}/api/leds/${id}/state`);
}

export async function setActuator(id, on) {
    return putJson(`${API_BASE}/api/leds/${id}/state`, { on });
}

export async function toggleActuator(id) {
    return postJson(`${API_BASE}/api/leds/${id}/toggle`, {});
}

// Compatibilidad con tu UI actual (Luces = id 1)
export async function getLedState(id) {
    return getActuatorState(id);
}

export async function setLed(id, on) {
    return setActuator(id, on);
}

export async function toggleLed(id) {
    return toggleActuator(id);
}

/* =========================
   DHT11
   Endpoints:
   POST /api/leds/dht11              -> { utc, temperatureC, humidity, source }
   GET  /api/leds/dht11/latest       -> { utc, temperatureC, humidity, source }
   GET  /api/leds/dht11/history?take=N -> [ ...DhtOutDto ]
   ========================= */

export async function postDhtReading({ temperatureC, humidity, source = "web" }) {
    return postJson(`${API_BASE}/api/leds/dht11`, { temperatureC, humidity, source });
}

export async function getDhtLatest() {
    return getJson(`${API_BASE}/api/leds/dht11/latest`);
}

export async function getDhtHistory(take = 50) {
    const url = new URL(`${API_BASE}/api/leds/dht11/history`);
    url.searchParams.set("take", String(take));
    return getJson(url.toString());
}
