import { useEffect, useMemo, useState } from "react";
import { listCosechas } from "../../services/cosechas";
import { listHydroponicos } from "../../services/hidroponicos";
import { listEtapasHidroponico } from "../../services/etapasHidroponico";
import ModalNuevoCosecha from "../../components/ModalNuevaCosecha/ModalNuevoCosecha";
import ModalDetalleCosecha from "../../components/ModalDetalleCosecha/ModalDetalleCosecha";
import ModalEtapas from "../../components/ModalEtapas/ModalEtapas";
import "./Cosechas.css";

const PAGE_SIZE = 8;

export default function Cosechas() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCosecha, setSelectedCosecha] = useState(null);
  const [etapasCosecha, setEtapasCosecha] = useState({ show: false, cosecha: null });

  const [stats, setStats] = useState({
    count: 0,
    totalCount: 0,
    byState: { ACTIVA: 0, PAUSADA: 0, FINALIZADA: 0, OTROS: 0 },
    pct: { activa: 0, pausada: 0, finalizada: 0 }
  });
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
    texto: ""
  });
  const [applied, setApplied] = useState(localFilters);

  useEffect(() => {
    (async () => {
      try {
        const res = await listHydroponicos({ page: 1, pageSize: 500 });
        const itemsH = Array.isArray(res) ? res : res.items || [];
        setHidros(itemsH);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const all = await listEtapasHidroponico();
        setEtapasGlobal(Array.isArray(all) ? all : all.items || []);
      } catch {
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
          ...(applied.hasta ? { hasta: addOneDayUtc(applied.hasta) } : {})
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
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "auto";
        document.body.style.paddingRight = "0px";
      };
    }, []);

    return <ModalDetalleCosecha cosecha={cosecha} onClose={onClose} />;
  }

  const computedStats = useMemo(() => {
    const cnt = items.length;
    const byState = { ACTIVA: 0, PAUSADA: 0, FINALIZADA: 0, OTROS: 0 };

    items.forEach((i) => {
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
        finalizada: Math.round((byState.FINALIZADA / totalCount) * 100)
      }
    };
  }, [items, total]);

  // Mantengo tu stats externo si lo usas; si falla, uso computedStats visualmente
  useEffect(() => {
    (async () => {
      try {
        setStatsLoading(true);
        // si ya tienes getCosechasStats definido, perfecto
        const data = await getCosechasStats();
        setStats(data);
      } catch (err) {
        setStatsError(err?.message || "Error cargando estadísticas");
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  const statsUI = statsLoading || statsError ? computedStats : stats;

  const visibleItems = useMemo(() => {
    if (!localFilters.texto) return items;
    const q = localFilters.texto.toLowerCase();
    return items.filter(
      (it) =>
        (it.observaciones || "").toLowerCase().includes(q) ||
        (it.nombreZafra || "").toLowerCase().includes(q)
    );
  }, [items, localFilters.texto]);

  const filteredTotal = visibleItems.length;
  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));

  return (
    <div className="container-fluid py-2 cosechas-page">
      {/* HEADER (igual Hidroponicos) */}
      <div className="header-row flex-wrap gap-2">
        <div className="page-title">
          <div className="title-icon">
            <i className="fas fa-seedling" />
          </div>
          <div>
            <h1>Cosechas</h1>
            <div className="page-desc">Administra zafras — controla etapas, riegos y monitoreo.</div>
          </div>
        </div>

        <div className="header-actions d-flex gap-2 flex-wrap">
          <ModalNuevoCosecha onCreated={_handleCreated} />

          <button type="button" className="btn btn-outline-secondary btn-ui" onClick={() => exportCsv(visibleItems)}>
            <i className="fas fa-file-export me-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* STATS (mismo estilo Hidroponicos) */}
      <div className="stats-row">
        <div className="stat-card stat-total">
          <div className="stat-icon">
            <i className="fas fa-layer-group" />
          </div>
          <div className="stat-content">
            <div className="stat-title">Total</div>
            <div className="stat-value">{statsUI.totalCount}</div>
            <div className="stat-sub">
              Mostradas: <b>{statsUI.count}</b> · Filtradas: <b>{filteredTotal}</b>
            </div>
            <div className="progress-thin">
              <div style={{ width: `${Math.round((statsUI.count / Math.max(statsUI.totalCount, 1)) * 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="stat-card stat-free">
          <div className="stat-icon">
            <i className="fas fa-seedling" />
          </div>
          <div className="stat-content">
            <div className="stat-title">Activas</div>
            <div className="stat-value">{statsUI.byState.ACTIVA}</div>
            <div className="stat-sub">
              <b>{statsUI.pct.activa}%</b> del total
            </div>
            <div className="progress-thin">
              <div style={{ width: `${statsUI.pct.activa}%` }} />
            </div>
          </div>
        </div>

        <div className="stat-card stat-maint">
          <div className="stat-icon">
            <i className="fas fa-pause-circle" />
          </div>
          <div className="stat-content">
            <div className="stat-title">Pausadas</div>
            <div className="stat-value">{statsUI.byState.PAUSADA}</div>
            <div className="stat-sub">
              <b>{statsUI.pct.pausada}%</b> del total
            </div>
            <div className="progress-thin">
              <div style={{ width: `${statsUI.pct.pausada}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS (como Hidroponicos) */}
      <div className="filters-section">
        <div className="filters-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
          >
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label>Desde</label>
                <div className="input-group input-group-soft">
                  <span className="input-group-text">
                    <i className="fas fa-calendar-alt" />
                  </span>
                  <input
                    type="date"
                    className="form-control"
                    value={localFilters.desde}
                    onChange={(e) => setLocalFilters((s) => ({ ...s, desde: e.target.value }))}
                  />
                </div>
                <div className="form-hint">Fecha de inicio (desde).</div>
              </div>

              <div className="col-md-3">
                <label>Hasta</label>
                <div className="input-group input-group-soft">
                  <span className="input-group-text">
                    <i className="fas fa-calendar-alt" />
                  </span>
                  <input
                    type="date"
                    className="form-control"
                    value={localFilters.hasta}
                    onChange={(e) => setLocalFilters((s) => ({ ...s, hasta: e.target.value }))}
                  />
                </div>
                <div className="form-hint">Fecha fin (hasta).</div>
              </div>

              <div className="col-md-3">
                <label>Estado</label>
                <div className="input-group input-group-soft">
                  <span className="input-group-text">
                    <i className="fas fa-signal" />
                  </span>
                  <select
                    className="form-select select-soft"
                    value={localFilters.estado}
                    onChange={(e) => setLocalFilters((s) => ({ ...s, estado: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    <option value="ACTIVA">ACTIVA</option>
                    <option value="PAUSADA">PAUSADA</option>
                    <option value="FINALIZADA">FINALIZADA</option>
                  </select>
                </div>
                <div className="form-hint">Filtra por estado.</div>
              </div>

              <div className="col-md-3">
                <label>Hidropónico</label>
                <div className="input-group input-group-soft">
                  <span className="input-group-text">
                    <i className="fas fa-warehouse" />
                  </span>
                  <select
                    className="form-select select-soft"
                    value={localFilters.hidroponicoId}
                    onChange={(e) => setLocalFilters((s) => ({ ...s, hidroponicoId: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    {hidros.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.nombre ?? `Hidro #${h.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-hint">Filtra por hidropónico.</div>
              </div>

              <div className="col-12 mt-2">
                <label>Buscar (like) — servidor</label>
                <div className="input-group input-group-soft">
                  <span className="input-group-text">
                    <i className="fas fa-search" />
                  </span>
                  <input
                    className="form-control"
                    placeholder="p.ej. 'lote A'"
                    value={localFilters.q}
                    onChange={(e) => setLocalFilters((s) => ({ ...s, q: e.target.value }))}
                  />
                </div>
                <div className="form-hint">Este filtro se envía al servidor.</div>
              </div>

              <div className="col-12 mt-2">
                <label>Buscar local (observaciones / nombreZafra)</label>
                <div className="input-group input-group-soft">
                  <span className="input-group-text">
                    <i className="fas fa-align-left" />
                  </span>
                  <input
                    className="form-control"
                    placeholder="Filtro local (solo UI)"
                    value={localFilters.texto}
                    onChange={(e) => setLocalFilters((s) => ({ ...s, texto: e.target.value }))}
                  />
                </div>
                <div className="form-hint">Este filtro es solo visual (no servidor).</div>
              </div>

              <div className="col-12 d-flex justify-content-end mt-3 gap-2">
                <button type="button" className="btn btn-outline-secondary btn-ui" onClick={clearFilters}>
                  <i className="fas fa-eraser me-2" />
                  Limpiar
                </button>

                <button type="submit" className="btn btn-success btn-ui btn-ui-primary">
                  <i className="fas fa-check me-2" />
                  Aplicar filtros
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="filters-hint">
          Mostrando <b>{filteredTotal}</b> resultado(s) {filteredTotal ? "filtrado(s)" : ""}.
        </div>
      </div>

      {/* CARDS (mismo grid Hidroponicos: 2 por fila en desktop) */}
      <div className="content-row py-4">
        <div className="list-column">
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
              {visibleItems.map((c) => {
                const displayEstado = (c.estado || "SIN ESTADO").toUpperCase();
                const pillClass = displayEstado.toLowerCase();

                // Etapas/progreso: MISMA LÓGICA que tenías
                const etapaInfo = (() => {
                  const ordered = (etapasGlobal || [])
                    .filter((e) => !e.hidroponicoId || e.hidroponicoId === c.hidroponicoId)
                    .slice()
                    .sort(
                      (a, b) =>
                        (a.ordenEtapa ?? a.OrdenEtapa ?? 0) - (b.ordenEtapa ?? b.OrdenEtapa ?? 0)
                    );

                  const start = c.fechaInicio ? new Date(c.fechaInicio) : new Date();
                  const now = new Date();
                  const computed = [];
                  let cur = new Date(start);

                  for (const etapa of ordered) {
                    const dur = Number(etapa.duracionHoras ?? etapa.DuracionHoras ?? 0) || 0;
                    const inicio = new Date(cur);
                    const fin = new Date(inicio);
                    fin.setHours(fin.getHours() + dur);

                    const estadoByDate =
                      now >= fin ? "FINALIZADA" : now >= inicio && now < fin ? "ACTIVA" : "PENDIENTE";

                    computed.push({
                      nombre: etapa.nombre,
                      duracionHorasPlan: dur,
                      fechaInicioReal: inicio.toISOString(),
                      fechaFinReal: fin.toISOString(),
                      estadoByDate
                    });

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
                  if ((c.estado || "").toUpperCase() === "FINALIZADA") overallPct = 100;

                  const currentIndex = computed.findIndex((it) => it.estadoByDate === "ACTIVA");
                  const currentName =
                    currentIndex >= 0
                      ? computed[currentIndex].nombre
                      : computed.length > 0
                      ? computed[computed.length - 1].estadoByDate === "FINALIZADA"
                        ? "Finalizada"
                        : "Sin etapa activa"
                      : "Sin etapas";

                  return { overallPct, currentName };
                })();

                return (
                  <div key={c.id} className="cosecha-card cosecha-card-pro">
                    {/* CARD HEADER */}
                    <div className="cosecha-card-top">
                      <div className="cosecha-card-type">
                        <span className="type-icon">
                          <i className="fas fa-seedling" />
                        </span>
                        <span className="type-text">Cosecha</span>
                      </div>

                      <span className={`estado-pill ${pillClass}`}>
                        <i className={`fas ${
                          pillClass === "activa"
                            ? "fa-seedling"
                            : pillClass === "pausada"
                            ? "fa-pause-circle"
                            : pillClass === "finalizada"
                            ? "fa-flag-checkered"
                            : "fa-question-circle"
                        } me-2`} />
                        {displayEstado}
                      </span>
                    </div>

                    {/* CARD MAIN */}
                    <div className="cosecha-card-main">
                      <div className="cosecha-card-icon">
                        <i className="fas fa-seedling" />
                      </div>

                      <div className="cosecha-card-body">
                        <div className="cosecha-card-head">
                          <div className="cosecha-title">{c.nombreZafra || "Zafra sin nombre"}</div>

                          <div className="cosecha-sub">
                            <i className="fas fa-warehouse me-2" />
                            Hidropónico:{" "}
                            <b className="ms-1">{c.hidroponicoId ?? "—"}</b>
                          </div>
                        </div>

                        <div className="cosecha-meta">
                          <div className="meta-item">
                            <i className="fas fa-calendar-alt" />
                            <span>
                              <b>{fmtFechaLabel(c.fechaInicio)}</b> → <b>{fmtFechaLabel(c.fechaFin)}</b>
                            </span>
                          </div>

                          <div className="meta-item">
                            <i className="fas fa-list" />
                            <span>
                              Etapa actual: <b>{etapaInfo.currentName}</b>
                            </span>
                          </div>
                        </div>

                        {/* PROGRESS */}
                        <div className="cosecha-progress">
                          <div className="progress-thin">
                            <div style={{ width: `${etapaInfo.overallPct}%` }} />
                          </div>
                          <div className="small text-muted mt-1">{etapaInfo.overallPct}%</div>
                        </div>

                        {/* Observaciones */}
                        <div className="obs-box">
                          <div className="obs-title">
                            <i className="fas fa-align-left" />
                            Comentario
                          </div>
                          <div className="cosecha-text">{c.observaciones ? c.observaciones : "—"}</div>
                        </div>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="cosecha-card-footer">
                      <button type="button" className="btn btn-outline-secondary btn-ui" onClick={() => setSelectedCosecha(c)}>
                        <i className="fas fa-eye me-2" />
                        Detalle
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-primary btn-ui"
                        onClick={() => setEtapasCosecha({ show: true, cosecha: c })}
                      >
                        <i className="fas fa-list me-2" />
                        Etapas
                      </button>

                      <button type="button" className="btn btn-outline-danger btn-ui">
                        <i className="fas fa-trash me-2" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <h6>No hay cosechas</h6>
              <div className="small text-muted">Crea una nueva cosecha o ajusta los filtros.</div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALLE */}
      {selectedCosecha && (
        <ModalDetalleCosechaWrapper cosecha={selectedCosecha} onClose={() => setSelectedCosecha(null)} />
      )}

      {/* MODAL ETAPAS */}
      {etapasCosecha.show && (
        <ModalEtapas
          show={etapasCosecha.show}
          cosecha={etapasCosecha.cosecha}
          onClose={() => setEtapasCosecha({ show: false, cosecha: null })}
          onFinalized={(id) => {
            setItems((prev) => prev.map((i) => (i.id === id ? { ...i, estado: "FINALIZADA" } : i)));
            setEtapasCosecha({ show: false, cosecha: null });
          }}
        />
      )}

      {/* PAGINATION (igual Hidroponicos) */}
      {totalPages > 1 && (
        <nav className="mt-3">
          <ul className="pagination pagination-sm justify-content-start pagination-soft">
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button type="button" className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                &laquo;
              </button>
            </li>

            {Array.from({ length: totalPages }).map((_, i) => (
              <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}>
                <button type="button" className="page-link" onClick={() => setPage(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}

            <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
              <button type="button" className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

/* helpers */
function fmtFechaLabel(iso) {
  if (!iso) return "N/D";
  const d = new Date(iso);
  return d.toLocaleDateString("es-NI", { day: "2-digit", month: "short", year: "numeric" });
}
function startOfDayUtc(ymd) {
  return `${ymd}T00:00:00Z`;
}
function addOneDayUtc(ymd) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 19) + "Z";
}
