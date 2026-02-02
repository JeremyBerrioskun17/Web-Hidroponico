import { api } from "../apiClient";

export async function listHydroponicos(params = {}) {
  const res = await api.get("/api/hidroponicos", { params });
  return res.data; // tu API devuelve array
}

export async function createHydroponico(payload) {
  const res = await api.post("/api/hidroponicos", payload);
  return res.data; // 201 Created devuelve objeto
}

export async function updateHydroponico(id, payload) {
  const res = await api.put(`/api/hidroponicos/${id}`, payload);
  return res.data; // en tu API devuelve 204, aquí será undefined; está bien
}

export async function deleteHydroponico(id) {
  const res = await api.delete(`/api/hidroponicos/${id}`);
  return res.data; // 204 => undefined
}
