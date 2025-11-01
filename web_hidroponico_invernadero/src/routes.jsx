//import Layout from "./components/Layout.jsx";
//import Home from "./pages/Home.jsx";

//export const routes = [
//    {
//        path: "/",
//        element: <Layout />,
//        children: [
//            { index: true, element: <Home /> },
//        ],
//    },
//];


import { Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx"; // o placeholders
import Diagnosticos from "./pages/Diagnostics.jsx";
import HeatMap from "./pages/HeatMap.jsx";
import SensoryControl from "./pages/sensory-control/SensoryControl.jsx";
import SensoryMonitoring from "./pages/SensoryMonitoring.jsx";
import SensoryMonitoring from "./pages/Catalogos.jsx";

export const routes = [
    // pública
    { path: "/Login", element: <Login /> },

    // protegidas
    {
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="/Dashboard" replace /> },
            { path: "Dashboard", element: <Dashboard /> },
            { path: "Home", element: <Home /> },
            { path: "diagnosticos", element: <Diagnosticos /> },
            { path: "heatmap", element: <HeatMap /> },
            { path: "sensoryControl", element: <SensoryControl /> },
            { path: "sensoryMonitoring", element: <SensoryMonitoring /> },
            { path: "Catalogos", element: <SensoryMonitoring /> },
        ],
    },

    // catch-all
    { path: "*", element: <Navigate to="/Login" replace /> },
];
