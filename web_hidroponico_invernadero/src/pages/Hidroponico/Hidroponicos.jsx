import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Hidroponico.css";
import { listHydroponicos, deleteHydroponico } from "../../services/hidroponicos";

import ModalNuevoHidroponico from "../../components/ModalNuevoHidroponico";
import SeedHidroponicos from "../../components/SeedHidroponicos";
import ModalDetalleHidroponico from "../../components/ModalDetalleHidroponico";

const PAGE_SIZE = 9;
const STATE_LABEL = { 0: "Libre", 1: "Ocupado", 2: "Mantenimiento" };

export default function Hidroponicos() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [modalHidro, setModalHidro] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 250);
    return () => clearTimeout(t);
  }, [q, estadoFilter]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const params = { page, pageSize: PAGE_SIZE, q: q || undefined, estado: estadoFilter || undefined };
        const data = await listHydroponicos(params);
        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err?.message || "Error cargando hidropónicos.");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, q, estadoFilter, refreshFlag]);

  function handleRefresh() { setRefreshFlag((s) => s + 1); }
  async function handleDelete(id) {
    if (!confirm("¿Eliminar este hidropónico?")) return;
    try { setLoading(true); await deleteHydroponico(id); handleRefresh(); } 
    catch (err) { alert(err?.message || "Error al eliminar."); } 
    finally { setLoading(false); }
  }

  function openModal(hidro) { setModalHidro(hidro); setShowModal(true); }

  const cards = useMemo(() => items.map((h) => ({
    id: h.id,
    nombre: h.nombre,
    numero: h.numeroHidroponico ?? h.numero ?? h.numeroHidroponico,
    bandejas: h.cantidadBandejas ?? "N/D",
    observaciones: h.observaciones ?? "",
    estado: Number(h.estado ?? 0),
    creadoEn: h.creadoEn,
  })), [items]);

  const chips = useMemo(() => {
    const arr = [];
    if (q) arr.push({ k: "q", label: `Buscar: "${q}"` });
    if (estadoFilter) arr.push({ k: "estado", label: `Estado: ${STATE_LABEL[Number(estadoFilter)] ?? estadoFilter}` });
    return arr;
  }, [q, estadoFilter]);

  function removeChip(k) { if(k==="q") setQ(""); if(k==="estado") setEstadoFilter(""); setPage(1); }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container-fluid" id="pageHidroponicos">

      {/* ===== HEADER ===== */}
      <div className="mb-3">
        <h1 className="h3 text-success"><i className="fas fa-water me-2"></i> Hidropónicos</h1>
        <div className="small text-muted">Gestiona las unidades de cultivo — crea, edita, asocia cosechas y monitorea.</div>
      </div>

      {/* ===== FILTROS Y BOTONES ===== */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="input-group" style={{ minWidth: 320 }}>
          <span className="input-group-text"><i className="fas fa-search"></i></span>
          <input
            className="form-control"
            placeholder="Buscar por nombre o número..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn btn-outline-secondary" onClick={() => { setQ(""); setPage(1); }}>
            <i className="fas fa-times" />
          </button>
        </div>

        <select
          className="form-select"
          style={{ width: 160 }}
          value={estadoFilter}
          onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
        >
          <option value="">Todos los estados</option>
          <option value="0">Libre</option>
          <option value="1">Ocupado</option>
          <option value="2">Mantenimiento</option>
        </select>

        <div className="d-flex gap-2">
          <ModalNuevoHidroponico onCreated={handleRefresh} />
          {import.meta.env.DEV && <SeedHidroponicos onDone={handleRefresh} />}
          <button className="btn btn-outline-success" onClick={() => exportCsv(items)}>
            <i className="fas fa-file-export me-1" /> Exportar
          </button>
          <button className="btn btn-outline-secondary" onClick={handleRefresh}>
            <i className="fas fa-sync-alt" />
          </button>
        </div>
      </div>

      {/* ===== CHIPS ===== */}
      <div className="mb-3 d-flex flex-wrap gap-2">
        {chips.map(c => (
          <div key={c.k} className="chip-filter">
            <i className="fas fa-filter"></i> {c.label}
            <button className="btn-close btn-close-transparent ms-2" onClick={() => removeChip(c.k)} />
          </div>
        ))}
      </div>

      {/* ===== ERROR ===== */}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* ===== REGISTROS ===== */}
      {loading ? (
        <div className="row g-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="col-xl-4 col-lg-6 mb-4"><div className="skeleton"/></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <img src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=520&auto=format&fit=crop" style={{ maxWidth: 220 }} className="mb-3 rounded" alt="" />
          <h5 className="text-success">No hay hidropónicos</h5>
          <p className="text-muted">Crea tu primer hidropónico para comenzar a programar cosechas y monitoreo.</p>
          <div className="d-flex justify-content-center gap-2">
            <ModalNuevoHidroponico onCreated={handleRefresh} />
            {import.meta.env.DEV && <SeedHidroponicos onDone={handleRefresh} />}
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {cards.map(c => (
            <div key={c.id} className="col-xl-4 col-lg-6 mb-4">
              <div
                className="card card-hidro border-0 h-100"
                onClick={() => openModal(c)}
              >
                <div className="card-body d-flex flex-column h-100">
                  <div className="d-flex align-items-start mb-3 gap-3">
                    <div className="mini-icon"><i className="fas fa-seedling fa-lg text-success"/></div>
                    <div>
                      <h5 className="mb-1">{c.nombre || `Hidro #${c.numero ?? c.id}`}</h5>
                      <div className="small text-muted">#{c.numero ?? c.id} · Creado {c.creadoEn ? new Date(c.creadoEn).toLocaleDateString() : "N/D"}</div>
                    </div>
                    <div className="ms-auto">
                      <span className={`hidro-badge ${c.estado === 0 ? "hidro-free" : c.estado === 1 ? "hidro-occupied" : "hidro-paused"}`}>
                        {STATE_LABEL[c.estado]}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted mb-3 line-clamp-3">{c.observaciones || "—"}</p>
                  <div className="mt-auto d-flex align-items-center justify-content-between">
                    <div className="d-flex gap-2 align-items-center small text-muted">
                      <i className="fas fa-layer-group me-1"/> {c.bandejas} bandejas
                    </div>
                    <div className="d-flex gap-2">
                      <Link to={`/hidroponicos/${c.id}/edit`} className="btn btn-sm btn-outline-primary rounded-pill">Editar</Link>
                      <button
                        className="btn btn-sm btn-outline-danger rounded-pill"
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== PAGINACIÓN ===== */}
      {totalPages > 1 && (
        <nav className="mt-3">
          <ul className="pagination pagination-sm justify-content-center">
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage(p => Math.max(1, p-1))}>&laquo;</button>
            </li>
            {Array.from({ length: totalPages }).map((_, i) => (
              <li key={i} className={`page-item ${page === i+1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPage(i+1)}>{i+1}</button>
              </li>
            ))}
            <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p+1))}>&raquo;</button>
            </li>
          </ul>
        </nav>
      )}

      {/* ===== MODAL ===== */}
      <ModalDetalleHidroponico show={showModal} onClose={() => setShowModal(false)} hidro={modalHidro} />
    </div>
  );
}

// ===== FUNCIÓN DE EXPORT CSV =====
function exportCsv(itemsToExport) {
  const STATE_LABEL = { 0: "Libre", 1: "Ocupado", 2: "Mantenimiento" };
  const rows = [
    ["Id","Nombre","Numero","CantidadBandejas","Estado","CreadoEn"].join(","),
    ...itemsToExport.map(d => [d.id,d.nombre,d.numero??"",d.bandejas??"",STATE_LABEL[d.estado],d.creadoEn??""].map(quoteCsv).join(","))
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download="hidroponicos.csv"; a.click(); URL.revokeObjectURL(url);
}
function quoteCsv(s){ const needs=/[",\n]/.test(s); return needs ? `"${(s??"").toString().replace(/"/g,'""')}"` : (s??""); }
