import React from "react";
import SwitchBig from "./SwitchBig";

export default function ActuatorCard({ icon, title, desc, disabled, switchProps }) {
  const isOn = switchProps.checked;

  return (
    <div className={`act-card ${isOn ? "on" : "off"} ${disabled ? "disabled" : ""}`}>
      <div className="act-card-body">

        <div className="act-icon">
          <i className={`fas fa-${icon}`} />
        </div>

        <div className="act-info">
          <h6>{title}</h6>
          <p>{desc}</p>
        </div>

        <div className="act-switch">
          <SwitchBig {...switchProps} disabled={disabled} />
          <span className={`act-state ${isOn ? "on" : "off"}`}>
            {isOn ? "ENCENDIDO" : "APAGADO"}
          </span>
        </div>

      </div>
    </div>
  );
}
