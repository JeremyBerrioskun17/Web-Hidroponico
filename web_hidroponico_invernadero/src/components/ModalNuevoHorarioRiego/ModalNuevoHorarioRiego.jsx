import { useEffect, useRef, useState } from "react";
import "./ModalNuevoHorarioRiego.css";
import { createHorarioRiego } from "../../services/horariosRiego";

const DIAS = [
  { id: 1, nombre: "Lunes" },
  { id: 2, nombre: "Martes" },
  { id: 3, nombre: "Miércoles" },
  { id: 4, nombre: "Jueves" },
  { id: 5, nombre: "Viernes" },
  { id: 6, nombre: "Sábado" },
  { id: 7, nombre: "Domingo" },
];

export default function ModalNuevoHorarioRiego({ show, onClose }) {
  const modalRef = useRef(null);
  const bsModal = useRef(null);

  const [form, setForm] = useState({
    diaSemana: "",
    horaInicio: "",
    duracionValor: 10,
    duracionUnidad: "M",
    activo: true,
  });

  const getNombreDia = (id) =>
    DIAS.find((d) => d.id === Number(id))?.nombre || "";

  /* ===============================
     Bootstrap Modal lifecycle
  =============================== */
  useEffect(() => {
    if (!modalRef.current || !window.bootstrap) return;

    bsModal.current = new window.bootstrap.Modal(modalRef.current, {
      backdrop: "static",
      keyboard: false,
    });

    modalRef.current.addEventListener("hidden.bs.modal", onClose);

    return () => {
      modalRef.current?.removeEventListener("hidden.bs.modal", onClose);
      bsModal.current?.dispose();
    };
  }, [onClose]);

  useEffect(() => {
    if (!bsModal.current) return;
    show ? bsModal.current.show() : bsModal.current.hide();
  }, [show]);

  /* ===============================
     Handlers
  =============================== */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm({
      diaSemana: "",
      horaInicio: "",
      duracionValor: 10,
      duracionUnidad: "M",
      activo: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        diaSemana: Number(form.diaSemana),
        nombreDia: getNombreDia(form.diaSemana),
        horaInicio:
          form.horaInicio.length === 5
            ? `${form.horaInicio}:00`
            : form.horaInicio,
        duracionValor: Number(form.duracionValor),
        duracionUnidad: form.duracionUnidad,
        activo: form.activo,
      };

      await createHorarioRiego(payload);

      bsModal.current?.hide();
      resetForm();

    } catch (error) {
      console.error("Error creando horario:", error);
      alert("No se pudo crear el horario de riego");
    }
  };

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content scx-modal">

          {/* ===== HEADER ===== */}
          <div className="modal-header scx-modal-header">
            <div className="d-flex align-items-center gap-2">
              <i className="fas fa-clock text-primary"></i>
              <h5 className="modal-title mb-0">Nuevo horario de riego</h5>
            </div>

            <button
              type="button"
              className="scx-close"
              onClick={() => bsModal.current?.hide()}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">

              {/* ===== Día ===== */}
              <div className="mb-3">
                <label className="form-label">Día</label>
                <small className="form-hint">
                  Selecciona el día en que se ejecutará el riego
                </small>

                <select
                  className="form-select scx-input"
                  name="diaSemana"
                  value={form.diaSemana}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar día</option>
                  {DIAS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* ===== Hora ===== */}
              <div className="mb-3">
                <label className="form-label">Hora de inicio</label>
                <small className="form-hint">
                  Hora exacta en la que comenzará el riego
                </small>

                <div className="scx-time-input">
                  <i className="fas fa-clock"></i>
                  <input
                    type="time"
                    name="horaInicio"
                    value={form.horaInicio}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* ===== Duración ===== */}
              <div className="mb-3">
                <label className="form-label">Duración del riego</label>
                <small className="form-hint">
                  Define cuánto tiempo estará activo el sistema
                </small>

                <div className="d-flex gap-2 align-items-center">
                  <div className="scx-spin">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          duracionValor: Math.max(1, f.duracionValor - 1),
                        }))
                      }
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min="1"
                      name="duracionValor"
                      value={form.duracionValor}
                      onChange={handleChange}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          duracionValor: f.duracionValor + 1,
                        }))
                      }
                    >
                      +
                    </button>
                  </div>

                  <div className="scx-unit-toggle">
                    <button
                      type="button"
                      className={form.duracionUnidad === "M" ? "active" : ""}
                      onClick={() =>
                        setForm((f) => ({ ...f, duracionUnidad: "M" }))
                      }
                    >
                      Min
                    </button>
                    <button
                      type="button"
                      className={form.duracionUnidad === "S" ? "active" : ""}
                      onClick={() =>
                        setForm((f) => ({ ...f, duracionUnidad: "S" }))
                      }
                    >
                      Seg
                    </button>
                  </div>
                </div>
              </div>

              {/* ===== Activo ===== */}
              <div className="form-check form-switch mt-4 px-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={handleChange}
                />
                <label className="form-check-label">
                  Activar este horario
                </label>
              </div>
            </div>

            {/* ===== FOOTER ===== */}
            <div className="modal-footer">
              <button
                type="submit"
                className="btn btn-primary scx-btn-primary"
              >
                <i className="fas fa-save me-1"></i>
                Guardar horario
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
