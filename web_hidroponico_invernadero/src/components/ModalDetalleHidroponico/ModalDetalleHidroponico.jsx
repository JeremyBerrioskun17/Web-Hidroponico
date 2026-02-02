import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import "./ModalDetalleHidroponico.css";

export default function ModalDetalleHidroponico({ show, onClose, hidro }) {
  const modalRef = useRef(null);
  const bsModalRef = useRef(null);

  // Initialize Bootstrap Modal instance and wire show/hidden events
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const bs = window.bootstrap;
    if (!bs?.Modal) return;

    bsModalRef.current = new bs.Modal(el, { backdrop: "static", keyboard: false });

    const onShow = () => {
      // noop for now; keep modal state clean
    };

    const onHidden = () => {
      onClose?.();
    };

    el.addEventListener("show.bs.modal", onShow);
    el.addEventListener("hidden.bs.modal", onHidden);

    return () => {
      try {
        el.removeEventListener("show.bs.modal", onShow);
        el.removeEventListener("hidden.bs.modal", onHidden);
      } catch (e) {}

      try {
        bsModalRef.current?.dispose();
      } catch (e) {}
      bsModalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Control show/hide from prop
  useEffect(() => {
    const bsModal = bsModalRef.current;
    if (!bsModal) return;
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);


  function toEstadoSafe(raw) {
    if (raw === null || raw === undefined || raw === "") return -1;
    if (typeof raw === "number") return raw;
    const s = String(raw).toUpperCase();
    if (s === "LIBRE" || s === "0") return 0;
    if (s === "OCUPADO" || s === "1") return 1;
    if (s === "PAUSADO" || s === "PAUSAR" || s === "2" || s === "MANTENIMIENTO") return 2;
    return -1;
  }

  const estadoMap = {
    0: { label: "Libre", class: "libre", icon: "fa-check-circle" },
    1: { label: "Ocupado", class: "ocupado", icon: "fa-leaf" },
    2: { label: "Pausado", class: "pausado", icon: "fa-pause-circle" },
    "-1": { label: "Desconocido", class: "inactivo", icon: "fa-question-circle" }
  };

  const estado = estadoMap[String(toEstadoSafe(hidro?.estado))] || estadoMap["-1"];

  const title = hidro?.nombre || `Hidropónico #${hidro?.numeroHidroponico ?? "—"}`;
  const ubicacion = hidro?.localizacionNombre || hidro?.ubicacion || hidro?.zona || "No definida";
  const createdLabel = hidro?.creadoEn ? new Date(hidro.creadoEn).toLocaleDateString() : "N/D";
  const numero = hidro?.numeroHidroponico ?? "—";
  const bandejas = hidro?.cantidadBandejas ?? "—";

  const chips = useMemo(
    () => [
      { icon: "fa-hashtag", label: "Número", value: String(numero), help: "Identificador interno del sistema." },
      { icon: "fa-layer-group", label: "Bandejas", value: String(bandejas), help: "Total de bandejas registradas." }
    ],
    [numero, bandejas]
  );

  const modalUI = (
    <div className="modal fade" tabIndex="-1" ref={modalRef} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content modal-fancy hidro-modal">
          {/* HEADER */}
          <div className="modal-header border-0 hidro-modal-header">
            <div className="hidro-modal-head">
              <div className="hidro-modal-icon">
                <i className="fas fa-water" />
              </div>

              <div className="hidro-modal-titleWrap">
                <div className="hidro-modal-kicker">
                  <span className="kicker-dot" />
                  Detalle del sistema
                </div>

                <h5 className="modal-title hidro-modal-title mb-0">{title}</h5>

                <div className="hidro-modal-sub">
                  <span className="sub-item">
                    <i className="fas fa-map-marker-alt" />
                    <span className="sub-label">Ubicación:</span>
                    <span className="sub-value">{ubicacion}</span>
                  </span>

                  <span className="sub-sep">•</span>

                  <span className="sub-item">
                    <i className="fas fa-calendar-alt" />
                    <span className="sub-label">Creado:</span>
                    <span className="sub-value">{createdLabel}</span>
                  </span>
                </div>
              </div>
            </div>

            <button type="button" className="btn-close hidro-close" aria-label="Close" onClick={onClose} />
          </div>

          {/* BODY */}
          <div className="modal-body hidro-modal-body">
            <div className="hidro-topRow">
              <div className={`estado-pill ${estado.class} hidro-estado`}>
                <i className={`fas ${estado.icon} me-2`} />
                {estado.label}
              </div>

              <div className="hidro-topHint">
                Vista informativa del sistema seleccionado.
              </div>
            </div>

            <div className="row g-3">
              {chips.map((c, idx) => (
                <div key={idx} className="col-md-6">
                  <div className="detail-card">
                    <div className="detail-icon">
                      <i className={`fas ${c.icon}`} />
                    </div>

                    <div className="detail-body">
                      <div className="detail-label">{c.label}</div>
                      <div className="detail-value">{c.value}</div>
                      <div className="detail-help">{c.help}</div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="col-12">
                <div className="panel-card">
                  <div className="panel-head">
                    <div className="panel-title">
                      <span className="panel-icon">
                        <i className="fas fa-align-left" />
                      </span>
                      Observaciones
                    </div>
                    <div className="panel-muted">Notas operativas / incidencias</div>
                  </div>

                  <div className="obs-panel">
                    {hidro?.observaciones?.trim() ? hidro.observaciones : "Sin observaciones registradas"}
                  </div>

                  <div className="obs-foot">
                    <i className="fas fa-circle-info me-2" />
                    Registra cambios, ajustes o incidencias para mantener trazabilidad.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="modal-footer border-0 hidro-modal-footer">
            <button type="button" className="btn btn-outline-secondary btn-ui" onClick={onClose}>
              <i className="fas fa-times me-2" />
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
}
