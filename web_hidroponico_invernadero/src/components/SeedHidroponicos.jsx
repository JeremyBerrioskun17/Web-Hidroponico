// src/components/SeedHidroponicos.jsx
import { useState } from "react";
import { createHydroponico } from "../services/hidroponicos";

/**
 * Botón que crea un conjunto de hidropónicos de prueba (solo en dev).
 * Uso: colocarlo en la página /hidroponicos, junto al modal/new
 */
const SAMPLES = [
  { nombre: "Hidro A - Invernadero 1", numeroHidroponico: 1, cantidadBandejas: 16, observaciones: "Ubicado al fondo", estado: 0 },
  { nombre: "Hidro B - Invernadero 1", numeroHidroponico: 2, cantidadBandejas: 16, observaciones: "Cerca de puerta", estado: 0 },
  { nombre: "Hidro C - Invernadero 2", numeroHidroponico: 10, cantidadBandejas: 12, observaciones: "Sombra parcial", estado: 0 },
  { nombre: "Hidro D - Invernadero 2", numeroHidroponico: 11, cantidadBandejas: 20, observaciones: "", estado: 0 },
  { nombre: "Hidro E - Exterior", numeroHidroponico: 20, cantidadBandejas: 8, observaciones: "Expuesto", estado: 0 }
];

export default function SeedHidroponicos({ onDone }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSeed() {
    if (!confirm("¿Crear hidropónicos de ejemplo? Esto añadirá varios registros a la base de datos.")) return;
    setLoading(true);
    setMsg("");
    let created = 0;
    for (const s of SAMPLES) {
      try {
        await createHydroponico(s);
        created++;
      } catch (err) {
        // ignorar errores (por ejemplo duplicados)
        console.warn("Seed error:", err);
      }
    }
    setLoading(false);
    setMsg(`${created} hidropónicos creados.`);
    onDone?.();
  }

  return (
    <div className="d-inline-block">
      <button className="btn btn-outline-primary" onClick={handleSeed} disabled={loading}>
        {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-seedling me-2" />}
        Crear ejemplos
      </button>
      {msg && <div className="small text-success mt-2">{msg}</div>}
    </div>
  );
}
