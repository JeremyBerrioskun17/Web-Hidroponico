// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../apiClient"; // ?? IMPORTA el cliente HTTP

function parseJwt(token) {
    try {
        const base64 = token.split(".")[1];
        const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
        // decodeURIComponent(escape(...)) evita problemas con unicode
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
    const [user, setUser] = useState(null); // { username, email, rol, token, exp }

    // Cargar sesión guardada
    useEffect(() => {
        const saved = localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
        if (saved) {
            const u = JSON.parse(saved);
            if (u?.exp && isExpired(u.exp)) {
                localStorage.removeItem("auth_user");
                sessionStorage.removeItem("auth_user");
            } else {
                setUser(u);
            }
        }
    }, []);

    // Auto-logout al expirar
    useEffect(() => {
        if (!user?.exp) return;
        const msToExpire = user.exp * 1000 - Date.now();
        if (msToExpire <= 0) { logout(); return; }
        const id = setTimeout(() => logout(), msToExpire + 1000);
        return () => clearTimeout(id);
    }, [user?.exp]);

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
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem("auth_user", JSON.stringify(authData));
        return authData;
    }

    function logout() {
        setUser(null);
        localStorage.removeItem("auth_user");
        sessionStorage.removeItem("auth_user");
    }

    const value = useMemo(() => ({
        user,
        isAuthenticated: !!user?.token && !isExpired(user?.exp),
        login,
        logout,
    }), [user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
