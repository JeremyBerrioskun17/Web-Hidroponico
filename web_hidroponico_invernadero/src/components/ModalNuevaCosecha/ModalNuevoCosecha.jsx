import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createCosecha } from "../../services/cosechas";
import { listHydroponicos } from "../../services/hidroponicos";
import "./ModalNuevoCosecha.css";

function addDaysIso(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function ModalNuevoCosecha({ onCreated }) {
  const dialogRef = useRef(null);

  const [show, setShow] = useState(false);

  const [form, setForm] = useState({
    hidroponicoId: "",
    nombreZafra: "",
    fechaInicio: todayIso(),
    fechaEstimulada: addDaysIso(todayIso(), 15),
    fechaFin: addDaysIso(todayIso(), 15),
    observaciones: "",
    estado: "ACTIVA",
  });

  const [hidros, setHidros] = useState([]);
  const [loadingHydros, setLoadingHydros] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openModal() {
    setError("");
    setShow(true);
  }

  function closeModal() {
    setShow(false);
    setError("");
  }

  // lock scroll + ESC + focus
  useEffect(() => {
    if (!show) return;

    const prevOverflow = document.body.style.overflow;
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);

    // focus modal
    const t = setTimeout(() => {
      try {
        dialogRef.current?.focus();
      } catch {}
    }, 10);

    // cargar hidros cada vez que abre
    fetchHydros();

    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
      document.body.style.overflow = prevOverflow || "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  async function fetchHydros() {
    try {
      setLoadingHydros(true);
      setError("");

      const res = await listHydroponicos({ page: 1, pageSize: 500 });
      const items = Array.isArray(res) ? res : (res.items || []);

      const isFree = (h) => {
        if (h.estado === 0 || h.estado === "0") return true;
        const s = (h.estado || h.Estado || "").toString().toLowerCase();
        return s === "0" || s === "libre" || s === "desocupado" || s === "disponible";
      };

      const filtered = items.filter((h) => (h.estado !== undefined ? isFree(h) : true));

      filtered.sort((a, b) => {
        const an = a.numeroHidroponico ?? a.numero ?? null;
        const bn = b.numeroHidroponico ?? b.numero ?? null;
        if (an != null && bn != null) return Number(an) - Number(bn);
        return (a.nombre || "").localeCompare(b.nombre || "");
      });

      setHidros(filtered);
    } catch (err) {
      setError("No se pudo cargar hidropónicos. " + (err?.message || ""));
      setHidros([]);
    } finally {
      setLoadingHydros(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function handleFechaInicioChange(e) {
    const v = e.target.value;

    setForm((s) => {
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
    if (v) return setError(v);

    setLoading(true);
    try {
      const payload = {
        hidroponicoId: Number(form.hidroponicoId),
        nombreZafra: form.nombreZafra || null,
        fechaInicio: new Date(form.fechaInicio).toISOString(),
        fechaEstimulada: new Date(form.fechaEstimulada).toISOString(),
        fechaFin: new Date(form.fechaFin).toISOString(),
        observaciones: form.observaciones || null,
        estado: "ACTIVA", // mantengo tu lógica original: siempre ACTIVA al crear
      };

      const created = await createCosecha(payload);

      onCreated?.(created);

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
      console.error("createCosecha error:", err);
      const srv = err?.response?.data ?? err?.response?.data?.message;
      const msg = srv
        ? (typeof srv === "string" ? srv : JSON.stringify(srv))
        : (err?.message || "Error creando cosecha.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function stop(e) {
    e.stopPropagation();
  }

  return (
    <>
      {/* Trigger button (igual que lo llamas desde Cosechas.jsx) */}
      <button
        type="button"
        className="btn btn-success btn-ui btn-ui-primary"
        onClick={openModal}
        title="Nueva cosecha"
      >
        <i className="fas fa-plus me-2" /> Nueva cosecha
      </button>

      {/* Modal */}
      {show &&
        createPortal(
          <div className="hdm-overlay" onMouseDown={closeModal}>
            <div
              className="hdm-dialog hdm-dialog-lg"
              role="dialog"
              aria-modal="true"
              aria-label="Nueva Cosecha"
              onMouseDown={stop}
              ref={dialogRef}
              tabIndex={-1}
            >
              <div className="modal-content modal-fancy hdm-modal">
                {/* HEADER */}
                <div className="modal-header border-0 hdm-header">
                  <div className="hdm-head">
                    <div className="hdm-icon">
                      <i className="fas fa-seedling" />
                    </div>

                    <div className="hdm-titleWrap">
                      <div className="hdm-kicker">
                        <span className="kicker-dot" />
                        Registro
                      </div>
                      <h5 className="modal-title hdm-title mb-0">Nueva Cosecha</h5>
                      <div className="hdm-sub">Crea una zafra y asígnala a un hidropónico libre.</div>
                    </div>
                  </div>

                  <button type="button" className="btn-close hdm-close" aria-label="Close" onClick={closeModal} />
                </div>

                {/* BODY */}
                <div className="modal-body hdm-body">
                  {error && <div className="alert alert-danger">{error}</div>}

                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Hidropónico *</label>

                        <div className="input-group input-group-soft">
                          <span className="input-group-text">
                            <i className="fas fa-water" />
                          </span>

                          <select
                            name="hidroponicoId"
                            className="form-select select-soft"
                            value={form.hidroponicoId}
                            onChange={handleChange}
                            required
                            disabled={loadingHydros}
                          >
                            <option value="">
                              {loadingHydros ? "Cargando hidropónicos..." : "Selecciona un hidropónico disponible…"}
                            </option>
                            {!loadingHydros && hidros.length === 0 && (
                              <option value="">No hay hidropónicos libres</option>
                            )}
                            {hidros.map((h) => (
                              <option key={h.id} value={h.id}>
                                {`${h.numeroHidroponico ?? h.numero ?? ""} — ${h.nombre ?? h.nombreHidroponico ?? "Sin nombre"}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-hint">
                          Se listan sólo hidropónicos libres (estado = 0 / “libre”).
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Nombre zafra</label>

                        <div className="input-group input-group-soft">
                          <span className="input-group-text">
                            <i className="fas fa-tag" />
                          </span>

                          <input
                            name="nombreZafra"
                            type="text"
                            className="form-control"
                            value={form.nombreZafra}
                            onChange={handleChange}
                            placeholder="Ej. Zafra 2025-10-01 lote A"
                            maxLength={200}
                          />
                        </div>

                        <div className="form-hint">Opcional. Útil para identificar lote/temporada.</div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Fecha inicio *</label>

                        <div className="input-group input-group-soft">
                          <span className="input-group-text">
                            <i className="far fa-calendar-check" />
                          </span>

                          <input
                            name="fechaInicio"
                            type="date"
                            className="form-control"
                            value={form.fechaInicio}
                            onChange={handleFechaInicioChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Fecha estimulada *</label>

                        <div className="input-group input-group-soft">
                          <span className="input-group-text">
                            <i className="fas fa-sun" />
                          </span>

                          <input
                            name="fechaEstimulada"
                            type="date"
                            className="form-control"
                            value={form.fechaEstimulada}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Fecha fin *</label>

                        <div className="input-group input-group-soft">
                          <span className="input-group-text">
                            <i className="far fa-flag" />
                          </span>

                          <input
                            name="fechaFin"
                            type="date"
                            className="form-control"
                            value={form.fechaFin}
                            onChange={handleChange}
                            required
                          />
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
                            rows={3}
                            value={form.observaciones}
                            onChange={handleChange}
                            placeholder="Notas opcionales..."
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Estado</label>

                        <div className="input-group input-group-soft">
                          <span className="input-group-text">
                            <i className="fas fa-toggle-on" />
                          </span>

                          <select
                            name="estado"
                            className="form-select select-soft"
                            value={form.estado}
                            onChange={handleChange}
                          >
                            <option value="ACTIVA">ACTIVA</option>
                            <option value="PAUSADA">PAUSADA</option>
                            <option value="FINALIZADA">FINALIZADA</option>
                          </select>
                        </div>

                        <div className="form-hint">
                          Al crear, se guarda como <b>ACTIVA</b> (misma lógica que tenías).
                        </div>
                      </div>

                      <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                        <button type="button" className="btn btn-outline-secondary btn-ui" onClick={closeModal} disabled={loading}>
                          Cancelar
                        </button>

                        <button type="submit" className="btn btn-success btn-ui btn-ui-primary" disabled={loading}>
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                              Creando...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-check me-2" /> Crear cosecha
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* FOOTER */}
                <div className="modal-footer border-0 hdm-footer">
                  <div className="hdm-footnote">
                    Tip: si no hay hidropónicos libres, libera uno desde el módulo de Hidropónicos.
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
