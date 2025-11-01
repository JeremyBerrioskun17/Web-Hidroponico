import { NavLink } from "react-router-dom";

export default function Topbar() {
    return (
        <header className="topbar">
            <div className="brand">Control Fitosanitario</div>
            <nav className="nav">
                <NavLink to="/" end>Inicio</NavLink>
                <NavLink to="/diagnosis">Diagnóstico</NavLink>
                <NavLink to="/reports">Reportes</NavLink>
                <NavLink to="/reports/new">Nuevo</NavLink>
                <NavLink to="/map">Mapa</NavLink>
                <NavLink to="/Dashboard">Dashboard</NavLink>
                <NavLink to="/Login">Ingresar</NavLink>
            </nav>
        </header>
    );
}
