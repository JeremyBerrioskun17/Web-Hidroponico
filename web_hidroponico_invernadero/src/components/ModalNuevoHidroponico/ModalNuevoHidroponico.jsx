import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createHydroponico, updateHydroponico } from "../../services/hidroponicos";
import { listLocalizaciones } from "../../services/localizaciones";
import "./ModalNuevoHidroponico.css";

const EMPTY_FORM = {
  nombre: "",
  numeroHidroponico: "",
  observaciones: "",
  cantidadBandejas: "",
  estado: 0,
  localizacionId: "",
};

export default function ModalNuevoHidroponico({ onCreated, initial, onUpdated, onClose }) {
  const modalRef = useRef(null);
  const bsModalRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [localizaciones, setLocalizaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const bs = window.bootstrap;
    if (!bs?.Modal) return;

    bsModalRef.current = new bs.Modal(el, { backdrop: "static", keyboard: false });

    const onShow = () => {
      setError("");
      setLoading(false);
      fetchLocalizaciones();
    };

    const onHidden = () => {
      setError("");
      setLoading(false);
      onClose?.();
    };

    el.addEventListener("show.bs.modal", onShow);
    el.addEventListener("hidden.bs.modal", onHidden);

    return () => {
      try {
        el.removeEventListener("show.bs.modal", onShow);
        el.removeEventListener("hidden.bs.modal", onHidden);
      } catch {}
      try {
        bsModalRef.current?.dispose();
      } catch {}
      bsModalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchLocalizaciones() {
    try {
      const data = await listLocalizaciones();
      setLocalizaciones(Array.isArray(data) ? data : []);
    } catch {
      setLocalizaciones([]);
      setError("No se pudieron cargar las localizaciones.");
    }
  }

  function openModal() {
    setError("");
    setLoading(false);
    if (!initial) setForm(EMPTY_FORM);
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
    const nombre = String(form.nombre || "").trim();
    if (nombre.length < 2) return "El nombre debe tener al menos 2 caracteres.";

    if (!form.localizacionId) return "Debe seleccionar una localización.";

    const num = Number(form.numeroHidroponico);
    if (!Number.isFinite(num) || num <= 0) return "El número del hidropónico debe ser mayor que 0.";

    if (form.cantidadBandejas !== "" && Number(form.cantidadBandejas) < 0) {
      return "Cantidad de bandejas inválida (no puede ser negativa).";
    }

    if (String(form.observaciones || "").length > 500) return "Observaciones: máximo 500 caracteres.";

    return "";
  }

  useEffect(() => {
    if (!initial) return;

    setForm({
      nombre: initial.nombre ?? "",
      numeroHidroponico: initial.numeroHidroponico ?? initial.NumeroHidroponico ?? "",
      observaciones: initial.observaciones ?? "",
      cantidadBandejas: initial.cantidadBandejas ?? initial.CantidadBandejas ?? "",
      estado: initial.estado ?? initial.Estado ?? 0,
      localizacionId: initial.localizacionId ?? initial.LocalizacionId ?? "",
    });

    setTimeout(() => bsModalRef.current?.show(), 0);
  }, [initial]);

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    setError("");
    const v = validate();
    if (v) return setError(v);

    setLoading(true);
    try {
      const payload = {
        nombre: String(form.nombre).trim(),
        numeroHidroponico: Number(form.numeroHidroponico),
        observaciones: form.observaciones ? String(form.observaciones).trim() : null,
        cantidadBandejas: form.cantidadBandejas === "" ? null : Number(form.cantidadBandejas),
        estado: Number(form.estado),
        localizacionId: Number(form.localizacionId),
      };

      if (initial?.id) {
        await updateHydroponico(initial.id, payload);
        onUpdated?.();
      } else {
        await createHydroponico(payload);
        onCreated?.();
      }

      closeModal();
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      const serverMsg =
        typeof data === "string"
          ? data
          : data?.message
          ? data.message
          : data?.title
          ? data.title
          : data?.errors
          ? Object.values(data.errors).flat().join(" · ")
          : data
          ? JSON.stringify(data)
          : null;

      setError(serverMsg || `Error guardando el hidropónico. (HTTP ${status ?? "?"})`);
    } finally {
      setLoading(false);
    }
  }

  const chars = String(form.observaciones || "").length;

  const modalUI = (
    <div className="modal fade modal-fix-z hm-modal-root" tabIndex="-1" ref={modalRef} aria-hidden="true">
      {/* 👇 IMPORTANTE: SIN modal-dialog-centered en móvil (lo rompía con altura) */}
      <div className="modal-dialog hidro-dialog">
        <div className="modal-content hidro-modal">
          {loading && (
            <div className="modal-loading-overlay" aria-hidden="true">
              <div className="loader-box">
                <div className="spinner-border text-light" role="status" />
                <div className="mt-2">Guardando, por favor espere...</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="hidro-form">
            <fieldset disabled={loading}>
              {/* HEADER */}
              <div className="modal-header hidro-header">
                <div className="d-flex align-items-center gap-3">
                  <div className="icon-header" aria-hidden="true">
                    <i className="fas fa-water" />
                  </div>

                  <div>
                    <h5 className="mb-0">{initial?.id ? "Editar Hidropónico" : "Nuevo Hidropónico"}</h5>
                    <div className="hidro-subtitle">Registra una nueva unidad de cultivo.</div>
                  </div>
                </div>

                <button type="button" className="btn-close" onClick={closeModal} aria-label="Cerrar" />
              </div>

              {/* BODY (scroll real) */}
              <div className="modal-body hidro-body">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="row g-3">
                  <div className="col-12 col-lg-6">
                    <label className="form-label">Nombre *</label>
                    <div className="input-group input-group-soft">
                      <span className="input-group-text">
                        <i className="fas fa-seedling" />
                      </span>
                      <input
                        name="nombre"
                        className="form-control"
                        value={form.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Hidro A - Zona 1"
                        required
                        minLength={2}
                        maxLength={120}
                      />
                    </div>
                    <div className="field-hint">Nombre visible del módulo.</div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label">Localización *</label>
                    <div className="input-group input-group-soft">
                      <span className="input-group-text">
                        <i className="fas fa-map-marker-alt" />
                      </span>
                      <select
                        name="localizacionId"
                        className="form-select"
                        value={form.localizacionId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccione una localización</option>
                        {localizaciones.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field-hint">Ubicación física / zona del invernadero.</div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label">Número *</label>
                    <div className="input-group input-group-soft">
                      <span className="input-group-text">
                        <i className="fas fa-hashtag" />
                      </span>
                      <input
                        type="number"
                        name="numeroHidroponico"
                        className="form-control"
                        value={form.numeroHidroponico}
                        onChange={handleChange}
                        placeholder="Ej: 12"
                        required
                        min={1}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="field-hint">Número único para identificación rápida.</div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label">Bandejas</label>
                    <div className="input-group input-group-soft">
                      <span className="input-group-text">
                        <i className="fas fa-layer-group" />
                      </span>
                      <input
                        type="number"
                        name="cantidadBandejas"
                        className="form-control"
                        value={form.cantidadBandejas}
                        onChange={handleChange}
                        placeholder="Ej: 48"
                        min={0}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="field-hint">Opcional. Capacidad total de bandejas.</div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label">Estado</label>
                    <div className="input-group input-group-soft">
                      <span className="input-group-text">
                        <i className="fas fa-toggle-on" />
                      </span>
                      <select name="estado" className="form-select" value={form.estado} onChange={handleChange}>
                        <option value={0}>Disponible</option>
                        <option value={1}>Ocupado</option>
                        <option value={2}>Mantenimiento</option>
                      </select>
                    </div>
                    <div className="field-hint">
                      Recomendado: <b>Disponible</b> al crear.
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Observaciones</label>
                    <div className="input-group input-group-soft">
                      <span className="input-group-text">
                        <i className="fas fa-note-sticky" />
                      </span>
                      <textarea
                        name="observaciones"
                        className="form-control"
                        value={form.observaciones}
                        onChange={handleChange}
                        placeholder="Notas opcionales (ej. mantenimiento, sensores, condiciones...)"
                        rows={4}
                        maxLength={500}
                      />
                    </div>

                    <div className="obs-foot">
                      <div className="field-hint mb-0">Máx. 500 caracteres.</div>
                      <div className={`char-count ${chars >= 500 ? "is-max" : ""}`}>{chars}/500</div>
                    </div>
                  </div>
                </div>

                {/* padding extra para que el último campo no quede detrás del footer */}
                <div className="hidro-safe-space" />
              </div>

              {/* FOOTER (siempre visible) */}
              <div className="modal-footer hidro-footer">
                <button type="button" className="btn btn-danger" onClick={closeModal}>
                  Cancelar
                </button>

                <button type="submit" className="btn btn-success">
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2" />
                      {initial?.id ? "Guardar cambios" : "Guardar"}
                    </>
                  )}
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ✅ Botón verde (con clases Bootstrap intactas) */}
      <button type="button" className="btn btn-success btn-ui btn-new-hidro" onClick={openModal}>
        <i className="fas fa-plus-circle me-2" />
        Nuevo hidropónico
      </button>

      {createPortal(modalUI, document.body)}
    </>
  );
}
