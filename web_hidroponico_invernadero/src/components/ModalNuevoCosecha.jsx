import { useEffect, useRef, useState } from "react";
import { createCosecha } from "../services/cosechas";
import { listHydroponicos } from "../services/hidroponicos";

function addDaysIso(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * ModalNuevoCosecha
 * Props:
 *  - onCreated: () => void   (llamado cuando la cosecha fue creada)
 *
 * Requiere:
 *  - bootstrap bundle + fontawesome ya incluidos en index.html (igual que el resto de la app)
 */
export default function ModalNuevoCosecha({ onCreated }) {
  const modalRef = useRef(null);
  const bsModalRef = useRef(null);

  const [form, setForm] = useState({
    hidroponicoId: "",
    nombreZafra: "",
    fechaInicio: todayIso(),
    fechaEstimulada: addDaysIso(todayIso(), 15),
    fechaFin: addDaysIso(todayIso(), 15),
    observaciones: "",
    estado: "ACTIVA",
  });

  const [hidros, setHidros] = useState([]); // lista de hidropónicos cargados
  const [loadingHydros, setLoadingHydros] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Init modal bootstrap
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const bs = window.bootstrap;
    if (!bs) return;
    bsModalRef.current = new bs.Modal(el, { backdrop: "static", keyboard: false });

    // reset form when modal opens (optional)
    el.addEventListener("show.bs.modal", () => {
      setError("");
      // recarga hidros cada vez que se abre para obtener disponibilidad actual
      fetchHydros();
    });

    return () => {
      bsModalRef.current?.dispose();
      bsModalRef.current = null;
    };
  }, []);

  // fetch hidropónicos disponibles (desocupados)
  async function fetchHydros() {
    try {
      setLoadingHydros(true);
      setError("");
      // pedimos muchos (ajusta pageSize si lo requieres)
      const res = await listHydroponicos({ page: 1, pageSize: 500 });
      let items = res.items || [];

      // Normalizar y filtrar por estado "desocupado".
      // Tu tabla tiene `Estado INT` donde 0 = desocupado (según comentaste).
      // Aceptamos varias formas por si la API devuelve string/num/estado textual.
      const isFree = (h) => {
        if (h.estado === 0 || h.estado === "0") return true;
        const s = (h.estado || "").toString().toLowerCase();
        return s === "0" || s === "desocupado" || s === "libre" || s === "activo" || s === "disponible";
      };

      // Si el backend no devuelve campo estado, asumimos todos disponibles (fallback)
      const filtered = items.filter((h) => (h.estado !== undefined ? isFree(h) : true));

      // Orden amigable por NumeroHidroponico / Nombre
      filtered.sort((a, b) => {
        if (a.numeroHidroponico && b.numeroHidroponico) return a.numeroHidroponico - b.numeroHidroponico;
        return (a.nombre || "").localeCompare(b.nombre || "");
      });

      setHidros(filtered);
      // si no hay hidros disponibles, usuario deberá ingresar id manual (se deja el select vacío)
      if (filtered.length === 0) {
        // no es error, solo aviso en la UI
      }
    } catch (err) {
      setError("No se pudo cargar hidropónicos. " + (err?.message || ""));
    } finally {
      setLoadingHydros(false);
    }
  }

  function openModal() {
    bsModalRef.current?.show();
  }
  function closeModal() {
    bsModalRef.current?.hide();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function handleFechaInicioChange(e) {
    const v = e.target.value;
    // actualizar estimulada/fin por defecto si el usuario no las tocó manualmente
    setForm((s) => {
      // si el usuario tenía las dos igualadas al antiguo predeterminado, las actualizamos;
      // si las editó, no las sobreescribimos.
      const oldStart = s.fechaInicio;
      const oldEst = s.fechaEstimulada;
      const oldFin = s.fechaFin;

      const newEstDefault = addDaysIso(v, 15);
      const newFinDefault = addDaysIso(v, 15);

      const est = (oldEst === addDaysIso(oldStart, 15) || !oldEst) ? newEstDefault : oldEst;
      const fin = (oldFin === addDaysIso(oldStart, 15) || !oldFin) ? newFinDefault : oldFin;

      return { ...s, fechaInicio: v, fechaEstimulada: est, fechaFin: fin };
    });
  }

  function validate() {
    if (!form.hidroponicoId) return "Selecciona un hidropónico (HidroponicoId).";
    if (!form.fechaInicio) return "Fecha de inicio es requerida.";
    if (!form.fechaEstimulada) return "Fecha estimulada es requerida.";
    if (!form.fechaFin) return "Fecha fin es requerida.";

    const f0 = new Date(form.fechaInicio);
    const f1 = new Date(form.fechaEstimulada);
    const f2 = new Date(form.fechaFin);

    if (f0 > f1) return "FechaInicio debe ser <= FechaEstimulada.";
    if (f1 > f2) return "FechaEstimulada debe ser <= FechaFin.";

    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        hidroponicoId: Number(form.hidroponicoId),
        nombreZafra: form.nombreZafra || null,
        fechaInicio: new Date(form.fechaInicio).toISOString(),
        fechaEstimulada: new Date(form.fechaEstimulada).toISOString(),
        fechaFin: new Date(form.fechaFin).toISOString(),
        observaciones: form.observaciones || null,
        estado: "ACTIVA" // aseguro estado activo al crear
      };

      const created = await createCosecha(payload);

      // notificar al padre
      onCreated?.(created);
      // cerrar y reset
      setForm({
        hidroponicoId: "",
        nombreZafra: "",
        fechaInicio: todayIso(),
        fechaEstimulada: addDaysIso(todayIso(), 15),
        fechaFin: addDaysIso(todayIso(), 15),
        observaciones: "",
        estado: "ACTIVA",
      });
      closeModal();
    } catch (err) {
      setError(err?.message || "Error creando cosecha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        /* pequeños estilos locales para el modal */
        .modal-fancy .modal-content {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
          transform-origin: center top;
          animation: popIn .18s ease;
        }
        @keyframes popIn {
          from { transform: translateY(-8px) scale(.995); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .modal-fancy .form-label { font-weight: 600; color: #6b7280; }
        .modal-fancy .input-icon { width: 42px; display:flex; align-items:center; justify-content:center; color: #6c757d; }
        .small-note { font-size: 0.85rem; color: #6c757d; }
        .hidro-option { display:flex; gap:8px; align-items:center; }
        .badge-num { background: #f1fdf6; color: #0f5132; padding: 4px 8px; border-radius: 10px; font-weight:600; font-size:0.85rem; }
      `}</style>

      {/* trigger button */}
      <button type="button" className="btn btn-success btn-lg-sm" onClick={openModal} title="Nueva cosecha">
        <i className="fas fa-plus me-2" /> Nueva cosecha
      </button>

      {/* Modal */}
      <div className="modal modal-fancy fade" tabIndex="-1" ref={modalRef} aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header border-0">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="fas fa-tractor fa-lg me-2 text-success"></i>
                  Nueva Cosecha
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Cerrar"></button>
              </div>

              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Hidropónico *</label>
                    <div className="input-group">
                      <span className="input-group-text input-icon"><i className="fas fa-water"></i></span>
                      <select
                        name="hidroponicoId"
                        className="form-select"
                        value={form.hidroponicoId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecciona un hidropónico disponible…</option>
                        {loadingHydros && <option> Cargando…</option>}
                        {!loadingHydros && hidros.length === 0 && <option value="">No hay hidropónicos libres</option>}
                        {hidros.map(h => (
                          <option key={h.id} value={h.id}>
                            {/* etiqueta: [numero] nombre */}
                            {`${h.numeroHidroponico ?? h.numero ?? ""} — ${h.nombre ?? h.nombreHidroponico ?? "Sin nombre"}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="small-note mt-1">Se listan sólo hidropónicos desocupados (estado = 0).</div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Nombre zafra</label>
                    <div className="input-group">
                      <span className="input-group-text input-icon"><i className="fas fa-tag"></i></span>
                      <input name="nombreZafra" type="text" className="form-control" value={form.nombreZafra} onChange={handleChange} placeholder="Ej. Zafra 2025-10-01 lote A" maxLength={200}/>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Fecha inicio *</label>
                    <div className="input-group">
                      <span className="input-group-text input-icon"><i className="far fa-calendar-check"></i></span>
                      <input name="fechaInicio" type="date" className="form-control" value={form.fechaInicio} onChange={handleFechaInicioChange} required/>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Fecha estimulada *</label>
                    <div className="input-group">
                      <span className="input-group-text input-icon"><i className="fas fa-sun"></i></span>
                      <input name="fechaEstimulada" type="date" className="form-control" value={form.fechaEstimulada} onChange={handleChange} required/>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Fecha fin *</label>
                    <div className="input-group">
                      <span className="input-group-text input-icon"><i className="far fa-flag"></i></span>
                      <input name="fechaFin" type="date" className="form-control" value={form.fechaFin} onChange={handleChange} required/>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Observaciones</label>
                    <div className="input-group">
                      <span className="input-group-text input-icon"><i className="fas fa-note-sticky"></i></span>
                      <textarea name="observaciones" className="form-control" rows={3} value={form.observaciones} onChange={handleChange} placeholder="Notas opcionales..." />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Estado</label>
                    <div className="input-group">
                      <span className="input-group-text input-icon"><i className="fas fa-toggle-on"></i></span>
                      <select name="estado" className="form-select" value={form.estado} onChange={handleChange}>
                        <option value="ACTIVA">ACTIVA</option>
                        <option value="PAUSADA">PAUSADA</option>
                        <option value="FINALIZADA">FINALIZADA</option>
                      </select>
                    </div>
                    <div className="small-note mt-1">Al crear, el estado será guardado como <strong>ACTIVA</strong> por defecto.</div>
                  </div>

                </div>
              </div>

              <div className="modal-footer border-0">
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={loading}>
                  Cancelar
                </button>

                <button type="submit" className="btn btn-success d-flex align-items-center" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2" /> Crear cosecha
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
