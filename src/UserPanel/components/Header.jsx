// Header.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import supabase from '../../../utils/supabase';
import './Header.css';

export const Header = () => {
  const { totalQty } = useCart();
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    // chequeo inicial y listener de auth
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setHasSession(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const handleUserClick = () => {
    if (hasSession) {
      navigate('/profile');
    } else {
      navigate('/profile/login');
    }
    setMenuOpen(false);
  };

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="logo">
          <Link to="/" onClick={handleLinkClick}>THIANET<span>.</span></Link>
        </h1>

        <button
          className={`menu-btn ${menuOpen ? 'is-open' : ''}`}
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(prev => !prev)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <nav className={`nav ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen && window.innerWidth < 768}>
          <ul>
            <li><Link to="/" onClick={handleLinkClick}>Home</Link></li>
            <li><Link to="/catalogo" onClick={handleLinkClick}>Catálogo</Link></li>
            <li><Link to="/preguntas-frecuentes" onClick={handleLinkClick}>Preguntas frecuentes</Link></li>
            <li><Link to="/terminos-y-condiciones" onClick={handleLinkClick}>Términos y condiciones</Link></li>
          </ul>
        </nav>

        <div className="header-actions">
          {/*<div className="search-wrapper">
            <button
              className="search-btn"
              aria-label="Buscar"
              onClick={() => setSearchOpen(prev => !prev)}
            >
              <span className="material-symbols-outlined">search</span>
            </button>

            <input
              ref={searchRef}
              className={`search ${searchOpen ? 'open' : ''}`}
              placeholder="Buscar..."
              aria-label="Buscar"
              onBlur={() => setSearchOpen(false)}
            />
          </div>*/}

          <button className="user-btn" onClick={handleUserClick} aria-label="Perfil">
            <span className="material-symbols-outlined">person</span>
          </button>

          <div className="cart" aria-live="polite">
            <Link to="/carrito" onClick={() => setMenuOpen(false)}>
              <span className="material-symbols-outlined">shopping_bag</span>
              {totalQty > 0 && <span className="headerBadge" aria-hidden="false">{totalQty}</span>}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
