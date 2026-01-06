import { useEffect, useRef } from "react";
import "./ModalDetalleCosecha.css";

export default function ModalDetalleCosecha({ cosecha, onClose }) {
  const modalRef = useRef(null);
  const bsModalRef = useRef(null);

  useEffect(() => {
    const el = modalRef.current;
    if (!el || !window.bootstrap) return;

    bsModalRef.current = new window.bootstrap.Modal(el, {
      backdrop: "static",
      keyboard: false,
    });

    bsModalRef.current.show();

    el.addEventListener("hidden.bs.modal", onClose);

    return () => {
      bsModalRef.current?.dispose();
    };
  }, []);

  return (
    <div className="modal modal-fancy fade" tabIndex="-1" ref={modalRef}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-seedling me-2 text-success"></i>
              Detalle de Cosecha
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="row g-3">
              <Info label="Nombre" value={cosecha.nombreZafra} icon="tag" />
              <Info label="Estado" value={cosecha.estado} icon="toggle-on" />
              <Info label="Hidropónico" value={cosecha.hidroponicoId} icon="warehouse" />
              <Info label="Fecha inicio" value={cosecha.fechaInicio} icon="calendar-check" />
              <Info label="Fecha fin" value={cosecha.fechaFin} icon="flag-checkered" />

              <div className="col-12">
                <label className="form-label">Observaciones</label>
                <div className="detail-box">
                  {cosecha.observaciones || "Sin observaciones"}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function Info({ label, value, icon }) {
  return (
    <div className="col-md-6">
      <label className="form-label">{label}</label>
      <div className="detail-field">
        <i className={`fas fa-${icon} me-2`}></i>
        {value || "—"}
      </div>
    </div>
  );
}
