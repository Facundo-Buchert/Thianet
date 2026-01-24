// src/UserPanel/pages/Login.jsx
import "./Login.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../../../utils/supabase";

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
      // 1) Sign in with Supabase Auth
      const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
        email: form.mail.trim().toLowerCase(),
        password: form.password
      });

      if (signErr || !signData?.user) {
        setError("Credenciales incorrectas.");
        setLoading(false);
        return;
      }

      const userId = signData.user.id;

      // 2) Traer perfil desde public.users
      const { data: profile, error: profileErr } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileErr || !profile) {
        // Puede pasar si no existe perfil: redirigir o crear perfil mínimo
        setError("No se encontró perfil asociado. Contactá soporte.");
        setLoading(false);
        return;
      }

      const userSafe = {
        id: profile.id,
        name: profile.name,
        mail: profile.mail,
        points: profile.points || 0,
        historyPoints: profile.historyPoints || 0
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
      </div>
    </div>
  );
};

export default Login;
