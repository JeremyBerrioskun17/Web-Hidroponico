import { useEffect, useState } from "react";
import "./ModalEtapas.css";
import { listEtapasHidroponico } from "../../services/etapasHidroponico";
import { finalizeCosecha } from "../../services/cosechas";

export default function ModalEtapas({ show, cosecha, onClose, onFinalized }) {
  const [items, setItems] = useState([]);
  const [etapasMap, setEtapasMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (show) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  useEffect(() => {
    if (!show || !cosecha) return;
    (async () => {
      try {
        setLoading(true);
        // Only fetch the etapas metadata and compute the per-cosecha timeline
        const etapas = await listEtapasHidroponico();
        const ordered = (etapas || []).slice().sort((a, b) => (a.ordenEtapa ?? a.OrdenEtapa ?? 0) - (b.ordenEtapa ?? b.OrdenEtapa ?? 0));

        const start = cosecha.fechaInicio ? new Date(cosecha.fechaInicio) : new Date();
        const now = new Date();

        const computed = [];
        let current = new Date(start);
        for (const etapa of ordered) {
          const dur = Number(etapa.duracionHoras ?? etapa.DuracionHoras ?? 0) || 0;
          const inicio = new Date(current);
          const fin = new Date(inicio);
          fin.setHours(fin.getHours() + dur);

          let estado = "PENDIENTE";
          if (now >= fin) estado = "FINALIZADA";
          else if (now >= inicio && now < fin) estado = "ACTIVA";

          computed.push({
            id: `${cosecha.id}-${etapa.id}`,
            cosechaId: cosecha.id,
            etapaId: etapa.id,
            nombre: etapa.nombre,
            fechaInicioReal: inicio.toISOString(),
            fechaFinReal: fin.toISOString(),
            duracionHorasPlan: dur,
            notas: etapa.observaciones || null,
            estado
          });

          // advance
          current = new Date(fin);
        }

        const map = {};
        ordered.forEach(e => { map[e.id] = e; });
        setEtapasMap(map);
        setItems(computed);
      } catch (err) {
        console.error(err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, cosecha]);

  if (!show || !cosecha) return null;

  const now = new Date();
  // overall progress
  const totalHours = items.reduce((s, it) => s + (Number(it.duracionHorasPlan) || 0), 0);
  const elapsedHours = items.reduce((s, it) => {
    const inicio = new Date(it.fechaInicioReal);
    const fin = new Date(it.fechaFinReal);
    if (now >= fin) return s + (Number(it.duracionHorasPlan) || 0);
    if (now <= inicio) return s;
    const hrs = (now - inicio) / (1000 * 60 * 60);
    return s + Math.min(hrs, Number(it.duracionHorasPlan) || 0);
  }, 0);
  const overallPct = totalHours > 0 ? Math.round((elapsedHours / totalHours) * 100) : 0;
  const currentIndex = items.findIndex(it => it.estado === 'ACTIVA');

  async function handleFinalize() {
    if (!confirm('¿Finalizar la cosecha?')) return;
    try {
      setFinalizing(true);
      await finalizeCosecha(cosecha.id);
      onFinalized?.(cosecha.id);
      onClose?.();
    } catch (err) {
      alert(err?.message || 'Error finalizando la cosecha');
    } finally {
      setFinalizing(false);
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
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <div>
                <strong>Progreso: {overallPct}%</strong>
                <div className="small text-muted">Inicio: {cosecha.fechaInicio ? new Date(cosecha.fechaInicio).toLocaleString() : 'N/D'}</div>
              </div>
              <div className="text-end small text-muted">{currentIndex >= 0 ? `Etapa actual: ${items[currentIndex].nombre}` : 'Sin etapa activa'}</div>
            </div>

            {loading ? (
              <div>Cargando etapas...</div>
            ) : items.length === 0 ? (
              <div className="empty-state small text-muted">No hay etapas registradas para esta cosecha.</div>
            ) : (
              <div className="timeline">
                {items.map((it, idx) => {
                  const etapaMeta = etapasMap[it.etapaId] || {};
                  const inicio = new Date(it.fechaInicioReal);
                  const fin = new Date(it.fechaFinReal);
                  let progressPct = 0;
                  if (now >= fin) progressPct = 100;
                  else if (now <= inicio) progressPct = 0;
                  else progressPct = Math.round(((now - inicio) / (fin - inicio)) * 100);
                  return (
                    <div className={`timeline-item ${it.estado ? it.estado.toLowerCase() : ''}`} key={it.id || idx}>
                      <div className="timeline-marker" />
                      <div className="timeline-content">
                        <div className="d-flex justify-content-between align-items-start">
                          <div style={{flex:1}}>
                            <div className="timeline-title">{etapaMeta.nombre || it.nombre || `Etapa ${idx+1}`}</div>
                            <div className="timeline-sub small text-muted">{etapaMeta.observaciones || it.notas || ''}</div>
                            <div className="timeline-times small text-muted mt-1">{new Date(it.fechaInicioReal).toLocaleString()} → {new Date(it.fechaFinReal).toLocaleString()}</div>
                            <div className="timeline-progress mt-2">
                              <div className={`timeline-progress-bar ${it.estado ? it.estado.toLowerCase() : ''}`} style={{ width: `${progressPct}%` }} />
                            </div>
                          </div>
                          <div className="ms-3 text-end">
                            <div className={`badge state-badge ${it.estado ? it.estado.toLowerCase() : ''}`}>{it.estado}</div>
                            <div className="small text-muted mt-2">
                              {(() => {
                                const hrs = Number(it.duracionHorasPlan) || 0;
                                const dias = hrs / 24;
                                const diasLabel = Number.isInteger(dias) ? `${dias} d` : `${dias.toFixed(1)} d`;
                                return `${hrs} h · ${diasLabel}`;
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>Cerrar</button>
            <button className="btn btn-success" onClick={handleFinalize} disabled={finalizing}>{finalizing ? 'Finalizando...' : 'Finalizar cosecha'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
