import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const BENEFITS = [
  { id: "b1", title: "Descuento 10%", subtitle: "10% en tu próxima compra", cost: 500 },
  { id: "b2", title: "Descuento 15%", subtitle: "15% en cualquier artículo", cost: 1000 },
  { id: "b3", title: "Envío Gratis", subtitle: "Envío nacional gratuito", cost: 800 },
  { id: "b4", title: "Descuento Premium", subtitle: "20% para clientes VIP", cost: 1500 },
];

const user = JSON.parse(localStorage.getItem("thianet_user"));
let isAdmin = false;

if (user.mail === "ventasthiagol20@gmail.com") {
  isAdmin = true
}

export const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState(null);

  // lee usuario seguro desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("thianet_user");
      if (!raw) {
        navigate("/profile/login");
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.name) {
        navigate("/profile/login");
        return;
      }
      // asegurar campos numéricos
      parsed.points = Number(parsed.points ?? 0);
      setUser(parsed);
    } catch (e) {
      navigate("/profile/login");
    }
    // eslint-disable-next-line
  }, []);

  if (!user) return null;

  const historyPoints = Number(user.historyPoints || 0);
  const points = Number(user.points || 0);


  // siguiente meta: múltiplo de 250 (ej: 500, 750, 1000...)
  const nextLevel = Math.max(250, Math.ceil((historyPoints + 1) / 250) * 250);
  const progress = Math.min(100, Math.round((historyPoints / nextLevel) * 100));
  const remaining = Math.max(0, nextLevel - historyPoints);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/profile/login");
  };

  const handleEdit = () => navigate("/profile/edit");

  const handleRedeem = (benefit) => {
    if (points < benefit.cost) {
      setMsg({ type: "error", text: `Te faltan ${benefit.cost - points} pts para ${benefit.title}.` });
      setTimeout(() => setMsg(null), 3000);
      return;
    }

    // simular canje: restar puntos y persistir en localStorage
    const updated = { ...user, points: points - benefit.cost };
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
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
            <button className="btn-admin" onClick={() => navigate("/admin") } style={{ display: isAdmin ? 'block' : 'none' }}>Panel Admin</button>
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
            <h2>Beneficios disponibles</h2>
            <div className="benefits-controls">
              <span className="chip">Disponibles para mí</span>
            </div>
          </div>

          <div className="benefits-grid">
            {BENEFITS.map(b => {
              const available = points >= b.cost;
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
