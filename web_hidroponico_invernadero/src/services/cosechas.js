import { api } from "../apiClient";

export async function listCosechas(params = {}) {
  const res = await api.get("/api/cosechas", { params });
  return res.data;
}

export async function getCosecha(id) {
  const res = await api.get(`/api/cosechas/${id}`);
  return res.data;
}

export async function createCosecha(payload) {
  const res = await api.post("/api/cosechas", payload);
  return res.data;
}

export async function updateCosecha(id, payload) {
  const res = await api.put(`/api/cosechas/${id}`, payload);
  return res.data;
}

export async function deleteCosecha(id) {
  const res = await api.delete(`/api/cosechas/${id}`);
  return res.data;
}

export async function listCosechasByHydroponico(hidroId, params = {}) {
  const res = await api.get(`/api/hidroponicos/${hidroId}/cosechas`, { params });
  return res.data;
}

export async function getCosechasStats() {
  const res = await api.get("/api/cosechas/stats");
  return res.data;
}

export async function finalizeCosecha(id) {
  // Use dedicated endpoint to finalizar cosecha
  const res = await api.post(`/api/cosechas/finalizar/${id}`);
  return res.data;
}
