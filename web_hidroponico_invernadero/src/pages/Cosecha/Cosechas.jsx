// src/pages/Cosechas.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listCosechas } from "../../services/cosechas";
import ModalNuevoCosecha from "../../components/ModalNuevoCosecha";

const PAGE_SIZE = 8;
const ACCENT = "#10b981"; // verde corporativo

export default function Cosechas() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [localFilters, setLocalFilters] = useState({
    q: "",
    desde: "",
    hasta: "",
    estado: "",
    hidroponicoId: "",
    texto: "",
  });
  const [applied, setApplied] = useState(localFilters);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [localFilters.q]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const params = {
          page,
          pageSize: PAGE_SIZE,
          ...(applied.q ? { q: applied.q } : {}),
          ...(applied.hidroponicoId ? { hidroponicoId: applied.hidroponicoId } : {}),
          ...(applied.estado ? { estado: applied.estado } : {}),
          ...(applied.desde ? { desde: startOfDayUtc(applied.desde) } : {}),
          ...(applied.hasta ? { hasta: addOneDayUtc(applied.hasta) } : {}),
        };
        const data = await listCosechas(params);
        setItems(data.items || data || []);
        setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
      } catch (err) {
        setError(err?.message || "Error cargando cosechas.");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, applied]);

  function applyFilters() {
    setApplied(localFilters);
    setPage(1);
  }
  function clearFilters() {
    const clean = { q: "", desde: "", hasta: "", estado: "", hidroponicoId: "", texto: "" };
    setLocalFilters(clean);
    setApplied(clean);
    setPage(1);
  }

  function _handleCreated() {
    setPage(1);
    setApplied((s) => ({ ...s }));
  }

  const stats = useMemo(() => {
    const cnt = items.length;
    const byState = { ACTIVA: 0, PAUSADA: 0, FINALIZADA: 0, OTROS: 0 };
    items.forEach(i => {
      const s = (i.estado || "").toUpperCase();
      if (s === "ACTIVA") byState.ACTIVA++;
      else if (s === "PAUSADA") byState.PAUSADA++;
      else if (s === "FINALIZADA") byState.FINALIZADA++;
      else byState.OTROS++;
    });
    const totalCount = Math.max(total || cnt, 1);
    return {
      count: cnt,
      totalCount,
      byState,
      pct: {
        activa: Math.round((byState.ACTIVA / totalCount) * 100),
        pausada: Math.round((byState.PAUSADA / totalCount) * 100),
        finalizada: Math.round((byState.FINALIZADA / totalCount) * 100),
      }
    };
  }, [items, total]);

  const visibleItems = useMemo(() => {
    if (!localFilters.texto) return items;
    const q = localFilters.texto.toLowerCase();
    return items.filter(it =>
      (it.observaciones || "").toLowerCase().includes(q) ||
      (it.nombreZafra || "").toLowerCase().includes(q)
    );
  }, [items, localFilters.texto]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));

  function quoteCsv(s) {
    const needs = /[",\n]/.test(s);
    return needs ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function exportCsv(itemsToExport) {
    const rows = [
      ["Id", "HidroponicoId", "NombreZafra", "FechaInicio", "FechaFin", "Estado", "Observaciones"].join(","),
      ...itemsToExport.map(c =>
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

  return (
    <div className="container-fluid py-3" id="pageCosechas">
      <style>{`
        :root { --accent: ${ACCENT}; --muted:#6b7280; --card-border: rgba(15,23,42,0.04); --bg:#f8fafc; }

        /* Header */
        .header-row { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-bottom:18px; }
        .page-title { display:flex; align-items:center; gap:12px; }
        .page-title h1 { margin:0; font-size:28px; font-weight:800; color:#0f172a; }
        .page-desc { font-size:14px; color: #475569; margin-top:6px; }

        /* Top stats row - full width with icons */
        .stats-row { display:flex; gap:16px; margin-bottom:18px; }
        .stat-card { flex:1; background:white; border:1px solid var(--card-border); border-radius:10px; padding:12px; box-shadow:0 6px 12px rgba(15,23,42,0.02); display:flex; gap:12px; align-items:center; }
        .stat-icon { width:48px; height:48px; border-radius:8px; display:grid; place-items:center; background:rgba(16,185,129,0.08); color:var(--accent); font-size:18px; }
        .stat-content { flex:1; }
        .stat-label { color:var(--muted); font-size:0.85rem; margin-bottom:6px; }
        .stat-value { font-weight:700; font-size:18px; color:#0f172a; }
        .stat-sub { font-size:0.85rem; color:var(--muted); margin-top:8px; }
        .progress-thin { height:8px; border-radius:6px; background:#eef2f7; margin-top:8px; overflow:hidden; }

        /* Filters row - full width */
        .filters-row { background: transparent; margin-bottom:18px; }
        .filters-card { background:white; border:1px solid var(--card-border); border-radius:10px; padding:14px; box-shadow:0 6px 16px rgba(15,23,42,0.02); }

        /* Main content: grid of small cards */
        .content-row { display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap; }
        .list-col { flex:1 1 70%; min-width:420px; }
        .action-col { width:240px; flex: 0 0 240px; }

        /* GRID for cosecha cards - small cards that wrap */
        .cards-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:12px; align-items:start; }
        .cosecha-card { background:white; border:1px solid var(--card-border); border-radius:8px; overflow:hidden; box-shadow: 0 6px 12px rgba(15,23,42,0.02); display:flex; flex-direction:column; height: 200px; width: 400px}
        .cosecha-body { padding:10px; display:flex; gap:8px; align-items:flex-start; flex:1; }
        .cosecha-left { flex:1; min-width:0; }
        .cosecha-title { font-weight:700; margin-bottom:4px; font-size:18px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cosecha-meta { color:var(--muted); font-size:0.82rem; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cosecha-text { color:#374151; font-size:0.85rem; margin-bottom:6px; display:block; height:42px; overflow:hidden; text-overflow:ellipsis; }
        .cosecha-footer { padding:8px 10px; border-top:1px solid var(--card-border); display:flex; gap:6px; background:#fff; justify-content:space-between; align-items:center; }

        .badge-accent { background:var(--accent); color:white; padding:.25rem .5rem; border-radius:999px; font-weight:800; font-size:.75rem; }

        .actions-sticky { display:flex; flex-direction:column; gap:12px; position:sticky; top:96px; }

        /* responsive */
        @media(max-width:1000px) {
          .stats-row { flex-direction:column; }
          .content-row { flex-direction:column; }
          .action-col { width:100%; order:2; }
          .list-col { order:1; }
          .cards-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
          .cosecha-card { height: 150px; }
        }
      `}</style>

      {/* Header */}
      <div className="header-row">
        <div>
          <div className="page-title">
            <div style={{ width:44, height:44, borderRadius:10, background:"rgba(16,185,129,0.08)", display:"grid", placeItems:"center" }}>
              <i className="fas fa-seedling" style={{ color:ACCENT, fontSize:18 }} />
            </div>
            <div>
              <h1>Cosechas</h1>
              <div className="page-desc">Administra zafras — controla etapas, riegos y monitoreo.</div>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <ModalNuevoCosecha onCreated={_handleCreated} />
          <button className="btn btn-outline-secondary" onClick={() => exportCsv(visibleItems)}><i className="fas fa-file-export me-1" /> Exportar</button>
        </div>
      </div>

      {/* STATS (full width) with icons */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-layer-group"></i></div>
          <div className="stat-content">
            <div className="stat-label">Total resultados</div>
            <div className="stat-value">{stats.totalCount}</div>
            <div className="stat-sub">Mostrados: {stats.count}</div>
            <div className="progress-thin"><div style={{ width: `${Math.round((stats.count / Math.max(stats.totalCount,1)) * 100)}%`, background: ACCENT, height:"100%" }} /></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background:"rgba(16,185,129,0.08)" }}><i className="fas fa-seedling"></i></div>
          <div className="stat-content">
            <div className="stat-label">Activas</div>
            <div className="stat-value">{stats.byState.ACTIVA}</div>
            <div className="stat-sub">{stats.pct.activa}% del total</div>
            <div className="progress-thin"><div style={{ width: `${stats.pct.activa}%`, background: ACCENT, height:"100%" }} /></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background:"rgba(245,158,11,0.08)", color:"#f59e0b" }}><i className="fas fa-pause-circle"></i></div>
          <div className="stat-content">
            <div className="stat-label">Pausadas</div>
            <div className="stat-value">{stats.byState.PAUSADA}</div>
            <div className="stat-sub">{stats.pct.pausada}% del total</div>
            <div className="progress-thin"><div style={{ width: `${stats.pct.pausada}%`, background: "#f59e0b", height:"100%" }} /></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background:"rgba(107,114,128,0.06)", color:"#6b7280" }}><i className="fas fa-flag-checkered"></i></div>
          <div className="stat-content">
            <div className="stat-label">Finalizadas</div>
            <div className="stat-value">{stats.byState.FINALIZADA}</div>
            <div className="stat-sub">{stats.pct.finalizada}% del total</div>
            <div className="progress-thin"><div style={{ width: `${stats.pct.finalizada}%`, background: "#6b7280", height:"100%" }} /></div>
          </div>
        </div>
      </div>

      {/* FILTERS (full width) */}
      <div className="filters-row">
        <div className="filters-card">
          <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }}>
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label className="small text-muted">Desde</label>
                <input type="date" className="form-control" value={localFilters.desde || ""} onChange={(e) => setLocalFilters(s => ({ ...s, desde: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <label className="small text-muted">Hasta</label>
                <input type="date" className="form-control" value={localFilters.hasta || ""} onChange={(e) => setLocalFilters(s => ({ ...s, hasta: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <label className="small text-muted">Estado</label>
                <select className="form-select" value={localFilters.estado} onChange={(e) => setLocalFilters(s => ({ ...s, estado: e.target.value }))}>
                  <option value="">Todos</option>
                  <option value="ACTIVA">ACTIVA</option>
                  <option value="PAUSADA">PAUSADA</option>
                  <option value="FINALIZADA">FINALIZADA</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="small text-muted">HidroponicoId</label>
                <input type="number" className="form-control" placeholder="Opcional" value={localFilters.hidroponicoId || ""} onChange={(e) => setLocalFilters(s => ({ ...s, hidroponicoId: e.target.value }))} />
              </div>

              <div className="col-12 mt-2">
                <label className="small text-muted">Buscar (like) — servidor</label>
                <div className="input-group">
                  <input className="form-control" placeholder="p.ej. 'lote A' o '2025-10'" value={localFilters.q} onChange={(e) => setLocalFilters(s => ({ ...s, q: e.target.value }))} />
                  <button type="button" className="btn" style={{ background: ACCENT, color:"#fff", minWidth:110 }} onClick={applyFilters}><i className="fas fa-filter me-1" /> Aplicar</button>
                </div>
              </div>

              <div className="col-12 mt-2">
                <label className="small text-muted">Buscar local (observaciones / nombreZafra)</label>
                <input className="form-control" placeholder="Filtro local (solo UI)" value={localFilters.texto} onChange={(e) => setLocalFilters(s => ({ ...s, texto: e.target.value }))} />
              </div>

              <div className="col-12 d-flex justify-content-end mt-3">
                <button type="button" className="btn btn-outline-secondary me-2" onClick={clearFilters}><i className="fas fa-eraser me-1" /> Limpiar</button>
                <button type="button" className="btn" style={{ background: ACCENT, color:"#fff" }} onClick={applyFilters}><i className="fas fa-check me-1" /> Aplicar filtros</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Main content: grid of small cards + actions */}
      <div className="content-row">
        <div className="list-col">
          {loading ? (
            <div className="cards-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="cosecha-card">
                  <div className="cosecha-body" style={{ background:"#f8fafc", height: "100%" }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : visibleItems.length > 0 ? (
            <div className="cards-grid">
              {visibleItems.map(c => (
                <div key={c.id} className="cosecha-card">
                  <div className="cosecha-body">
                    <div className="cosecha-left">
                      <div className="cosecha-title" title={c.nombreZafra}>{c.nombreZafra || `Zafra #${c.id}`}</div>
                      <div className="cosecha-meta"><i className="fas fa-warehouse me-1"></i> Hidro #{c.hidroponicoId}</div>
                      <div className="cosecha-text">{c.observaciones || "—"}</div>
                      <div className="small text-muted">{fmtFechaLabel(c.fechaInicio)} · Fin: {fmtFecha(c.fechaFin)}</div>
                    </div>

                    <div style={{ display:"flex", flexDirection:"column", justifyContent:"space-between", alignItems:"flex-end" }}>
                      <div><span className="badge-accent">{c.estado}</span></div>
                      <div style={{ marginTop:6, display:"flex", gap:6 }}>
                        <Link to={`/cosechas/${c.id}`} className="btn btn-sm btn-outline-secondary"><i className="fas fa-eye" /></Link>
                        <Link to={`/cosechas/${c.id}/etapas`} className="btn btn-sm btn-outline-secondary"><i className="fas fa-list" /></Link>
                        <button className="btn btn-sm btn-outline-danger"><i className="fas fa-trash" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="cosecha-footer">
                    <div className="small text-muted">Creado: {c.creadoEn ? new Date(c.creadoEn).toLocaleDateString() : "N/D"}</div>
                    <div className="small text-muted">ID: {c.id}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding:24, textAlign:"center" }}>
              <h6 style={{ color: ACCENT }}>No hay cosechas</h6>
              <div className="small text-muted">Crea una nueva cosecha o ajusta los filtros.</div>
            </div>
          )}

          {/* pagination */}
          {totalPages > 1 && (
            <nav aria-label="Page navigation" className="mt-3">
              <ul className="pagination pagination-sm justify-content-start">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}><button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>&laquo;</button></li>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}><button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button></li>
                ))}
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}><button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>&raquo;</button></li>
              </ul>
            </nav>
          )}
        </div>

        
      </div>
    </div>
  );
}

/* helpers */
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
