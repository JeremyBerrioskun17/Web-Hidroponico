import { useEffect, useRef, useState } from "react";
import { createHydroponico, updateHydroponico } from "../../services/hidroponicos";
import { listLocalizaciones } from "../../services/localizaciones";
import "./ModalNuevoHidroponico.css";

/**
 * Props:
 *  - onCreated(createdItem) => callback opcional
 */
export default function ModalNuevoHidroponico({ onCreated, initial, onUpdated, onClose }) {
  const modalRef = useRef(null);
  const bsModalRef = useRef(null);

  const [form, setForm] = useState({
    nombre: "",
    numeroHidroponico: "",
    observaciones: "",
    cantidadBandejas: "",
    estado: 0,
    localizacionId: ""
  });

  const [localizaciones, setLocalizaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    const el = modalRef.current;
    if (!el || !window.bootstrap) return;

    bsModalRef.current = new window.bootstrap.Modal(el, {
      backdrop: "static",
      keyboard: false
    });

    el.addEventListener("show.bs.modal", async () => {
      setError("");
      setOkMsg("");
      setLoading(false);

      try {
        const data = await listLocalizaciones();
        setLocalizaciones(data);
      } catch {
        setError("No se pudieron cargar las localizaciones.");
      }
    });

    el.addEventListener("hidden.bs.modal", () => {
      onClose?.();
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
    setForm(s => ({ ...s, [name]: value }));
  }

  function validate() {
    if (!form.nombre || form.nombre.trim().length < 2)
      return "El nombre debe tener al menos 2 caracteres.";

    if (!form.numeroHidroponico || isNaN(Number(form.numeroHidroponico)))
      return "El número del hidropónico debe ser válido.";

    if (!form.localizacionId)
      return "Debe seleccionar una localización.";

    if (form.cantidadBandejas && Number(form.cantidadBandejas) < 0)
      return "Cantidad de bandejas inválida.";

    return "";
  }

  // when `initial` prop changes, populate form and open modal for edit
  useEffect(() => {
    if (!initial) return;
    setForm({
      nombre: initial.nombre ?? "",
      numeroHidroponico: initial.numeroHidroponico ?? "",
      observaciones: initial.observaciones ?? "",
      cantidadBandejas: initial.cantidadBandejas ?? "",
      estado: initial.estado ?? 0,
      localizacionId: initial.localizacionId ?? ""
    });
    // show modal
    setTimeout(() => bsModalRef.current?.show(), 50);
  }, [initial]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setOkMsg("");

    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        numeroHidroponico: Number(form.numeroHidroponico),
        observaciones: form.observaciones || null,
        cantidadBandejas: form.cantidadBandejas
          ? Number(form.cantidadBandejas)
          : null,
        estado: Number(form.estado),
        localizacionId: Number(form.localizacionId)
      };

      if (initial && initial.id) {
        // update flow
        await updateHydroponico(initial.id, payload);
        const updated = { ...initial, ...payload };
        setOkMsg("Hidropónico actualizado correctamente.");
        onUpdated?.(updated);
      } else {
        const created = await createHydroponico(payload);
        setOkMsg("Hidropónico creado correctamente.");
        onCreated?.(created);
      }

      setForm({
        nombre: "",
        numeroHidroponico: "",
        observaciones: "",
        cantidadBandejas: "",
        estado: 0,
        localizacionId: ""
      });

      setTimeout(closeModal, 700);
    } catch (err) {
      setError(err?.message || (initial && initial.id ? "Error actualizando el hidropónico." : "Error creando el hidropónico."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="btn btn-success" onClick={() => { setForm({ nombre: "", numeroHidroponico: "", observaciones: "", cantidadBandejas: "", estado: 0, localizacionId: "" }); openModal(); }}>
        <i className="fas fa-plus-circle me-2"></i>
        Nuevo hidropónico
      </button>

      <div className="modal fade" tabIndex="-1" ref={modalRef}>
        <div className="modal-dialog modal-md modal-dialog-centered">
          <div className="modal-content hidro-modal modal-fancy">
            <form onSubmit={handleSubmit}>
              {loading && (
                <div className="modal-loading-overlay">
                  <div className="loader-box">
                    <div className="spinner-border text-light" role="status"></div>
                    <div className="mt-2">Guardando, por favor espere...</div>
                  </div>
                </div>
              )}

              <fieldset disabled={loading}>
                {/* HEADER */}
                <div className="modal-header hidro-header">
                  <div className="d-flex align-items-center">
                    <div className="icon-header">
                      <i className="fas fa-water"></i>
                    </div>
                    <div>
                      <h5 className="mb-0">{initial && initial.id ? 'Editar Hidropónico' : 'Nuevo Hidropónico'}</h5>
                      <small className="text-muted">Registra una nueva unidad de cultivo</small>
                    </div>
                  </div>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                {/* BODY */}
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  {okMsg && <div className="alert alert-success">{okMsg}</div>}

                  {/* NOMBRE */}
                  <div className="mb-3">
                    <label className="form-label">Nombre del hidropónico</label>
                    <div className="form-desc">Identificador visible del sistema de cultivo.</div>
                    <div className="input-group">
                      <span className="input-group-text"><i className="fas fa-seedling"></i></span>
                      <input name="nombre" className="form-control" value={form.nombre} onChange={handleChange} placeholder="Ej: Hidro A - Zona 1" />
                    </div>
                  </div>

                  {/* LOCALIZACIÓN */}
                  <div className="mb-3">
                    <label className="form-label">Localización</label>
                    <div className="form-desc">Lugar físico donde se encuentra el hidropónico.</div>
                    <div className="input-group">
                      <span className="input-group-text"><i className="fas fa-map-location-dot"></i></span>
                      <select name="localizacionId" className="form-select" value={form.localizacionId} onChange={handleChange}>
                        <option value="">Seleccione una localización</option>
                        {localizaciones.map(l => (
                          <option key={l.id} value={l.id}>{l.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* NÚMERO + BANDEJAS */}
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label">Número</label>
                      <div className="form-desc">Número interno o consecutivo.</div>
                      <div className="input-group">
                        <span className="input-group-text"><i className="fas fa-hashtag"></i></span>
                        <input type="number" name="numeroHidroponico" className="form-control" value={form.numeroHidroponico} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Bandejas</label>
                      <div className="form-desc">Cantidad total de bandejas (opcional).</div>
                      <div className="input-group">
                        <span className="input-group-text"><i className="fas fa-layer-group"></i></span>
                        <input type="number" name="cantidadBandejas" className="form-control" value={form.cantidadBandejas} onChange={handleChange} />
                      </div>
                    </div>
                  </div>

                  {/* OBSERVACIONES */}
                  <div className="mt-3">
                    <label className="form-label">Observaciones</label>
                    <div className="form-desc">Comentarios adicionales o notas importantes.</div>
                    <div className="input-group">
                      <span className="input-group-text"><i className="fas fa-note-sticky"></i></span>
                      <input name="observaciones" className="form-control" value={form.observaciones} onChange={handleChange} />
                    </div>
                  </div>

                  {/* ESTADO */}
                  <div className="mt-3">
                    <label className="form-label">Estado</label>
                    <div className="form-desc">Estado actual del hidropónico.</div>
                    <div className="input-group">
                      <span className="input-group-text"><i className="fas fa-toggle-on"></i></span>
                      <select name="estado" className="form-select" value={form.estado} onChange={handleChange}>
                        <option value={0}>Disponible</option>
                        <option value={1}>Ocupado</option>
                        <option value={2}>Mantenimiento</option>
                      </select>
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* FOOTER */}
              <div className="modal-footer modal-fancy-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn btn-success btn-submit" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2 text-white" />Guardando...</>
                  ) : (
                    <><i className="fas fa-check me-2"></i>{initial && initial.id ? 'Guardar cambios' : 'Crear'}</>
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
