import { useEffect } from "react";
import "./ModalEtapas.css";
import { finalizeCosecha } from "../../services/cosechas";

export default function ModalEtapas({ show, cosecha, onClose, onFinalized }) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  if (!show || !cosecha) return null;

  const etapas = Array.isArray(cosecha.etapas) ? cosecha.etapas : [];

  async function handleFinalize() {
    try {
      await finalizeCosecha(cosecha.id);
      onFinalized?.(cosecha.id);
      onClose?.();
    } catch (err) {
      alert(err?.message || 'Error finalizando la cosecha');
    }
  }

  return (
    <div className="modal fade show d-block scx-backdrop">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content modal-fancy p-3">
          <div className="modal-header border-0 d-flex align-items-center">
            <h5 className="modal-title"><i className="fas fa-stream me-2 text-success"></i>Etapas - {cosecha.nombreZafra || cosecha.id}</h5>
            <button className="btn-close ms-auto" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="timeline">
              {etapas.length === 0 ? (
                <div className="empty-state small text-muted">No hay etapas registradas para esta cosecha.</div>
              ) : (
                etapas.map((et, idx) => (
                  <div className={`timeline-item ${et.estado ? et.estado.toLowerCase() : ''}`} key={et.id || idx}>
                    <div className="timeline-marker" />
                    <div className="timeline-content">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="timeline-title">{et.nombre || `Etapa ${idx+1}`}</div>
                          <div className="timeline-sub small text-muted">{et.descripcion || ''}</div>
                        </div>
                        <div className="small text-muted">{et.fecha ? new Date(et.fecha).toLocaleString() : ''}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>Cerrar</button>
            <button className="btn btn-success" onClick={handleFinalize}>Finalizar cosecha</button>
          </div>
        </div>
      </div>
    </div>
  );
}
