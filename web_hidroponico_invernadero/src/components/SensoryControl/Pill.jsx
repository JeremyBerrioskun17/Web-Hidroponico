import React from "react";

export default function Pill({ children, tone = "secondary" }) {
  return (
    <span className={`badge rounded-pill scx-badge-${tone} px-3 py-2 fw-semibold`}>
      {children}
    </span>
  );
}
