// // src/pages/SensoryControl.jsx
// import { useEffect, useState } from "react";
// import { useAuth } from "../../context/AuthContext";
// import { AgGridReact } from "ag-grid-react";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";


// import {
//     pingApi,
//     getActuatorState,
//     setActuator,
//     getDhtLatest,
// } from "../../services/leds";

// // CSS PROPIO DEL MÓDULO (scoped)
// import "./sensory-control.css";

// // ===== IDs de actuadores en la API =====
// const ID_LUCES = 1;
// const ID_BOMBA = 2;
// const ID_VENT = 3;

// const POLL_MS_ACTUADORES = 2000;
// const POLL_MS_DHT = 3000;

// /* ===== UI helpers ===== */
// function Pill({ children, tone = "secondary" }) {
//     return (
//         <span className={`badge rounded-pill scx-badge-${tone} px-3 py-2 fw-semibold`}>
//             {children}
//         </span>
//     );
// }

// function StackedSwitch({
//     id,
//     checked,
//     onChange,
//     disabled,
//     onLabel = "Activo",
//     offLabel = "Inactivo",
// }) {
//     return (
//         <div className="switch-stack mt-3">
//             <div className="scx-switch-xl">
//                 <input
//                     id={id}
//                     type="checkbox"
//                     checked={checked}
//                     onChange={(e) => onChange?.(e.target.checked)}
//                     disabled={disabled}
//                 />
//                 <label htmlFor={id} aria-label={checked ? onLabel : offLabel} />
//             </div>
//             <div className="small mt-1 text-muted fw-semibold">
//                 {checked ? onLabel : offLabel}
//             </div>
//         </div>
//     );
// }

// function ActuatorCard({
//     icon,
//     iconTone = "success",
//     title,
//     desc,
//     children,
//     switchProps,
//     disabled = false,
// }) {
//     return (
//         <div className={`card scx-card act-card border-0 position-relative ${disabled ? "act-disabled" : ""}`}>
//             <div className="card-body d-flex flex-column h-100">
//                 <div className="d-flex align-items-start gap-3">
//                     <div className={`scx-ico ${iconTone}`}>
//                         <i className={`fas fa-${icon}`} />
//                     </div>
//                     <div className="flex-grow-1">
//                         <h6 className="fw-bold mb-1">{title}</h6>
//                         <p className="text-muted small mb-0">{desc}</p>
//                     </div>
//                 </div>

//                 {children && <div className="mt-3">{children}</div>}
//                 {switchProps && <StackedSwitch {...switchProps} />}
//             </div>

//             {disabled && (
//                 <div className="act-mask">
//                     <span className="badge scx-badge-success-subtle">
//                         Automático activo
//                     </span>
//                 </div>
//             )}
//         </div>
//     );
// }

// /* ===== Página ===== */
// export default function SensoryControl() {
//     const { user } = useAuth();
//     const actor = user?.username || "usuario";

//     // Modo general
//     const [autoMode, setAutoMode] = useState(false);

//     // Actuadores (API)
//     const [lucesOn, setLucesOn] = useState(false);
//     const [bombaOn, setBombaOn] = useState(false);
//     const [ventOn, setVentOn] = useState(false);

//     // (Opcional) otros de UI
//     const [calefOn, setCalefOn] = useState(false);
//     const [techo, setTecho] = useState("Cerrado");

//     // Estado de red/actuadores
//     const [loadingAct, setLoadingAct] = useState(true);
//     const [errorAct, setErrorAct] = useState("");

//     // DHT11
//     const [tempC, setTempC] = useState(null);
//     const [hum, setHum] = useState(null);
//     const [dhtTs, setDhtTs] = useState(null);
//     const [errorDht, setErrorDht] = useState("");

//     // Heartbeat API (opcional)
//     const [apiOk, setApiOk] = useState(true);

//     // Logs
//     const [logs, setLogs] = useState([]);
//     const [lastUpdate, setLastUpdate] = useState(new Date());
//     const fmt = (d) =>
//         new Date(d).toLocaleString("es-NI", { dateStyle: "short", timeStyle: "medium" });

