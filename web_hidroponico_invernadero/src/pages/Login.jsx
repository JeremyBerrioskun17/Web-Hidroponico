import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

/* Activos de marca */
import logo from "../assets/Logo_GC.png";
// ✅ Usa una de estas dos líneas y elimina la otra:

// A) local:
import heroFarm from "../assets/bg_cultivo.webp";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const from = location.state?.from?.pathname || "/dashboard";

    const [form, setForm] = useState({ username: "", password: "", remember: false });
    const [loading, setLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.username.trim() || !form.password.trim()) {
            toast.info("Completa usuario y contraseña", { hideProgressBar: true, theme: "colored" });
            return;
        }
        try {
            setLoading(true);
            await login(form.username, form.password, form.remember);
            toast.success("¡Bienvenido a GueguenseCode! 🌱", { autoClose: 2000, hideProgressBar: true, theme: "colored" });
            navigate(from, { replace: true });
        } catch (err) {
            const msg =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                (typeof err?.response?.data === "string" ? err.response.data : null) ||
                err?.message ||
                "No se pudo iniciar sesión";
            toast.error(String(msg), { autoClose: 2600, hideProgressBar: true, theme: "colored" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-split min-vh-100">
            <div className="container-fluid h-100">
                <div className="row h-100 g-0">
                    {/* Left / Hero */}
                    <div className="col-lg-7 d-none d-lg-flex align-items-stretch animate-fade-in">
                        <section
                            className="login-hero w-100 d-flex flex-column justify-content-between p-5"
                            style={{
                                backgroundImage: `
                  linear-gradient(135deg, rgba(24,179,123,.92) 0%, rgba(33,209,154,.90) 100%),
                  url(${heroFarm})
                `,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        >
                            <div>
                                <div className="d-flex align-items-center mb-4">
                                    <img src={logo} alt="Gueguense Code" style={{ height: 34 }} className="me-2" />
                                    <span className="text-white fw-bold">Gueguense<span className="text-lime">Code</span></span>
                                </div>
                                <h1 className="display-4 fw-extrabold text-white login-hero-title">Cultiva decisiones inteligentes</h1>
                                <p className="lead text-white-50 mt-2">Monitorea tus sensores, detecta plagas y toma acción a tiempo con IA.</p>
                                <div className="d-flex flex-wrap gap-3 mt-4">
                                    <Link to="/about" className="btn btn-outline-light shadow-sm fw-semibold btn-lg-sm">
                                        <i className="fa-solid fa-circle-info me-2" />
                                        Conoce más de nosotros
                                    </Link>
                                </div>
                            </div>
                            <div className="small text-white-50 mt-4">
                                <span className="fw-semibold">Invernadero Inteligente</span> — Control Fitosanitario con IA
                            </div>
                        </section>
                    </div>

                    {/* Right / Form */}
                    <div className="col-lg-5 bg-white position-relative d-flex align-items-center justify-content-center p-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 w-100 animate-up" style={{ maxWidth: 540 }}>
                            <div className="d-flex align-items-center mb-1">
                                <i className="fa-solid fa-seedling text-lime title-icon me-3" />
                                <h2 className="fw-bold text-slate m-0">¡Hola! Nos alegra verte de nuevo</h2>
                            </div>
                            <p className="text-muted mb-4">Ingresa tus credenciales para acceder al panel.</p>

                            <form onSubmit={handleSubmit} noValidate>
                                <div className="mb-3">
                                    <div className="input-group input-group-elevated">
                                        <span className="input-group-text icon-soft"><i className="fa-solid fa-user" /></span>
                                        <input
                                            type="text"
                                            className="form-control form-control-underline"
                                            placeholder="Nombre de usuario"
                                            value={form.username}
                                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <div className="input-group input-group-elevated">
                                        <span className="input-group-text icon-soft"><i className="fa-solid fa-key" /></span>
                                        <input
                                            type={showPwd ? "text" : "password"}
                                            className="form-control form-control-underline"
                                            placeholder="Contraseña"
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            required
                                            autoComplete="off"
                                            name="password"
                                        />
                                        <button
                                            type="button"
                                            className="input-group-text icon-soft btn-eye"
                                            onClick={() => setShowPwd((v) => !v)}
                                            aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                                            title={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        >
                                            <i className={`fa-solid ${showPwd ? "fa-eye-slash" : "fa-eye"}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center justify-content-between mb-4">
                                    <div className="form-check">
                                        <input
                                            id="remember"
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={form.remember}
                                            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                                        />
                                        <label className="form-check-label" htmlFor="remember">Recuérdame</label>
                                    </div>
                                    <a href="#" className="link-lime small fw-semibold">¿Olvidaste tu contraseña?</a>
                                </div>

                                <button className="btn btn-gradient w-100 text-white-50 py-3 fw-bold shadow-sm hover-lift" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                                            Ingresando…
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-right-to-bracket me-2" />
                                            Ingresar
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-muted mt-4 mb-0" style={{ fontSize: ".9rem" }}>
                                ¿No tienes cuenta?{" "}
                                <a href="#" className="link-lime fw-semibold">Regístrate</a>
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
