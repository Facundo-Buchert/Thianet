// src/UserPanel/pages/Profile.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../utils/supabase";
import "./Profile.css";

const BENEFITS = [
  { id: "b1", title: "Descuento 10%", subtitle: "10% en tu próxima compra", cost: 500 },
  { id: "b2", title: "Descuento 15%", subtitle: "15% en cualquier artículo", cost: 1000 },
  { id: "b3", title: "Envío Gratis", subtitle: "Envío nacional gratuito", cost: 800 },
  { id: "b4", title: "Descuento premium", subtitle: "20% para clientes VIP", cost: 1500 },
];

export const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
        if (authErr) {
          console.error("Auth error:", authErr);
          navigate("/profile/login");
          return;
        }
        if (!authUser) {
          navigate("/profile/login");
          return;
        }

        // traer perfil desde DB
        const { data: profile, error: profileErr } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profileErr) {
          console.error("Profile fetch error:", profileErr);
          navigate("/profile/login");
          return;
        }
        if (!profile) {
          console.warn("No profile found for auth user:", authUser.id);
          navigate("/profile/login");
          return;
        }

        profile.points = Number(profile.points ?? 0);
        setUser(profile);

        // calcular admin según email del perfil
        setIsAdmin(Boolean(profile.mail && profile.mail.toLowerCase() === "ventasthiagol20@gmail.com"));

        // mantener en localStorage el objeto seguro si querés (clave consistente)
        localStorage.setItem(
          "thianet_user",
          JSON.stringify({
            id: profile.id,
            name: profile.name,
            mail: profile.mail,
            points: profile.points,
            historypoints: profile.historypoints
          })
        );
      } catch (e) {
        console.error("Unexpected error loading profile:", e);
        navigate("/profile/login");
      }
    };
    load();
    // eslint-disable-next-line
  }, []);

  if (!user) return null;

  const historypoints = Number(user.historypoints || 0);
  const points = Number(user.points || 0);

  // siguiente meta: múltiplo de 250 (ej: 500, 750, 1000...)
  const nextLevel = Math.max(250, Math.ceil((historypoints + 1) / 250) * 250);
  const progress = Math.min(100, Math.round((historypoints / nextLevel) * 100));
  const remaining = Math.max(0, nextLevel - historypoints);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    localStorage.removeItem("thianet_user");
    navigate("/profile/login");
  };

  const handleEdit = () => navigate("/profile/edit");

  const handleRedeem = (benefit) => {
    if (points < benefit.cost) {
      setMsg({ type: "error", text: `Te faltan ${benefit.cost - points} pts para ${benefit.title}.` });
      setTimeout(() => setMsg(null), 3000);
      return;
    }

    // simular canje: restar puntos y persistir en localStorage (clave consistente)
    const updated = { ...user, points: points - benefit.cost };
    setUser(updated);

    localStorage.setItem("thianet_user", JSON.stringify({
      id: updated.id,
      name: updated.name,
      mail: updated.mail,
      points: updated.points,
      historypoints: updated.historypoints
    }));

    setMsg({ type: "success", text: `Canjeado: ${benefit.title}. -${benefit.cost} pts` });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <header className="profile-top">
          <div>
            <h1 className="profile-name">Hola, {user.name}</h1>
            <p className="profile-mail">{user.mail}</p>
          </div>

          <div className="profile-actions">
            <button className="btn-admin" onClick={() => navigate("/admin")} style={{ display: isAdmin ? 'block' : 'none' }}>Panel Admin</button>
            <button className="btn-ghost" onClick={handleEdit}>Editar perfil</button>
            <button className="btn-primary" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </header>

        <section className="profile-stats">
          <div className="points-box">
            <div className="points-number">{points}</div>
            <div className="points-label">Puntos disponibles</div>
          </div>

          <div className="progress-box">
            <div className="progress-top">
              <span>Progreso al siguiente nivel</span>
              <strong>{progress}%</strong>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-meta">
              <small>{remaining} pts para {nextLevel} pts</small>
            </div>
          </div>
        </section>

        <section className="profile-benefits">
          <div className="benefits-header">
            <h2>Beneficios disponibles (Muy pronto!)</h2>
            <div className="benefits-controls">
              <span className="chip">Disponibles para mí</span>
            </div>
          </div>

          <div className="benefits-grid">
            {BENEFITS.map(b => {
              //COREGIR ACA CUANDO ESTEN LOS BENEFICIOS REALES
              //const available = points >= b.cost;
              const available = false;
              
              return (
                <article key={b.id} className={`benefit-card ${available ? "available" : "locked"}`}>
                  <div className="benefit-top">
                    <div className="benefit-title">{b.title}</div>
                    <div className="benefit-cost">{b.cost} pts</div>
                  </div>
                  <p className="benefit-sub">{b.subtitle}</p>

                  <div className="benefit-footer">
                    {available ? (
                      <button className="btn-primary btn-small" onClick={() => handleRedeem(b)}>Canjear</button>
                    ) : (
                      <button className="btn-disabled" disabled>Faltan {b.cost - points}</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {msg && (
          <div className={`profile-msg ${msg.type === "error" ? "err" : "ok"}`}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
