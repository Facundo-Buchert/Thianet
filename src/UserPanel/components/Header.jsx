import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './Header.css';

export const Header = () => {
  const { totalQty } = useCart();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("thianet_user"));

  const handleUserClick = () => {
    if (user) {
      navigate("/profile");
    } else {
      navigate("/profile/login");
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