//     function addLog({ tipo, periferico, accion, descripcion }) {
//         setLogs((prev) => [
//             {
//                 id: prev.length + 1,
//                 usuario: actor,
//                 fecha: new Date().toISOString(),
//                 tipo, periferico, accion, descripcion,
//             },
//             ...prev,
//         ]);
//         setLastUpdate(new Date());
//     }

//     /* ===== Modo ===== */
//     function toggleAuto(v) {
//         const from = autoMode ? "Automático" : "Manual";
//         const to = v ? "Automático" : "Manual";
//         setAutoMode(v);
//         addLog({
//             tipo: "Modo",
//             periferico: "Sistema",
//             accion: `${from} → ${to}`,
//             descripcion: `Cambio de modo realizado por ${actor}`,
//         });
//     }

//     /* ===== Ping API ===== */
//     useEffect(() => {
//         let alive = true;
//         (async () => {
//             try {
//                 await pingApi();
//                 if (alive) setApiOk(true);
//             } catch {
//                 if (alive) setApiOk(false);
//             }
//         })();
//         return () => { alive = false; };
//     }, []);

//     /* ===== Poll actuadores ===== */
//     useEffect(() => {
//         let alive = true;

//         async function pullAll() {
//             try {
//                 setErrorAct("");
//                 const [s1, s2, s3] = await Promise.all([
//                     getActuatorState(ID_LUCES),
//                     getActuatorState(ID_BOMBA),
//                     getActuatorState(ID_VENT),
//                 ]);
//                 if (!alive) return;
//                 setLucesOn(!!s1.on);
//                 setBombaOn(!!s2.on);
//                 setVentOn(!!s3.on);
//             } catch (err) {
//                 console.error(err);
//                 if (alive) setErrorAct("No se pudo leer el estado de los actuadores.");
//             } finally {
//                 if (alive) setLoadingAct(false);
//             }
//         }

//         pullAll();
//         const it = setInterval(pullAll, POLL_MS_ACTUADORES);
//         return () => { alive = false; clearInterval(it); };
//     }, []);

//     /* ===== Handlers (guardado optimista) ===== */
//     const handleSet =
//         (nombre, id, value, setter) =>
//             async (v) => {
//                 if (autoMode) return;
//                 const prev = value;
//                 setter(v);
//                 try {
//                     await setActuator(id, v);
//                     setErrorAct("");
//                     addLog({
//                         tipo: "Actuador",
//                         periferico: nombre,
//                         accion: v ? "Activado" : "Desactivado",
//                         descripcion: `${nombre} actualizado en el servidor (id=${id}).`,
//                     });
//                 } catch (err) {
//                     console.error(err);
//                     setter(prev);
//                     setErrorAct(`No se pudo cambiar el estado de ${nombre}.`);
//                     addLog({
//                         tipo: "Actuador",
//                         periferico: nombre,
//                         accion: "Error",
//                         descripcion: "Fallo al guardar en el servidor.",
//                     });
//                 }
//             };

//     const handleLucesChange = handleSet("Luces", ID_LUCES, lucesOn, setLucesOn);
//     const handleBombaChange = handleSet("Bomba", ID_BOMBA, bombaOn, setBombaOn);
//     const handleVentChange = handleSet("Ventilador", ID_VENT, ventOn, setVentOn);

//     /* ===== Poll DHT11 ===== */
//     useEffect(() => {
//         let alive = true;

//         async function pullDht() {
//             try {
//                 setErrorDht("");
//                 const r = await getDhtLatest(); // { utc, temperatureC, humidity, source }
//                 if (!alive || !r) return;
//                 setTempC(r.temperatureC ?? null);
//                 setHum(r.humidity ?? null);
//                 setDhtTs(r.utc ?? null);
//             } catch (err) {
//                 console.error(err);
//                 if (alive) setErrorDht("No se pudo obtener la última lectura del DHT11.");
//             }
//         }

//         pullDht();
//         const it = setInterval(pullDht, POLL_MS_DHT);
//         return () => { alive = false; clearInterval(it); };
//     }, []);

//     /* ===== Otros actuadores locales (UI) ===== */
//     function pulseBomba() {
//         if (autoMode) return;
//         setBombaOn(true);
//         addLog({
//             tipo: "Pulso",
//             periferico: "Bomba",
//             accion: "Pulso 10s",
//             descripcion: "Se activó un pulso de 10 segundos en la bomba (solo UI).",
//         });
//         setTimeout(() => setBombaOn(false), 10000);
//     }

