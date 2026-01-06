import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import {
  pingApi,
  getActuatorState,
  setActuator,
  getDhtLatest,
} from "../../services/leds";

import { listHorariosRiego } from "../../services/horariosRiego";
import ModalDetalleHorarios from "../../components/ModalDetalleHorarios/ModalDetalleHorarios";
import ModalNuevoHorarioRiego from "../../components/ModalNuevoHorarioRiego/ModalNuevoHorarioRiego";


import "./sensory-control.css";

const POLL_MS_ACTUADORES = 2000;
const POLL_MS_DHT = 3000;
const PAGE_SIZE = 8;

/* ================== Constantes ================== */
const DIAS = [
  { id: 1, nombre: "Lunes" },
  { id: 2, nombre: "Martes" },
  { id: 3, nombre: "Miércoles" },
  { id: 4, nombre: "Jueves" },
  { id: 5, nombre: "Viernes" },
  { id: 6, nombre: "Sábado" },
  { id: 7, nombre: "Domingo" },
];


/* ================== UI helpers ================== */
function Pill({ children, tone = "secondary" }) {
  return (
    <span className={`badge rounded-pill scx-badge-${tone} px-3 py-2 fw-semibold`}>
      {children}
    </span>
  );
}

function SwitchBig({ id, checked, onChange, disabled }) {
  return (
    <label className="chk-toggle">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="slider"></span>
    </label>
  );
}


function ActuatorCard({ icon, title, desc, disabled, switchProps }) {
  const isOn = switchProps.checked;

  return (
    <div className={`act-card ${isOn ? "on" : "off"} ${disabled ? "disabled" : ""}`}>
      <div className="act-card-header">
        <div className="act-card-header-inner">
          <div className="act-icon-square">
            <i className={`fas fa-${icon}`} />
          </div>
          <div className="act-header-text">
            <div className="act-header-title">{title}</div>
            <div className="act-header-sub">{desc}</div>
          </div>
        </div>
      </div>

      <div className="act-card-body">
        <div className="act-status-row">
          <div>
            <h4 className="act-status-label">Estado:</h4>
            <div className="state-badge">
              <Pill tone={isOn ? "success" : "secondary"}>{isOn ? "Encendido" : "Apagado"}</Pill>
            </div>
          </div>

          <div className="act-switch-wrapper">
            <SwitchBig {...switchProps} disabled={disabled} />
          </div>
        </div>
      </div>
    </div>
  );
}



