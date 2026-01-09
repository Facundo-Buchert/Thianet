import React from 'react'
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './Header.css';

export const Header = () => {

  const { totalQty } = useCart();

  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="logo">
          <Link to="/">THIANET<span>.</span></Link>
        </h1>

        <nav className="nav">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/catalogo">Catálogo</Link></li>
          <li><Link to="/">Preguntas Frecuentes</Link></li>
          <li><Link to="/">Terminos y Condiciones</Link></li>
        </nav>

        <div className="header-actions">
          <input className="search" placeholder="Search" />
          <Link to="/profile/login"><span className="material-symbols-outlined">person</span></Link>
          <div className="cart">
            <Link to="/carrito">
              <span className="material-symbols-outlined">shopping_bag</span>
              <span className="badge">{totalQty}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
