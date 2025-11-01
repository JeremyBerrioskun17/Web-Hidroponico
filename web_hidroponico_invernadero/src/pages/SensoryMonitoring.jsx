// src/pages/RealtimeSensorsResponsive.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    TimeScale,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line, Doughnut } from "react-chartjs-2";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    TimeScale,
    Tooltip,
    Legend,
    Filler,
    ArcElement
);

// ===== Paleta =====
const C = {
    primary: "#15b67a",
    primaryDark: "#0f8c5e",
    lime: "#a3e635",
    yellow: "#ffcc4d",
    text: "#1f2d3d",
    muted: "#7a8aa0",
    card: "#ffffff",
    bg: "#f6f9fb",
    border: "rgba(20, 180, 120, .18)",
};

// ===== Demo data =====
const now = () => new Date();
const rnd = (min, max) => +(min + Math.random() * (max - min)).toFixed(1);
const mkPoint = () => ({
    t: now(),
    temp: rnd(18, 35),
    hum: rnd(40, 92),
    soil: rnd(20, 70),
});

export default function RealtimeSensorsResponsive() {
    const [auto, setAuto] = useState(true);

    // estados de actuadores (demo)
    const [sLight, setLight] = useState(false);
    const [sPump, setPump] = useState(false);
    const [sFan, setFan] = useState(false);
    const [sHeat, setHeat] = useState(false);
    const [roof, setRoof] = useState("cerrado"); // "abierto" | "cerrado"

    // histórico sensores
    const [history, setHistory] = useState(() => {
        const base = now().getTime() - 9 * 2000;
        return Array.from({ length: 6 }, (_, i) => {
            const t = new Date(base + i * 2000);
            const p = mkPoint();
            p.t = t;
            return p;
        });
    });

    const last = history.at(-1);
    const prev = history.at(-2);
    const gridApiRef = useRef(null);

    useEffect(() => {
        if (!auto) return;
        const id = setInterval(() => {
            setHistory((prev) => [...prev.slice(-9), mkPoint()]);
        }, 2000);
        return () => clearInterval(id);
    }, [auto]);

    // ===== Gráfica líneas
    const lineData = useMemo(() => {
        const labels = history.map((p) => p.t);
        return {
            labels,
            datasets: [
                {
                    label: "Temperatura",
                    data: history.map((p) => p.temp),
                    borderColor: C.primary,
                    backgroundColor: (ctx) => gradient(ctx, C.primary),
                    tension: 0.25,
                    pointRadius: 0,
                    fill: true,
                },
                {
                    label: "Humedad aire",
                    data: history.map((p) => p.hum),
                    borderColor: C.yellow,
                    backgroundColor: (ctx) => gradient(ctx, C.yellow),
                    tension: 0.25,
                    pointRadius: 0,
                    fill: true,
                },
                {
                    label: "Humedad suelo",
                    data: history.map((p) => p.soil),
                    borderColor: "#25c46c",
                    backgroundColor: (ctx) => gradient(ctx, "#25c46c"),
                    tension: 0.25,
                    pointRadius: 0,
                    fill: true,
                },
            ],
        };
    }, [history]);

    const lineOpts = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        plugins: {
            legend: {
                position: "bottom",
                labels: { color: C.text, boxWidth: 16, usePointStyle: true },
            },
            tooltip: {
                callbacks: {
                    title: (items) => new Date(items[0].parsed.x).toLocaleString(),
                },
            },
        },
        scales: {
            x: {
                type: "time",
                time: { tooltipFormat: "dd/MM HH:mm:ss" },
                grid: { color: "rgba(28, 35, 50, 0.08)" },
                ticks: { color: C.muted, maxRotation: 0 },
            },
            y: {
                grid: { color: "rgba(28, 35, 50, 0.08)" },
                ticks: { color: C.muted },
            },
        },
    };

    // Donut demo
    const donutData = useMemo(() => {
        const s = last
            ? [Math.max(0, 100 - last.hum), Math.min(60, last.hum / 2), last.hum / 3]
            : [60, 25, 15];
        return {
            labels: ["Plantas sanas", "Mancha angular", "Roya"],
            datasets: [
                {
                    data: s,
                    backgroundColor: [C.primary, C.yellow, "#25c46c"],
                    borderWidth: 0,
                },
            ],
        };
    }, [last]);

    // Tabla
    const columnDefs = [
        {
            field: "idx",
            headerName: "#",
            maxWidth: 80,
            valueGetter: (p) => (p.node ? p.node.rowIndex + 1 : ""),
            sortable: false,
        },
        {
            field: "t",
            headerName: "Fecha/Hora",
            valueFormatter: (p) => new Date(p.value).toLocaleString(),
            minWidth: 220,
            sortable: true,
        },
        { field: "temp", headerName: "Temp (°C)", valueFormatter: (p) => p.value?.toFixed(1) },
        { field: "hum", headerName: "Hum (%)", valueFormatter: (p) => p.value?.toFixed(1) },
        { field: "soil", headerName: "Suelo (%)", valueFormatter: (p) => p.value?.toFixed(1) },
    ];
    const defaultColDef = { resizable: true, flex: 1, minWidth: 120 };

    const clear = () => {
        setHistory([]);
        gridApiRef.current?.setGridOption("rowData", []);
    };

    // tendencias (flechitas)
    const trend = (cur, prev) => {
        if (cur == null || prev == null) return null;
        if (cur > prev) return "up";
        if (cur < prev) return "down";
        return "same";
    };

    return (
        <div className="container-xxl py-3 sensors-v3">
            {/* Encabezado */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div>
                    <h1 className="page-title mb-0">Control del invernadero</h1>
                    <small className="text-muted">
                        Activa manualmente los actuadores o habilita el modo automático por sensores.
                    </small>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <button className="btn btn-success-subtle d-flex align-items-center gap-2">
                        <i className="fa-solid fa-file-csv"></i> Generar reporte (CSV)
                    </button>
                    <div className="form-check form-switch switch-xl">
                        <input
                            id="autoRef"
                            className="form-check-input"
                            type="checkbox"
                            checked={auto}
                            onChange={(e) => setAuto(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="autoRef">
                            Auto-refrescar
                        </label>
                    </div>
                </div>
            </div>

            {/* ===== Actuadores ===== */}
            <div className="row g-3 mb-3">
                <ControlCard
                    icon="fa-lightbulb"
                    color="#10b981"
                    title="Luces"
                    desc="Iluminación suplementaria para fotoperíodo."
                    on={sLight}
                    onToggle={setLight}
                    statusText={sLight ? "Encendidas" : "Apagadas"}
                />
                <ControlCard
                    icon="fa-faucet-drip"
                    color="#06b6d4"
                    title="Bomba de agua"
                    desc="Riego/recirculación de solución nutritiva."
                    on={sPump}
                    onToggle={setPump}
                    statusText={sPump ? "Activa" : "Inactiva"}
                    actions={[
                        { label: "Pulso 10s", icon: "fa-bolt", onClick: () => alert("Pulso 10s"), variant: "outline" },
                    ]}
                />
                <ControlCard
                    icon="fa-fan"
                    color="#22c55e"
                    title="Ventilador"
                    desc="Intercambio de aire para controlar T/H."
                    on={sFan}
                    onToggle={setFan}
                    statusText={sFan ? "Activo" : "Inactivo"}
                />
                <ControlCard
                    icon="fa-fire"
                    color="#fb923c"
                    title="Calefacción"
                    desc="Soporte térmico en noches frías o descensos bruscos."
                    on={sHeat}
                    onToggle={setHeat}
                    statusText={sHeat ? "Activo" : "Inactivo"}
                />
                <RoofCard
                    state={roof}
                    onOpen={() => setRoof("abierto")}
                    onClose={() => setRoof("cerrado")}
                />
            </div>

            {/* ===== Sensores (lado derecho) + Línea (lado izquierdo) ===== */}
            <div className="row g-3">
                <div className="col-lg-8">
                    <section className="card-soft p-3">
                        <div className="card-head">
                            <div className="card-title">
                                <i className="fa-solid fa-chart-line me-2"></i>
                                Tendencias recientes
                            </div>
                        </div>
                        <div className="chart-box">
                            <Line data={lineData} options={lineOpts} />
                        </div>
                    </section>
                </div>

                <div className="col-lg-4">
                    {/* KPIs sensores actuales */}
                    <section className="card-soft p-3 mb-3">
                        <div className="card-title mb-2">Lecturas actuales</div>

                        <SensorKpi
                            icon="fa-thermometer-half"
                            label="Temperatura"
                            value={last ? `${last.temp} °C` : "—"}
                            trend={trend(last?.temp, prev?.temp)}
                            hint="Rango ideal 20-28 °C"
                        />
                        <SensorKpi
                            icon="fa-droplet"
                            label="Humedad relativa"
                            value={last ? `${last.hum} %` : "—"}
                            trend={trend(last?.hum, prev?.hum)}
                            hint="Objetivo 50-70 %"
                        />
                        <SensorKpi
                            icon="fa-water"
                            label="Humedad del suelo"
                            value={last ? `${last.soil} %` : "—"}
                            trend={trend(last?.soil, prev?.soil)}
                            hint="Ideal 30-55 %"
                        />

                        <div className="small text-muted mt-2">
                            Última actualización:{" "}
                            <span className="fw-semibold">
                                {last ? last.t.toLocaleTimeString() : "—"}
                            </span>
                        </div>
                    </section>

                    <section className="card-soft p-3">
                        <div className="card-title">Distribución por diagnóstico</div>
                        <div className="donut-wrap">
                            <Doughnut
                                data={donutData}
                                options={{
                                    responsive: true,
                                    plugins: { legend: { display: false } },
                                    cutout: "68%",
                                }}
                            />
                        </div>
                        <ul className="legend mt-2">
                            <li>
                                <span className="dot" style={{ background: C.primary }}></span>
                                Plantas sanas
                            </li>
                            <li>
                                <span className="dot" style={{ background: C.yellow }}></span>
                                Mancha angular
                            </li>
                            <li>
                                <span className="dot" style={{ background: "#25c46c" }}></span>
                                Roya
                            </li>
                        </ul>
                    </section>
                </div>
            </div>

            {/* ===== Tabla ===== */}
            <section className="card-soft mt-4">
                <div className="p-3 d-flex align-items-center justify-content-between">
                    <div className="card-title mb-0">Últimas lecturas</div>
                    <button className="btn btn-light border btn-sm" onClick={clear}>
                        <i className="fa-solid fa-broom me-1" /> Limpiar
                    </button>
                </div>
                <div className="px-3 pb-3">
                    <div className="ag-theme-quartz sensors-grid" style={{ height: 420, width: "100%" }}>
                        <AgGridReact
                            rowData={history}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            onGridReady={(p) => (gridApiRef.current = p.api)}
                            pagination
                            paginationPageSize={10}
                            suppressCellFocus
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ========= Subcomponentes UI ========= */

function ControlCard({ icon, color, title, desc, on, onToggle, statusText, actions = [] }) {
    return (
        <div className="col-12 col-md-6">
            <div className="ctrl-card card-soft p-3">
                <div className="d-flex align-items-start justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                        <div className="ctrl-ico" style={{ color }}>
                            <i className={`fa-solid ${icon}`} />
                        </div>
                        <div>
                            <div className="ctrl-title">{title}</div>
                            <div className="ctrl-desc">{desc}</div>
                        </div>
                    </div>

                    <div className="form-check form-switch switch-xl ms-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={on}
                            onChange={(e) => onToggle(e.target.checked)}
                            id={`sw-${title}`}
                        />
                    </div>
                </div>

                <div className="d-flex align-items-center justify-content-between mt-3">
                    <span className={`badge rounded-pill ${on ? "bg-success" : "bg-secondary-subtle text-body"}`}>
                        {statusText}
                    </span>

                    {actions.length > 0 && (
                        <div className="d-flex gap-2">
                            {actions.map((a, i) => (
                                <button
                                    key={i}
                                    className={`btn btn-${a.variant === "outline" ? "outline-" : ""}success btn-pill-sm`}
                                    onClick={a.onClick}
                                >
                                    {a.icon && <i className={`fa-solid ${a.icon} me-1`} />}
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function RoofCard({ state, onOpen, onClose }) {
    const open = state === "abierto";
    return (
        <div className="col-12">
            <div className="ctrl-card card-soft p-3">
                <div className="d-flex align-items-start justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                        <div className="ctrl-ico" style={{ color: "#22c55e" }}>
                            <i className="fa-solid fa-warehouse" />
                        </div>
                        <div>
                            <div className="ctrl-title">Techo</div>
                            <div className="ctrl-desc">Apertura/cierre del techo corredizo.</div>
                        </div>
                    </div>

                    <span className={`badge rounded-pill ${open ? "bg-success" : "bg-secondary-subtle text-body"}`}>
                        Estado: {open ? "Abierto" : "Cerrado"}
                    </span>
                </div>

                <div className="d-flex align-items-center gap-2 mt-3">
                    <button className="btn btn-success btn-pill-sm" onClick={onOpen}>
                        <i className="fa-solid fa-arrow-up-right-from-square me-1" /> Abrir
                    </button>
                    <button className="btn btn-outline-success btn-pill-sm" onClick={onClose}>
                        <i className="fa-solid fa-arrow-down me-1" /> Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

function SensorKpi({ icon, label, value, trend, hint }) {
    return (
        <div className="sensor-kpi">
            <div className="left">
                <div className="ico">
                    <i className={`fa-solid ${icon}`} />
                </div>
                <div>
                    <div className="lbl">{label}</div>
                    <div className="hint">{hint}</div>
                </div>
            </div>
            <div className="right">
                <span className="val">{value}</span>
                {trend && (
                    <span className={`trend ${trend}`}>
                        <i className={`fa-solid fa-arrow-${trend === "up" ? "up" : trend === "down" ? "down" : "right"}`} />
                    </span>
                )}
            </div>
        </div>
    );
}

/* ===== Helpers ===== */
function gradient(ctx, color) {
    const { chart } = ctx;
    const { ctx: g, chartArea } = chart;
    if (!chartArea) return color;
    const grd = g.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    grd.addColorStop(0, hexToRgba(color, 0.25));
    grd.addColorStop(1, hexToRgba(color, 0.06));
    return grd;
}
function hexToRgba(hex, a) {
    const h = hex.replace("#", "");
    const n = parseInt(h, 16);
    const r = (n >> 16) & 255,
        g = (n >> 8) & 255,
        b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
}
