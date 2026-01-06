import { useState, useEffect } from "react";
import { registerUser } from "../../services/authService";
import { toast } from "react-toastify";
import "./ModalRegister.css";

export default function ModalRegister({ open, onClose }) {
  const [animating, setAnimating] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    rolId: "",
  });

  const [roles, setRoles] = useState([
    // ⚠️ Reemplaza después por llamada real a API
    { id: 2, nombre: "Productor" },
    { id: 3, nombre: "Cliente" },
    { id: 4, nombre: "Técnico" },
  ]);

  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Animación de apertura
  useEffect(() => {
    if (open) {
      setTimeout(() => setAnimating(true), 10);
    } else {
      setAnimating(false);
    }
  }, [open]);

  if (!open) return null;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.username.trim() || !form.password.trim() || !form.rolId) {
      toast.info("Completa todos los campos requeridos.", { theme: "colored" });
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Las contraseñas no coinciden.", { theme: "colored" });
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        UsuarioOCorreo: form.username,
        Correo: form.email || null,
        Contrasena: form.password,
        RolId: Number(form.rolId),
      });

      toast.success("¡Cuenta creada exitosamente! 🎉", { theme: "colored" });
      onClose();
    } catch (err) {
      toast.error(err.message || "Error al registrar usuario", {
        theme: "colored",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className={`modal-container ${animating ? "open" : ""}`}>
        
        {/* HEADER */}
        <div className="modal-header">
          <h4 className="fw-bold m-0">
            <i className="fa-solid fa-user-plus me-2 text-lime"></i>
            Registro de usuario
          </h4>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <p className="modal-desc">Completa la siguiente información para crear tu cuenta en el sistema.</p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="form-body">
          
          {/* Usuario */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              <i className="fa-solid fa-user text-lime me-1"></i> Usuario
            </label>
            <input
              type="text"
              name="username"
              className="form-control form-input"
              placeholder="Ej: jberrios"
              value={form.username}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <small className="text-muted">
              Nombre único que usarás para iniciar sesión.
            </small>
          </div>

          {/* Correo */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              <i className="fa-solid fa-envelope text-lime me-1"></i> Correo (opcional)
            </label>
            <input
              type="email"
              name="email"
              className="form-control form-input"
              placeholder="correo@ejemplo.com"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />
            <small className="text-muted">
              Usado para recuperaciones de cuenta y notificaciones.
            </small>
          </div>

          {/* Rol */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              <i className="fa-solid fa-id-badge text-lime me-1"></i> Rol en el sistema
            </label>
            <select
              name="rolId"
              className="form-select form-input"
              value={form.rolId}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="">Seleccione un rol</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
            <small className="text-muted">
              Los permisos se asignarán automáticamente según el rol.
            </small>
          </div>

          {/* Contraseña */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              <i className="fa-solid fa-lock text-lime me-1"></i> Contraseña
            </label>
            <div className="input-group">
              <input
                type={showPwd ? "text" : "password"}
                name="password"
                className="form-control form-input"
                placeholder="********"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="input-group-text btn-eye"
                onClick={() => setShowPwd(!showPwd)}
              >
                <i className={`fa-solid ${showPwd ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
            <small className="text-muted">
              Usa una contraseña segura con letras y números.
            </small>
          </div>

          {/* Confirmar contraseña */}
          <div className="mb-4">
            <label className="form-label fw-semibold">
              <i className="fa-solid fa-key text-lime me-1"></i> Confirmar contraseña
            </label>
            <input
              type={showPwd ? "text" : "password"}
              name="confirmPassword"
              className="form-control form-input"
              placeholder="********"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-gradient w-100 py-3 fw-bold rounded-3"
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
