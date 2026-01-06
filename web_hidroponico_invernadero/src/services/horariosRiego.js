import { api } from "../apiClient";

/**
 * Listar todos los horarios de riego
 */
export async function listHorariosRiego(params = {}) {
  const res = await api.get("/api/horarios-riego", { params });
  return res.data;
}

/**
 * Crear un nuevo horario
 * payload -> {
 *   diaSemana: number (1-7),
 *   nombreDia: string,
 *   horaInicio: "HH:mm:ss",
 *   duracionValor: number,
 *   duracionUnidad: "S" | "M"
 * }
 */
export async function createHorarioRiego(payload) {
  const res = await api.post("/api/horarios-riego", payload);
  return res.data;
}

/**
 * Actualizar horario
 */
export async function updateHorarioRiego(id, payload) {
  const res = await api.put(`/api/horarios-riego/${id}`, payload);
  return res.data;
}

/**
 * Eliminar horario
 */
export async function deleteHorarioRiego(id) {
  await api.delete(`/api/horarios-riego/${id}`);
}
