//import { StrictMode } from "react";
//import { createRoot } from "react-dom/client";
//import "./index.css";   // 👈 aquí va tu CSS custom
//import App from "./App.jsx";


//createRoot(document.getElementById("root")).render(
//    <StrictMode>
//        <App />
//    </StrictMode>
//);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // estilos base

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
                <ToastContainer
                    position="top-right"
                    autoClose={2500}
                    hideProgressBar
                    newestOnTop
                    closeOnClick
                    pauseOnHover
                    theme="colored" // "light", "dark", o "colored"
                />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);


