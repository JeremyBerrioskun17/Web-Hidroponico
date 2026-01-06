// src/components/Layout.jsx
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// use a placeholder/logo for branding; keep asset import if you later replace with real logo
import LogoGC from "../assets/Logo_GC.png";

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const ROL = (user?.rol || "").toLowerCase(); // "admin" | "investigador" | "tecnico"

    // Cierra todos los submenús abiertos del sidebar
    function closeAllSubmenus() {
        const bs = window.bootstrap; // requiere bootstrap.bundle en index.html
        if (!bs) return;
        document
            .querySelectorAll(".sidebar .collapse.show")
            .forEach((el) => new bs.Collapse(el, { toggle: false }).hide());
    }

    // Control de Roles
    const can = {
        verIA: ROL === "administrador" || ROL === "investigador",
        verMapas: ROL === "administrador" || ROL === "investigador",
        verReportes: ROL === "administrador" || ROL === "investigador",
        verIoT: ROL === "administrador" || ROL === "tecnico",
        verGestion: ROL === "administrador",
    };

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        navigate("/login", { replace: true });
    };

    // Cerrar submenús cuando cambia de ruta
    useEffect(() => {
        closeAllSubmenus();
    }, [location.pathname]);

    // Avatar
    const avatarSrc =
        user?.photoUrl
            ? user.photoUrl
            : user?.photoBase64
                ? `data:image/jpeg;base64,${user.photoBase64}`
                : "https://i.pravatar.cc/40?img=3";

    return (
        <div id="wrapper" className="d-flex">
            {/* ===== SIDEBAR ===== */}
            <ul
                className={
                    "navbar-nav bg-gradient-success sidebar sidebar-dark accordion " +
                    (collapsed ? "toggled" : "")
                }
                id="accordionSidebar"
            >
                {/* Brand → /dashboard */}
                <NavLink
                    className="sidebar-brand d-flex align-items-center justify-content-center"
                    to="/dashboard"
                    onClick={closeAllSubmenus}
                >
                    <div className="sidebar-brand-icon rotate-n-15">
                        <i className="fas fa-seedling"></i>
                    </div>
                    <div className="sidebar-brand-text mx-3">
                        NicaTech <sup>Solutions</sup>
                    </div>
                </NavLink>

                <hr className="sidebar-divider my-0" />

                {/* Dashboard */}
                <li className="nav-item">
                    <NavLink className="nav-link" to="/dashboard" onClick={closeAllSubmenus}>
                        <i className="fas fa-warehouse"></i>
                        <span>Dashboard</span>
                    </NavLink>
                </li>

                {/* ====== FITOSANITARIA ====== */}
                {can.verIA && (
                    <>
                        <hr className="sidebar-divider" />
                        <div className="sidebar-heading">Fitosanitaria</div>

                        <li className="nav-item">
                            <a
                                className="nav-link collapsed"
                                href="#collapseIA"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseIA"
                                aria-expanded="false"
                                aria-controls="collapseIA"
                            >
                                <i className="fas fa-microscope"></i>
                                <span>Diagnóstico IA</span>
                            </a>
                            <div
                                id="collapseIA"
                                className="collapse"
                                data-bs-parent="#accordionSidebar"
                            >
                                <div className="bg-white py-2 collapse-inner rounded">
                                    <h6 className="collapse-header">Clasificación:</h6>
                                    <NavLink className="collapse-item" to="/catalogos" onClick={closeAllSubmenus}>
                                        Plagas registradas
                                    </NavLink>
                                    <NavLink className="collapse-item" to="/diagnosticos" onClick={closeAllSubmenus}>
                                        Mis diagnósticos
                                    </NavLink>
                                    <div className="collapse-divider"></div>
                                    <h6 className="collapse-header">Modelos IA:</h6>
                                    <NavLink className="collapse-item" to="/models" onClick={closeAllSubmenus}>
                                        Versiones del modelo
                                    </NavLink>
                                    {/* <NavLink className="collapse-item" to="/metrics">Métricas</NavLink> */}
                                </div>
                            </div>
                        </li>

                        <li className="nav-item">
                            <a
                                className="nav-link collapsed"
                                href="#collapseMapa"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseMapa"
                                aria-expanded="false"
                                aria-controls="collapseMapa"
                            >
                                <i className="fas fa-map-marked-alt"></i>
                                <span>Mapa</span>
                            </a>
                            <div
                                id="collapseMapa"
                                className="collapse"
                                data-bs-parent="#accordionSidebar"
                            >
                                <div className="bg-white py-2 collapse-inner rounded">
                                    <h6 className="collapse-header">Geolocalización:</h6>
                                    <NavLink className="collapse-item" to="/map" onClick={closeAllSubmenus}>
                                        Focos y casos
                                    </NavLink>
                                    <NavLink className="collapse-item" to="/heatmap" onClick={closeAllSubmenus}>
                                        Mapa de calor
                                    </NavLink>
                                    {/* <NavLink className="collapse-item" to="/map/filters">Filtros por fecha/región</NavLink> */}
                                </div>
                            </div>
                        </li>

                        <li className="nav-item">
                            <a
                                className="nav-link collapsed"
                                href="#collapseReportes"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseReportes"
                                aria-expanded="false"
                                aria-controls="collapseReportes"
                            >
                                <i className="fas fa-chart-line"></i>
                                <span>Reportes</span>
                            </a>
                            <div
                                id="collapseReportes"
                                className="collapse"
                                data-bs-parent="#accordionSidebar"
                            >
                                <div className="bg-white py-2 collapse-inner rounded">
                                    <h6 className="collapse-header">Analítica:</h6>
                                    <NavLink className="collapse-item" to="/reports" onClick={closeAllSubmenus}>
                                        Gráficas
                                    </NavLink>
                                    <NavLink className="collapse-item" to="/reports/table" onClick={closeAllSubmenus}>
                                        Datos en tabla
                                    </NavLink>
                                </div>
                            </div>
                        </li>
                    </>
                )}
                {/* ====== Cosecha ====== */}
                {(can.verGestion || can.verIoT) && (
                <>
                    <hr className="sidebar-divider" />
                    <div className="sidebar-heading">Hidroponía</div>

                    <li className="nav-item">
                    <a
                        className="nav-link collapsed"
                        href="#collapseHidro"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseHidro"
                        aria-expanded="false"
                        aria-controls="collapseHidro"
                    >
                        <i className="fas fa-water"></i>
                        <span>Hidroponía</span>
                    </a>
                    <div id="collapseHidro" className="collapse" data-bs-parent="#accordionSidebar">
                        <div className="bg-white py-2 collapse-inner rounded">
                        <h6 className="collapse-header">Gestión:</h6>
                        <NavLink className="collapse-item" to="/hidroponicos" onClick={closeAllSubmenus}>
                            Hidropónicos
                        </NavLink>
                        <NavLink className="collapse-item" to="/cosecha" onClick={closeAllSubmenus}>
                            Cosechas
                        </NavLink>
                        </div>
                    </div>
                    </li>
                </>
                )}

                {/* ====== IoT ====== */}
                {can.verIoT && (
                    <>
                        <hr className="sidebar-divider" />
                        <div className="sidebar-heading">IoT</div>

                        {/* Sensores */}
                        <li className="nav-item">
                            <a
                                className="nav-link collapsed"
                                href="#collapseSensores"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseSensores"
                                aria-expanded="false"
                                aria-controls="collapseSensores"
                            >
                                <i className="fas fa-thermometer-half"></i>
                                <span>Sensores</span>
                            </a>
                            <div
                                id="collapseSensores"
                                className="collapse"
                                data-bs-parent="#accordionSidebar"
                            >
                                <div className="bg-white py-2 collapse-inner rounded">
                                    <h6 className="collapse-header">Lecturas:</h6>
                                    <NavLink className="collapse-item" to="/sensoryMonitoring" onClick={closeAllSubmenus}>
                                        Monitoreo Tiempo Real
                                    </NavLink>
                                    <NavLink className="collapse-item" to="/sensors/control" onClick={closeAllSubmenus}>
                                        Control según análisis
                                    </NavLink>
                                </div>
                            </div>
                        </li>

                        {/* Control directo */}
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/sensoryControl" onClick={closeAllSubmenus}>
                                <i className="fas fa-sliders-h"></i>
                                <span>Control</span>
                            </NavLink>
                        </li>
                    </>
                )}

                {/* ====== GESTIÓN (solo admin) ====== */}
                {can.verGestion && (
                    <>
                        <hr className="sidebar-divider" />
                        <div className="sidebar-heading">Gestión</div>

                        {/* Gestión */}
                        <li className="nav-item">
                            <a
                                className="nav-link collapsed"
                                href="#collapseGestion"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseGestion"
                                aria-expanded="false"
                                aria-controls="collapseGestion"
                            >
                                <i className="fas fa-users-cog"></i>
                                <span>Usuarios y roles</span>
                            </a>
                            <div
                                id="collapseGestion"
                                className="collapse"
                                data-bs-parent="#accordionSidebar"
                            >
                                <div className="bg-white py-2 collapse-inner rounded">
                                    <NavLink className="collapse-item" to="/users" onClick={closeAllSubmenus}>
                                        Usuarios
                                    </NavLink>
                                    <NavLink className="collapse-item" to="/roles" onClick={closeAllSubmenus}>
                                        Roles y permisos
                                    </NavLink>
                                    <NavLink className="collapse-item" to="/profile" onClick={closeAllSubmenus}>
                                        Mi perfil
                                    </NavLink>
                                </div>
                            </div>
                        </li>

                        {/* Conocimiento */}
                        <li className="nav-item">
                            <a
                                className="nav-link collapsed"
                                href="#collapseConocimiento"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseConocimiento"
                                aria-expanded="false"
                                aria-controls="collapseConocimiento"
                            >
                                <i className="fas fa-book-medical"></i>
                                <span>Conocimiento</span>
                            </a>
                            <div
                                id="collapseConocimiento"
                                className="collapse"
                                data-bs-parent="#accordionSidebar"
                            >
                                <div className="bg-white py-2 collapse-inner rounded">
                                    <NavLink className="collapse-item" to="/guide" onClick={closeAllSubmenus}>
                                        Guía de enfermedades
                                    </NavLink>
                                    <NavLink className="collapse-item" to="/dataset" onClick={closeAllSubmenus}>
                                        Dataset y etiquetado
                                    </NavLink>
                                </div>
                            </div>
                        </li>
                    </>
                )}

                <hr className="sidebar-divider d-none d-md-block" />

                {/* Sidebar Toggler (desktop) */}
                <div className="text-center d-none d-md-inline">
                    <button
                        className="rounded-circle border-0"
                        id="sidebarToggle"
                        onClick={() => setCollapsed((v) => !v)}
                        aria-label="Toggle sidebar"
                    />
                </div>

                {/* Sidebar Message */}
                <div className="sidebar-card d-none d-lg-flex">
                    <img
                        className="sidebar-card-illustration mb-2"
                        src={"https://via.placeholder.com/120x80.png?text=NicaTech"}
                        alt="NicaTech Solutions"
                    />
                    <p className="text-center mb-2">
                        <strong>NicaTech Solutions</strong> — Plataforma para monitoreo y control inteligente de cultivos.
                    </p>
                    <a className="btn btn-success btn-sm" href="#">
                        Ver más
                    </a>
                </div>
            </ul>

            {/* ===== CONTENT ===== */}
            <div id="content-wrapper" className="d-flex flex-column w-100">
                <div id="content">
                    {/* ===== TOPBAR ===== */}
                    <nav className="navbar navbar-expand navbar-light topbar mb-4 static-top shadow">
                        <button
                            id="sidebarToggleTop"
                            className="btn btn-link d-md-none rounded-circle me-3"
                            onClick={() => setCollapsed((v) => !v)}
                            aria-label="Toggle sidebar"
                        >
                            <i className="fa fa-bars text-white"></i>
                        </button>

                        <ul className="navbar-nav ms-auto align-items-center">
                            {/* Alerts */}
                            <li className="nav-item dropdown no-arrow mx-1">
                                <a
                                    className="nav-link dropdown-toggle"
                                    href="#"
                                    id="alertsDropdown"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="fas fa-bell fa-fw"></i>
                                    <span className="badge badge-counter">3</span>
                                </a>
                                <div
                                    className="dropdown-list dropdown-menu dropdown-menu-end shadow"
                                    aria-labelledby="alertsDropdown"
                                    style={{ minWidth: 320 }}
                                >
                                    <h6 className="dropdown-header">Centro de Alertas</h6>
                                    {/* ...items... */}
                                </div>
                            </li>

                            {/* Messages */}
                            <li className="nav-item dropdown no-arrow mx-1">
                                <a
                                    className="nav-link dropdown-toggle"
                                    href="#"
                                    id="messagesDropdown"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="fas fa-envelope fa-fw"></i>
                                    <span className="badge badge-counter">5</span>
                                </a>
                                <div
                                    className="dropdown-list dropdown-menu dropdown-menu-end shadow"
                                    aria-labelledby="messagesDropdown"
                                    style={{ minWidth: 320 }}
                                >
                                    <h6 className="dropdown-header">Centro de Mensajes</h6>
                                    {/* ...items... */}
                                </div>
                            </li>

                            <div className="topbar-divider d-none d-sm-block" />

                            {/* User */}
                            <li className="nav-item dropdown no-arrow">
                                <a
                                    className="nav-link dropdown-toggle d-flex align-items-center"
                                    href="#"
                                    id="userDropdown"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <span className="me-2 d-none d-lg-inline username-topbar">
                                        <i className="fas fa-user-circle me-1"></i>{" "}
                                        {user?.username ?? "Usuario"}
                                        {user?.rol ? ` · ${user.rol}` : ""}
                                    </span>
                                    <img
                                        className="img-profile rounded-circle"
                                        src={avatarSrc}
                                        width="32"
                                        height="32"
                                        alt={user?.username || "user"}
                                    />
                                </a>
                                <div
                                    className="dropdown-menu dropdown-menu-end shadow"
                                    aria-labelledby="userDropdown"
                                >
                                    <a className="dropdown-item" href="#">
                                        <i className="fas fa-user fa-sm fa-fw me-2 text-gray-400"></i>{" "}
                                        Perfil
                                    </a>
                                    <a className="dropdown-item" href="#">
                                        <i className="fas fa-cogs fa-sm fa-fw me-2 text-gray-400"></i>{" "}
                                        Configuración
                                    </a>
                                    <div className="dropdown-divider"></div>
                                    <a className="dropdown-item" href="#" onClick={handleLogout}>
                                        <i className="fas fa-sign-out-alt fa-sm fa-fw me-2 text-gray-400"></i>{" "}
                                        Cerrar sesión
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </nav>

                    {/* CONTENIDO */}
                    <main className="container-fluid p-4">
                        <Outlet />
                    </main>
                </div>

                <footer className="bg-light text-center p-3 border-top mt-auto">
                    © NicaTech Solutions
                </footer>
            </div>
        </div>
    );
}