//     function toggleActuatorLocal(name, setter) {
//         return (v) => {
//             if (autoMode) return;
//             setter(v);
//             addLog({
//                 tipo: "Actuador",
//                 periferico: name,
//                 accion: v ? "Activado" : "Desactivado",
//                 descripcion: `El actuador "${name}" fue ${v ? "activado" : "desactivado"} (local).`,
//             });
//         };
//     }

//     function abrirTecho() {
//         if (autoMode) return;
//         setTecho("Abierto");
//         addLog({ tipo: "Actuador", periferico: "Techo", accion: "Abrir", descripcion: "Se ordenó abrir el techo corredizo (UI)." });
//     }
//     function cerrarTecho() {
//         if (autoMode) return;
//         setTecho("Cerrado");
//         addLog({ tipo: "Actuador", periferico: "Techo", accion: "Cerrar", descripcion: "Se ordenó cerrar el techo corredizo (UI)." });
//     }

//     return (
//         <div className="container-fluid scx">
//             {/* Título */}
//             <div className="d-flex align-items-center mb-3 gap-2">
//                 <div className="scx-kpi-ico"><i className="fas fa-sliders-h" /></div>
//                 <div>
//                     <h1 className="h3 mb-0 scx-title">Control del invernadero</h1>
//                     <small className="text-muted">
//                         Activa manualmente los actuadores o habilita el modo automático por sensores.
//                     </small>
//                 </div>
//             </div>

//             {/* Modo automático */}
//             <div className="card scx-card mb-3">
//                 <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-3">
//                     <div className="d-flex align-items-start gap-3">
//                         <div className="scx-ico success"><i className="fas fa-microchip" /></div>
//                         <div>
//                             <h6 className="fw-bold mb-1">Modo automático</h6>
//                             <p className="text-muted small mb-0">
//                                 Al activarlo, los sensores gestionan los actuadores (los controles manuales se bloquean).
//                             </p>
//                         </div>
//                     </div>

//                     <div className="text-center">
//                         <div className="scx-switch-xl">
//                             <input id="swAuto" type="checkbox" checked={autoMode} onChange={(e) => toggleAuto(e.target.checked)} />
//                             <label htmlFor="swAuto" aria-label={autoMode ? "Automático" : "Manual"} />
//                         </div>
//                         <div className="small text-muted fw-semibold mt-1">{autoMode ? "Automático" : "Manual"}</div>
//                     </div>
//                 </div>
//             </div>

//             {/* Sensores: DHT11 */}
//             <div className="card scx-card mb-3">
//                 <div className="card-body d-flex align-items-center justify-content-between">
//                     <div className="d-flex align-items-center gap-3">
//                         <div className="scx-ico success"><i className="fas fa-thermometer-half" /></div>
//                         <div>
//                             <h6 className="fw-bold mb-1">Ambiente (DHT11)</h6>
//                             <p className="text-muted small mb-0">
//                                 Temp: <strong>{tempC ?? "—"}°C</strong> · Hum: <strong>{hum ?? "—"}%</strong>
//                                 {dhtTs && (<span className="text-muted ms-2">({new Date(dhtTs).toLocaleTimeString()})</span>)}
//                             </p>
//                             {errorDht && <div className="small text-warning mt-1">{errorDht}</div>}
//                         </div>
//                     </div>
//                     <Pill tone={apiOk ? "success" : "secondary"}>{apiOk ? "En línea" : "Sin conexión"}</Pill>
//                 </div>
//             </div>

//             {/* Grid de actuadores */}
//             {errorAct && (
//                 <div className="alert alert-warning py-2 px-3 small">
//                     <i className="fas fa-triangle-exclamation me-2" />
//                     {errorAct}
//                 </div>
//             )}

//             <div className="row g-3">
//                 <div className="col-xl-4 col-lg-6">
//                     <ActuatorCard
//                         icon="lightbulb"
//                         iconTone="success"
//                         title="Luces"
//                         desc="Iluminación suplementaria para fotoperíodo y crecimiento."
//                         disabled={autoMode}
//                         switchProps={{
//                             id: "swLuces",
//                             checked: lucesOn,
//                             onChange: handleLucesChange,
//                             disabled: autoMode || loadingAct,
//                             onLabel: loadingAct ? "Cargando…" : "Encendidas",
//                             offLabel: loadingAct ? "Cargando…" : "Apagadas",
//                         }}
//                     />
//                 </div>