/* ================== Página ================== */
export default function SensoryControl() {
  const { user } = useAuth();
  const actor = user?.username || "usuario";

  // Actuadores
  const [autoMode, setAutoMode] = useState(false);
  const [lucesOn, setLucesOn] = useState(false);
  const [bombaOn, setBombaOn] = useState(false);
  const [ventOn, setVentOn] = useState(false);

  // Sensores
  const [tempC, setTempC] = useState(null);
  const [hum, setHum] = useState(null);
  const [dhtTs, setDhtTs] = useState(null);
  const [apiOk, setApiOk] = useState(true);

  // Horarios
  const [horarios, setHorarios] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [horariosDia, setHorariosDia] = useState([]);

  // Bitácora
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);

  const [showNuevoHorario, setShowNuevoHorario] = useState(false);

  const fmt = (d) =>
    new Date(d).toLocaleString("es-NI", {
      dateStyle: "short",
      timeStyle: "medium",
    });

  function addLog(data) {
    setLogs((prev) => [
      { id: prev.length + 1, usuario: actor, fecha: new Date(), ...data },
      ...prev,
    ]);
  }

  /* ================== Hooks ================== */
  useEffect(() => {
    pingApi().then(
      () => setApiOk(true),
      () => setApiOk(false)
    );
  }, []);

  useEffect(() => {
    const pull = async () => {
      const [l, b, v] = await Promise.all([
        getActuatorState(1),
        getActuatorState(2),
        getActuatorState(3),
      ]);
      setLucesOn(!!l?.on);
      setBombaOn(!!b?.on);
      setVentOn(!!v?.on);
    };
    pull();
    const it = setInterval(pull, POLL_MS_ACTUADORES);
    return () => clearInterval(it);
  }, []);

  useEffect(() => {
    const pull = async () => {
      const d = await getDhtLatest();
      if (!d) return;
      setTempC(d.temperatureC);
      setHum(d.humidity);
      setDhtTs(d.utc);
    };
    pull();
    const it = setInterval(pull, POLL_MS_DHT);
    return () => clearInterval(it);
  }, []);

  useEffect(() => {
    listHorariosRiego().then(setHorarios);
  }, []);

  /* ================== Horarios ================== */
  const openDia = (dia) => {
    const filtrados = horarios.filter(h => h.diaSemana === dia.id);
    setDiaSeleccionado(dia.nombre);
    setHorariosDia(filtrados);
  };

  /* ================== Actuadores ================== */
  const handleSet = (name, id, value, setter) => async (v) => {
    if (autoMode) return;
    setter(v);
    await setActuator(id, v);
    addLog({
      tipo: "Actuador",
      periferico: name,
      accion: v ? "Encendido" : "Apagado",
      descripcion: `${name} cambiado manualmente`,
    });
  };

  /* ================== Paginación ================== */
  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [logs, page]
  );

  /* ================== Render ================== */
  return (
    <div className="container-fluid scx">
      
      {/* ===== Header ===== */}
      <div className="header-row flex-wrap gap-3">

        {/* ===== Título ===== */}
        <div className="page-title">
          <div className="title-icon bg-success-subtle text-success">
            <i className="fas fa-seedling" />
          </div>

          <div>
            <h1>Control del Invernadero</h1>
            <div className="page-desc">
              Monitoreo ambiental y control de actuadores.
            </div>
          </div>
        </div>

        {/* ===== Acciones ===== */}
        <div className="header-actions d-flex align-items-center gap-2 flex-wrap">

          {/* Acción principal */}
          <button
            className="btn btn-success scx-btn-add"
            onClick={() => setShowNuevoHorario(true)}
          >
            <i className="fas fa-plus me-1" />
            Nuevo horario
          </button>

          {/* Modal */}
         <ModalNuevoHorarioRiego
            show={showNuevoHorario}
            onClose={() => {
              setShowNuevoHorario(false);
              listHorariosRiego().then(setHorarios);
            }}
          />
        </div>
      </div>

      

      {/* ===== Modo ===== */}
      <div className="scx-section">
        <div className="scx-card scx-card-highlight">
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-bold mb-1">Modo automático</h6>
              <small className="text-muted">
                Bloquea los controles manuales cuando está activo
              </small>
            </div>
            <SwitchBig id="swAuto" checked={autoMode} onChange={setAutoMode} />
          </div>
        </div>
      </div>



     {/* ===== Horarios ===== */}
    <div className="scx-section">
      <h6 className="scx-section-title">Horarios de riego</h6>

      <div className="row g-3">
        {DIAS.map((dia) => {
          const total = horarios.filter(h => h.diaSemana === dia.id).length;
          const hasHorarios = total > 0;

          return (
            <div className="col-sm-6 col-md-4" key={dia.id}>
              <div
                className={`schedule-card ${hasHorarios ? "active" : "empty"}`}
                onClick={() => openDia(dia)}
              >
                {/* ICONO */}
                <div className="schedule-icon">
                  <i className="fas fa-clock" />
                </div>

                {/* INFO */}
                <div className="schedule-info">
                  <h5>{dia.nombre}</h5>
                  <span className="schedule-count">
                    {hasHorarios
                      ? `${total} horario${total > 1 ? "s" : ""}`
                      : "Sin horarios"}
                  </span>
                </div>

                {/* BADGE */}
                {hasHorarios && (
                  <span className="schedule-badge">
                    Configurado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <ModalDetalleHorarios
      dia={diaSeleccionado}
      horarios={horariosDia}
      onClose={() => {
        setDiaSeleccionado(null);
        setHorariosDia([]);
      }}
    />



      {/* ===== Actuadores ===== */}
      <div className="scx-section">
        <h6 className="scx-section-title">Actuadores</h6>

        <div className="row g-3 actuators-grid">
          <div className="actuators-grid-item">
            <ActuatorCard
              icon="lightbulb"
              title="Luces"
              desc="Iluminación del invernadero"
              disabled={autoMode}
              switchProps={{
                id: "luces",
                checked: lucesOn,
                onChange: handleSet("Luces", 1, lucesOn, setLucesOn),
              }}
            />
          </div>

          <div className="actuators-grid-item">
            <ActuatorCard
              icon="water"
              title="Bomba"
              desc="Sistema de riego"
              disabled={autoMode}
              switchProps={{
                id: "bomba",
                checked: bombaOn,
                onChange: handleSet("Bomba", 2, bombaOn, setBombaOn),
              }}
            />
          </div>

          <div className="actuators-grid-item">
            <ActuatorCard
              icon="fan"
              title="Ventilador"
              desc="Control de ventilación"
              disabled={autoMode}
              switchProps={{
                id: "vent",
                checked: ventOn,
                onChange: handleSet("Ventilador", 3, ventOn, setVentOn),
              }}
            />
          </div>
        </div>
      </div>


      {/* ===== Bitácora ===== */}
      <div className="card scx-card mt-4">
        <div className="scx-log-header">
          <div className="scx-log-header-inner">
            <div className="scx-ico-lg scx-log-ico">
              <i className="fas fa-clipboard-list" />
            </div>
            <h3 className="scx-log-title">Bitácora</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="scx-log-wrap">
            <table className="table table-sm scx-log-table">
              <thead>
                <tr>
                  <th><div className="scx-td"><i className="fas fa-hashtag me-1" /></div></th>
                  <th><div className="scx-td"><i className="fas fa-clock me-1" />Fecha</div></th>
                  <th><div className="scx-td"><i className="fas fa-toggle-on me-1" />Acción</div></th>
                  <th><div className="scx-td"><i className="fas fa-comment-alt me-1" />Descripción</div></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((l, i) => (
                  <tr key={l.id}>
                    <td><div className="scx-td">{(page - 1) * PAGE_SIZE + i + 1}</div></td>
                      <td><div className="scx-td scx-td-date">{fmt(l.fecha)}</div></td>
                      <td><div className="scx-td scx-td-action">
                        <Pill tone={String(l.accion).toLowerCase().includes('encend') ? 'success' : 'secondary'}>{l.accion}</Pill>
                      </div></td>
                      <td><div className="scx-td scx-td-desc">{l.descripcion}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ←
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
