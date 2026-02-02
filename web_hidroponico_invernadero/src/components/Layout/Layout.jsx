// src/components/Layout.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Layout.css";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ Flyout para sidebar colapsado
  const [flyoutOpen, setFlyoutOpen] = useState(null); // "hidro" | "sensores" | "gestion" | null
  const flyoutTimer = useRef(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ROL = (user?.rol || "").toLowerCase();

  const can = useMemo(
    () => ({
      verIA: ROL === "administrador" || ROL === "investigador",
      verMapas: ROL === "administrador" || ROL === "investigador",
      verReportes: ROL === "administrador" || ROL === "investigador",
      verIoT: ROL === "administrador" || ROL === "tecnico",
      verGestion: ROL === "administrador",
    }),
    [ROL]
  );

  function closeAllSubmenus() {
    const bs = window.bootstrap;
    if (!bs) return;
    document.querySelectorAll(".nt-sidebar .collapse.show").forEach((el) =>
      new bs.Collapse(el, { toggle: false }).hide()
    );
  }

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate("/login", { replace: true });
  };

  // ✅ al navegar: cierra submenus + drawer + flyout
  useEffect(() => {
    closeAllSubmenus();
    setMobileOpen(false);
    setFlyoutOpen(null);
  }, [location.pathname]);

  // ✅ si entra a móvil: no mantener collapsed
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 991px)");
    const onChange = (e) => {
      if (e.matches) {
        setCollapsed(false);
        setMobileOpen(false);
        setFlyoutOpen(null);
      } else {
        setMobileOpen(false);
      }
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // ✅ lock scroll cuando drawer móvil está abierto
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [mobileOpen]);

  const avatarSrc =
    user?.photoUrl
      ? user.photoUrl
      : user?.photoBase64
      ? `data:image/jpeg;base64,${user.photoBase64}`
      : "https://i.pravatar.cc/40?img=3";

  function toggleSidebar() {
    const isMobile = window.matchMedia("(max-width: 991px)").matches;
    if (isMobile) {
      setMobileOpen((v) => !v);
      setCollapsed(false);
      setFlyoutOpen(null);
      return;
    }

    setCollapsed((v) => {
      const next = !v;
      if (next) closeAllSubmenus(); // comprimimos => cerramos collapse
      setFlyoutOpen(null);
      return next;
    });
  }

  const preventHash = (e) => e.preventDefault();

  // ===== Flyout helpers =====
  function openFlyout(id) {
    if (!collapsed) return;
    clearTimeout(flyoutTimer.current);
    setFlyoutOpen(id);
  }

  function closeFlyoutSoon() {
    clearTimeout(flyoutTimer.current);
    flyoutTimer.current = setTimeout(() => setFlyoutOpen(null), 150);
  }

  function keepFlyoutOpen() {
    clearTimeout(flyoutTimer.current);
  }

  const navCls = ({ isActive }) => "nt-nav-link" + (isActive ? " active" : "");

  return (
    <div className={`nt-shell ${collapsed ? "is-collapsed" : ""}`}>
      {/* Backdrop móvil */}
      {mobileOpen && (
        <div className="nt-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={
          "nt-sidebar " +
          (mobileOpen ? "is-mobile-open " : "") +
          (collapsed ? "is-collapsed " : "")
        }
        aria-label="Sidebar"
        onMouseLeave={() => {
          if (collapsed) closeFlyoutSoon();
        }}
      >
        {/* BRAND */}
        <NavLink
          className="nt-brand"
          to="/dashboard"
          onClick={() => {
            closeAllSubmenus();
            setMobileOpen(false);
            setFlyoutOpen(null);
          }}
          title="NicaTech Solutions"
        >
          <div className="nt-brand-icon" aria-hidden="true">
            <i className="fas fa-seedling" />
          </div>

          <div className="nt-brand-text">
            <div className="nt-brand-title">
              NicaTech <span>Solutions</span>
            </div>
            <div className="nt-brand-sub">Hidroponía</div>
          </div>
        </NavLink>

        <div className="nt-sidebar-scroll">
          {/* NAVIGATION */}
          <div className="nt-nav-section">
            <div className="nt-nav-title">Navigation</div>

            <NavLink className={navCls} to="/dashboard" onClick={() => setMobileOpen(false)}>
              <span className="nt-ico"><i className="fas fa-warehouse" /></span>
              <span className="nt-txt">Dashboard</span>
              <span className="nt-end" />
            </NavLink>
          </div>

          {/* HIDROPONÍA */}
          {(can.verGestion || can.verIoT) && (
            <div className="nt-nav-section">
              <div className="nt-nav-title">Hidroponía</div>

              {!collapsed && (
                <div className="nt-group">
                  <a
                    className="nt-nav-link nt-group-trigger collapsed"
                    href="#"
                    onClick={preventHash}
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseHidro"
                    aria-expanded="false"
                    aria-controls="collapseHidro"
                  >
                    <span className="nt-ico"><i className="fas fa-water" /></span>
                    <span className="nt-txt">Hidroponía</span>
                    <span className="nt-end"><i className="fas fa-chevron-right" /></span>
                  </a>

                  <div id="collapseHidro" className="collapse nt-collapse">
                    <div className="nt-submenu">
                      <div className="nt-subtitle">Gestión</div>

                      <NavLink className={navCls} to="/hidroponico" onClick={() => setMobileOpen(false)}>
                        <span className="nt-subdot" />
                        <span className="nt-subtxt">Hidropónicos</span>
                      </NavLink>

                      <NavLink className={navCls} to="/cosecha" onClick={() => setMobileOpen(false)}>
                        <span className="nt-subdot" />
                        <span className="nt-subtxt">Cosechas</span>
                      </NavLink>
                    </div>
                  </div>
                </div>
              )}

              {collapsed && (
                <div
                  className="nt-fly-anchor"
                  onMouseEnter={() => openFlyout("hidro")}
                  onFocus={() => openFlyout("hidro")}
                >
                  <button
                    className={"nt-nav-link nt-fly-trigger " + (flyoutOpen === "hidro" ? "is-open" : "")}
                    type="button"
                    onClick={() => setFlyoutOpen((v) => (v === "hidro" ? null : "hidro"))}
                    aria-haspopup="true"
                    aria-expanded={flyoutOpen === "hidro"}
                    title="Hidroponía"
                  >
                    <span className="nt-ico"><i className="fas fa-water" /></span>
                    <span className="nt-txt">Hidroponía</span>
                    <span className="nt-end" />
                  </button>

                  {flyoutOpen === "hidro" && (
                    <div className="nt-flyout" onMouseEnter={keepFlyoutOpen} onMouseLeave={closeFlyoutSoon}>
                      <div className="nt-flyout-head">
                        <div className="nt-flyout-title">Hidroponía</div>
                        <div className="nt-flyout-sub">Gestión</div>
                      </div>

                      <NavLink className="nt-fly-item" to="/hidroponico" onClick={() => setMobileOpen(false)}>
                        Hidropónicos
                      </NavLink>
                      <NavLink className="nt-fly-item" to="/cosecha" onClick={() => setMobileOpen(false)}>
                        Cosechas
                      </NavLink>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* IOT */}
          {can.verIoT && (
            <div className="nt-nav-section">
              <div className="nt-nav-title">IoT</div>

              {!collapsed && (
                <div className="nt-group">
                  <a
                    className="nt-nav-link nt-group-trigger collapsed"
                    href="#"
                    onClick={preventHash}
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseSensores"
                    aria-expanded="false"
                    aria-controls="collapseSensores"
                  >
                    <span className="nt-ico"><i className="fas fa-thermometer-half" /></span>
                    <span className="nt-txt">Sensores</span>
                    <span className="nt-end"><i className="fas fa-chevron-right" /></span>
                  </a>

                  <div id="collapseSensores" className="collapse nt-collapse">
                    <div className="nt-submenu">
                      <div className="nt-subtitle">Lecturas</div>

                      <NavLink className={navCls} to="/sensoryMonitoring" onClick={() => setMobileOpen(false)}>
                        <span className="nt-subdot" />
                        <span className="nt-subtxt">Monitoreo Tiempo Real</span>
                      </NavLink>

                      <NavLink className={navCls} to="/sensors/control" onClick={() => setMobileOpen(false)}>
                        <span className="nt-subdot" />
                        <span className="nt-subtxt">Control según análisis</span>
                      </NavLink>
                    </div>
                  </div>
                </div>
              )}

              {collapsed && (
                <div
                  className="nt-fly-anchor"
                  onMouseEnter={() => openFlyout("sensores")}
                  onFocus={() => openFlyout("sensores")}
                >
                  <button
                    className={"nt-nav-link nt-fly-trigger " + (flyoutOpen === "sensores" ? "is-open" : "")}
                    type="button"
                    onClick={() => setFlyoutOpen((v) => (v === "sensores" ? null : "sensores"))}
                    aria-haspopup="true"
                    aria-expanded={flyoutOpen === "sensores"}
                    title="Sensores"
                  >
                    <span className="nt-ico"><i className="fas fa-thermometer-half" /></span>
                    <span className="nt-txt">Sensores</span>
                    <span className="nt-end" />
                  </button>

                  {flyoutOpen === "sensores" && (
                    <div className="nt-flyout" onMouseEnter={keepFlyoutOpen} onMouseLeave={closeFlyoutSoon}>
                      <div className="nt-flyout-head">
                        <div className="nt-flyout-title">Sensores</div>
                        <div className="nt-flyout-sub">Lecturas</div>
                      </div>

                      <NavLink className="nt-fly-item" to="/sensoryMonitoring" onClick={() => setMobileOpen(false)}>
                        Monitoreo Tiempo Real
                      </NavLink>
                      <NavLink className="nt-fly-item" to="/sensors/control" onClick={() => setMobileOpen(false)}>
                        Control según análisis
                      </NavLink>
                    </div>
                  )}
                </div>
              )}

              <NavLink className={navCls} to="/sensoryControl" onClick={() => setMobileOpen(false)}>
                <span className="nt-ico"><i className="fas fa-sliders-h" /></span>
                <span className="nt-txt">Control</span>
                <span className="nt-end" />
              </NavLink>
            </div>
          )}

          {/* GESTIÓN */}
          {can.verGestion && (
            <div className="nt-nav-section">
              <div className="nt-nav-title">Gestión</div>

              {!collapsed && (
                <div className="nt-group">
                  <a
                    className="nt-nav-link nt-group-trigger collapsed"
                    href="#"
                    onClick={preventHash}
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseGestion"
                    aria-expanded="false"
                    aria-controls="collapseGestion"
                  >
                    <span className="nt-ico"><i className="fas fa-users-cog" /></span>
                    <span className="nt-txt">Usuarios y roles</span>
                    <span className="nt-end"><i className="fas fa-chevron-right" /></span>
                  </a>

                  <div id="collapseGestion" className="collapse nt-collapse">
                    <div className="nt-submenu">
                      <NavLink className={navCls} to="/users" onClick={() => setMobileOpen(false)}>
                        <span className="nt-subdot" />
                        <span className="nt-subtxt">Usuarios</span>
                      </NavLink>

                      <NavLink className={navCls} to="/roles" onClick={() => setMobileOpen(false)}>
                        <span className="nt-subdot" />
                        <span className="nt-subtxt">Roles y permisos</span>
                      </NavLink>

                      <NavLink className={navCls} to="/profile" onClick={() => setMobileOpen(false)}>
                        <span className="nt-subdot" />
                        <span className="nt-subtxt">Mi perfil</span>
                      </NavLink>
                    </div>
                  </div>
                </div>
              )}

              {collapsed && (
                <div
                  className="nt-fly-anchor"
                  onMouseEnter={() => openFlyout("gestion")}
                  onFocus={() => openFlyout("gestion")}
                >
                  <button
                    className={"nt-nav-link nt-fly-trigger " + (flyoutOpen === "gestion" ? "is-open" : "")}
                    type="button"
                    onClick={() => setFlyoutOpen((v) => (v === "gestion" ? null : "gestion"))}
                    aria-haspopup="true"
                    aria-expanded={flyoutOpen === "gestion"}
                    title="Usuarios y roles"
                  >
                    <span className="nt-ico"><i className="fas fa-users-cog" /></span>
                    <span className="nt-txt">Usuarios y roles</span>
                    <span className="nt-end" />
                  </button>

                  {flyoutOpen === "gestion" && (
                    <div className="nt-flyout" onMouseEnter={keepFlyoutOpen} onMouseLeave={closeFlyoutSoon}>
                      <div className="nt-flyout-head">
                        <div className="nt-flyout-title">Gestión</div>
                        <div className="nt-flyout-sub">Usuarios y roles</div>
                      </div>

                      <NavLink className="nt-fly-item" to="/users" onClick={() => setMobileOpen(false)}>
                        Usuarios
                      </NavLink>
                      <NavLink className="nt-fly-item" to="/roles" onClick={() => setMobileOpen(false)}>
                        Roles y permisos
                      </NavLink>
                      <NavLink className="nt-fly-item" to="/profile" onClick={() => setMobileOpen(false)}>
                        Mi perfil
                      </NavLink>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer sidebar */}
        <div className="nt-sidebar-footer">
          <button
            className="nt-sidebar-toggle d-none d-lg-inline-flex"
            onClick={toggleSidebar}
            type="button"
            aria-label="Comprimir/expandir sidebar"
            title={collapsed ? "Expandir" : "Comprimir"}
          >
            <i className={`fas ${collapsed ? "fa-angle-right" : "fa-angle-left"}`} />
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="nt-main">
        <header className="nt-topbar">
          <div className="nt-topbar-left">
            <button className="nt-burger d-lg-none" onClick={toggleSidebar} type="button" aria-label="Menu">
              <i className="fas fa-bars" />
            </button>

            <div className="nt-search d-none d-md-flex" role="search">
              <i className="fas fa-search" />
              <input placeholder="Buscar..." aria-label="Buscar" />
              <button type="button">Search</button>
            </div>
          </div>

          <div className="nt-topbar-right">
            <div className="dropdown">
              <button className="nt-icon" data-bs-toggle="dropdown" type="button" aria-label="Notificaciones">
                <i className="fas fa-bell" />
                <span className="nt-dot" />
              </button>
              <div className="dropdown-menu dropdown-menu-end nt-dd">
                <div className="nt-dd-head">Notificaciones</div>
                <div className="nt-dd-empty text-muted">Sin notificaciones</div>
              </div>
            </div>

            <div className="dropdown">
              <button className="nt-icon" data-bs-toggle="dropdown" type="button" aria-label="Mensajes">
                <i className="fas fa-envelope" />
              </button>
              <div className="dropdown-menu dropdown-menu-end nt-dd">
                <div className="nt-dd-head">Mensajes</div>
                <div className="nt-dd-empty text-muted">Sin mensajes</div>
              </div>
            </div>

            <div className="nt-topbar-sep d-none d-sm-block" />

            <div className="dropdown">
              <button className="nt-user" data-bs-toggle="dropdown" type="button" aria-label="Usuario">
                <img className="nt-avatar" src={avatarSrc} alt={user?.username} />
                <div className="nt-user-meta d-none d-md-block">
                  <div className="nt-user-name">{user?.username}</div>
                  <div className="nt-user-role">{user?.rol}</div>
                </div>
                <i className="fas fa-chevron-down d-none d-md-block nt-caret" />
              </button>

              <div className="dropdown-menu dropdown-menu-end nt-dd">
                <div className="nt-dd-head">Cuenta</div>

                <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                  <i className="fas fa-user me-2" />
                  Perfil
                </a>

                <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                  <i className="fas fa-cog me-2" />
                  Configuración
                </a>

                <div className="dropdown-divider" />

                <a className="dropdown-item text-danger" href="#" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-2" />
                  Cerrar sesión
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="nt-content">
          <div className="container-fluid nt-container">
            <Outlet />
          </div>
        </main>

        <footer className="nt-footer">© NicaTech Solutions</footer>
      </div>
    </div>
  );
}
