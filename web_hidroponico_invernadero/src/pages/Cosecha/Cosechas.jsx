// src/pages/Cosechas.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listCosechas } from "../../services/cosechas";
import ModalNuevoCosecha from "../../components/ModalNuevoCosecha";

const PAGE_SIZE = 8;

export default function Cosechas() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    desde: "",
    hasta: "",
    estado: "",
    hidroponicoId: "",
    texto: "",
  });

  const [applied, setApplied] = useState(filters);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          pageSize: PAGE_SIZE,
          ...(applied.hidroponicoId ? { hidroponicoId: applied.hidroponicoId } : {}),
          ...(applied.estado ? { estado: applied.estado } : {}),
          ...(applied.desde ? { desde: startOfDayUtc(applied.desde) } : {}),
          ...(applied.hasta ? { hasta: addOneDayUtc(applied.hasta) } : {}),
        };

        const data = await listCosechas(params);
        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err.message || "Error cargando cosechas.");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, applied]);

  function applyFilters() {
    setApplied(filters);
    setPage(1);
  }
  function clearFilters() {
    const clean = { desde: "", hasta: "", estado: "", hidroponicoId: "", texto: "" };
    setFilters(clean);
    setApplied(clean);
    setPage(1);
  }

  const chips = useMemo(() => ([
    applied.desde && { k: "desde", label: `Desde ${fmtFecha(applied.desde)}` },
    applied.hasta && { k: "hasta", label: `Hasta ${fmtFecha(applied.hasta)}` },
    applied.estado && { k: "estado", label: `Estado: ${applied.estado}` },
    applied.hidroponicoId && { k: "hidroponicoId", label: `Hidro #${applied.hidroponicoId}` },
    applied.texto && { k: "texto", label: `“${applied.texto}”` },
  ].filter(Boolean)), [applied]);

  function removeChip(k) {
    const next = { ...applied, [k]: "" };
    setApplied(next);
    setFilters(next);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function _handleCreated() {
    setPage(1);
    setApplied((s) => ({ ...s }));
  }

  return (
    <div className="container-fluid" id="pageCosechas">
      <div className="d-sm-flex align-items-center justify-content-between mb-3">
        <h1 className="h3 mb-0 text-success">
          <i className="fas fa-seedling me-2"></i> Cosechas
        </h1>

        <div className="page-actions d-flex gap-2">
          {/* Trigger del modal (componente incluye su propio botón) */}
          <ModalNuevoCosecha onCreated={_handleCreated} />

          <button className="btn btn-outline-success btn-lg-sm" onClick={() => exportCsv(items)}>
            <i className="fas fa-file-export me-2"></i> Exportar
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-lg mb-2">
        <div className="card-body py-3">
          <form className="row g-3" onSubmit={(e) => e.preventDefault()}>
            <div className="col-md-3">
              <label className="small text-muted">Desde</label>
              <div className="input-group">
                <span className="input-group-text icon-soft"><i className="fa-regular fa-calendar" /></span>
                <input type="date" className="form-control" value={filters.desde}
                  onChange={(e) => setFilters((s) => ({ ...s, desde: e.target.value }))} />
              </div>
            </div>

            <div className="col-md-3">
              <label className="small text-muted">Hasta</label>
              <div className="input-group">
                <span className="input-group-text icon-soft"><i className="fa-regular fa-calendar" /></span>
                <input type="date" className="form-control" value={filters.hasta}
                  onChange={(e) => setFilters((s) => ({ ...s, hasta: e.target.value }))} />
              </div>
            </div>

            <div className="col-md-3">
              <label className="small text-muted">Estado</label>
              <select className="form-select" value={filters.estado} onChange={(e) => setFilters((s) => ({ ...s, estado: e.target.value }))}>
                <option value="">Todos</option>
                <option value="ACTIVA">ACTIVA</option>
                <option value="PAUSADA">PAUSADA</option>
                <option value="FINALIZADA">FINALIZADA</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="small text-muted">HidroponicoId</label>
              <input type="number" className="form-control" value={filters.hidroponicoId}
                onChange={(e) => setFilters((s) => ({ ...s, hidroponicoId: e.target.value }))} placeholder="Opcional" />
            </div>

            <div className="col-12">
              <label className="small text-muted">Buscar (solo UI)</label>
              <div className="input-group">
                <span className="input-group-text icon-soft"><i className="fa-solid fa-magnifying-glass" /></span>
                <input type="text" className="form-control" placeholder="Buscar en observaciones…"
                  value={filters.texto} onChange={(e) => setFilters((s) => ({ ...s, texto: e.target.value }))} />
              </div>
            </div>

            <div className="col-12 d-flex align-items-center">
              <button type="button" className="btn btn-success me-2" onClick={applyFilters}><i className="fas fa-filter me-1"></i> Aplicar</button>
              <button type="button" className="btn btn-outline-success" onClick={clearFilters}>Limpiar</button>
              <span className="ms-3 small text-muted">Mostrando <strong>{total}</strong> resultados</span>
            </div>
          </form>
        </div>
      </div>

      <div className="mb-3 d-flex flex-wrap gap-2" aria-live="polite">
        {chips.map(c => (
          <span key={c.k} className="chip-filter">
            <i className="fa-solid fa-filter me-1" />{c.label}
            <button className="btn-close ms-2" onClick={() => removeChip(c.k)} aria-label="Quitar filtro"></button>
          </span>
        ))}
      </div>

      {loading ? (
        <div className="text-muted">Cargando cosechas…</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : items.length > 0 ? (
        <div className="row">
          {items.filter(it => !applied.texto || (it.observaciones || "").toLowerCase().includes(applied.texto.toLowerCase()))
            .map(c => (
              <div key={c.id} className="col-xl-4 col-lg-6 mb-4">
                <div className="card border-0 h-100 overflow-hidden">
                  <div className="card-body">
                    <div className="d-flex align-items-start mb-2">
                      <div>
                        <h5 className="mb-1">{c.nombreZafra || `Zafra #${c.id}`}</h5>
                        <div className="small text-muted">Hidroponico #{c.hidroponicoId}</div>
                      </div>
                      <span className={`badge ms-auto ${badgeByEstado(c.estado)}`}>{c.estado}</span>
                    </div>

                    <p className="card-text mb-2 line-clamp-3">{c.observaciones || "—"}</p>

                    <div className="d-flex align-items-center justify-content-between">
                      <small className="text-muted"><i className="far fa-clock me-1" /> {fmtFechaLabel(c.fechaInicio)}</small>
                      <small className="text-muted">Fin: {fmtFecha(c.fechaFin)}</small>
                    </div>
                  </div>

                  <div className="card-footer bg-white border-0 d-flex">
                    <Link to={`/cosechas/${c.id}`} className="btn btn-sm btn-outline-success rounded-pill me-2" title="Ver detalle">
                      <i className="fas fa-eye" />
                    </Link>
                    <Link to={`/cosechas/${c.id}/etapas`} className="btn btn-sm btn-outline-success rounded-pill me-2" title="Etapas">
                      <i className="fas fa-list" />
                    </Link>
                    <button className="btn btn-sm btn-outline-danger rounded-pill" title="Eliminar">
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      ) : (
        <div id="estadoVacio" className="text-center py-5">
          <img src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=600&auto=format&fit=crop" alt="" style={{ maxWidth: 220 }} className="mb-3 rounded" />
          <h6 className="text-success">No hay cosechas</h6>
          <p className="text-muted">Crea una nueva cosecha o modifica los filtros.</p>
          <button className="btn btn-outline-success btn-sm" onClick={clearFilters}><i className="fas fa-broom me-1" /> Limpiar filtros</button>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Page navigation" className="mt-3">
          <ul className="pagination pagination-sm justify-content-center">
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}><button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>&laquo;</button></li>
            {Array.from({ length: totalPages }).map((_, i) => (
              <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}><button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button></li>
            ))}
            <li className={`page-item ${page === totalPages ? "disabled" : ""}`}><button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>&raquo;</button></li>
          </ul>
        </nav>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */
function fmtFechaLabel(iso) {
  if (!iso) return "N/D";
  const d = new Date(iso);
  return d.toLocaleDateString("es-NI", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtFecha(isoYmd) {
  if (!isoYmd) return "";
  try {
    const d = new Date(isoYmd);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch { return isoYmd; }
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
    ["Id", "HidroponicoId", "NombreZafra", "FechaInicio", "FechaFin", "Estado", "Observaciones"].join(","),
    ...items.map(c =>
      [c.id, c.hidroponicoId, quoteCsv(c.nombreZafra ?? ""), c.fechaInicio ?? "", c.fechaFin ?? "", c.estado ?? "", quoteCsv(c.observaciones ?? "")]
        .join(",")
    )
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cosechas.csv";
  a.click();
  URL.revokeObjectURL(url);
}
function quoteCsv(s) {
  const needs = /[",\n]/.test(s);
  return needs ? `"${s.replace(/"/g, '""')}"` : s;
}
function badgeByEstado(estado) {
  const s = (estado || "").toUpperCase();
  if (s === "ACTIVA") return "badge-success";
  if (s === "PAUSADA") return "badge-warning";
  if (s === "FINALIZADA") return "badge-secondary";
  return "badge-secondary";
}
