import { useEffect, useMemo, useState, useCallback } from "react";
import { listHydroponicos, deleteHydroponico } from "../../services/hidroponicos";
import { toast } from "react-toastify";
import ModalNuevoHidroponico from "../../components/ModalNuevoHidroponico/ModalNuevoHidroponico";
import ModalDetalleHidroponico from "../../components/ModalDetalleHidroponico/ModalDetalleHidroponico";
import "./Hidroponico.css";

const PAGE_SIZE = 8;

const ESTADO_MAP = {
  0: { label: "Libre", class: "libre", icon: "fa-check-circle" },
  1: { label: "Ocupado", class: "ocupado", icon: "fa-leaf" },
  2: { label: "Pausado", class: "pausado", icon: "fa-tools" }
};

const CLEAN_FILTERS = {
  q: "",
  estado: "",
  texto: "",
  nombre: "",
  numero: "",
  bandejasMin: "",
  bandejasMax: ""
};

function toEstadoCode(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return raw;

  const s = String(raw).toUpperCase();
  if (s === "LIBRE" || s === "0") return 0;
  if (s === "OCUPADO" || s === "1") return 1;
  if (s === "PAUSADO" || s === "PAUSAR" || s === "2" || s === "MANTENIMIENTO") return 2;

  return null;
}

function normalizeHidro(h) {
  return {
    ...h,
    numeroHidroponico: h.numeroHidroponico ?? h.NumeroHidroponico ?? h.numero ?? null,
    cantidadBandejas: h.cantidadBandejas ?? h.CantidadBandejas ?? 0
  };
}