//                 <div className="col-xl-4 col-lg-6">
//                     <ActuatorCard
//                         icon="water"
//                         iconTone="success"
//                         title="Bomba de agua"
//                         desc="Riego/recirculación de solución nutritiva."
//                         disabled={autoMode}
//                         switchProps={{
//                             id: "swBomba",
//                             checked: bombaOn,
//                             onChange: handleBombaChange,
//                             disabled: autoMode || loadingAct,
//                         }}
//                     >
//                         <button
//                             className="btn scx-btn-outline-success btn-sm d-inline-flex align-items-center gap-2"
//                             onClick={pulseBomba}
//                             disabled={autoMode}
//                         >
//                             <i className="fas fa-bolt" /> Pulso 10s
//                         </button>
//                     </ActuatorCard>
//                 </div>

//                 <div className="col-xl-4 col-lg-6">
//                     <ActuatorCard
//                         icon="fan"
//                         iconTone="success"
//                         title="Ventilador"
//                         desc="Intercambio de aire para controlar temperatura y humedad."
//                         disabled={autoMode}
//                         switchProps={{
//                             id: "swVent",
//                             checked: ventOn,
//                             onChange: handleVentChange,
//                             disabled: autoMode || loadingAct,
//                         }}
//                     />
//                 </div>

//                 {/* (Opcional) locales */}
//                 <div className="col-xl-4 col-lg-6">
//                     <ActuatorCard
//                         icon="fire"
//                         iconTone="success"
//                         title="Calefacción"
//                         desc="Soporte térmico durante noches frías o descensos bruscos."
//                         disabled={autoMode}
//                         switchProps={{
//                             id: "swCalef",
//                             checked: calefOn,
//                             onChange: toggleActuatorLocal("Calefacción", setCalefOn),
//                             disabled: autoMode,
//                         }}
//                     />
//                 </div>

//                 <div className="col-xl-8 col-lg-12">
//                     <div className={`card scx-card act-card position-relative ${autoMode ? "act-disabled" : ""}`}>
//                         <div className="card-body">
//                             <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
//                                 <div className="d-flex align-items-start gap-3">
//                                     <div className="scx-ico success"><i className="fas fa-warehouse" /></div>
//                                     <div>
//                                         <h6 className="fw-bold mb-1">Techo</h6>
//                                         <p className="text-muted small mb-0">Apertura/cierre del techo corredizo.</p>
//                                     </div>
//                                 </div>
//                                 <Pill tone={techo === "Abierto" ? "success" : "secondary"}>Estado: {techo}</Pill>
//                             </div>

//                             <div className="d-flex align-items-center gap-2 mt-3">
//                                 <button className="btn scx-btn-success d-inline-flex align-items-center gap-2" onClick={abrirTecho} disabled={autoMode}>
//                                     <i className="fas fa-arrow-up" /> Abrir
//                                 </button>
//                                 <button className="btn scx-btn-outline-success d-inline-flex align-items-center gap-2" onClick={cerrarTecho} disabled={autoMode}>
//                                     <i className="fas fa-arrow-down" /> Cerrar
//                                 </button>
//                             </div>
//                         </div>

//                         {autoMode && (
//                             <div className="act-mask">
//                                 <span className="badge scx-badge-success-subtle">Automático activo</span>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Bitácora / Logs */}
//             {/* ===== Bitácora (AG Grid) ===== */}
//             <div className="card scx-card mt-4">
//                 <div className="card-body">
//                     <div className="d-flex align-items-center justify-content-between mb-3">
//                         <h6 className="fw-bold mb-0">
//                             <i className="fas fa-clipboard-list me-2 text-success"></i>
//                             Bitácora de cambios
//                         </h6>
//                         <small className="text-muted">
//                             Última actualización: {fmt(lastUpdate)}
//                         </small>
//                     </div>

