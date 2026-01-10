import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listCosechas } from "../../services/cosechas";
import { listHydroponicos } from "../../services/hidroponicos";
import { listEtapasHidroponico } from "../../services/etapasHidroponico";
import ModalNuevoCosecha from "../../components/ModalNuevaCosecha/ModalNuevoCosecha";
import ModalDetalleCosecha from "../../components/ModalDetalleCosecha/ModalDetalleCosecha";
import ModalEtapas from "../../components/ModalEtapas/ModalEtapas";
import './Cosechas.css';

const PAGE_SIZE = 8;
const ACCENT = "#10b981";

export default function Cosechas() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCosecha, setSelectedCosecha] = useState(null);
  const [etapasCosecha, setEtapasCosecha] = useState({ show: false, cosecha: null });

  const [stats, setStats] = useState({ count: 0, totalCount: 0, byState: { ACTIVA: 0, PAUSADA: 0, FINALIZADA: 0, OTROS: 0 }, pct: { activa: 0, pausada: 0, finalizada: 0 } });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);


  const [hidros, setHidros] = useState([]);
  const [etapasGlobal, setEtapasGlobal] = useState([]);
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
    (async () => {
      try {
        const res = await listHydroponicos({ page: 1, pageSize: 500 });
        let itemsH = Array.isArray(res) ? res : (res.items || []);
        setHidros(itemsH);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const all = await listEtapasHidroponico();
        setEtapasGlobal(Array.isArray(all) ? all : (all.items || []));
      } catch (err) {
        setEtapasGlobal([]);
      }
    })();
  }, []);

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

  function ModalDetalleCosechaWrapper({ cosecha, onClose }) {
  useEffect(() => {
    // Al abrir el modal, deshabilitamos scroll
    document.body.style.overflow = "hidden";

    return () => {
      // Al cerrar el modal, restauramos scroll
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px"; // si Bootstrap agregó padding
    };
  }, []);

  return <ModalDetalleCosecha cosecha={cosecha} onClose={onClose} />;
}


  const computedStats = useMemo(() => {
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


  useEffect(() => {
  (async () => {
    try {
      setStatsLoading(true);
      const data = await getCosechasStats();
      setStats(data);
    } catch (err) {
      setStatsError(err.message || "Error cargando estadísticas");
    } finally {
      setStatsLoading(false);
    }
  })();
}, []);


  return (
    <div className="container-fluid py-2 cosechas-page">
      {/* Header */}
      <div className="header-row">
        <div className="page-title">
          <div className="title-icon"><i className="fas fa-seedling" /></div>
          <div>
            <h1>Cosechas</h1>
            <div className="page-desc">Administra zafras — controla etapas, riegos y monitoreo.</div>
          </div>
        </div>
        <div className="header-actions">
          <ModalNuevoCosecha onCreated={_handleCreated} />
          <button className="btn btn-outline-secondary" onClick={() => exportCsv(visibleItems)}><i className="fas fa-file-export me-1" /> Exportar</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-layer-group"></i></div>
          <div className="stat-content">
            <div className="stat-label">Total resultados</div>
            <div className="stat-value">{stats.totalCount}</div>
            <div className="stat-sub">Mostrados: {stats.count}</div>
            <div className="progress-thin"><div style={{ width: `${Math.round((stats.count / Math.max(stats.totalCount,1)) * 100)}%`, background: ACCENT }} /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-seedling"></i></div>
          <div className="stat-content">
            <div className="stat-label">Activas</div>
            <div className="stat-value">{stats.byState.ACTIVA}</div>
            <div className="stat-sub">{stats.pct.activa}% del total</div>
            <div className="progress-thin"><div style={{ width: `${stats.pct.activa}%`, background: ACCENT }} /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon paused"><i className="fas fa-pause-circle"></i></div>
          <div className="stat-content">
            <div className="stat-label">Pausadas</div>
            <div className="stat-value">{stats.byState.PAUSADA}</div>
            <div className="stat-sub">{stats.pct.pausada}% del total</div>
            <div className="progress-thin"><div style={{ width: `${stats.pct.pausada}%`, background: "#f59e0b" }} /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon finished"><i className="fas fa-flag-checkered"></i></div>
          <div className="stat-content">
            <div className="stat-label">Finalizadas</div>
            <div className="stat-value">{stats.byState.FINALIZADA}</div>
            <div className="stat-sub">{stats.pct.finalizada}% del total</div>
            <div className="progress-thin"><div style={{ width: `${stats.pct.finalizada}%`, background: "#6b7280" }} /></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="filters-card">
          <form onSubmit={e => { e.preventDefault(); applyFilters(); }}>
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label>Desde</label>
                <input type="date" className="form-control" value={localFilters.desde} onChange={(e) => setLocalFilters(s => ({ ...s, desde: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <label>Hasta</label>
                <input type="date" className="form-control" value={localFilters.hasta} onChange={(e) => setLocalFilters(s => ({ ...s, hasta: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <label>Estado</label>
                <select className="form-select" value={localFilters.estado} onChange={(e) => setLocalFilters(s => ({ ...s, estado: e.target.value }))}>
                  <option value="">Todos</option>
                  <option value="ACTIVA">ACTIVA</option>
                  <option value="PAUSADA">PAUSADA</option>
                  <option value="FINALIZADA">FINALIZADA</option>
                </select>
              </div>
              <div className="col-md-3">
                <label>Hidroponico</label>
                <select className="form-select" value={localFilters.hidroponicoId} onChange={(e) => setLocalFilters(s => ({ ...s, hidroponicoId: e.target.value }))}>
                  <option value="">Todos</option>
                  {hidros.map(h => <option key={h.id} value={h.id}>{h.nombre ?? `Hidro #${h.id}`}</option>)}
                </select>
              </div>

              <div className="col-12 mt-2">
                <label>Buscar (like) — servidor</label>
                <div className="input-group">
                  <input className="form-control" placeholder="p.ej. 'lote A'" value={localFilters.q} onChange={e => setLocalFilters(s => ({ ...s, q: e.target.value }))} />
                  <button type="button" className="btn btn-apply" onClick={applyFilters}><i className="fas fa-filter me-1" /> Aplicar</button>
                </div>
              </div>

              <div className="col-12 mt-2">
                <label>Buscar local (observaciones / nombreZafra)</label>
                <input className="form-control" placeholder="Filtro local (solo UI)" value={localFilters.texto} onChange={e => setLocalFilters(s => ({ ...s, texto: e.target.value }))} />
              </div>

              <div className="col-12 d-flex justify-content-end mt-3">
                <button type="button" className="btn btn-outline-secondary me-2" onClick={clearFilters}><i className="fas fa-eraser me-1" /> Limpiar</button>
                <button type="button" className="btn btn-apply" onClick={applyFilters}><i className="fas fa-check me-1" /> Aplicar filtros</button>
              </div>
            </div>
          </form>
        </div>
      </div>

     {/* Cards */}
      <div className="content-row">
        <div className="list-col">
          {loading ? (
            <div className="cards-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="cosecha-card skeleton" />
              ))}
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : visibleItems.length > 0 ? (
            <div className="cards-grid">
              {visibleItems.map(c => (
                <div key={c.id} className="cosecha-card cosecha-card-xl">

                  <div className="cosecha-main d-flex flex-column flex-lg-row align-items-center">

                    {/* ICONO */}
                    <div className="cosecha-icon mb-3 mb-lg-0">
                      <i className="fas fa-seedling"></i>
                    </div>

                    {/* CONTENIDO */}
                    <div className="cosecha-body flex-grow-1 ms-lg-2 w-100">

                      {/* HEADER */}
                      <div className="d-flex flex-wrap justify-content-between align-items-start mb-2">
                          <div className="zafra-row">
                            <small className="text-success fw-semibold cosecha-label"><i className="fas fa-seedling me-1" />Zafra:</small>
                            <h5 className="cosecha-title fw-bold mb-0">{c.nombreZafra || "Zafra sin nombre"}</h5>
                          </div>
                        {(() => {
                          const ordered = (etapasGlobal || []).filter(e => !e.hidroponicoId || e.hidroponicoId === c.hidroponicoId).slice().sort((a, b) => (a.ordenEtapa ?? a.OrdenEtapa ?? 0) - (b.ordenEtapa ?? b.OrdenEtapa ?? 0));
                          const start = c.fechaInicio ? new Date(c.fechaInicio) : new Date();
                          const now = new Date();
                          const computed = [];
                          let cur = new Date(start);
                          for (const etapa of ordered) {
                            const dur = Number(etapa.duracionHoras ?? etapa.DuracionHoras ?? 0) || 0;
                            const inicio = new Date(cur);
                            const fin = new Date(inicio);
                            fin.setHours(fin.getHours() + dur);
                            let estado = (etapa.estado ?? etapa.estadoEtapa ?? 'PENDIENTE').toUpperCase();
                            const estadoByDate = (now >= fin) ? 'FINALIZADA' : (now >= inicio && now < fin ? 'ACTIVA' : 'PENDIENTE');
                            computed.push({ nombre: etapa.nombre, estado, estadoByDate, duracionHorasPlan: dur, fechaInicioReal: inicio.toISOString(), fechaFinReal: fin.toISOString() });
                            cur = new Date(fin);
                          }
                          // Use the cosecha's state directly (comes from API)
                          const displayEstado = (c.estado || 'SIN ESTADO').toUpperCase();
                          const pillClass = displayEstado.toLowerCase();
                          return <span className={`estado-pill ${pillClass}`}>{displayEstado}</span>;
                        })()}
                      </div>

                      

                      {/* INFO LABELS (comentario mostrado aquí, sin duplicados) */}
                      <div className="info-labels d-flex flex-column align-items-start mb-2">
                        <div className="info-item d-flex align-items-center">
                          <i className="fas fa-warehouse me-2 text-muted"></i>
                          <span className="fw-semibold">Hidroponico:</span>
                          <span className="text-muted ms-1">{c.hidroponicoId ?? '—'}</span>
                        </div>
                        <div className="info-item d-flex align-items-center">
                          <i className="fas fa-calendar-alt me-2 text-muted"></i>
                          <span className="fw-semibold">Fechas:</span>
                          <span className="text-muted ms-1">{fmtFechaLabel(c.fechaInicio)} → {fmtFechaLabel(c.fechaFin)}</span>
                        </div>
                        <div className="info-item d-flex align-items-start">
                          <i className="fas fa-comment me-2 text-muted"></i>
                          <div>
                            <div className="fw-semibold">Comentario:</div>
                            <div className="text-muted info-comment">{c.observaciones ? c.observaciones : '—'}</div>
                          </div>
                        </div>
                      </div>
                      <hr className="comment-divider" />

                      {(() => {
                        const ordered = (etapasGlobal || []).filter(e => !e.hidroponicoId || e.hidroponicoId === c.hidroponicoId).slice().sort((a, b) => (a.ordenEtapa ?? a.OrdenEtapa ?? 0) - (b.ordenEtapa ?? b.OrdenEtapa ?? 0));
                        const start = c.fechaInicio ? new Date(c.fechaInicio) : new Date();
                        const now = new Date();
                        const computed = [];
                        let cur = new Date(start);
                        for (const etapa of ordered) {
                          const dur = Number(etapa.duracionHoras ?? etapa.DuracionHoras ?? 0) || 0;
                          const inicio = new Date(cur);
                          const fin = new Date(inicio);
                          fin.setHours(fin.getHours() + dur);
                          let estado = (etapa.estado ?? etapa.estadoEtapa ?? 'PENDIENTE').toUpperCase();
                          const estadoByDate = (now >= fin) ? 'FINALIZADA' : (now >= inicio && now < fin ? 'ACTIVA' : 'PENDIENTE');
                          computed.push({ nombre: etapa.nombre, estado, estadoByDate, duracionHorasPlan: dur, fechaInicioReal: inicio.toISOString(), fechaFinReal: fin.toISOString() });
                          cur = new Date(fin);
                        }
                        const totalHours = computed.reduce((s, it) => s + (Number(it.duracionHorasPlan) || 0), 0);
                        const elapsedHours = computed.reduce((s, it) => {
                          const inicio = new Date(it.fechaInicioReal);
                          const fin = new Date(it.fechaFinReal);
                          if (now >= fin) return s + (Number(it.duracionHorasPlan) || 0);
                          if (now <= inicio) return s;
                          const hrs = (now - inicio) / (1000 * 60 * 60);
                          return s + Math.min(hrs, Number(it.duracionHorasPlan) || 0);
                        }, 0);
                        let overallPct = totalHours > 0 ? Math.round((elapsedHours / totalHours) * 100) : 0;
                        if ((c.estado || '').toUpperCase() === 'FINALIZADA') overallPct = 100;
                        const currentIndex = computed.findIndex(it => it.estadoByDate === 'ACTIVA');
                        const currentName = currentIndex >= 0 ? computed[currentIndex].nombre : (computed.length > 0 ? (computed[computed.length - 1].estadoByDate === 'FINALIZADA' ? 'Finalizada' : 'Sin etapa activa') : 'Sin etapas');
                          return (
                          <div className="mb-2 etapa-current">
                            <div className="etapa-label">Etapa actual: <strong>{currentName}</strong></div>
                            <div className="progress-custom mt-2">
                              <div style={{ width: `${overallPct}%` }} />
                            </div>
                            <div className="small text-muted mt-1">{overallPct}%</div>
                          </div>
                        );
                      })()}

                      <hr />

                      {/* FOOTER / ACCIONES - reused hidroponico button styles */}
                      <div className="cosecha-footer hidroponico-actions">
                        <button
                          className="btn btn-outline-secondary btn-pill"
                          onClick={() => setSelectedCosecha(c)}
                        >
                          <i className="fas fa-eye me-1"></i> Detalle
                        </button>

                        <button
                          className="btn btn-outline-primary btn-pill"
                          onClick={() => setEtapasCosecha({ show: true, cosecha: c })}
                        >
                          <i className="fas fa-list me-1"></i> Etapas
                        </button>

                        <button className="btn btn-outline-danger btn-pill">
                          <i className="fas fa-trash me-1"></i> Eliminar
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h6>No hay cosechas</h6>
              <div className="small text-muted">Crea una nueva cosecha o ajusta los filtros.</div>
            </div>
          )}
        </div>
      </div>


{/* Modal Detalle */}
{selectedCosecha && (
  <ModalDetalleCosechaWrapper
    cosecha={selectedCosecha}
    onClose={() => setSelectedCosecha(null)}
  />
)}

{etapasCosecha.show && (
  <ModalEtapas
    show={etapasCosecha.show}
    cosecha={etapasCosecha.cosecha}
    onClose={() => setEtapasCosecha({ show: false, cosecha: null })}
    onFinalized={(id) => {
      // Refresh list: mark item as FINALIZADA locally
      setItems(prev => prev.map(i => i.id === id ? { ...i, estado: 'FINALIZADA' } : i));
      setEtapasCosecha({ show: false, cosecha: null });
    }}
  />
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
  );
}

/* helpers */
function fmtFechaLabel(iso) { if (!iso) return "N/D"; const d = new Date(iso); return d.toLocaleDateString("es-NI", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtFecha(isoYmd) { if (!isoYmd) return ""; try { const d = new Date(isoYmd); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; } catch { return isoYmd; } }
function startOfDayUtc(ymd) { return `${ymd}T00:00:00Z`; }
function addOneDayUtc(ymd) { const d = new Date(`${ymd}T00:00:00Z`); d.setUTCDate(d.getUTCDate()+1); return d.toISOString().slice(0,19)+"Z"; }
