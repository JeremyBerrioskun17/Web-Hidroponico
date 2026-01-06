import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "./Login.css";

import logo from "../../assets/Logo_GC.png";
import heroFarm from "../../assets/bg_cultivo.webp";

// 👉 IMPORTA EL MODAL
import ModalRegister from "../../components/ModalRegister/ModalRegister";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ username: "", password: "", remember: false });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // 👉 CONTROL DEL MODAL
  const [showRegister, setShowRegister] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      toast.info("Completa usuario y contraseña", { hideProgressBar: true, theme: "colored" });
      return;
    }
    try {
      setLoading(true);
      await login(form.username, form.password, form.remember);
      toast.success("¡Bienvenido a NicaTech Solutions! 🌱", { autoClose: 1600, hideProgressBar: true, theme: "colored" });
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
    <>
      {/* 👉 MODAL */}
      {showRegister && <ModalRegister open={showRegister} onClose={() => setShowRegister(false)} />}

      <div className="login-split min-vh-100">
        <div className="container-fluid h-100">
          <div className="row h-100 g-0 align-items-stretch">
           
            {/* LEFT / HERO */}
            <div className="col-lg-7 d-none d-lg-flex hero-col">
              <section
                className="login-hero w-100 d-flex flex-column justify-content-between p-5 border-0 rounded-4"
                style={{
                  backgroundImage: `
                    linear-gradient(135deg, rgba(24,179,123,.92) 0%, rgba(33,209,154,.90) 100%),
                    url(${heroFarm})
                  `,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                aria-hidden="true"
              >
                <div>
                  <div className="brand d-flex align-items-center mb-4">
                    <img src={"https://via.placeholder.com/48x48.png?text=NT"} alt="NicaTech Solutions" className="me-2 brand-logo" />
                    <span className="text-white fw-bold brand-text">
                      NicaTech <span className="text-lime">Solutions</span>
                    </span>
                  </div>

                  <h1 className="display-4 fw-extrabold text-white login-hero-title">
                    Entra a tu cuenta y <br /> descubre nuevas experiencias
                  </h1>

                  <p className="lead text-white-50 mt-2 hero-sub">
                    ¿Aún no tienes una cuenta?
                  </p>

                  <div className="d-flex flex-wrap gap-3 mt-4 hero-ctas">
                    {/* 👉 ABRE EL MODAL - integrado (transparent background) */}
                    <button 
                      className="hero-btn hero-btn-transparent d-flex align-items-center gap-2"
                      onClick={() => setShowRegister(true)}
                    >
                      <i className="fa-solid fa-user-plus" />
                      Crear usuario
                    </button>
                  </div>
                </div>

                <div className="small text-white-50 mt-4 hero-note">
                  Plataforma NicaTech — Monitoreo y control inteligente de cultivos hidropónicos
                </div>
              </section>
            </div>

            {/* RIGHT / FORM */}
            <div className="col-lg-5 bg-white position-relative d-flex align-items-center justify-content-center p-4">
              <div
                className="card login-card border-0 rounded-4 p-4 p-md-5 w-100"
                style={{ maxWidth: 540 }}
                role="region"
                aria-labelledby="login-title"
              >
                <div className="d-flex align-items-center mb-2">
                  <i className="fa-solid fa-seedling text-lime title-icon me-3" aria-hidden="true" />
                  <h2 id="login-title" className="fw-bold text-slate m-0">¡Hola, bienvenido! 👋</h2>
                </div>

                <p className="text-muted mb-4">Ingresa tus credenciales para continuar</p>

                <form onSubmit={handleSubmit} noValidate>
                  {/* Usuario */}
                  <div className="mb-3">
                    <div className="input-group input-group-elevated">
                      <span className="input-group-text icon-soft">
                        <i className="fa-solid fa-user" />
                      </span>
                      <input
                        id="username"
                        type="text"
                        className="form-control form-control-underline"
                        placeholder="Nombre de usuario"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                        autoFocus
                        autoComplete="username"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div className="mb-2">
                    <div className="input-group input-group-elevated">
                      <span className="input-group-text icon-soft">
                        <i className="fa-solid fa-key" />
                      </span>
                      <input
                        id="password"
                        type={showPwd ? "text" : "password"}
                        className="form-control form-control-underline"
                        placeholder="Contraseña"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        autoComplete="current-password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="input-group-text icon-soft btn-eye"
                        onClick={() => setShowPwd((v) => !v)}
                        disabled={loading}
                      >
                        <i className={`fa-solid ${showPwd ? "fa-eye-slash" : "fa-eye"}`} />
                      </button>
                    </div>
                  </div>

                  {/* Recordarme */}
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="form-check">
                      <input
                        id="remember"
                        className="form-check-input"
                        type="checkbox"
                        checked={form.remember}
                        onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                        disabled={loading}
                      />
                      <label className="form-check-label" htmlFor="remember">Recuérdame</label>
                    </div>

                    <Link to="/forgot" className="link-lime small fw-semibold">¿Olvidaste tu contraseña?</Link>
                  </div>

                  {/* Botón login */}
                  <button
                    className="btn btn-gradient w-100 text-white py-3 fw-bold btn-animate"
                    disabled={loading}
                  >
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

                <div className="divider my-4" />

                {/* Social */}
                <div className="d-flex gap-2 mb-3">
                  <button className="btn btn-social btn-facebook w-50 btn-animate">
                    <i className="fa-brands fa-facebook-f me-2" /> Facebook
                  </button>
                  <button className="btn btn-social btn-google w-50 btn-animate">
                    <i className="fa-brands fa-google me-2" /> Google
                  </button>
                </div>

                <p className="text-center text-muted mt-2 mb-0" style={{ fontSize: ".9rem" }}>
                  ¿No tienes cuenta?{" "}
                 <button
                    type="button"
                    className="link-lime fw-semibold border-0 bg-transparent"
                    onClick={() => setShowRegister(true)}
                  >
                    Regístrate
                  </button>
                </p>
              </div>
            </div>
          
          </div>
        </div>
      </div>
    </>
  );
}
