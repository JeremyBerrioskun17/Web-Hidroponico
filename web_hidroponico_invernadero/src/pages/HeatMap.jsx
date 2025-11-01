import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Datos dummy: reemplázalos por tu API
const CASES = [
    { id: 101, fecha: '2025-08-25', region: 'Estelí', productor: 'María López', cultivo: 'Frijol', diagnostico: 'Planta sana', severidad: 'baja', lat: 13.090, lng: -86.360, estado: 'confirmado' },
    { id: 102, fecha: '2025-08-25', region: 'Matagalpa', productor: 'José Pérez', cultivo: 'Frijol', diagnostico: 'Mancha angular', severidad: 'media', lat: 12.860, lng: -85.930, estado: 'confirmado' },
    { id: 103, fecha: '2025-08-24', region: 'León', productor: 'Elena Ruiz', cultivo: 'Frijol', diagnostico: 'Roya', severidad: 'alta', lat: 12.440, lng: -86.880, estado: 'confirmado' },
    { id: 104, fecha: '2025-08-24', region: 'León', productor: 'Carlos Díaz', cultivo: 'Frijol', diagnostico: 'Roya', severidad: 'alta', lat: 12.445, lng: -86.885, estado: 'sospechoso' },
    { id: 105, fecha: '2025-08-23', region: 'Jinotega', productor: 'Ana Gómez', cultivo: 'Frijol', diagnostico: 'Mancha angular', severidad: 'media', lat: 13.090, lng: -85.980, estado: 'confirmado' },
    { id: 106, fecha: '2025-08-23', region: 'Matagalpa', productor: 'Luis Mora', cultivo: 'Frijol', diagnostico: 'Roya', severidad: 'alta', lat: 12.86, lng: -85.95, estado: 'confirmado' },
    { id: 107, fecha: '2025-08-22', region: 'Matagalpa', productor: 'Rosa Vega', cultivo: 'Frijol', diagnostico: 'Roya', severidad: 'alta', lat: 12.855, lng: -85.955, estado: 'confirmado' },
    { id: 108, fecha: '2025-08-22', region: 'Estelí', productor: 'Pedro Téllez', cultivo: 'Frijol', diagnostico: 'Mancha angular', severidad: 'media', lat: 13.095, lng: -86.355, estado: 'confirmado' },
];

// helpers de formato
const sevBadgeClass = (s) =>
    s === "alta" ? "sev-badge sev-alta" : s === "media" ? "sev-badge sev-media" : "sev-badge sev-baja";

