// src/components/ModalNuevoHidroponico.jsx
import { useEffect, useRef, useState } from "react";
import { createHydroponico } from "../services/hidroponicos";

/**
 * Props:
 *  - onCreated(createdItem)  => optional callback to notify parent
 */
export default function ModalNuevoHidroponico({ onCreated }) {
  const modalRef = useRef(null);
  const bsModalRef = useRef(null);

  const [form, setForm] = useState({
    nombre: "",
    numeroHidroponico: "",
    observaciones: "",
    cantidadBandejas: "",
    estado: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const bs = window.bootstrap;
    if (!bs) return;
    bsModalRef.current = new bs.Modal(el, { backdrop: "static", keyboard: false });

    // limpiar mensajes al abrir
    el.addEventListener("show.bs.modal", () => {
      setError("");
      setOkMsg("");
      setLoading(false);
    });

    return () => bsModalRef.current?.dispose();
  }, []);

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

  function validate() {
    if (!form.nombre || form.nombre.trim().length < 2) return "Nombre mínimo de 2 caracteres.";
    if (!form.numeroHidroponico || isNaN(Number(form.numeroHidroponico))) return "NumeroHidroponico debe ser un número.";
    // cantidad bandejas opcional pero si existe validar
    if (form.cantidadBandejas && Number(form.cantidadBandejas) < 0) return "Cantidad de bandejas inválida.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setOkMsg("");
    const v = validate();
    if (v) { setError(v); return; }

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        numeroHidroponico: Number(form.numeroHidroponico),
        observaciones: form.observaciones || null,
        cantidadBandejas: form.cantidadBandejas ? Number(form.cantidadBandejas) : null,
        estado: Number(form.estado) // por defecto 0
      };

      const created = await createHydroponico(payload);
      setOkMsg("Hidropónico creado correctamente.");
      onCreated?.(created);
      // reset form (pero mantén modal abierto por si quieren crear más)
      setForm({ nombre: "", numeroHidroponico: "", observaciones: "", cantidadBandejas: "", estado: 0 });
      // auto cerrar unos ms después
      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      setError(err?.message || "Error creando hidropónico.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="btn btn-success" onClick={openModal} title="Nuevo hidropónico">
        <i className="fas fa-plus me-2"></i> Nuevo hidropónico
      </button>

      <div className="modal fade" tabIndex="-1" ref={modalRef} aria-hidden="true">
        <div className="modal-dialog modal-md modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: 12, overflow: "hidden", animation: "popIn .16s ease" }}>
            <style>{`
              @keyframes popIn { from { transform: translateY(-6px) scale(.995); opacity:0 } to { transform: none; opacity:1 } }
              .input-icon { width:44px; display:flex; align-items:center; justify-content:center; color:#6c757d; }
            `}</style>

            <form onSubmit={handleSubmit}>
              <div className="modal-header border-0 pb-0">
                <div className="d-flex align-items-center">
                  <div style={{ width:44, height:44, borderRadius:10, background:"#e9f9f0", display:"flex", alignItems:"center", justifyContent:"center", marginRight:12 }}>
                    <i className="fas fa-water text-success fa-lg" />
                  </div>
                  <div>
                    <h5 className="modal-title mb-0">Nuevo hidropónico</h5>
                    <div className="small text-muted">Registra una nueva unidad de cultivo</div>
                  </div>
                </div>

                <button type="button" className="btn-close" onClick={closeModal} />
              </div>

              <div className="modal-body pt-3">
                {error && <div className="alert alert-danger">{error}</div>}
                {okMsg && <div className="alert alert-success">{okMsg}</div>}

                <div className="mb-3">
                  <label className="form-label small">Nombre</label>
                  <div className="input-group">
                    <span className="input-group-text input-icon"><i className="fas fa-seedling"></i></span>
                    <input name="nombre" className="form-control" value={form.nombre} onChange={handleChange} placeholder="Ej: Hidro A - Invernadero 1" />
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-sm-6 mb-3">
                    <label className="form-label small">Número</label>
                    <div className="input-group">
                      <span className="input-group-text input-icon"><i className="fas fa-hashtag"></i></span>
                      <input name="numeroHidroponico" type="number" className="form-control" value={form.numeroHidroponico} onChange={handleChange} placeholder="1" />
                    </div>
                  </div>

                  <div className="col-sm-6 mb-3">
                    <label className="form-label small">Bandejas</label>
                    <div className="input-group">
                      <span className="input-group-text input-icon"><i className="fas fa-layer-group"></i></span>
                      <input name="cantidadBandejas" type="number" className="form-control" value={form.cantidadBandejas} onChange={handleChange} placeholder="16" />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small">Observaciones</label>
                  <div className="input-group">
                    <span className="input-group-text input-icon"><i className="fas fa-sticky-note"></i></span>
                    <input name="observaciones" className="form-control" value={form.observaciones} onChange={handleChange} placeholder="Notas opcionales..." />
                  </div>
                </div>

                <div className="mb-0">
                  <label className="form-label small">Estado</label>
                  <div className="input-group">
                    <span className="input-group-text input-icon"><i className="fas fa-toggle-on"></i></span>
                    <select name="estado" className="form-select" value={form.estado} onChange={handleChange}>
                      <option value={0}>Libre / Disponible</option>
                      <option value={1}>Ocupado</option>
                      <option value={2}>En mantenimiento</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0">
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn btn-success d-flex align-items-center" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creando...</> : <><i className="fas fa-check me-2" />Crear</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
