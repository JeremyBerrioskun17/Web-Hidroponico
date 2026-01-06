import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listHydroponicos, deleteHydroponico } from "../../services/hidroponicos";
import { toast } from "react-toastify";
import ModalNuevoHidroponico from "../../components/ModalNuevoHidroponico/ModalNuevoHidroponico";
import ModalDetalleHidroponico from "../../components/ModalDetalleHidroponico/ModalDetalleHidroponico";
import "./Hidroponico.css";

const PAGE_SIZE = 8;

export default function Hidroponicos() {

  /* ==============================
     STATE
  ============================== */
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedHidro, setSelectedHidro] = useState(null);
  const [editingHidro, setEditingHidro] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, hidro: null });

  const [localFilters, setLocalFilters] = useState({
    q: "",
    estado: "",
    texto: "",
    nombre: "",
    numero: "",
    bandejasMin: "",
    bandejasMax: ""
  });
  const [applied, setApplied] = useState(localFilters);

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

        const data = await listHydroponicos();

        if (!Array.isArray(data)) {
          throw new Error("La API no devolvió un array");
        }

        setItems(data);
        setTotal(data.length);

      } catch (err) {
        setError(err?.message || "Error cargando hidropónicos");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, applied]);

  /* ==============================
     FILTER HANDLERS
  ============================== */
  function applyFilters() {
    setApplied(localFilters);
    setPage(1);
  }

  function clearFilters() {
    const clean = { q: "", estado: "", texto: "", nombre: "", numero: "", bandejasMin: "", bandejasMax: "" };
    setLocalFilters(clean);
    setApplied(clean);
    setPage(1);
  }

  /* ==============================
     LOCAL FILTER
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

    return items.filter(it => {
      // name/text search (local)
      if (af.texto) {
        const q = af.texto.toLowerCase();
        if (!((it.nombre || "").toLowerCase().includes(q) || (it.observaciones || "").toLowerCase().includes(q))) return false;
      }

      if (af.nombre) {
        if (!((it.nombre || "").toLowerCase().includes(String(af.nombre).toLowerCase()))) return false;
      }

      if (af.numero) {
        if (String(it.numeroHidroponico || it.NumeroHidroponico || it.numero || "") !== String(af.numero)) return false;
      }

      if (af.bandejasMin) {
        if ((it.cantidadBandejas || it.CantidadBandejas || 0) < Number(af.bandejasMin)) return false;
      }

      if (af.bandejasMax) {
        if ((it.cantidadBandejas || it.CantidadBandejas || 0) > Number(af.bandejasMax)) return false;
      }

      if (estadoFilter !== null) {
        const raw = it.estado;
        let code = null;
        if (typeof raw === 'number') code = raw;
        else if (typeof raw === 'string') {
          const s = raw.toUpperCase();
          if (s === 'LIBRE') code = 0;
          else if (s === 'OCUPADO') code = 1;
          else if (s === 'PAUSADO' || s === 'PAUSAR' || s === 'MANTENIMIENTO') code = 2;
        }
        if (code === null) return false;
        if (String(code) !== String(estadoFilter)) return false;
      }

      return true;
    });
  }, [items, applied]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));

  const ESTADO_MAP = {
    0: { label: "Libre", class: "libre" },
    1: { label: "Ocupado", class: "ocupado" },
    2: { label: "Pausado", class: "pausado" }
  };

  const toEstadoCode = (raw) => {
    if (raw === null || raw === undefined || raw === "") return null;
    if (typeof raw === 'number') return raw;
    const s = String(raw).toUpperCase();
    if (s === 'LIBRE' || s === '0') return 0;
    if (s === 'OCUPADO' || s === '1') return 1;
    if (s === 'PAUSADO' || s === 'PAUSAR' || s === '2' || s === 'MANTENIMIENTO') return 2;
    return null;
  };

  async function performDelete(h) {
    try {
      setLoading(true);
      await deleteHydroponico(h.id);
      setItems(prev => prev.filter(p => p.id !== h.id));
      setTotal(t => Math.max(0, t - 1));
      toast.success(`${h.nombre || `Hidro #${h.id}`} eliminado.`, { hideProgressBar: true, theme: 'colored' });
    } catch (err) {
      toast.error(err?.message || 'Error eliminando el hidropónico', { hideProgressBar: true, theme: 'colored' });
    } finally {
      setLoading(false);
    }
  }

  function showConfirm(h) {
    const code = toEstadoCode(h.estado);
    if (code !== 0) {
      toast.info('Sólo se pueden eliminar hidropónicos libres.', { hideProgressBar: true, theme: 'colored' });
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

  function handleCreated(created) {
    // Insert the created item at the top and reset to page 1
    setItems(prev => [created, ...prev]);
    setTotal(t => t + 1);
    setPage(1);
    toast.success('Hidropónico creado.', { hideProgressBar: true, theme: 'colored' });
  }

 
  return (
  <div className="container-fluid py-2 hidroponicos-page">

    {/* ==============================
        HEADER
    ============================== */}
    <div className="header-row flex-wrap gap-2">
      <div className="page-title">
        <div className="title-icon">
          <i className="fas fa-seedling" />
        </div>
        <div>
          <h1>Hidropónicos</h1>
          <div className="page-desc">
            Administración de sistemas hidropónicos y sus capacidades.
          </div>
        </div>
      </div>

      <div className="header-actions d-flex gap-2 flex-wrap">
        <ModalNuevoHidroponico onCreated={handleCreated} initial={editingHidro} onUpdated={(u) => {
          // update item in list
          setItems(prev => prev.map(p => p.id === u.id ? u : p));
          setEditingHidro(null);
        }} onClose={() => setEditingHidro(null)} />

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => exportCsv(visibleItems)}
        >
          <i className="fas fa-file-export me-1" />
          Exportar
        </button>
      </div>
    </div>

    {/* ==============================
        STATS
    ============================== */}
    {(() => {
      const totalCount = total || 0;
        const freeCount = items.filter(i => toEstadoCode(i.estado) === 0).length;
        const maintCount = items.filter(i => toEstadoCode(i.estado) === 2).length;
        const occupiedCount = items.filter(i => toEstadoCode(i.estado) === 1).length;
      const pctOccupied = totalCount ? Math.round((occupiedCount / totalCount) * 100) : 0;
      const pctFree = totalCount ? Math.round((freeCount / totalCount) * 100) : 0;
      const pctMaint = totalCount ? Math.round((maintCount / totalCount) * 100) : 0;

      // additional metrics
      const totalBandejas = items.reduce((s, it) => s + (Number(it.cantidadBandejas || it.CantidadBandejas || 0) || 0), 0);
      const freeBandejas = items.filter(i => toEstadoCode(i.estado) === 0)
        .reduce((s, it) => s + (Number(it.cantidadBandejas || it.CantidadBandejas || 0) || 0), 0);
      const maintNames = items.filter(i => toEstadoCode(i.estado) === 2)
        .map(i => (i.nombre || `Hidro #${i.id}`))
        .slice(0, 3);

      return (
        <div className="stats-row flex-wrap">
          <div className="stat-card">
            <div className="stat-icon bg-success-soft big">
              <i className="fas fa-layer-group" />
            </div>
            <div>
              <div className="stat-value">{totalCount}</div>
              <div className="stat-label">Total</div>
              <div className="stat-sub">Activos: {occupiedCount} — {pctOccupied}% · Bandejas totales: {totalBandejas}</div>
              <div className="progress-thin mt-2">
                <div style={{ width: `${pctOccupied}%` }} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-info-soft big">
              <i className="fas fa-check-circle" />
            </div>
            <div>
              <div className="stat-value">{freeCount}</div>
              <div className="stat-label">Libres</div>
              <div className="stat-sub">{pctFree}% del total · Bandejas libres: {freeBandejas}</div>
              <div className="progress-thin mt-2">
                <div style={{ width: `${pctFree}%` }} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-warning-soft big">
              <i className="fas fa-tools" />
            </div>
            <div>
              <div className="stat-value">{maintCount}</div>
              <div className="stat-label">Mantenimiento</div>
              <div className="stat-sub">{pctMaint}% del total · Ej: {maintNames.length ? maintNames.join(', ') : '—'}</div>
              <div className="progress-thin mt-2">
                <div style={{ width: `${pctMaint}%` }} />
              </div>
            </div>
          </div>
        </div>
      );
    })()}

    {/* ==============================
        FILTERS
    ============================== */}
    <div className="filters-section">
      <div className="filters-card">
        <form
          onSubmit={e => {
            e.preventDefault();
            applyFilters();
          }}
        >
            <div className="row g-2 align-items-end">

              <div className="col-md-3">
                <label>Nombre</label>
                <input
                  className="form-control"
                  placeholder="Nombre del hidropónico"
                  value={localFilters.nombre}
                  onChange={e => setLocalFilters(s => ({ ...s, nombre: e.target.value }))}
                />
              </div>

              <div className="col-md-2">
                <label>Número</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="#"
                  value={localFilters.numero}
                  onChange={e => setLocalFilters(s => ({ ...s, numero: e.target.value }))}
                />
              </div>

              <div className="col-md-3">
                <label>Estado</label>
                <select
                  className="form-select"
                  value={localFilters.estado}
                  onChange={e => setLocalFilters(s => ({ ...s, estado: e.target.value }))}
                >
                  <option value="">Todos</option>
                  <option value="0">Libre</option>
                  <option value="1">Ocupado</option>
                  <option value="2">Pausado</option>
                </select>
              </div>

              <div className="col-md-2">
                <label>Bandejas min</label>
                <input
                  type="number"
                  className="form-control"
                  value={localFilters.bandejasMin}
                  onChange={e => setLocalFilters(s => ({ ...s, bandejasMin: e.target.value }))}
                />
              </div>

              <div className="col-md-2">
                <label>Bandejas max</label>
                <input
                  type="number"
                  className="form-control"
                  value={localFilters.bandejasMax}
                  onChange={e => setLocalFilters(s => ({ ...s, bandejasMax: e.target.value }))}
                />
              </div>

              <div className="col-12 mt-2">
                <label>Buscar (texto)</label>
                <input
                  className="form-control"
                  placeholder="Nombre / observaciones"
                  value={localFilters.texto}
                  onChange={e => setLocalFilters(s => ({ ...s, texto: e.target.value }))}
                />
              </div>

              <div className="col-12 d-flex justify-content-end mt-3 gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={clearFilters}
                >
                  <i className="fas fa-eraser me-1" />
                  Limpiar
                </button>

                <button type="submit" className="btn btn-success btn-pill">
                  <i className="fas fa-check me-1" />
                  Aplicar filtros
                </button>
              </div>

            </div>
        </form>
      </div>
    </div>

    {/* ==============================
        CARDS
    ============================== */}
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
        ) : visibleItems.length > 0 ? (
          <div className="cards-grid">
            {visibleItems.map(h => (
              <div key={h.id} className="hidroponico-card">

                <div className="hidroponico-main">

                  <div className="hidroponico-icon hidroponico-icon-lg">
                    <i className="fas fa-water" />
                  </div>

                  <div className="hidroponico-body">

                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div>
                        <small className="text-success fw-semibold">
                          Hidropónico
                        </small>
                        <div className="hidroponico-title">
                          {h.nombre || `Hidro #${h.id}`}
                        </div>
                        <div className="hidroponico-sub">
                          {h.ubicacion || h.zona || "—"}
                        </div>
                      </div>

                      {(() => {
                        const code = toEstadoCode(h.estado);
                        const meta = ESTADO_MAP[code] || { label: 'Desconocido', class: 'inactivo' };
                        return (
                          <span className={`estado-pill ${meta.class}`}>
                            {meta.label}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="hidroponico-meta mb-2">
                      <div className="meta-item">
                        <i className="fas fa-layer-group me-1" />
                        {h.cantidadBandejas ?? "—"} bandejas
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-calendar-alt me-1" />
                        {h.creadoEn
                          ? new Date(h.creadoEn).toLocaleDateString()
                          : (h.ultimaLectura ? new Date(h.ultimaLectura).toLocaleString() : "Sin fecha")}
                      </div>
                    </div>

                    {/* Occupation progress removed per request */}

                    <div className="hidroponico-text mt-2">
                      {h.observaciones || "Sin observaciones registradas"}
                    </div>

                    <div className="hidroponico-db-meta mt-2 small text-muted d-flex flex-wrap gap-3">
                      <div>Nº: {h.numeroHidroponico ?? "—"}</div>
                      {h.capacidadBandejas != null && (
                        <div>Capacidad: {h.capacidadBandejas}</div>
                      )}
                      {h.responsable && <div>Resp: {h.responsable}</div>}
                      {Array.isArray(h.sensores) && (
                        <div>{h.sensores.length} sensores</div>
                      )}
                    </div>

                    <div className="hidroponico-actions mt-3">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-pill"
                        onClick={() => setSelectedHidro(h)}
                      >
                        <i className="fas fa-eye" />
                        Detalle
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-primary btn-pill"
                        onClick={() => setEditingHidro(h)}
                      >
                        <i className="fas fa-edit" />
                        Editar
                      </button>
                      {(() => {
                        const isFree = toEstadoCode(h.estado) === 0;
                        return (
                          <button
                            type="button"
                            className={`btn ${isFree ? 'btn-outline-danger' : 'btn-outline-secondary'} btn-pill ms-2`}
                            onClick={() => isFree ? showConfirm(h) : null}
                            title={isFree ? '' : 'Sólo se puede eliminar si está libre'}
                            disabled={!isFree}
                          >
                            <i className="fas fa-trash" />
                            Eliminar
                          </button>
                        );
                      })()}
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h6>No hay hidropónicos</h6>
            <div className="small text-muted">
              Registra un nuevo sistema o ajusta los filtros.
            </div>
          </div>
        )}

      </div>
    </div>

    {/* ==============================
        MODAL DETALLE
    ============================== */}
    {selectedHidro && (
      <ModalDetalleHidroponico
          show={!!selectedHidro}
          hidro={selectedHidro}
          onClose={() => setSelectedHidro(null)}
        />
    )}

    {/* Confirmation modal (centered) */}
    {confirmModal.show && (
      <div className="modal fade show d-block scx-backdrop">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content modal-fancy p-3">
            <div className="modal-body text-center">
              <div className="confirm-icon mb-3">
                <i className="fas fa-trash-alt"></i>
              </div>
              <h6>¿Eliminar hidropónico?</h6>
              <p className="text-muted small">Esta acción no se puede deshacer.</p>

              <p className="mt-2">{confirmModal.hidro?.nombre || `Hidro #${confirmModal.hidro?.id}`}</p>

              <div className="d-flex justify-content-center gap-3 mt-3">
                <button className="btn btn-outline-secondary" onClick={closeConfirm}>Cancelar</button>
                <button className="btn btn-danger" onClick={confirmAndDelete}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ==============================
        PAGINATION
    ============================== */}
    {totalPages > 1 && (
      <nav className="mt-3">
        <ul className="pagination pagination-sm justify-content-start">
          <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              &laquo;
            </button>
          </li>

          {Array.from({ length: totalPages }).map((_, i) => (
            <li
              key={i}
              className={`page-item ${page === i + 1 ? "active" : ""}`}
            >
              <button
                type="button"
                className="page-link"
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            </li>
          ))}

          <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
            <button
              type="button"
              className="page-link"
              onClick={() =>
                setPage(p => Math.min(totalPages, p + 1))
              }
            >
              &raquo;
            </button>
          </li>
        </ul>
      </nav>
    )}

  </div>
);

}
