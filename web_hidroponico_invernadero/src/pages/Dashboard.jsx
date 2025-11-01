import { Line, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { useMemo } from "react";

ChartJS.register(
    LineElement,
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Filler
);

export default function Dashboard() {
    // ====== KPIs (mock) ======
    const kpis = [
        {
            title: "Reportes (hoy)",
            value: "24",
            icon: "fas fa-camera",
            border: "border-left-lime",
            bgIcon: "bg-lime",
            textClass: "text-lime",
        },
        {
            title: "Casos acumulados",
            value: "1,284",
            icon: "fas fa-seedling",
            border: "border-left-success",
            bgIcon: "bg-success",
            textClass: "text-success",
        },
        {
            title: "Precisión del modelo (val)",
            value: "92%",
            icon: "fas fa-microscope",
            border: "border-left-info",
            bgIcon: "bg-info",
            textClass: "text-info",
            progress: 92,
        },
        {
            title: "Zonas en riesgo alto",
            value: "5",
            icon: "fas fa-exclamation-triangle",
            border: "border-left-warning",
            bgIcon: "bg-warning",
            textClass: "text-warning",
        },
    ];

    // ====== CHARTS ======
    const lineData = useMemo(
        () => ({
            labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
            datasets: [
                {
                    label: "Planta sana",
                    data: [12, 15, 13, 14, 18, 17, 19],
                    borderColor: "#198754",
                    backgroundColor: "rgba(25,135,84,.15)",
                    pointRadius: 3,
                    tension: 0.35,
                    fill: true,
                },
                {
                    label: "Mancha angular",
                    data: [4, 5, 3, 6, 5, 4, 6],
                    borderColor: "#ffc107",
                    backgroundColor: "rgba(255,193,7,.12)",
                    pointRadius: 3,
                    tension: 0.35,
                    fill: true,
                },
                {
                    label: "Roya",
                    data: [2, 3, 3, 5, 4, 3, 4],
                    borderColor: "#22c55e",
                    backgroundColor: "rgba(34,197,94,.12)",
                    pointRadius: 3,
                    tension: 0.35,
                    fill: true,
                },
            ],
        }),
        []
    );

    const lineOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: "top", labels: { usePointStyle: true } },
                tooltip: { mode: "index", intersect: false },
            },
            interaction: { mode: "nearest", axis: "x", intersect: false },
            scales: {
                x: { grid: { color: "rgba(0,0,0,.05)" } },
                y: { min: 0, max: 20, grid: { color: "rgba(0,0,0,.05)" } },
            },
        }),
        []
    );

    const doughnutData = useMemo(
        () => ({
            labels: ["Sana", "Mancha angular", "Roya"],
            datasets: [
                {
                    data: [62, 22, 16],
                    backgroundColor: ["#198754", "#ffc107", "#22c55e"],
                    borderWidth: 0,
                    hoverOffset: 4,
                },
            ],
        }),
        []
    );

    const doughnutOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            cutout: "60%",
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}%` } },
            },
        }),
        []
    );

    return (
        <div className="container-fluid">
            {/* Heading */}
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-0 fw-bold text-success">
                    <i className="fas fa-seedling me-2"></i> Dashboard Fitosanitario
                </h1>
                <a href="#" className="d-none d-sm-inline-block btn btn-sm btn-success shadow-sm">
                    <i className="fas fa-file-csv fa-sm text-white-50 me-1"></i> Generar reporte (CSV)
                </a>
            </div>

            {/* KPIs */}
            <div className="row">
                {kpis.map((k, i) => (
                    <div key={i} className="col-xl-3 col-md-6 mb-4">
                        <div className={`card ${k.border} shadow h-100 py-2`}>
                            <div className="card-body">
                                <div className="row g-0 align-items-center">
                                    <div className="col">
                                        <div className={`text-xs fw-bold ${k.textClass} text-uppercase mb-1`}>{k.title}</div>
                                        <div className="h5 mb-0 fw-bold text-gray-800">{k.value}</div>
                                        {"progress" in k && (
                                            <div className="d-flex align-items-center mt-2">
                                                <div className="progress progress-sm w-100 me-2">
                                                    <div
                                                        className="progress-bar bg-info"
                                                        style={{ width: `${k.progress}%` }}
                                                        aria-valuenow={k.progress}
                                                        aria-valuemin="0"
                                                        aria-valuemax="100"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-auto">
                                        <div className={`icon-circle ${k.bgIcon}`}>
                                            <i className={`${k.icon} text-white`}></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="row">
                {/* Area */}
                <div className="col-xl-8 col-lg-7">
                    <div className="card shadow mb-4">
                        <div className="card-header py-3 d-flex align-items-center justify-content-between">
                            <h6 className="m-0 fw-bold text-success">
                                <i className="fas fa-chart-line me-2"></i> Incidencia semanal (últimos 30 días)
                            </h6>
                            <div className="dropdown no-arrow">
                                <a className="dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i className="fas fa-ellipsis-vertical fa-sm text-gray-400"></i>
                                </a>
                                <div className="dropdown-menu dropdown-menu-end shadow">
                                    <div className="dropdown-header">Rango:</div>
                                    <a className="dropdown-item" href="#">7 días</a>
                                    <a className="dropdown-item" href="#">30 días</a>
                                    <div className="dropdown-divider"></div>
                                    <a className="dropdown-item" href="#">Personalizado…</a>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="chart-area chart-h-lg">
                                <Line data={lineData} options={lineOptions} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Doughnut */}
                <div className="col-xl-4 col-lg-5">
                    <div className="card shadow mb-4">
                        <div className="card-header py-3 d-flex align-items-center justify-content-between">
                            <h6 className="m-0 fw-bold text-success">Distribución por diagnóstico</h6>
                            <div className="dropdown no-arrow">
                                <a className="dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i className="fas fa-ellipsis-vertical fa-sm text-gray-400"></i>
                                </a>
                                <div className="dropdown-menu dropdown-menu-end shadow">
                                    <a className="dropdown-item" href="#">Últimos 7 días</a>
                                    <a className="dropdown-item" href="#">Últimos 30 días</a>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div style={{ height: 280 }}>
                                <Doughnut data={doughnutData} options={doughnutOptions} />
                            </div>
                            <div className="mt-4 text-center small">
                                <span className="me-3"><i className="fas fa-circle text-success me-1"></i> Plantas sanas</span>
                                <span className="me-3"><i className="fas fa-circle text-warning me-1"></i> Mancha angular</span>
                                <span className="me-3"><i className="fas fa-circle text-lime me-1"></i> Roya</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info cards */}
            <div className="row">
                {/* Avance */}
                <div className="col-lg-6 mb-4">
                    <div className="card shadow mb-4">
                        <div className="card-header py-3">
                            <h6 className="m-0 fw-bold text-success">Avance de tareas de campo</h6>
                        </div>
                        <div className="card-body">
                            <ProgressItem label="Monitoreo semanal" value={60} color="bg-success" />
                            <ProgressItem label="Verificación técnica" value={45} color="bg-info" />
                            <ProgressItem label="Capacitación BPA" value={30} color="bg-warning" />
                            <ProgressItem label="Actualización del modelo" value={80} color="bg-lime" />
                        </div>
                    </div>
                </div>

                {/* Guía + Avisos */}
                <div className="col-lg-6 mb-4">
                    <div className="card shadow mb-4">
                        <div className="card-header py-3">
                            <h6 className="m-0 fw-bold text-success">Guía rápida de interpretación</h6>
                        </div>
                        <div className="card-body">
                            <ul className="mb-3">
                                <li><strong>Planta sana:</strong> Mantén monitoreo, ventilación y rotación de cultivo.</li>
                                <li><strong>Mancha angular:</strong> Evita exceso de humedad, usa semilla certificada.</li>
                                <li><strong>Roya:</strong> Vigila pústulas anaranjadas; mejora aireación del cultivo.</li>
                            </ul>
                            <a href="#" className="btn btn-sm btn-success">Ver guía completa</a>
                        </div>
                    </div>

                    <div className="card shadow mb-4">
                        <div className="card-header py-3">
                            <h6 className="m-0 fw-bold text-success">Avisos del sistema</h6>
                        </div>
                        <div className="card-body">
                            <div className="d-flex align-items-start mb-3">
                                <div className="icon-circle bg-warning me-3"><i className="fas fa-cloud-rain text-white"></i></div>
                                <div>
                                    <strong>Humedad elevada</strong> — Riesgo de mancha angular en la zona norte.
                                    <div className="small text-muted">Actualizado hace 1 h</div>
                                </div>
                            </div>
                            <div className="d-flex align-items-start mb-3">
                                <div className="icon-circle bg-success me-3"><i className="fas fa-leaf text-white"></i></div>
                                <div>
                                    <strong>Nuevos reportes validados</strong> — 12 diagnósticos confirmados por técnicos.
                                    <div className="small text-muted">Hoy</div>
                                </div>
                            </div>
                            <a href="#" className="btn btn-sm bg-lime text-white">Ver focos en el mapa</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProgressItem({ label, value, color }) {
    return (
        <>
            <h4 className="small fw-bold">
                {label} <span className="float-end">{value}%</span>
            </h4>
            <div className="progress mb-4">
                <div
                    className={`progress-bar ${color}`}
                    role="progressbar"
                    style={{ width: `${value}%` }}
                    aria-valuenow={value}
                    aria-valuemin="0"
                    aria-valuemax="100"
                />
            </div>
        </>
    );
}

