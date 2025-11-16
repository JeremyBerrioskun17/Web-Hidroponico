// src/pages/Hidroponicos.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  listHydroponicos,
  deleteHydroponico,
  listHydroponicosAll
} from "../services/hidroponicos"; // ajusta ruta si tu structure es distinta
// import ModalNuevoHidroponico from "../components/ModalNuevoHidroponico"; // lo implementamos después

const PAGE_SIZE = 9;

export default function Hidroponicos() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [refreshFlag, setRefreshFlag] = useState(0); // para refrescar desde modal

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const params = { page, pageSize: PAGE_SIZE, q };
        const data = await listHydroponicos(params);
        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err.message || "Error cargando hidropónicos.");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, q, refreshFlag]);

  // quick search local debounce-ish (simple)
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 250);
    return () => clearTimeout(t);
  }, [q]);

  function handleRefresh() {
    setRefreshFlag((s) => s + 1);
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este hidropónico? Esta acción no se puede deshacer.")) return;
    try {
      setLoading(true);
      await deleteHydroponico(id);
      handleRefresh();
    } catch (err) {
      alert(err?.message || "Error al eliminar.");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const cards = useMemo(() => items.map(h => ({
    id: h.id,
    nombre: h.nombre,
    numero: h.numeroHidroponico ?? h.numero ?? h.numeroHidroponico,
    bandejas: h.cantidadBandejas ?? "",
    observaciones: h.observaciones ?? "",
    estado: h.estado ?? 0,
    creadoEn: h.creadoEn
  })), [items]);

  return (
    <div className="container-fluid" id="pageHidroponicos">
      <style>{`
        /* scoped styles for the module */
        #pageHidroponicos .card-hidro {
          border-radius: 14px;
          transition: transform .18s ease, box-shadow .18s ease;
          overflow: hidden;
        }
        #pageHidroponicos .card-hidro:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 18px 40px rgba(12, 58, 49, .12); }
        .hidro-badge { font-weight:700; padding:6px 10px; border-radius:999px; font-size:0.85rem; }
        .hidro-free { background:#e9f7ef; color:#0f5132; }
        .hidro-occupied { background:#fff8e6; color:#7a4a00; }
        .hidro-paused { background:#f3f4f6; color:#374151;}
        .skeleton { background: linear-gradient(90deg,#f3f3f3 25%,#ececec 37%,#f3f3f3 63%); background-size: 400% 100%; animation: shimmer 1.2s linear infinite; height: 120px; border-radius: 12px;}
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0}}
        .mini-icon { width:38px; height:38px; display:flex; align-items:center; justify-content:center; border-radius:10px; background:rgba(0,0,0,0.04) }
      `}</style>

      <div className="d-sm-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h3 mb-0 text-success"><i className="fas fa-water me-2"></i> Hidropónicos</h1>
          <div className="small text-muted">Un vistazo general a tus sistemas — crea, edita y administra fácilmente.</div>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <div className="input-group me-2" style={{ minWidth: 280 }}>
            <span className="input-group-text"><i className="fas fa-search"></i></span>
            <input className="form-control" placeholder="Buscar por nombre o número..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn-outline-secondary" onClick={() => { setQ(""); setPage(1); }}>
              <i className="fas fa-times" />
            </button>
          </div>

          <ModalNuevoHidroponico onCreated={handleRefresh} />

          <button className="btn btn-outline-success" onClick={handleRefresh} title="Refrescar">
            <i className="fas fa-sync-alt me-1"></i> Refrescar
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="row g-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="col-xl-4 col-lg-6 mb-4"><div className="skeleton" /></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <img src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=520&auto=format&fit=crop" style={{ maxWidth: 220 }} className="mb-3 rounded" alt="" />
          <h5 className="text-success">No hay hidropónicos</h5>
          <p className="text-muted">Crea tu primer hidropónico para comenzar a programar cosechas y monitoreo.</p>
          <ModalNuevoHidroponico onCreated={handleRefresh} />
        </div>
      ) : (
        <>
          <div className="row g-3">
            {cards.map(c => (
              <div key={c.id} className="col-xl-4 col-lg-6 mb-4">
                <div className="card card-hidro border-0 h-100">
                  <div className="card-body d-flex flex-column h-100">
                    <div className="d-flex align-items-start mb-3 gap-3">
                      <div className="mini-icon"><i className="fas fa-seedling fa-lg text-success" /></div>
                      <div>
                        <h5 className="mb-1">{c.nombre || `Hidro #${c.numero ?? c.id}`}</h5>
                        <div className="small text-muted">#{c.numero ?? c.id} · Creado {new Date(c.creadoEn).toLocaleDateString()}</div>
                      </div>

                      <div className="ms-auto d-flex align-items-center gap-2">
                        <span className={`hidro-badge ${c.estado === 0 ? "hidro-free" : c.estado === 1 ? "hidro-occupied" : "hidro-paused"}`}>
                          {c.estado === 0 ? "Libre" : c.estado === 1 ? "Ocupado" : "Otro"}
                        </span>
                      </div>
                    </div>

                    <p className="text-muted mb-3 line-clamp-3">{c.observaciones || "—"}</p>

                    <div className="mt-auto d-flex align-items-center justify-content-between">
                      <div className="d-flex gap-2 align-items-center small text-muted">
                        <i className="fas fa-layer-group me-1"></i> {c.bandejas || "N/D"} bandejas
                      </div>

                      <div className="d-flex gap-2">
                        <Link to={`/hidroponicos/${c.id}`} className="btn btn-sm btn-outline-success rounded-pill" title="Ver detalle">
                          <i className="fas fa-eye" />
                        </Link>
                        <Link to={`/hidroponicos/${c.id}/edit`} className="btn btn-sm btn-outline-primary rounded-pill" title="Editar">
                          <i className="fas fa-edit" />
                        </Link>
                        <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => handleDelete(c.id)} title="Eliminar">
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-3" aria-label="Page navigation">
              <ul className="pagination pagination-sm justify-content-center">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}><button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>&laquo;</button></li>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}><button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button></li>
                ))}
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}><button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>&raquo;</button></li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

/* helpers */
function exportCsv(items) {
  const rows = [
    ["Id", "Nombre", "Numero", "CantidadBandejas", "Estado", "CreadoEn"].join(","),
    ...items.map(d =>
      [d.id, d.nombre, d.numero ?? "", d.bandejas ?? "", d.estado ?? "", d.creadoEn ?? ""].map(quoteCsv).join(",")
    )
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hidroponicos.csv";
  a.click();
  URL.revokeObjectURL(url);
}
function quoteCsv(s) {
  const needs = /[",\n]/.test(s);
  return needs ? `"${(s ?? "").toString().replace(/"/g, '""')}"` : (s ?? "");
}