//                     <div
//                         className="ag-theme-alpine ag-theme-green"
//                         style={{ height: 420, width: "100%" }}
//                     >
//                         <AgGridReact
//                             rowData={logs}
//                             columnDefs={[
//                                 { headerName: "#", valueGetter: (p) => p.node.rowIndex + 1, maxWidth: 80 },
//                                 { headerName: "Usuario", field: "usuario" },
//                                 { headerName: "Fecha", field: "fecha", valueFormatter: (p) => fmt(p.value) },
//                                 { headerName: "Tipo", field: "tipo" },
//                                 { headerName: "Periférico", field: "periferico" },
//                                 { headerName: "Acción", field: "accion" },
//                                 { headerName: "Descripción", field: "descripcion", flex: 1 },
//                             ]}
//                             defaultColDef={{
//                                 sortable: true,
//                                 resizable: true,
//                                 flex: 1,
//                                 minWidth: 150,
//                             }}
//                             pagination={true}
//                             paginationPageSize={10}
//                             suppressCellFocus={true}
//                         />
//                     </div>
//                 </div>
//             </div>

//         </div>
//     );
// }
// src/pages/SensoryControl.jsx
// src/pages/SensoryControl.jsx
// src/pages/SensoryControl.jsx
// src/pages/SensoryControl.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import {
  pingApi,
  getActuatorState,
  setActuator,
  getDhtLatest,
} from "../../services/leds";

import "./sensory-control.css";

// Path local a la imagen que subiste (se transformará a URL por la plataforma)
const PLACEHOLDER_IMG = "/mnt/data/ff503d82-c6c7-4c9e-ab2b-9c8bfe2df798.png";

const POLL_MS_ACTUADORES = 2000;
const POLL_MS_DHT = 3000;
const PAGE_SIZE = 10;

function Pill({ children, tone = "secondary" }) {
  return (
    <span className={`badge rounded-pill scx-badge-${tone} px-3 py-2 fw-semibold`}>
      {children}
    </span>
  );
}

function SwitchBig({ id, checked, onChange, disabled, onLabel = "Activo", offLabel = "Inactivo" }) {
  return (
    <div className="d-flex flex-column align-items-start">
      <div className="scx-switch-xl">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange?.(e.target.checked)} disabled={disabled} />
        <label htmlFor={id} aria-label={checked ? onLabel : offLabel} />
      </div>
      <div className="small mt-1 text-muted">{checked ? onLabel : offLabel}</div>
    </div>
  );
}

function ActuatorCard({ icon, title, desc, children, switchProps, disabled = false }) {
  return (
    <div className={`card scx-card act-card border-0 position-relative ${disabled ? "act-disabled" : ""}`}>
      <div className="card-body d-flex flex-column h-100">
        <div className="d-flex align-items-start gap-3">
          <div className="scx-ico success"><i className={`fas fa-${icon}`} /></div>
          <div className="flex-grow-1">
            <h6 className="fw-bold mb-1">{title}</h6>
            <p className="text-muted small mb-0">{desc}</p>
          </div>
        </div>

        {children && <div className="mt-3">{children}</div>}
        {switchProps && <div className="mt-3"><SwitchBig {...switchProps} /></div>}
      </div>

      {disabled && (
        <div className="act-mask">
          <span className="badge scx-badge-success-subtle">Automático activo</span>
        </div>
      )}
    </div>
  );
}

