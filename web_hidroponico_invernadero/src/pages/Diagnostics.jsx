import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ModalNuevoDiag from "../components/ModalNuevoDiag";
import { listDiagnosticos } from "../services/diagnosticos";

const PAGE_SIZE = 6;

export default function Diagnosticos() {
    // lista/paginación
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // estado de red
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // filtros UI
    const [filters, setFilters] = useState({
        desde: "",        // YYYY-MM-DD (local)
        hasta: "",        // YYYY-MM-DD (local)
        tipo: "",         // "" | "plaga" | "enfermedad"
        inspectorId: "",  // opcional
        texto: "",        // filtro client-side sobre 'notas'
    });

    // filtros aplicados
    const [applied, setApplied] = useState(filters);

    // Cargar datos cuando cambian page/applied
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setError(null);

                const params = {
                    page,
                    pageSize: PAGE_SIZE,
                    tipo: applied.tipo || undefined,
                    inspectorId: applied.inspectorId || undefined,
                    ...(applied.desde ? { desdeUtc: startOfDayUtc(applied.desde) } : {}),
                    ...(applied.hasta ? { hastaUtc: addOneDayUtc(applied.hasta) } : {}),
                };

                const data = await listDiagnosticos(params);
                setItems(data.items || []);
                setTotal(data.total || 0);
            } catch (err) {
                setError(err.message || "Error cargando diagnósticos.");
            } finally {
                setLoading(false);
            }
        })();
    }, [page, applied]);

    // aplicar/limpiar filtros
    function applyFilters() {
        setApplied(filters);
        setPage(1);
    }
    function clearFilters() {
        const clean = { desde: "", hasta: "", tipo: "", inspectorId: "", texto: "" };
        setFilters(clean);
        setApplied(clean);
        setPage(1);
    }

    // chips de filtros
    const chips = useMemo(() => ([
        applied.desde && { k: "desde", label: `Desde ${fmtFecha(applied.desde)}` },
        applied.hasta && { k: "hasta", label: `Hasta ${fmtFecha(applied.hasta)}` },
        applied.tipo && { k: "tipo", label: applied.tipo === "plaga" ? "Plaga" : "Enfermedad" },
        applied.inspectorId && { k: "inspectorId", label: `Inspector ${applied.inspectorId}` },
        applied.texto && { k: "texto", label: `“${applied.texto}”` },
    ].filter(Boolean)), [applied]);

    function removeChip(k) {
        const next = { ...applied, [k]: "" };
        setApplied(next);
        setFilters(next);
        setPage(1);
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // refrescar tras crear en modal
    function handleCreated() {
        setPage(1);
        setApplied((s) => ({ ...s })); // dispara el useEffect
    }

    return (
        <div className="container-fluid" id="pageDiagnosticos">
            {/* Título + Acciones */}
            <div className="d-sm-flex align-items-center justify-content-between mb-3">
                <h1 className="h3 mb-0 text-success">
                    <i className="fas fa-seedling me-2"></i> Mis diagnósticos
                </h1>

                <div className="page-actions d-flex gap-2">
                    <button
                        type="button"
                        className="btn btn-success btn-lg-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#modalNuevoDiag"
                    >
                        <i className="fas fa-plus me-2"></i> Nuevo
                    </button>

                    <button className="btn btn-outline-success btn-lg-sm" onClick={() => exportCsv(items)}>
                        <i className="fas fa-file-export me-2"></i> Exportar
                    </button>

                    <Link className="btn btn-outline-success btn-lg-sm" to="/map">
                        <i className="fas fa-map-marked-alt me-2"></i> Ver mapa
                    </Link>
                </div>
            </div>

            {/* Filtros */}
            <div className="card shadow-sm border-0 rounded-lg mb-2">
                <div className="card-body py-3">
                    <form className="row g-3" onSubmit={(e) => e.preventDefault()}>
                        <div className="col-md-3">
                            <label className="small text-muted" htmlFor="fDesde">Desde</label>
                            <div className="input-group">
                                <span className="input-group-text icon-soft"><i className="fa-regular fa-calendar" /></span>
                                <input
                                    id="fDesde"
                                    type="date"
                                    className="form-control"
                                    value={filters.desde}
                                    onChange={(e) => setFilters((s) => ({ ...s, desde: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="col-md-3">
                            <label className="small text-muted" htmlFor="fHasta">Hasta</label>
                            <div className="input-group">
                                <span className="input-group-text icon-soft"><i className="fa-regular fa-calendar" /></span>
                                <input
                                    id="fHasta"
                                    type="date"
                                    className="form-control"
                                    value={filters.hasta}
                                    onChange={(e) => setFilters((s) => ({ ...s, hasta: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="col-md-3">
                            <label className="small text-muted" htmlFor="fTipo">Tipo</label>
                            <select
                                id="fTipo"
                                className="form-select"
                                value={filters.tipo}
                                onChange={(e) => setFilters((s) => ({ ...s, tipo: e.target.value }))}
                            >
                                <option value="">Todos</option>
                                <option value="plaga">Plaga</option>
                                <option value="enfermedad">Enfermedad</option>
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="small text-muted" htmlFor="fInsp">InspectorId</label>
                            <input
                                id="fInsp"
                                type="number"
                                className="form-control"
                                value={filters.inspectorId}
                                onChange={(e) => setFilters((s) => ({ ...s, inspectorId: e.target.value }))}
                                placeholder="Opcional"
                            />
                        </div>

                        <div className="col-12">
                            <label className="small text-muted" htmlFor="fTexto">Buscar (solo UI)</label>
                            <div className="input-group">
                                <span className="input-group-text icon-soft"><i className="fa-solid fa-magnifying-glass" /></span>
                                <input
                                    id="fTexto"
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar en Notas…"
                                    value={filters.texto}
                                    onChange={(e) => setFilters((s) => ({ ...s, texto: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="col-12 d-flex align-items-center">
                            <button type="button" className="btn btn-success me-2" onClick={applyFilters}>
                                <i className="fas fa-filter me-1"></i> Aplicar
                            </button>
                            <button type="button" className="btn btn-outline-success" onClick={clearFilters}>
                                Limpiar
                            </button>
                            <span className="ms-3 small text-muted">
                                Mostrando <strong>{total}</strong> {total === 1 ? "resultado" : "resultados"}
                            </span>
                        </div>
                    </form>
                </div>
            </div>

            {/* Chips */}
            <div className="mb-3 d-flex flex-wrap gap-2" aria-live="polite">
                {chips.map((c) => (
                    <span key={c.k} className="chip-filter">
                        <i className="fa-solid fa-filter me-1" />{c.label}
                        <button className="btn-close ms-2" onClick={() => removeChip(c.k)} aria-label="Quitar filtro"></button>
                    </span>
                ))}
            </div>

            {/* Grid / Estado */}
            {loading ? (
                <div className="text-muted">Cargando diagnósticos…</div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : items.length > 0 ? (
                <div className="row">
                    {items
                        .filter(d => !applied.texto || (d.notas || "").toLowerCase().includes(applied.texto.toLowerCase()))
                        .map((d) => (
                            <div key={d.id} className="col-xl-4 col-lg-6 mb-4">
                                <div className="card card-diag border-0 h-100 overflow-hidden">
                                    <div className="ratio-box">
                                        <img
                                            src={d.fotoDiagnostico || "https://via.placeholder.com/800x500?text=Diagn%C3%B3stico"}
                                            className="card-img-top"
                                            alt={`Diagnóstico ${d.id}`}
                                            loading="lazy"
                                        />
                                    </div>

                                    <div className="card-body">
                                        <div className="d-flex align-items-center mb-2 flex-wrap gap-2">
                                            <span className={`badge ${badgeByTipo(d.tipo)} me-2`}>{labelByTipo(d.tipo)}</span>
                                            {d.severidad !== null && d.severidad !== undefined && (
                                                <span className="badge badge-cultivo">Severidad {d.severidad}</span>
                                            )}
                                            <span className="ms-auto meta small text-muted">
                                                <i className="far fa-clock me-1" /> {fmtFechaLabel(d.fechaMuestreo)}
                                            </span>
                                        </div>

                                        <p className="card-text mb-2 desc line-clamp-2">{d.notas || "—"}</p>

                                        <div className="d-flex align-items-center">
                                            <span className="small text-muted">
                                                Inspector: {d.inspectorId ? `#${d.inspectorId}` : "N/D"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="card-footer bg-white border-0 d-flex">
                                        <Link to={`/diagnosticos/${d.id}`} className="btn btn-sm btn-outline-success rounded-pill me-2" title="Ver detalle">
                                            <i className="fas fa-eye" />
                                        </Link>
                                        <Link to={`/map?focus=${d.id}`} className="btn btn-sm btn-outline-success rounded-pill me-2" title="Ver en mapa">
                                            <i className="fas fa-map-pin" />
                                        </Link>
                                        <button className="btn btn-sm btn-outline-success rounded-pill" title="Descargar">
                                            <i className="fas fa-download" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            ) : (
                <div id="estadoVacio" className="text-center py-5">
                    <img
                        src="https://images.unsplash.com/photo-1492496913980-501348b61469?q=80&w=600&auto=format&fit=crop"
                        alt=""
                        style={{ maxWidth: 220 }}
                        className="mb-3 rounded"
                    />
                    <h6 className="text-success">No hay diagnósticos</h6>
                    <p className="text-muted">Prueba cambiando los filtros o crea un nuevo diagnóstico.</p>
                    <button className="btn btn-outline-success btn-sm" onClick={clearFilters}>
                        <i className="fas fa-broom me-1" /> Limpiar filtros
                    </button>
                </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
                <nav aria-label="Page navigation" className="mt-3">
                    <ul className="pagination pagination-sm justify-content-center">
                        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>&laquo;</button>
                        </li>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}>
                                <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                            </li>
                        ))}
                        <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>&raquo;</button>
                        </li>
                    </ul>
                </nav>
            )}

            <ModalNuevoDiag onCreated={handleCreated} />
        </div>
    );
}

/* ---------- helpers ---------- */
function labelByTipo(tipo) {
    const t = (tipo || "").toString().toLowerCase();
    if (t === "plaga") return "Plaga";
    if (t === "enfermedad") return "Enfermedad";
    return "Desconocido";
}
function badgeByTipo(tipo) {
    const t = (tipo || "").toString().toLowerCase();
    if (t === "plaga") return "badge-rust";
    if (t === "enfermedad") return "badge-angular";
    return "badge-secondary";
}
function fmtFechaLabel(iso) {
    if (!iso) return "N/D";
    const d = new Date(iso);
    return d.toLocaleDateString("es-NI", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtFecha(isoYmd) {
    if (!isoYmd) return "";
    const [y, m, d] = isoYmd.split("-");
    return `${d}/${m}/${y}`;
}
function startOfDayUtc(ymd) {
    return `${ymd}T00:00:00Z`;
}
function addOneDayUtc(ymd) {
    const d = new Date(`${ymd}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 19) + "Z";
}
function exportCsv(items) {
    const rows = [
        ["Id", "Tipo", "InspectorId", "FechaMuestreo", "Severidad", "Notas"].join(","),
        ...items.map(d =>
            [d.id, d.tipo, d.inspectorId ?? "", d.fechaMuestreo ?? "", d.severidad ?? "", quoteCsv(d.notas ?? "")]
                .join(",")
        )
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagnosticos.csv";
    a.click();
    URL.revokeObjectURL(url);
}
function quoteCsv(s) {
    const needs = /[",\n]/.test(s);
    return needs ? `"${s.replace(/"/g, '""')}"` : s;
}