export default function MapaDeCalor() {
    // filtros
    const [filters, setFilters] = useState({
        desde: "",
        hasta: "",
        severidad: "",
        region: "",
        q: "",
    });

    const [toggles, setToggles] = useState({
        casos: true,
        focos: true,
        calor: false,
    });

    // Mapa refs
    const mapRef = useRef(null);
    const casosLayerRef = useRef(null);
    const focosLayerRef = useRef(null);
    const heatLayerRef = useRef(null);

    // filtrar
    const filtered = useMemo(() => {
        return CASES.filter((c) => {
            if (filters.desde && c.fecha < filters.desde) return false;
            if (filters.hasta && c.fecha > filters.hasta) return false;
            if (filters.severidad && c.severidad !== filters.severidad) return false;
            if (filters.region && !c.region.toLowerCase().includes(filters.region.toLowerCase())) return false;
            if (filters.q) {
                const text = (c.productor + " " + c.diagnostico + " " + c.cultivo).toLowerCase();
                if (!text.includes(filters.q.toLowerCase())) return false;
            }
            return true;
        });
    }, [filters]);

    // KPIs
    const kpi = useMemo(() => {
        const focos = groupToFocos(filtered);
        return {
            casos: filtered.length,
            focos: focos.length,
            riesgo: filtered.filter((x) => x.severidad === "alta").length,
        };
    }, [filtered]);

    // init mapa
    useEffect(() => {
        // eslint-disable-next-line no-undef
        const L = window.L;
        if (!L) return;

        const NIC_BOUNDS = L.latLngBounds([10.7, -87.9], [15.1, -82.5]);

        const map = L.map("heatmap", {
            zoomControl: true,
            minZoom: 6.4,
            maxZoom: 14,
            maxBounds: NIC_BOUNDS.pad(0.2),
            maxBoundsViscosity: 1.0,
        });
        map.fitBounds(NIC_BOUNDS);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
        }).addTo(map);

        // capas
        const casos = L.layerGroup().addTo(map);
        const focos = L.layerGroup().addTo(map);
        // eslint-disable-next-line no-undef
        const heat = L.heatLayer([], { radius: 25, blur: 15, maxZoom: 14 });

        // guardar refs
        mapRef.current = map;
        casosLayerRef.current = casos;
        focosLayerRef.current = focos;
        heatLayerRef.current = heat;

        // control de capas
        L.control
            .layers(null, { Casos: casos, Focos: focos, "Calor (preview)": heat }, { position: "topright", collapsed: true })
            .addTo(map);

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // re-render capas según datos/toggles
    useEffect(() => {
        if (!mapRef.current) return;
        // eslint-disable-next-line no-undef
        const L = window.L;

        const casos = casosLayerRef.current;
        const focos = focosLayerRef.current;
        const heat = heatLayerRef.current;

        casos.clearLayers();
        focos.clearLayers();
        heat.setLatLngs([]);

        // CASOS
        filtered.forEach((c) => {
            const color = c.severidad === "alta" ? "#dc3545" : c.severidad === "media" ? "#ffc107" : "#198754";
            const marker = L.circleMarker([c.lat, c.lng], {
                radius: 7,
                color,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.25,
            }).bindPopup(`
        <div class="mb-1"><b>#${c.id}</b> — ${c.fecha}</div>
        <div class="small text-muted">${c.region} · ${c.cultivo}</div>
        <div><b>${c.diagnostico}</b> · <span class="${sevBadgeClass(c.severidad)}">${c.severidad}</span></div>
      `);
            casos.addLayer(marker);
        });

        // FOCOS: agregación tosca por grilla 0.1°
        groupToFocos(filtered).forEach(({ lat, lng, count }) => {
            const r = 1500 + count * 800;
            // eslint-disable-next-line no-undef
            L.circle([lat, lng], {
                radius: r,
                color: "#157347",
                weight: 1,
                fillColor: "#198754",
                fillOpacity: 0.18,
            })
                .bindTooltip(`Foco: <b>${count}</b> caso(s)`)
                .addTo(focos);
        });

        // HEAT
        heat.setLatLngs(
            filtered.map((c) => {
                const w = c.severidad === "alta" ? 1.0 : c.severidad === "media" ? 0.6 : 0.3;
                return [c.lat, c.lng, w];
            })
        );

        // toggles → mostrar/ocultar
        const map = mapRef.current;
        if (toggles.casos) map.addLayer(casos);
        else map.removeLayer(casos);

        if (toggles.focos) map.addLayer(focos);
        else map.removeLayer(focos);

        if (toggles.calor) map.addLayer(heat);
        else map.removeLayer(heat);
    }, [filtered, toggles]);

    function groupToFocos(data) {
        const buckets = {};
        data.forEach((c) => {
            const key = Math.round(c.lat * 10) / 10 + "," + Math.round(c.lng * 10) / 10;
            buckets[key] = (buckets[key] || 0) + 1;
        });
        return Object.entries(buckets).map(([k, count]) => {
            const [lat, lng] = k.split(",").map(Number);
            return { lat, lng, count };
        });
    }

    function clearFilters() {
        setFilters({ desde: "", hasta: "", severidad: "", region: "", q: "" });
    }

    function exportCSV() {
        const rows = [
            ["id", "fecha", "region", "productor", "cultivo", "diagnostico", "severidad", "lat", "lng"],
            ...filtered.map((c) => [c.id, c.fecha, c.region, c.productor, c.cultivo, c.diagnostico, c.severidad, c.lat, c.lng]),
        ];
        const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mapa_calor.csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="container-fluid">
            {/* Título + CTA */}
            <div className="d-sm-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center" style={{ gap: ".75rem" }}>
                    <div className="kpi-icon">
                        <i className="fas fa-fire"></i>
                    </div>
                    <div>
                        <h1 className="h3 mb-0 text-slate">Mapa de calor</h1>
                        <small className="text-muted">
                            Concentración de casos y focos por región. Usa los filtros para acotar por fecha y severidad.
                        </small>
                    </div>
                </div>
                <div className="mt-3 mt-sm-0">
                    <Link to="/map" className="btn btn-outline-success">
                        <i className="fas fa-map-marked-alt me-1"></i> Ir a focos y casos
                    </Link>
                </div>
            </div>

            {/* KPIs */}
            <div className="row g-3 mb-3">
                <div className="col-md-4">
                    <div className="card kpi-card border-0 shadow-sm h-100">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <div className="text-uppercase text-success small fw-bold">Casos registrados</div>
                                <div className="h5 mb-0">{kpi.casos}</div>
                            </div>
                            <div className="kpi-icon">
                                <i className="fas fa-bug"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card kpi-card border-0 shadow-sm h-100">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <div className="text-uppercase text-warning small fw-bold">Focos detectados</div>
                                <div className="h5 mb-0">{kpi.focos}</div>
                            </div>
                            <div className="kpi-icon kpi-warning">
                                <i className="fas fa-bullseye"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card kpi-card border-0 shadow-sm h-100">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <div className="text-uppercase text-danger small fw-bold">Riesgo alto</div>
                                <div className="h5 mb-0">{kpi.riesgo}</div>
                            </div>
                            <div className="kpi-icon kpi-danger">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="card shadow-sm border-0 rounded mb-3">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-2">
                            <label className="small text-muted">Desde</label>
                            <div className="input-group">
                                <span className="input-group-text icon-soft">
                                    <i className="fa-regular fa-calendar"></i>
                                </span>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filters.desde}
                                    onChange={(e) => setFilters((s) => ({ ...s, desde: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="col-md-2">
                            <label className="small text-muted">Hasta</label>
                            <div className="input-group">
                                <span className="input-group-text icon-soft">
                                    <i className="fa-regular fa-calendar"></i>
                                </span>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filters.hasta}
                                    onChange={(e) => setFilters((s) => ({ ...s, hasta: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="col-md-2">
                            <label className="small text-muted">Severidad</label>
                            <select
                                className="form-select"
                                value={filters.severidad}
                                onChange={(e) => setFilters((s) => ({ ...s, severidad: e.target.value }))}
                            >
                                <option value="">Todas</option>
                                <option value="alta">Alta</option>
                                <option value="media">Media</option>
                                <option value="baja">Baja</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="small text-muted">Región</label>
                            <div className="input-group">
                                <span className="input-group-text icon-soft">
                                    <i className="fa-solid fa-location-dot"></i>
                                </span>
                                <input
                                    className="form-control"
                                    placeholder="Ej. Matagalpa"
                                    value={filters.region}
                                    onChange={(e) => setFilters((s) => ({ ...s, region: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <label className="small text-muted">Buscar</label>
                            <div className="input-group">
                                <span className="input-group-text icon-soft">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                </span>
                                <input
                                    className="form-control"
                                    placeholder="Productor, diagnóstico…"
                                    value={filters.q}
                                    onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="row mt-3 align-items-center">
                        <div className="col-md-6 d-flex flex-wrap gap-3">
                            <div className="form-check">
                                <input
                                    id="tCasos"
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={toggles.casos}
                                    onChange={(e) => setToggles((t) => ({ ...t, casos: e.target.checked }))}
                                />
                                <label className="form-check-label" htmlFor="tCasos">
                                    Mostrar casos
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    id="tFocos"
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={toggles.focos}
                                    onChange={(e) => setToggles((t) => ({ ...t, focos: e.target.checked }))}
                                />
                                <label className="form-check-label" htmlFor="tFocos">
                                    Mostrar focos
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    id="tCalor"
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={toggles.calor}
                                    onChange={(e) => setToggles((t) => ({ ...t, calor: e.target.checked }))}
                                />
                                <label className="form-check-label" htmlFor="tCalor">
                                    Vista previa de calor
                                </label>
                            </div>
                        </div>
                        <div className="col-md-6 text-md-end mt-2 mt-md-0">
                            <button className="btn btn-light border me-2" onClick={clearFilters}>
                                Limpiar
                            </button>
                            <button className="btn btn-success" onClick={exportCSV}>
                                <i className="fas fa-file-export me-1"></i> Exportar CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mapa */}
            <div className="card shadow-sm border-0 rounded mb-3">
                <div className="card-body p-2">
                    <div id="heatmap" style={{ height: 520, borderRadius: 12 }} />
                </div>
            </div>

            {/* Tabla */}
            <div className="card shadow-sm border-0 rounded">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Fecha</th>
                                    <th>Región</th>
                                    <th>Productor</th>
                                    <th>Diagnóstico</th>
                                    <th>Severidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => (
                                    <tr key={c.id}>
                                        <td>{c.id}</td>
                                        <td>{c.fecha}</td>
                                        <td>{c.region}</td>
                                        <td>{c.productor}</td>
                                        <td>{c.diagnostico}</td>
                                        <td>
                                            <span className={sevBadgeClass(c.severidad)}>{c.severidad}</span>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center text-muted py-4">
                                            Sin resultados para los filtros aplicados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* estilos locales mínimos */}
            <style>{`
        .kpi-icon{
          width:36px;height:36px;border-radius:10px;display:grid;place-items:center;
          color:#fff;background: linear-gradient(135deg,#198754,#157347);
        }
        .kpi-icon.kpi-warning{ background: linear-gradient(135deg,#ffc107,#b07e00); }
        .kpi-icon.kpi-danger{ background: linear-gradient(135deg,#dc3545,#b02a37); }
        .sev-badge{ font-weight:600; text-transform:capitalize; padding:.25rem .5rem; border-radius:.5rem; }
        .sev-alta{ background:#fde2e4; color:#b02a37; }
        .sev-media{ background:#fff6db; color:#b07e00; }
        .sev-baja{ background:#e7f5ee; color:#157347; }
        .icon-soft{ background:#f1f5f9; color:#475569; }
      `}</style>
        </div>
    );
}
