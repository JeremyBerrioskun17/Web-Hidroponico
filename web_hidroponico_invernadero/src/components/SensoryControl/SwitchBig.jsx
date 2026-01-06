import React from "react";

export default function SwitchBig({ id, checked, onChange, disabled }) {
  return (
    <label className="chk-toggle">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="slider" />
    </label>
  );
}
