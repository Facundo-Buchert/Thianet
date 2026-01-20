import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import supabase from '../../../utils/supabase';
import './Header.css';

export const Header = () => {
  const { totalQty } = useCart();
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // chequeo inicial
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });

    // listener por cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setHasSession(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
  console.log('SESSION CHECK');
  supabase.auth.getSession().then(({ data }) => {
    console.log('SESSION:', data.session);
  });
}, []);


  const handleUserClick = () => {
    if (hasSession) {
      navigate('/profile');
    } else {
      navigate('/profile/login');
    }
  };

  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="logo">
          <Link to="/">THIANET<span>.</span></Link>
        </h1>

        <nav className="nav">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/catalogo">Catálogo</Link></li>
          <li><Link to="/preguntas-frecuentes">Preguntas Frecuentes</Link></li>
          <li><Link to="/terminos-y-condiciones">Términos y Condiciones</Link></li>
        </nav>

        <div className="header-actions">
          <input className="search" placeholder="Search" />

          <button className="user-btn" onClick={handleUserClick}>
            <span className="material-symbols-outlined">person</span>
          </button>

          <div className="cart">
            <Link to="/carrito">
              <span className="material-symbols-outlined">shopping_bag</span>
              {totalQty > 0 && <span className="badge">{totalQty}</span>}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
