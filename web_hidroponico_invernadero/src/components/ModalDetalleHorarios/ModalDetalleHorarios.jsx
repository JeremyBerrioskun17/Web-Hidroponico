import { useState } from "react";
import "./ModalDetalleHorarios.css";
import { deleteHorarioRiego } from "../../services/horariosRiego";

export default function ModalDetalleHorarios({
  dia,
  horarios,
  onClose,
  onDeleted,
}) {
  const [toDelete, setToDelete] = useState(null);

  if (!dia) return null;

  const formatDuracion = (h) =>
    h.duracionValor
      ? `${h.duracionValor} ${h.duracionUnidad === "M" ? "min" : "seg"}`
      : "—";

  const confirmDelete = async () => {
    try {
      await deleteHorarioRiego(toDelete);
      setToDelete(null);
      onDeleted?.();
    } catch (err) {
      alert("No se pudo eliminar el horario");
    }
  };

  return (
    <>
      {/* ===== MODAL PRINCIPAL ===== */}
      <div className="modal fade show d-block scx-backdrop">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content modal-fancy">

            {/* HEADER */}
            <div className="modal-header border-0">
              <h5 className="modal-title d-flex align-items-center">
                <i className="fas fa-water me-2 text-success"></i>
                Horarios de riego
              </h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>

            {/* BODY */}
            <div className="modal-body">
              <div className="mb-3 small text-muted">
                Día seleccionado: <strong>{dia}</strong>
              </div>

              {horarios.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-calendar-times"></i>
                  <p>No hay riegos programados.</p>
                </div>
              ) : (
                <div className="row g-4">
                  {horarios.map((h) => (
                    <div key={h.id} className="col-xl-4 col-lg-6">
                      <div className="card card-horario h-100 border-0">

                        {/* CARD BODY */}
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-2 flex-wrap gap-2">
                            <span
                              className={`badge ${
                                h.activo
                                  ? "badge-success-soft"
                                  : "badge-secondary-soft"
                              }`}
                            >
                              <i
                                className={`fas me-1 ${
                                  h.activo
                                    ? "fa-check-circle"
                                    : "fa-pause-circle"
                                }`}
                              />
                              {h.activo ? "Activo" : "Inactivo"}
                            </span>

                            <span className="ms-auto meta small text-muted">
                              <i className="far fa-clock me-1" />
                              {h.horaInicio}
                            </span>
                          </div>

                          <p className="card-text desc mb-1">
                            <i className="fas fa-hourglass-half me-2 text-success"></i>
                            Duración: <strong>{formatDuracion(h)}</strong>
                          </p>
                        </div>

                        {/* CARD FOOTER */}
                        <div className="card-footer bg-white border-0 d-flex justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-danger rounded-pill"
                            onClick={() => setToDelete(h.id)}
                          >
                            <i className="fas fa-trash me-1" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONFIRM DELETE ===== */}
      {toDelete && (
        <div className="modal fade show d-block scx-backdrop">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-fancy p-3">
              <div className="modal-body text-center">
                <div className="confirm-icon mb-3">
                  <i className="fas fa-trash-alt"></i>
                </div>
                <h6>¿Eliminar horario?</h6>
                <p className="text-muted small">
                  Esta acción no se puede deshacer.
                </p>

                <div className="d-flex justify-content-center gap-3 mt-3">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setToDelete(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={confirmDelete}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
