import { useEffect, useRef, useState } from "react";

export default function ModalDetalleHidroponico({ show, onClose, hidro }) {
  const modalRef = useRef(null);
  const bsModalRef = useRef(null);

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const bs = window.bootstrap;
    if (!bs) return;

    bsModalRef.current = new bs.Modal(el, { backdrop: "static", keyboard: false });

    el.addEventListener("hidden.bs.modal", () => {
      onClose?.();
    });

    return () => bsModalRef.current?.dispose();
  }, [onClose]);

  // Abrir o cerrar modal según prop `show`
  useEffect(() => {
    if (show) bsModalRef.current?.show();
    else bsModalRef.current?.hide();
  }, [show]);

  if (!hidro) return null;

  return (
    <div className="modal fade" tabIndex="-1" ref={modalRef} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content" style={{ borderRadius: 12, overflow: "hidden", animation: "popIn .16s ease" }}>
          <style>{`
            @keyframes popIn { from { transform: translateY(-6px) scale(.995); opacity:0 } to { transform: none; opacity:1 } }
          `}</style>

          <div className="modal-header">
            <h5 className="modal-title">
              {hidro.nombre || `Hidro #${hidro.numero ?? hidro.id}`}
            </h5>
            <button type="button" className="btn-close" onClick={() => bsModalRef.current?.hide()}></button>
          </div>

          <div className="modal-body">
            <p><strong>Numero:</strong> {hidro.numero}</p>
            <p><strong>Bandejas:</strong> {hidro.bandejas}</p>
            <p><strong>Estado:</strong> {hidro.estado === 0 ? "Libre" : hidro.estado === 1 ? "Ocupado" : "Mantenimiento"}</p>
            <p><strong>Observaciones:</strong> {hidro.observaciones || "—"}</p>
            <p><strong>Creado:</strong> {hidro.creadoEn ? new Date(hidro.creadoEn).toLocaleDateString() : "N/D"}</p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => bsModalRef.current?.hide()}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