function exportCsv(rows) {
  const headers = [
    "id",
    "nombre",
    "numeroHidroponico",
    "cantidadBandejas",
    "estado",
    "ubicacion",
    "zona",
    "observaciones",
    "creadoEn",
    "ultimaLectura",
    "responsable"
  ];

  const escape = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `hidroponicos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

export default function Hidroponicos() {
  /* ==============================
     STATE
  ============================== */
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedHidro, setSelectedHidro] = useState(null);
  const [editingHidro, setEditingHidro] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, hidro: null });

  const [localFilters, setLocalFilters] = useState(CLEAN_FILTERS);
  const [applied, setApplied] = useState(CLEAN_FILTERS);

  // ✅ recarga cuando creas/actualizas/eliminas
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleCloseDetalle = useCallback(() => setSelectedHidro(null), []);

  // debug helper: wrap selection to log the object passed to the detail modal
  function showDetalle(h) {
    try {
      console.log("[debug] opening detalle for:", h);
      // expose for quick inspection in DevTools
      window.__dbg_selectedHidro = h;
    } catch (e) {}
    setSelectedHidro(h);
  }

  /* ==============================
     DATA LOAD
  ============================== */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          pageSize: PAGE_SIZE,
          ...(applied.q ? { q: applied.q } : {}),
          ...(applied.estado ? { estado: applied.estado } : {})
        };
        void params;

        const data = await listHydroponicos();
        if (!Array.isArray(data)) throw new Error("La API no devolvió un array");

        setItems(data.map(normalizeHidro));
      } catch (err) {
        setError(err?.message || "Error cargando hidropónicos");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, applied, refreshKey]);

  /* ==============================
     BODY SCROLL LOCK FOR CONFIRM MODAL
  ============================== */
  useEffect(() => {
    if (confirmModal.show) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [confirmModal.show]);

  /* ==============================
     FILTER HANDLERS
  ============================== */
  function applyFilters() {
    setApplied(localFilters);
    setPage(1);
  }

  function clearFilters() {
    setLocalFilters(CLEAN_FILTERS);
    setApplied(CLEAN_FILTERS);
    setPage(1);
  }

  /* ==============================
     LOCAL FILTER (applied)
  ============================== */
  const visibleItems = useMemo(() => {
    const af = applied || {};

    const mapEstadoString = (v) => {
      if (v === null || v === undefined || v === "") return null;
      if (typeof v === "number") return v;
      const s = String(v).toUpperCase();
      if (s === "LIBRE" || s === "0") return 0;
      if (s === "OCUPADO" || s === "1") return 1;
      if (s === "PAUSADO" || s === "PAUSAR" || s === "2") return 2;
      return null;
    };

    const estadoFilter = mapEstadoString(af.estado);

    return (items || []).filter((it) => {
      if (af.texto) {
        const q = String(af.texto).toLowerCase();
        const n = String(it.nombre || "").toLowerCase();
        const o = String(it.observaciones || "").toLowerCase();
        if (!(n.includes(q) || o.includes(q))) return false;
      }

      if (af.nombre) {
        const q = String(af.nombre).toLowerCase();
        if (!String(it.nombre || "").toLowerCase().includes(q)) return false;
      }

      if (af.numero) {
        if (String(it.numeroHidroponico ?? "") !== String(af.numero)) return false;
      }

      if (af.bandejasMin) {
        if ((Number(it.cantidadBandejas) || 0) < Number(af.bandejasMin)) return false;
      }

      if (af.bandejasMax) {
        if ((Number(it.cantidadBandejas) || 0) > Number(af.bandejasMax)) return false;
      }

      if (estadoFilter !== null) {
        const code = toEstadoCode(it.estado);
        if (code === null) return false;
        if (String(code) !== String(estadoFilter)) return false;
      }

      return true;
    });
  }, [items, applied]);

  /* ==============================
     PAGINATION
  ============================== */
  const filteredTotal = visibleItems.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return visibleItems.slice(start, start + PAGE_SIZE);
  }, [visibleItems, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  /* ==============================
     METRICS
  ============================== */
  const stats = useMemo(() => {
    const totalCount = items.length;

    const freeCount = items.filter((i) => toEstadoCode(i.estado) === 0).length;
    const occupiedCount = items.filter((i) => toEstadoCode(i.estado) === 1).length;
    const maintCount = items.filter((i) => toEstadoCode(i.estado) === 2).length;

    const pctOccupied = totalCount ? Math.round((occupiedCount / totalCount) * 100) : 0;
    const pctFree = totalCount ? Math.round((freeCount / totalCount) * 100) : 0;
    const pctMaint = totalCount ? Math.round((maintCount / totalCount) * 100) : 0;

    const totalBandejas = items.reduce((s, it) => s + (Number(it.cantidadBandejas) || 0), 0);
    const freeBandejas = items
      .filter((i) => toEstadoCode(i.estado) === 0)
      .reduce((s, it) => s + (Number(it.cantidadBandejas) || 0), 0);

    const maintNames = items
      .filter((i) => toEstadoCode(i.estado) === 2)
      .map((i) => i.nombre || `Hidro #${i.id}`)
      .slice(0, 3);

    return {
      totalCount,
      freeCount,
      occupiedCount,
      maintCount,
      pctOccupied,
      pctFree,
      pctMaint,
      totalBandejas,
      freeBandejas,
      maintNames
    };
  }, [items]);

  /* ==============================
     DELETE FLOW
  ============================== */
  async function performDelete(h) {
    try {
      setLoading(true);
      await deleteHydroponico(h.id);

      toast.success(`${h.nombre || `Hidro #${h.id}`} eliminado.`, {
        hideProgressBar: true,
        theme: "colored"
      });

      bumpRefresh();
    } catch (err) {
      toast.error(err?.message || "Error eliminando el hidropónico", {
        hideProgressBar: true,
        theme: "colored"
      });
    } finally {
      setLoading(false);
    }
  }

  function showConfirm(h) {
    const code = toEstadoCode(h.estado);
    if (code !== 0) {
      toast.info("Sólo se pueden eliminar hidropónicos libres.", {
        hideProgressBar: true,
        theme: "colored"
      });
      return;
    }
    setConfirmModal({ show: true, hidro: h });
  }

  function closeConfirm() {
    setConfirmModal({ show: false, hidro: null });
  }

  function confirmAndDelete() {
    if (!confirmModal.hidro) return closeConfirm();
    const h = confirmModal.hidro;
    closeConfirm();
    performDelete(h);
  }

  /* ==============================
     CREATE/UPDATE HANDLERS
  ============================== */
  function handleCreated() {
    toast.success("Hidropónico creado.", { hideProgressBar: true, theme: "colored" });
    setEditingHidro(null);
    setPage(1);
    bumpRefresh();
  }

  function handleUpdated() {
    toast.success("Hidropónico actualizado.", { hideProgressBar: true, theme: "colored" });
    setEditingHidro(null);
    bumpRefresh();
  }

  /* ==============================
     RENDER
  ============================== */
  return (
    <div className="container-fluid py-2 hidroponicos-page">
      {/* HEADER */}
      <div className="header-row flex-wrap gap-2">
        <div className="page-title">
          <div className="title-icon">
            <i className="fas fa-seedling" />
          </div>
          <div>
            <h1>Hidropónicos</h1>
            <div className="page-desc">Administración de sistemas hidropónicos y sus capacidades.</div>
          </div>
        </div>

        <div className="header-actions d-flex gap-2 flex-wrap">
          <ModalNuevoHidroponico
            onCreated={handleCreated}
            initial={editingHidro}
            onUpdated={handleUpdated}
            onClose={() => setEditingHidro(null)}
          />

          <button
            type="button"
            className="btn btn-outline-secondary btn-ui"
            onClick={() => exportCsv(visibleItems)}
          >
            <i className="fas fa-file-export me-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row">
        <div className="stat-card stat-total">
          <div className="stat-icon">
            <i className="fas fa-layer-group" />
          </div>
          <div className="stat-content">
            <div className="stat-title">Total</div>
            <div className="stat-value">{stats.totalCount}</div>
            <div className="stat-sub">
              Activos: <b>{stats.occupiedCount}</b> · Ocupación: <b>{stats.pctOccupied}%</b>
            </div>
            <div className="progress-thin">
              <div style={{ width: `${stats.pctOccupied}%` }} />
            </div>
          </div>
        </div>

        <div className="stat-card stat-free">
          <div className="stat-icon">
            <i className="fas fa-check-circle" />
          </div>
          <div className="stat-content">
            <div className="stat-title">Libres</div>
            <div className="stat-value">{stats.freeCount}</div>
            <div className="stat-sub">
              Bandejas libres: <b>{stats.freeBandejas}</b> · <b>{stats.pctFree}%</b> del total
            </div>
            <div className="progress-thin">
              <div style={{ width: `${stats.pctFree}%` }} />
            </div>
          </div>
        </div>

        <div className="stat-card stat-maint">
          <div className="stat-icon">
            <i className="fas fa-tools" />
          </div>
          <div className="stat-content">
            <div className="stat-title">Mantenimiento</div>
            <div className="stat-value">{stats.maintCount}</div>
            <div className="stat-sub">
              <b>{stats.pctMaint}%</b> del total · Ej:{" "}
              {stats.maintNames.length ? <b>{stats.maintNames.join(", ")}</b> : "—"}
            </div>
            <div className="progress-thin">
              <div style={{ width: `${stats.pctMaint}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
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
                <label>Nombre</label>
                <div className="input-group input-group-soft">
                  <span className="input-group-text">
                    <i className="fas fa-tag" />
                  </span>
                  <input
                    className="form-control"
                    placeholder="Nombre del hidropónico"
                    value={localFilters.nombre}
                    onChange={(e) => setLocalFilters((s) => ({ ...s, nombre: e.target.value }))}
                  />
                </div>
                <div className="form-hint">Filtra por el nombre del sistema hidropónico.</div>
              </div>

              <div className="col-md-2">
                <label>Número</label>
                <div className="input-group input-group-soft">
                  <span className="input-group-text">
                    <i className="fas fa-hashtag" />
                  </span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="#"
                    value={localFilters.numero}
                    onChange={(e) => setLocalFilters((s) => ({ ...s, numero: e.target.value }))}
                  />
                </div>
                <div className="form-hint">Número exacto del hidroponico.</div>
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
                    <option value="0">Libre</option>
                    <option value="1">Ocupado</option>
                    <option value="2">Pausado</option>
                  </select>
                </div>
                <div className="form-hint">Filtra por disponibilidad del módulo.</div>
              </div>

              <div className="col-md-2">
                <label>Bandejas min</label>
                <div className="input-group input-group-soft">
                  <span className="input-group-text">
                    <i className="fas fa-sort-amount-up" />
                  </span>
                  <input
                    type="number"
                    className="form-control"
                    value={localFilters.bandejasMin}
                    onChange={(e) => setLocalFilters((s) => ({ ...s, bandejasMin: e.target.value }))}
                  />
                </div>
                <div className="form-hint">Mínimo de bandejas para mostrar.</div>
              </div>

              <div className="col-md-2">
                <label>Bandejas max</label>
                <div className="input-group input-group-soft">
                  <span className="input-group-text">
                    <i className="fas fa-sort-amount-down" />
                  </span>
                  <input
                    type="number"
                    className="form-control"
                    value={localFilters.bandejasMax}
                    onChange={(e) => setLocalFilters((s) => ({ ...s, bandejasMax: e.target.value }))}
                  />
                </div>
                <div className="form-hint">Límite superior de bandejas.</div>
              </div>

              <div className="col-12 mt-2">
                <label>Buscar (texto)</label>
                <div className="input-group input-group-soft">
                  <span className="input-group-text">
                    <i className="fas fa-search" />
                  </span>
                  <input
                    className="form-control"
                    placeholder="Nombre / observaciones"
                    value={localFilters.texto}
                    onChange={(e) => setLocalFilters((s) => ({ ...s, texto: e.target.value }))}
                  />
                </div>
                <div className="form-hint">
                  Busca coincidencias en <b>nombre</b> u <b>observaciones</b>.
                </div>
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

      {/* CARDS */}
      <div className="content-row py-4">
        <div className="list-column">
          {loading ? (
            <div className="cards-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="hidroponico-card skeleton" />
              ))}
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : pagedItems.length > 0 ? (
            <div className="cards-grid">
              {pagedItems.map((h) => {
                const code = toEstadoCode(h.estado);
                const meta =
                  ESTADO_MAP[code] || {
                    label: "Desconocido",
                    class: "inactivo",
                    icon: "fa-question-circle"
                  };

                const isFree = toEstadoCode(h.estado) === 0;

                return (
                  <div key={h.id} className="hidroponico-card hidroponico-card-pro">
                    {/* CARD HEADER */}
                    <div className="hidro-card-top">
                      <div className="hidro-card-type">
                        <span className="type-icon">
                          <i className="fas fa-seedling" />
                        </span>
                        <span className="type-text">Hidropónico</span>
                      </div>

                      <span className={`estado-pill ${meta.class}`}>
                        <i className={`fas ${meta.icon} me-2`} />
                        {meta.label}
                      </span>
                    </div>

                    {/* CARD MAIN */}
                    <div className="hidro-card-main">
                      <div className="hidro-card-icon">
                        <i className="fas fa-water" />
                      </div>

                      <div className="hidro-card-body">
                        <div className="hidro-card-head">
                          <div className="hidroponico-title">{h.nombre || `Hidro #${h.id}`}</div>

                          <div className="hidroponico-sub">
                            <i className="fas fa-map-marker-alt me-2" />
                            {h.localizacionNombre || h.ubicacion || h.zona || "—"}
                          </div>
                        </div>

                        <div className="hidroponico-meta">
                          <div className="meta-item">
                            <i className="fas fa-layer-group" />
                            <span>
                              <b>{h.cantidadBandejas ?? "—"}</b> bandejas
                            </span>
                          </div>

                          <div className="meta-item">
                            <i className="fas fa-hashtag" />
                            <span>
                              Nº <b>{h.numeroHidroponico ?? "—"}</b>
                            </span>
                          </div>

                          <div className="meta-item">
                            <i className="fas fa-calendar-alt" />
                            <span>
                              {h.creadoEn
                                ? new Date(h.creadoEn).toLocaleDateString()
                                : h.ultimaLectura
                                ? new Date(h.ultimaLectura).toLocaleString()
                                : "Sin fecha"}
                            </span>
                          </div>

                          {h.responsable && (
                            <div className="meta-item">
                              <i className="fas fa-user" />
                              <span>{h.responsable}</span>
                            </div>
                          )}

                          {Array.isArray(h.sensores) && (
                            <div className="meta-item">
                              <i className="fas fa-microchip" />
                              <span>{h.sensores.length} sensores</span>
                            </div>
                          )}
                        </div>

                        {/* Observaciones */}
                        <div className="obs-box">
                          <div className="obs-title">
                            <i className="fas fa-align-left" />
                            Observaciones
                          </div>
                          <div className="hidroponico-text">
                            {h.observaciones || "Sin observaciones registradas"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD FOOTER */}
                    <div className="hidro-card-footer">
                      <button type="button" className="btn btn-outline-secondary btn-ui" onClick={() => showDetalle(h)}>
                        <i className="fas fa-eye me-2" />
                        Detalle
                      </button>

                      <button type="button" className="btn btn-outline-primary btn-ui" onClick={() => setEditingHidro(h)}>
                        <i className="fas fa-edit me-2" />
                        Editar
                      </button>

                      <button
                        type="button"
                        className={`btn ${isFree ? "btn-outline-danger" : "btn-outline-secondary"} btn-ui`}
                        onClick={() => (isFree ? showConfirm(h) : null)}
                        title={isFree ? "" : "Sólo se puede eliminar si está libre"}
                        disabled={!isFree}
                      >
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
              <h6>No hay hidropónicos</h6>
              <div className="small text-muted">Registra un nuevo sistema o ajusta los filtros.</div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALLE */}
      <ModalDetalleHidroponico show={!!selectedHidro} hidro={selectedHidro} onClose={handleCloseDetalle} />

      {/* CONFIRM DELETE MODAL */}
      {confirmModal.show && (
        <div className="modal fade show d-block scx-backdrop scx-anim">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content modal-fancy p-3">
              <div className="modal-body text-center">
                <div className="confirm-icon">
                  <i className="fas fa-trash-alt" />
                </div>

                <h6 className="confirm-title">¿Eliminar hidropónico?</h6>
                <p className="confirm-sub">Esta acción no se puede deshacer.</p>

                <div className="confirm-target">
                  <div className="confirm-target-name">
                    {confirmModal.hidro?.nombre || `Hidro #${confirmModal.hidro?.id}`}
                  </div>

                  <div className="confirm-target-meta">
                    <span className="chip">
                      <i className="fas fa-hashtag me-1" />
                      {confirmModal.hidro?.numeroHidroponico ?? "—"}
                    </span>
                    <span className="chip">
                      <i className="fas fa-layer-group me-1" />
                      {confirmModal.hidro?.cantidadBandejas ?? "—"} bandejas
                    </span>
                  </div>
                </div>

                <div className="confirm-actions">
                  <button className="btn btn-outline-secondary btn-ui" onClick={closeConfirm} disabled={loading}>
                    Cancelar
                  </button>

                  <button className="btn btn-danger btn-ui btn-ui-danger" onClick={confirmAndDelete} disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash me-2" />
                        Eliminar
                      </>
                    )}
                  </button>
                </div>

                <div className="confirm-footnote">
                  Sugerencia: si solo quieres detenerlo, cambia el estado a <b>Pausado</b>.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGINATION */}
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
