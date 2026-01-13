import "./Login.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../../../utils/supabase";
import bcrypt from "bcryptjs";

export const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    mail: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.mail || !form.password) {
      setError("Email y contraseña son obligatorios.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: supaErr } = await supabase
        .from("users")
        .select("*")
        .eq("mail", form.mail.trim().toLowerCase())
        .single();

      if (supaErr || !data) {
        setError("Credenciales incorrectas.");
        setLoading(false);
        return;
      }

      const isValid = await bcrypt.compare(form.password, data.password);

      if (!isValid) {
        setError("Credenciales incorrectas.");
        setLoading(false);
        return;
      }

      // guardar usuario SIN password
      const userSafe = {
        id: data.id,
        name: data.name,
        mail: data.mail,
        points: data.points || 0,
        historyPoints: data.historyPoints || 0
      };

      localStorage.setItem("thianet_user", JSON.stringify(userSafe));

      setLoading(false);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Error al iniciar sesión.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Link to="/" className="back-button">
        <img
          src="https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/flecha_atras.png"
          alt="Volver al inicio"
        />
      </Link>

      <div className="login-card">
        {/* LADO IZQUIERDO */}
        <div className="login-form">
          <h1>Iniciar Sesión</h1>
          <p className="subtitle">
            Accedé a tu cuenta para ver tus pedidos y acumular puntos.
          </p>

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Correo Electrónico *</label>
              <input
                type="email"
                name="mail"
                value={form.mail}
                onChange={onChange}
                placeholder="juan@ejemplo.com"
                required
              />
            </div>

            <div className="form-group password-group">
              <label>Contraseña *</label>

              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="••••••••"
                  required
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <img
                    src={
                      showPassword
                        ? "https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/esconder.png"
                        : "https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/ver.png"
                    }
                    alt={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  />
                </button>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="login-footer">
            <span>¿No tenés cuenta?</span>
            <Link to="/profile/register">Crear cuenta</Link>
          </div>
        </div>

        {/* LADO DERECHO */}
        <div className="login-image">
          <img src="/login-image.jpg" alt="Producto" />

          <div className="points-box">
            <span className="icon">🏷️</span>
            <h4>Suma Puntos</h4>
            <p>
              Cada compra suma puntos que podés canjear por descuentos exclusivos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
