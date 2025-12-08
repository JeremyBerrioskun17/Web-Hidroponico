// src/components/Layout.jsx
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LogoGC from "../../assets/Logo_GC.png";
import "./Layout.css"; // Estilos mejorados

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const ROL = (user?.rol || "").toLowerCase();

    // Roles permitidos
    const can = {
        verIA: ROL === "administrador" || ROL === "investigador",
        verMapas: ROL === "administrador" || ROL === "investigador",
        verReportes: ROL === "administrador" || ROL === "investigador",
        verIoT: ROL === "administrador" || ROL === "tecnico",
        verGestion: ROL === "administrador",
    };

    // Función para cerrar submenús
    function closeAllSubmenus() {
        const bs = window.bootstrap;
        if (!bs) return;
        document.querySelectorAll(".sidebar .collapse.show").forEach((el) =>
            new bs.Collapse(el, { toggle: false }).hide()
        );
    }

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        navigate("/login", { replace: true });
    };

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

    // ★ Mejora: soporte a animaciones suaves del sidebar
    useEffect(() => {
        const collapses = Array.from(document.querySelectorAll(".sidebar .collapse"));
        if (!collapses.length) return;

        const onShow = (e) => e.target.classList.add("animating-show");
        const onShown = (e) => {
            const el = e.target;
            el.classList.remove("animating-show");
            el.classList.add("animated");
        };
        const onHide = (e) => {
            const el = e.target;
            el.classList.add("animating-hide");
            el.classList.remove("animated");
        };
        const onHidden = (e) => e.target.classList.remove("animating-hide");

        collapses.forEach((c) => {
            c.addEventListener("show.bs.collapse", onShow);
            c.addEventListener("shown.bs.collapse", onShown);
            c.addEventListener("hide.bs.collapse", onHide);
            c.addEventListener("hidden.bs.collapse", onHidden);
        });

        return () => {
            collapses.forEach((c) => {
                c.removeEventListener("show.bs.collapse", onShow);
                c.removeEventListener("shown.bs.collapse", onShown);
                c.removeEventListener("hide.bs.collapse", onHide);
                c.removeEventListener("hidden.bs.collapse", onHidden);
            });
        };
    }, []);

    return (
        <div id="wrapper" className="d-flex">
            {/* ===== SIDEBAR ===== */}
            <ul
                className={
                    "navbar-nav sidebar sidebar-dark accordion " +
                    (collapsed ? "toggled" : "")
                }
                id="accordionSidebar"
            >
                {/* BRAND */}
              <NavLink
                    className="sidebar-brand d-flex align-items-center"
                    to="/dashboard"
                    onClick={closeAllSubmenus}
                >
                    <div className="sidebar-brand-icon rotate-n-15">
                        <i className="fas fa-seedling"></i>
                    </div>

                    <div className="sidebar-brand-text">
                        Gueguense<sup>Code</sup>
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

                {/* ===== HIDROPONÍA ===== */}
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

                            <div
                                id="collapseHidro"
                                className="collapse"
                                data-bs-parent="#accordionSidebar"
                            >
                                <div className="collapse-inner">
                                    <h6 className="collapse-header">Gestión:</h6>

                                    <NavLink className="collapse-item" to="/hidroponico">
                                        Hidropónicos
                                    </NavLink>
                                    <NavLink className="collapse-item" to="/cosecha">
                                        Cosechas
                                    </NavLink>
                                </div>
                            </div>
                        </li>
                    </>
                )}

                {/* ====== FITOSANITARIA ====== 
                {can.verIA && ( <> <hr className="sidebar-divider" /> <div className="sidebar-heading">Fitosanitaria</div> <li className="nav-item"> <a className="nav-link collapsed" href="#collapseIA" data-bs-toggle="collapse" data-bs-target="#collapseIA" aria-expanded="false" aria-controls="collapseIA" > <i className="fas fa-microscope"></i> <span>Diagnóstico IA</span> </a> <div id="collapseIA" className="collapse" data-bs-parent="#accordionSidebar" > <div className="bg-white py-2 collapse-inner rounded"> <h6 className="collapse-header">Clasificación:</h6> <NavLink className="collapse-item" to="/catalogos" onClick={closeAllSubmenus}> Plagas registradas </NavLink> <NavLink className="collapse-item" to="/diagnosticos" onClick={closeAllSubmenus}> Mis diagnósticos </NavLink> <div className="collapse-divider"></div> <h6 className="collapse-header">Modelos IA:</h6> <NavLink className="collapse-item" to="/models" onClick={closeAllSubmenus}> Versiones del modelo </NavLink> <NavLink className="collapse-item" to="/metrics">Métricas</NavLink> </div> </div> </li> <li className="nav-item"> <a className="nav-link collapsed" href="#collapseMapa" data-bs-toggle="collapse" data-bs-target="#collapseMapa" aria-expanded="false" aria-controls="collapseMapa" > <i className="fas fa-map-marked-alt"></i> <span>Mapa</span> </a> <div id="collapseMapa" className="collapse" data-bs-parent="#accordionSidebar" > <div className="bg-white py-2 collapse-inner rounded"> <h6 className="collapse-header">Geolocalización:</h6> <NavLink className="collapse-item" to="/map" onClick={closeAllSubmenus}> Focos y casos </NavLink> <NavLink className="collapse-item" to="/heatmap" onClick={closeAllSubmenus}> Mapa de calor </NavLink> <NavLink className="collapse-item" to="/map/filters">Filtros por fecha/región</NavLink> </div> </div> </li> <li className="nav-item"> <a className="nav-link collapsed" href="#collapseReportes" data-bs-toggle="collapse" data-bs-target="#collapseReportes" aria-expanded="false" aria-controls="collapseReportes" > <i className="fas fa-chart-line"></i> <span>Reportes</span> </a> <div id="collapseReportes" className="collapse" data-bs-parent="#accordionSidebar" > <div className="bg-white py-2 collapse-inner rounded"> <h6 className="collapse-header">Analítica:</h6> <NavLink className="collapse-item" to="/reports" onClick={closeAllSubmenus}> Gráficas </NavLink> <NavLink className="collapse-item" to="/reports/table" onClick={closeAllSubmenus}> Datos en tabla </NavLink> </div> </div> </li> </> )} */}

                {/* ===== IOT ===== */}
                {can.verIoT && (
                    <>
                        <hr className="sidebar-divider" />
                        <div className="sidebar-heading">IoT</div>

                        <li className="nav-item">
                            <a
                                className="nav-link collapsed"
                                href="#collapseSensores"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseSensores"
                            >
                                <i className="fas fa-thermometer-half"></i>
                                <span>Sensores</span>
                            </a>

                            <div
                                id="collapseSensores"
                                className="collapse"
                                data-bs-parent="#accordionSidebar"
                            >
                                <div className="collapse-inner">
                                    <h6 className="collapse-header">Lecturas:</h6>

                                    <NavLink className="collapse-item" to="/sensoryMonitoring">
                                        Monitoreo Tiempo Real
                                    </NavLink>

                                    <NavLink className="collapse-item" to="/sensors/control">
                                        Control según análisis
                                    </NavLink>
                                </div>
                            </div>
                        </li>

                        <li className="nav-item">
                            <NavLink className="nav-link" to="/sensoryControl">
                                <i className="fas fa-sliders-h"></i>
                                <span>Control</span>
                            </NavLink>
                        </li>
                    </>
                )}

                {/* ===== GESTIÓN ===== */}
                {can.verGestion && (
                    <>
                        <hr className="sidebar-divider" />
                        <div className="sidebar-heading">Gestión</div>

                        <li className="nav-item">
                            <a
                                className="nav-link collapsed"
                                href="#collapseGestion"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseGestion"
                            >
                                <i className="fas fa-users-cog"></i>
                                <span>Usuarios y roles</span>
                            </a>

                            <div id="collapseGestion" className="collapse">
                                <div className="collapse-inner">
                                    <NavLink className="collapse-item" to="/users">
                                        Usuarios
                                    </NavLink>

                                    <NavLink className="collapse-item" to="/roles">
                                        Roles y permisos
                                    </NavLink>

                                    <NavLink className="collapse-item" to="/profile">
                                        Mi perfil
                                    </NavLink>
                                </div>
                            </div>
                        </li>
                    </>
                )}

                {/* Toggler */}
                <div className="text-center d-none d-md-inline">
                    <button
                        className="rounded-circle border-0"
                        id="sidebarToggle"
                        onClick={() => setCollapsed((v) => !v)}
                        aria-label="Toggle sidebar"
                    />
                </div>
            </ul>

            {/* ===== CONTENT WRAPPER ===== */}
            <div id="content-wrapper" className="d-flex flex-column w-100">
                <div id="content">

                    {/* ===== TOPBAR (ahora verde elegante) ===== */}
                    <nav className="navbar navbar-expand topbar mb-4 shadow">
                        {/* Mobile Toggle */}
                        <button
                            id="sidebarToggleTop"
                            className="btn btn-link d-md-none rounded-circle me-3"
                            onClick={() => setCollapsed((v) => !v)}
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
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="fas fa-bell fa-fw"></i>
                                    <span className="badge badge-counter">3</span>
                                </a>

                                <div
                                    className="dropdown-list dropdown-menu dropdown-menu-end shadow"
                                    aria-labelledby="alertsDropdown"
                                >
                                    <h6 className="dropdown-header">Centro de Alertas</h6>
                                </div>
                            </li>

                            {/* Messages */}
                            <li className="nav-item dropdown no-arrow mx-1">
                                <a
                                    className="nav-link dropdown-toggle"
                                    href="#"
                                    id="messagesDropdown"
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="fas fa-envelope fa-fw"></i>
                                    <span className="badge badge-counter">5</span>
                                </a>

                                <div
                                    className="dropdown-list dropdown-menu dropdown-menu-end shadow"
                                >
                                    <h6 className="dropdown-header">Centro de Mensajes</h6>
                                </div>
                            </li>

                            <div className="topbar-divider d-none d-sm-block" />

                            {/* User */}
                            <li className="nav-item dropdown no-arrow">
                                <a
                                    className="nav-link dropdown-toggle d-flex align-items-center"
                                    href="#"
                                    id="userDropdown"
                                    data-bs-toggle="dropdown"
                                >
                                    <span className="me-2 d-none d-lg-inline username-topbar">
                                        <i className="fas fa-user-circle me-1"></i>
                                        {user?.username} {user?.rol ? `· ${user.rol}` : ""}
                                    </span>

                                    <img
                                        className="img-profile rounded-circle"
                                        src={avatarSrc}
                                        width="32"
                                        height="32"
                                        alt={user?.username}
                                    />
                                </a>

                                <div className="dropdown-menu dropdown-menu-end shadow">
                                    <a className="dropdown-item" href="#">
                                        <i className="fas fa-user fa-sm fa-fw me-2 text-gray-400"></i>
                                        Perfil
                                    </a>

                                    <a className="dropdown-item" href="#">
                                        <i className="fas fa-cogs fa-sm fa-fw me-2 text-gray-400"></i>
                                        Configuración
                                    </a>

                                    <div className="dropdown-divider"></div>

                                    <a className="dropdown-item" href="#" onClick={handleLogout}>
                                        <i className="fas fa-sign-out-alt fa-sm fa-fw me-2 text-gray-400"></i>
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
                    © Gueguense Code
                </footer>
            </div>
        </div>
    );
}
