// src/components/PrivateRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // mientras validamos/rehidratamos, mostramos loader (evita redirect)
  if (loading) return <div className="p-4 text-center">Cargando sesión…</div>;

  // si no hay user (no autenticado), redirigimos al login guardando la ruta origen
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}