export default function SensoryControl() {
  const { user } = useAuth();
  const actor = user?.username || "usuario";

  // actuadores / estado
  const [autoMode, setAutoMode] = useState(false);
  const [lucesOn, setLucesOn] = useState(false);
  const [bombaOn, setBombaOn] = useState(false);
  const [ventOn, setVentOn] = useState(false);
  const [calefOn, setCalefOn] = useState(false);
  const [techo, setTecho] = useState("Cerrado");
  const [loadingAct, setLoadingAct] = useState(true);
  const [errorAct, setErrorAct] = useState("");

  // sensores
  const [tempC, setTempC] = useState(null);
  const [hum, setHum] = useState(null);
  const [dhtTs, setDhtTs] = useState(null);
  const [errorDht, setErrorDht] = useState("");
  const [apiOk, setApiOk] = useState(true);

  // bitácora (logs)
  const [logs, setLogs] = useState([]); // siempre array
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // quick filter + pagination
  const [quickFilter, setQuickFilter] = useState("");
  const [page, setPage] = useState(1);

  const fmt = (d) => new Date(d).toLocaleString("es-NI", { dateStyle: "short", timeStyle: "medium" });

  function addLog({ tipo, periferico, accion, descripcion }) {
    setLogs(prev => [{ id: prev.length + 1, usuario: actor, fecha: new Date().toISOString(), tipo, periferico, accion, descripcion }, ...prev]);
    setLastUpdate(new Date());
  }

  function toggleAuto(v) {
    const from = autoMode ? "Automático" : "Manual";
    const to = v ? "Automático" : "Manual";
    setAutoMode(v);
    addLog({
      tipo: "Modo",
      periferico: "Sistema",
      accion: `${from} → ${to}`,
      descripcion: `Cambio de modo realizado por ${actor}`,
    });
  }

  // Pings iniciales
  useEffect(() => {
    let alive = true;
    (async () => {
      try { await pingApi(); if (alive) setApiOk(true); }
      catch { if (alive) setApiOk(false); }
    })();
    return () => { alive = false; };
  }, []);

  // Poll actuadores (similares a tu lógica)
  useEffect(() => {
    let alive = true;
    async function pullAll() {
      try {
        setErrorAct("");
        const [s1, s2, s3] = await Promise.all([
          getActuatorState(1),
          getActuatorState(2),
          getActuatorState(3),
        ]);
        if (!alive) return;
        setLucesOn(!!s1?.on);
        setBombaOn(!!s2?.on);
        setVentOn(!!s3?.on);
      } catch (err) {
        console.error(err);
        if (alive) setErrorAct("No se pudo leer el estado de los actuadores.");
      } finally { if (alive) setLoadingAct(false); }
    }

    pullAll();
    const it = setInterval(pullAll, POLL_MS_ACTUADORES);
    return () => { alive = false; clearInterval(it); };
  }, []);

  // // Poll DHT
  // useEffect(() => {
  //   let alive = true;
  //   async function pullDht() {
  //     try {
  //       setErrorDht("");
  //       const r = await getDhtLatest();
  //       if (!alive || !r) return;
  //       setTempC(r.temperatureC ?? null);
  //       setHum(r.humidity ?? null);
  //       setDhtTs(r.utc ?? null);
  //     } catch (err) {
  //       console.error(err);
  //       if (alive) setErrorDht("No se pudo obtener la última lectura del DHT11.");
  //     }
  //   }
  //   pullDht();
  //   const it = setInterval(pullDht, POLL_MS_DHT);
  //   return () => { alive = false; clearInterval(it); };
  // }, []);

  // helpers para actuadores
  const handleSet = (nombre, id, value, setter) => async (v) => {
    if (autoMode) return;
    const prev = value;
    setter(v);
    try {
      await setActuator(id, v);
      setErrorAct("");
      addLog({ tipo: "Actuador", periferico: nombre, accion: v ? "Activado" : "Desactivado", descripcion: `${nombre} actualizado en el servidor (id=${id}).` });
    } catch (err) {
      console.error(err);
      setter(prev);
      setErrorAct(`No se pudo cambiar el estado de ${nombre}.`);
      addLog({ tipo: "Actuador", periferico: nombre, accion: "Error", descripcion: "Fallo al guardar en el servidor." });
    }
  };

  const handleLucesChange = handleSet("Luces", 1, lucesOn, setLucesOn);
  const handleBombaChange = handleSet("Bomba", 2, bombaOn, setBombaOn);
  const handleVentChange = handleSet("Ventilador", 3, ventOn, setVentOn);

  function pulseBomba() {
    if (autoMode) return;
    setBombaOn(true);
    addLog({ tipo: "Pulso", periferico: "Bomba", accion: "Pulso 10s", descripcion: "Se activó un pulso de 10 segundos en la bomba (solo UI)." });
    setTimeout(() => setBombaOn(false), 10000);
  }

  function toggleActuatorLocal(name, setter) {
    return (v) => {
      if (autoMode) return;
      setter(v);
      addLog({ tipo: "Actuador", periferico: name, accion: v ? "Activado" : "Desactivado", descripcion: `El actuador "${name}" fue ${v ? "activado" : "desactivado"} (local).` });
    };
  }

  function abrirTecho() { if (!autoMode) { setTecho("Abierto"); addLog({ tipo: "Actuador", periferico: "Techo", accion: "Abrir", descripcion: "Se ordenó abrir el techo corredizo (UI)." }); } }
  function cerrarTecho() { if (!autoMode) { setTecho("Cerrado"); addLog({ tipo: "Actuador", periferico: "Techo", accion: "Cerrar", descripcion: "Se ordenó cerrar el techo corredizo (UI)." }); } }

  // Filtrado tipo LIKE (cliente)
  const filtered = useMemo(() => {
    if (!quickFilter) return logs;
    const q = quickFilter.trim().toLowerCase();
    return logs.filter(r =>
      (r.usuario || "").toString().toLowerCase().includes(q) ||
      (r.tipo || "").toString().toLowerCase().includes(q) ||
      (r.periferico || "").toString().toLowerCase().includes(q) ||
      (r.accion || "").toString().toLowerCase().includes(q) ||
      (r.descripcion || "").toString().toLowerCase().includes(q) ||
      (r.fecha || "").toString().toLowerCase().includes(q)
    );
  }, [logs, quickFilter]);

  // paginación simple en cliente
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCsv(itemsToExport = filtered) {
    const rows = [
      ["Id", "Usuario", "Fecha", "Tipo", "Periférico", "Acción", "Descripción"].join(","),
      ...itemsToExport.map(r => [
        r.id,
        r.usuario,
        r.fecha,
        r.tipo,
        r.periferico,
        r.accion,
        (r.descripcion || "").replace(/"/g, '""')
      ].map(v => (typeof v === "string" && /[",\n]/.test(v)) ? `"${v}"` : v).join(","))
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bitacora.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearLogs() {
    if (!confirm("¿Borrar toda la bitácora?")) return;
    setLogs([]);
  }

  return (
    <div className="container-fluid scx">
      <style>{`
        .hover-card {box-shadow .18s ease; }
        .hover-card:hover {box-shadow: 0 12px 30px rgba(12,58,49,0.06); }
      `}</style>

      <div className="d-flex align-items-center mb-3 gap-2">
        <div className="scx-kpi-ico"><i className="fas fa-sliders-h" /></div>
        <div>
          <h1 className="h3 mb-0 scx-title">Control del invernadero</h1>
          <small className="text-muted">Activa manualmente los actuadores o habilita el modo automático por sensores.</small>
        </div>
      </div>

      {/* quick filter + acciones */}
      <div className="d-flex gap-2 align-items-center mb-3">
        <div className="input-group" style={{ maxWidth: 380 }}>
          <span className="input-group-text"><i className="fas fa-search"></i></span>
          <input className="form-control" placeholder="Buscar en la bitácora..." value={quickFilter} onChange={(e) => { setQuickFilter(e.target.value); setPage(1); }} />
          <button className="btn btn-outline-secondary" onClick={() => { setQuickFilter(""); setPage(1); }}><i className="fas fa-times" /></button>
        </div>

        <div className="ms-auto d-flex gap-2">
          <button className="btn btn-outline-success" onClick={() => exportCsv()}><i className="fas fa-file-export me-1" /> Exportar</button>
          <button className="btn btn-outline-danger" onClick={clearLogs}><i className="fas fa-trash me-1" /> Limpiar</button>
          <Pill tone={apiOk ? "success" : "secondary"}>{apiOk ? "En línea" : "Sin conexión"}</Pill>
        </div>
      </div>

      {/* Modo automatico card */}
      <div className="card scx-card mb-3 hover-card">
        <div className="card-body d-flex align-items-center justify-content-between">
          <div className="d-flex gap-3 align-items-center">
            <div className="scx-ico success"><i className="fas fa-microchip" /></div>
            <div>
              <h6 className="mb-0 fw-bold">Modo automático</h6>
              <div className="small text-muted">Al activarlo, los sensores gestionan los actuadores.</div>
            </div>
          </div>

          <div className="text-center">
            <div className="scx-switch-xl">
              <input id="swAuto" type="checkbox" checked={autoMode} onChange={(e) => toggleAuto(e.target.checked)} />
              <label htmlFor="swAuto" />
            </div>
            <div className="small text-muted mt-1">{autoMode ? "Automático" : "Manual"}</div>
          </div>
        </div>
      </div>

      {/* sensores
      <div className="card scx-card mb-3 hover-card">
        <div className="card-body d-flex align-items-center justify-content-between">
          <div className="d-flex gap-3 align-items-center">
            <div className="scx-ico success"><i className="fas fa-thermometer-half" /></div>
            <div>
              <h6 className="mb-0 fw-bold">Ambiente (DHT11)</h6>
              <div className="small text-muted">Temp: <strong>{tempC ?? "—"}°C</strong> · Hum: <strong>{hum ?? "—"}%</strong>{dhtTs && <span className="text-muted ms-2">({new Date(dhtTs).toLocaleTimeString()})</span>}</div>
              {errorDht && <div className="small text-warning mt-1">{errorDht}</div>}
            </div>
          </div>
          <div></div>
        </div>
      </div> */}

      {/* Actuadores */}
      <div className="row g-3">
        <div className="col-xl-4 col-lg-6">
          <ActuatorCard icon="lightbulb" title="Luces" desc="Iluminación suplementaria" switchProps={{ id: "swLuces", checked: lucesOn, onChange: handleLucesChange, disabled: autoMode || loadingAct }} />
        </div>
        <div className="col-xl-4 col-lg-6">
          <ActuatorCard icon="water" title="Bomba" desc="Riego/recirculación" switchProps={{ id: "swBomba", checked: bombaOn, onChange: handleBombaChange, disabled: autoMode || loadingAct }}>
            <button className="btn scx-btn-outline-success btn-sm" onClick={pulseBomba} disabled={autoMode}><i className="fas fa-bolt me-1" /> Pulso 10s</button>
          </ActuatorCard>
        </div>
        <div className="col-xl-4 col-lg-6">
          <ActuatorCard icon="fan" title="Ventilador" desc="Intercambio de aire" switchProps={{ id: "swVent", checked: ventOn, onChange: handleVentChange, disabled: autoMode || loadingAct }} />
        </div>

        <div className="col-xl-8 col-lg-12">
          <div className={`card scx-card act-card position-relative ${autoMode ? "act-disabled" : ""}`}>
            <div className="card-body d-flex justify-content-between align-items-center">
              <div className="d-flex gap-3 align-items-center">
                <div className="scx-ico success"><i className="fas fa-warehouse" /></div>
                <div>
                  <h6 className="mb-0 fw-bold">Techo</h6>
                  <div className="small text-muted">Apertura/cierre del techo corredizo.</div>
                </div>
              </div>

              <div className="d-flex gap-2 align-items-center">
                <span className={`badge ${techo === "Abierto" ? "bg-success" : "bg-secondary"}`}>Estado: {techo}</span>
                <button className="btn scx-btn-success" onClick={abrirTecho} disabled={autoMode}><i className="fas fa-arrow-up me-1" /> Abrir</button>
                <button className="btn scx-btn-outline-success" onClick={cerrarTecho} disabled={autoMode}><i className="fas fa-arrow-down me-1" /> Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla bootstrap */}
      <div className="card scx-card mt-4">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold mb-0"><i className="fas fa-clipboard-list me-2 text-success"></i>Bitácora de cambios</h6>
            <small className="text-muted">Última actualización: {fmt(lastUpdate)}</small>
          </div>

          {errorAct && <div className="alert alert-warning py-2 px-3 small"><i className="fas fa-triangle-exclamation me-2" />{errorAct}</div>}

          {filtered.length === 0 ? (
            <div className="text-center py-5">
              <img src={PLACEHOLDER_IMG} alt="placeholder" style={{ maxWidth: 220 }} className="mb-3 rounded" />
              <h6 className="text-success">No hay registros</h6>
              <p className="text-muted">Las acciones que realices aparecerán aquí.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>Usuario</th>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Periférico</th>
                      <th>Acción</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((r, idx) => (
                      <tr key={r.id ?? idx}>
                        <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td>{r.usuario}</td>
                        <td>{fmt(r.fecha)}</td>
                        <td>{r.tipo}</td>
                        <td>{r.periferico}</td>
                        <td>{r.accion}</td>
                        <td style={{ maxWidth: 420 }} className="text-truncate">{r.descripcion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* paginación simple */}
              <div className="d-flex align-items-center justify-content-between mt-3">
                <div className="small text-muted">Mostrando {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}</div>

                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>&laquo;</button>
                    </li>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                      </li>
                    ))}
                    <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>&raquo;</button>
                    </li>
                  </ul>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


