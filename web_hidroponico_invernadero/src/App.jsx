import { Routes, Route, Navigate } from "react-router-dom";

import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login/Login.jsx";
import Diagnostics from "./pages/Diagnostics.jsx";
import HeatMap from "./pages/HeatMap.jsx";
import SensoryControl from "./pages/sensory-control/SensoryControl.jsx";
import SensoryMonitoring from "./pages/SensoryMonitoring.jsx";
import Catalogos from "./pages/Catalogos.jsx";

import Cosechas from "./pages/Cosecha/Cosechas.jsx";

import Hidroponicos from "./pages/Hidroponico/Hidroponicos.jsx";

import PrivateRoute from "./components/PrivateRoute";


export default function App() {
  return (
    <Routes>
            {/* Pública */}
            <Route path="/login" element={<Login />} />

            {/* Padre protegido con Layout (sidebar/topbar) */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                {/* Ruta por defecto dentro del layout */}
                <Route index element={<Navigate to="dashboard" replace />} />

                {/* Hijas protegidas */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="diagnosticos" element={<Diagnostics />} />
                <Route path="heatmap" element={<HeatMap />} />
                <Route path="sensoryControl" element={<SensoryControl />} />
                <Route path="sensoryMonitoring" element={<SensoryMonitoring />} />
                <Route path="catalogos" element={<Catalogos />} />
                <Route path="cosecha" element={<Cosechas />} />
                <Route path="hidroponico" element={<Hidroponicos />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
  );
}