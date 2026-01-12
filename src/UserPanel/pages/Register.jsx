import "./Register.css";
import { Link } from "react-router-dom";

export const Register = () => {
  return (
    <div className="register-page">

        <Link to="/" className="back-button">
          <img src="" alt="Volver al inicio" />
        </Link>
        
      <div className="register-card">
        <div className="register-form">

          <h1>Crear una Cuenta</h1>
          <p className="subtitle">
            Completá tus datos para agilizar tus pedidos y empezar a sumar puntos
            en cada compra.
          </p>

          <form>
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input type="text" placeholder="Ej. Juan Pérez" />
            </div>

            <div className="form-group">
              <label>Correo Electrónico *</label>
              <input type="email" placeholder="juan@ejemplo.com" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>WhatsApp / Teléfono *</label>
                <input type="text" placeholder="+54 9 11..." />
              </div>

              <div className="form-group">
                <label>Instagram</label>
                <input type="text" placeholder="@usuario" />
              </div>
            </div>

            <div className="form-group">
              <label>Dirección (Calle y número) *</label>
              <input type="text" placeholder="Av. Siempre Viva 742" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Localidad *</label>
                <input type="text" placeholder="Ciudad" />
              </div>

              <div className="form-group">
                <label>Código Postal *</label>
                <input type="text" placeholder="CP 1234" />
              </div>
            </div>

            <button className="primary-btn">
              Registrarse Ahora
            </button>
          </form>

          <div className="register-footer">
            <span>¿Ya tenés cuenta?</span>
            <Link to="/profile/login">Iniciar sesión</Link>
          </div>
        </div>

        {/* DERECHA – IMAGEN */}
        <div className="register-image">
          <img
            src="/register-shirt.png"
            alt="Producto"
          />

          <div className="points-box">
            <span className="icon">🏷️</span>
            <h4>Suma Puntos</h4>
            <p>
              Con cada compra acumulás puntos que podés canjear por descuentos
              exclusivos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
