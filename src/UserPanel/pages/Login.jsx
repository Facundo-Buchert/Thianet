import "./Login.css";
import { useState } from "react";
import { Link } from "react-router-dom";

export const Login = () => {

    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="login-page">
            
            <Link to="/" className="back-button">
                <img src="" alt="Volver al inicio" />
            </Link>

            <div className="login-card">
                {/* LADO IZQUIERDO */}
                <div className="login-form">
                    <h1>Iniciar Sesión</h1>
                    <p className="subtitle">
                        Accede a tu cuenta para ver tus pedidos y acumular puntos.
                    </p>

                    <form>
                        <div className="form-group">
                            <label>Correo Electrónico *</label>
                            <input
                                type="email"
                                placeholder="juan@ejemplo.com"
                                required
                            />
                        </div>

                        <div className="form-group password-group">
                            <label>Contraseña *</label>

                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
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
                                                ? "https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/esconder.png"   // ocultar
                                                : "https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/ver.png"       // mostrar
                                        }
                                        alt={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    />
                                </button>
                            </div>
                        </div>


                        <button type="submit" className="primary-btn">
                            Iniciar Sesión
                        </button>
                    </form>

                    <div className="login-footer">
                        <span>¿No tenés cuenta?</span>
                        <Link to="/profile/register">Crear cuenta</Link>
                    </div>
                </div>

                {/* LADO DERECHO */}
                <div className="login-image">
                    <img
                        src="/login-image.jpg"
                        alt="Producto"
                    />

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
}
