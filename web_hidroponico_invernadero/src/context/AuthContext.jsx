// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../apiClient"; // tu cliente axios/fetch wrapper

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

function isExpired(expUnixSeconds) {
  if (!expUnixSeconds) return true;
  const now = Math.floor(Date.now() / 1000);
  return expUnixSeconds <= now;
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // 1) Leer storage *sincrónicamente* en la inicialización
  const initial = (() => {
    try {
      const saved = localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
      if (!saved) return null;
      const u = JSON.parse(saved);
      if (u?.exp && isExpired(u.exp)) {
        localStorage.removeItem("auth_user");
        sessionStorage.removeItem("auth_user");
        return null;
      }
      return u;
    } catch {
      return null;
    }
  })();

  // user ya viene rehidratado en el primer render
  const [user, setUser] = useState(initial);
  // loading indica que la app está validando/rehidratando (útil para PrivateRoute)
  const [loading, setLoading] = useState(false);

  // Si existe user al iniciar, aplica header Authorization al cliente HTTP
  useEffect(() => {
    if (user?.token) {
      // Si usas axios:
      if (api?.defaults) api.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
      // Si tu api es otro wrapper, ajusta aquí.
    } else {
      if (api?.defaults) delete api.defaults.headers.common["Authorization"];
    }
  }, [user]);

  // Auto-logout al expirar (igual que antes)
  useEffect(() => {
    if (!user?.exp) return;
    const msToExpire = user.exp * 1000 - Date.now();
    if (msToExpire <= 0) { logout(); return; }
    const id = setTimeout(() => logout(), msToExpire + 1000);
    return () => clearTimeout(id);
  }, [user?.exp]);

  // login: guarda en storage, set user y header
  async function login(emailOrUser, password, remember = false) {
    if (!emailOrUser || !password) throw new Error("Completa email/usuario y contraseña");

    const { data } = await api.post("/api/auth/login", {
      UsuarioOCorreo: emailOrUser,
      Contrasena: password,
    });
    // data: { token, expiraEn, usuario, rol }

    const payload = parseJwt(data.token);
    const exp = payload?.exp || Math.floor(Date.parse(data.expiraEn) / 1000) || null;

    const authData = {
      username: data.usuario,
      email: payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || null,
      rol: data.rol,
      token: data.token,
      exp,
    };

    setUser(authData);

    // set Authorization header en el cliente
    if (api?.defaults) api.defaults.headers.common["Authorization"] = `Bearer ${authData.token}`;

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("auth_user", JSON.stringify(authData));
    return authData;
  }

  function logout() {
    setUser(null);
    if (api?.defaults) delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("auth_user");
    sessionStorage.removeItem("auth_user");
  }

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: !!user?.token && !isExpired(user?.exp),
    login,
    logout,
    // helper: forzar revalidación (útil si usas cookie HttpOnly / me endpoint)
    async revalidate() {
      setLoading(true);
      try {
        const res = await api.get("/api/auth/me");
        setUser(res.data);
        if (api?.defaults && res.data?.token) api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
