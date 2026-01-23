import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../../utils/supabase';
import './EditProfile.css';

export const EditProfile = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    mail: '',
    password: '',
    confirmPassword: '',
    number: '',
    instagram: '',
    adress: '',
    adress_code: '',
    location: ''
  });

  const [origEmail, setOrigEmail] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          setError('No estás autenticado.');
          return;
        }

        const authUser = data.user;

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setOrigEmail(authUser.email || '');

        if (profile) {
          setForm({
            name: profile.name || '',
            mail: profile.mail || authUser.email || '',
            password: '',
            confirmPassword: '',
            number: profile.number ?? '',
            instagram: profile.instagram ?? '',
            adress: profile.address ?? profile.adress ?? '',
            adress_code: profile.address_code ?? profile.adress_code ?? '',
            location: profile.location ?? ''
          });
        } else {
          setForm(f => ({ ...f, mail: authUser.email || '' }));
        }
      } catch {
        setError('Error cargando el perfil.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onChange = e => {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'El nombre es obligatorio.';
    if (!form.mail.trim()) return 'El email es obligatorio.';
    if (form.password) {
      if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
      if (form.password !== form.confirmPassword) return 'Las contraseñas no coinciden.';
    }
    if (!form.adress.trim()) return 'La dirección es obligatoria.';
    if (!form.location.trim()) return 'La localidad es obligatoria.';
    return null;
  };

  const onSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) throw new Error();

      await supabase.from('users').update({
        name: form.name,
        mail: form.mail.toLowerCase(),
        number: form.number || null,
        instagram: form.instagram || null,
        address: form.adress,
        address_code: form.adress_code || null,
        location: form.location
      }).eq('id', user.id);

      const authUpdates = {};
      if (form.mail.toLowerCase() !== origEmail.toLowerCase()) {
        authUpdates.email = form.mail.toLowerCase();
      }
      if (form.password) authUpdates.password = form.password;

      if (Object.keys(authUpdates).length) {
        await supabase.auth.updateUser(authUpdates);
      }

      setSuccessMsg('Perfil actualizado correctamente.');
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
    } catch {
      setError('No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-page">
        <div className="edit-profile-card">
          <div className="profile-skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="edit-profile-page">
      <div className="edit-profile-header">
        <h1>Editar perfil</h1>
        <p>Mantené tus datos actualizados</p>
      </div>

      <div className="edit-profile-card">
        <form onSubmit={onSubmit} className="profile-form">
          <div className="profile-section">
            <h3>Datos personales</h3>

            <div className="profile-row">
              <div className="profile-group">
                <label>Nombre completo *</label>
                <input name="name" value={form.name} onChange={onChange} />
              </div>

              <div className="profile-group">
                <label>Email *</label>
                <input type="email" name="mail" value={form.mail} onChange={onChange} />
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Seguridad</h3>

            <div className="profile-row">
              <div className="profile-group">
                <label>Nueva contraseña</label>
                <input type="password" name="password" value={form.password} onChange={onChange} />
              </div>

              <div className="profile-group">
                <label>Confirmar contraseña</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={onChange} />
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Contacto y envío</h3>

            <div className="profile-row">
              <div className="profile-group">
                <label>Teléfono</label>
                <input name="number" value={form.number} onChange={onChange} />
              </div>

              <div className="profile-group">
                <label>Instagram</label>
                <input name="instagram" value={form.instagram} onChange={onChange} />
              </div>
            </div>

            <div className="profile-group">
              <label>Dirección *</label>
              <input name="adress" value={form.adress} onChange={onChange} />
            </div>

            <div className="profile-row">
              <div className="profile-group">
                <label>Localidad *</label>
                <input name="location" value={form.location} onChange={onChange} />
              </div>

              <div className="profile-group">
                <label>Código postal</label>
                <input name="adress_code" value={form.adress_code} onChange={onChange} />
              </div>
            </div>
          </div>

          {error && <div className="profile-error">{error}</div>}
          {successMsg && <div className="profile-success">{successMsg}</div>}

          <div className="profile-actions">
            <span className="hint">Los cambios se guardan automáticamente</span>
            <button className="save-btn" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default EditProfile;
