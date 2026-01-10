import { api } from "../apiClient";

export async function listEtapasHidroponico(params = {}) {
  const res = await api.get("/api/etapas-hidroponico", { params });
  return res.data;
}

export async function getEtapaHidroponico(id) {
  const res = await api.get(`/api/etapas-hidroponico/${id}`);
  return res.data;
}
