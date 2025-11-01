// Reemplaza estas funciones con tus llamadas reales (fetch/axios a tu backend IoT)

export async function getStatus() {
    // Simula lectura inicial
    await delay(250);
    return {
        auto: false,
        actuators: {
            lights: false,
            pump: false,
            fan: false,
            heater: false,
            roof: "closed",
        },
        updatedAt: new Date().toISOString(),
    };
}

export async function setAutoMode(on) {
    await delay(180);
    // Aquí harías: await fetch('/api/iot/auto', { method:'POST', body: JSON.stringify({ on }) })
    return { ok: true };
}

export async function setActuator(key, value) {
    await delay(180);
    // POST /api/iot/actuators  { key, value }
    return { ok: true };
}

export async function setRoof(position) {
    await delay(200);
    // POST /api/iot/roof { position: 'open' | 'closed' }
    return { ok: true };
}

export async function pulse(key, seconds) {
    await delay(150);
    // POST /api/iot/pulse { key, seconds }
    return { ok: true };
}

function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
