// src/UserPanel/pages/Register.jsx

// src/UserPanel/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../../utils/supabase';
import './Register.css';

export const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    mail: '',
    password: '',
    number: '',
    instagram: '',
    adress: '',
    adress_code: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  };

  const validate = () => {
    if (!form.name?.trim()) return 'El nombre es requerido.';
    if (!form.mail?.trim()) return 'El correo es requerido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail)) return 'Email inválido.';
    if (!form.password || form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (!form.adress?.trim()) return 'La dirección es requerida.';
    if (!form.location?.trim()) return 'La localidad es requerida.';
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);

    try {
      // 1) Crear usuario en Auth
      const { data: signData, error: signErr } = await supabase.auth.signUp({
        email: form.mail.trim().toLowerCase(),
        password: form.password
      });

      if (signErr) {
        setError(signErr.message || 'No se pudo crear la cuenta.');
        setLoading(false);
        return;
      }

      // 2) Completar datos del perfil creado por el trigger
      const userId = signData?.user?.id;

      if (userId) {
        const payload = {
          name: form.name.trim(),
          mail: form.mail.trim().toLowerCase(),
          number: form.number
            ? Number(String(form.number).replace(/\D/g, ''))
            : null,
          instagram: form.instagram?.trim() || null,
          address: form.adress?.trim() || null,
          address_code: form.adress_code
            ? parseFloat(String(form.adress_code).replace(',', '.'))
            : null,
          location: form.location?.trim() || null,
          // estos normalmente ya existen, pero los dejamos explícitos
          points: 0
        };

        const { error: updateErr } = await supabase
          .from('users')
          .update(payload)
          .eq('id', userId);

        if (updateErr) {
          console.error('Error actualizando perfil:', updateErr);
          // no rompas el registro, el usuario auth ya existe
        }
      }


      setSuccessMsg('Cuenta creada. Te enviamos un email de confirmación si es necesario.');
      setLoading(false);
      setTimeout(() => navigate('/profile/login'), 900);
    } catch (err) {
      console.error(err);
      setError('Error inesperado. Reintentá.');
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <Link to="/" className="back-button">
        <img src="https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/flecha_atras.png" alt="Volver al inicio" />
      </Link>

      <div className="register-card">
        <div className="register-form">
          <h1>Crear una Cuenta</h1>
          <p className="subtitle">
            Completá tus datos para agilizar tus pedidos y empezar a sumar puntos en cada compra.
          </p>

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input name="name" value={form.name} onChange={onChange} type="text" placeholder="Ej. Juan Pérez" />
            </div>

            <div className="form-group">
              <label>Correo Electrónico *</label>
              <input name="mail" value={form.mail} onChange={onChange} type="email" placeholder="juan@ejemplo.com" />
            </div>

            <div className="form-group">
              <label>Contraseña *</label>
              <input name="password" value={form.password} onChange={onChange} type="password" placeholder="Ingresá tu contraseña" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>WhatsApp / Teléfono</label>
                <input name="number" value={form.number} onChange={onChange} type="text" placeholder="+54 9 11..." />
              </div>

              <div className="form-group">
                <label>Instagram</label>
                <input name="instagram" value={form.instagram} onChange={onChange} type="text" placeholder="@usuario" />
              </div>
            </div>

            <div className="form-group">
              <label>Dirección (Calle y número) *</label>
              <input name="adress" value={form.adress} onChange={onChange} type="text" placeholder="Av. Siempre Viva 742" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Localidad *</label>
                <input name="location" value={form.location} onChange={onChange} type="text" placeholder="Ciudad" />
              </div>

              <div className="form-group">
                <label>Código Postal</label>
                <input name="adress_code" value={form.adress_code} onChange={onChange} type="text" placeholder="CP 1234" />
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}
            {successMsg && <div className="form-success">{successMsg}</div>}

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Registrarse Ahora'}
            </button>
          </form>

          <div className="register-footer">
            <span>¿Ya tenés cuenta?</span>
            <Link to="/profile/login">Iniciar sesión</Link>
          </div>
        </div>

        <div className="register-image">
          <img src="/register-shirt.png" alt="Producto" />
          <div className="points-box">
            <span className="icon">🏷️</span>
            <h4>Suma Puntos</h4>
            <p>Con cada compra acumulás puntos que podés canjear por descuentos exclusivos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
