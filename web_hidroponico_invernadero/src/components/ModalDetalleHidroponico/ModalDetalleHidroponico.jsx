import { useEffect, useRef } from "react";
import "./ModalDetalleHidroponico.css";

export default function ModalDetalleHidroponico({ show, onClose, hidro }) {
  const modalRef = useRef(null);
  const bsModalRef = useRef(null);

  useEffect(() => {
    const el = modalRef.current;
    if (!el || !window.bootstrap) return;

    const bs = window.bootstrap;
    bsModalRef.current = new bs.Modal(el, {
      backdrop: "static",
      keyboard: false,
    });

    const handleHidden = () => {
      onClose?.();
    };

    el.addEventListener("hidden.bs.modal", handleHidden);

    return () => {
      try {
        bsModalRef.current?.hide();
      } catch (e) {}
      el.removeEventListener("hidden.bs.modal", handleHidden);
      bsModalRef.current?.dispose();
      // defensive cleanup: ensure body isn't left locked
      try {
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      } catch (e) {}
    };
  }, [onClose]);

  useEffect(() => {
    if (!bsModalRef.current) return;
    show ? bsModalRef.current.show() : bsModalRef.current.hide();
  }, [show]);

  if (!hidro) return null;

  // no-op: deletion handled from list view; modal is read-only now

  const estadoMap = {
    0: { label: "Libre", class: "libre", icon: "fa-check-circle" },
    1: { label: "Ocupado", class: "ocupado", icon: "fa-bolt" },
    2: { label: "Pausado", class: "pausado", icon: "fa-pause-circle" },
  };

  const estado = estadoMap[toEstadoSafe(hidro.estado)];

  function toEstadoSafe(raw) {
    if (raw === null || raw === undefined || raw === "") return -1;
    if (typeof raw === 'number') return raw;
    const s = String(raw).toUpperCase();
    if (s === 'LIBRE' || s === '0') return 0;
    if (s === 'OCUPADO' || s === '1') return 1;
    if (s === 'PAUSADO' || s === 'PAUSAR' || s === '2' || s === 'MANTENIMIENTO') return 2;
    return -1;
  }

  return (
    <div className="modal fade" tabIndex={-1} ref={modalRef}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content modal-fancy hidro-modal">

          {/* HEADER */}
          <div className="modal-header border-0">
            <div className="d-flex align-items-center gap-3">
              <div className="hidro-modal-icon">
                <i className="fas fa-water"></i>
              </div>
              <div>
                <h5 className="modal-title mb-0">
                  {hidro.nombre || `Hidropónico #${hidro.numeroHidroponico ?? hidro.id}`}
                </h5>
                <small className="text-muted">Sistema hidropónico</small>
              </div>
            </div>

            <button
              type="button"
              className="btn-close"
              onClick={() => bsModalRef.current?.hide()}
            />
          </div>

          {/* BODY */}
          <div className="modal-body hidro-modal-body">

            <div className={`d-flex align-items-center justify-content-between mb-3` }>
              <div className={`estado-badge ${estado.class}`}>
                <i className={`fas ${estado.icon}`}></i>
                {estado.label}
              </div>
              <div className="small text-muted">Creado: {hidro.creadoEn ? new Date(hidro.creadoEn).toLocaleDateString() : 'N/D'}</div>
            </div>

            <div className="row g-3 mt-2">

              <div className="col-md-4">
                <div className="info-card">
                  <div className="icon-circle bg-green">
                    <i className="fas fa-hashtag"></i>
                  </div>
                  <div>
                    <div className="label">Número</div>
                    <div className="value">{hidro.numeroHidroponico ?? '—'}</div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="info-card">
                  <div className="icon-circle bg-green">
                    <i className="fas fa-layer-group"></i>
                  </div>
                  <div>
                    <div className="label">Bandejas / Capacidad</div>
                    <div className="value">{hidro.cantidadBandejas ?? '—'}{hidro.capacidadBandejas ? ` / ${hidro.capacidadBandejas}` : ''}</div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="info-card">
                  <div className="icon-circle bg-blue">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div>
                    <div className="label">Ubicación</div>
                    <div className="value">{hidro.localizacionNombre ?? 'No definida'}</div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="info-card">
                  <div className="icon-circle bg-yellow">
                    <i className="fas fa-user"></i>
                  </div>
                  <div>
                    <div className="label">Responsable</div>
                    <div className="value">{hidro.responsable ?? '—'}</div>
                  </div>
                </div>
              </div>

              {/* sensors and last-reading removed as not relevant */}

              <div className="col-12">
                <div className="info-card full">
                  <div className="icon-circle bg-gray">
                    <i className="fas fa-align-left"></i>
                  </div>
                  <div>
                    <div className="label">Observaciones</div>
                    <div className="value">{hidro.observaciones || 'Sin observaciones registradas'}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer removed per request; only close button in header remains */}

        </div>
      </div>

      {/* deletion UI removed; modal is read-only */}
    </div>
  );
}
