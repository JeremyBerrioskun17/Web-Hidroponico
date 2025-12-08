import axios from "axios";


function getStoredAuth() {
    const ls = localStorage.getItem("auth_user");
    const ss = sessionStorage.getItem("auth_user");
    return JSON.parse(ls || ss || "null");
}


export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://localhost:7001"
});


// Inyecta Authorization: Bearer <token> si hay sesi�n
api.interceptors.request.use((config) => {
    const auth = getStoredAuth();
    if (auth?.token) config.headers.Authorization = `Bearer ${auth.token}`;
    return config;
});



// (Opcional) logout autom�tico si el backend responde 401
// import { logout } from "./auth/somewhere";
// api.interceptors.response.use(r => r, err => { if (err?.response?.status === 401) logout(); return Promise.reject(err); });