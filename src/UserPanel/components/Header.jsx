import React from 'react'
import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="logo">
          <Link to="/">THIANET<span>.</span></Link>
        </h1>

        <nav className="nav">
            <li><Link to="/inventory">Inventory</Link></li>
            <li><Link to="/women">Women</Link></li>
            <li><Link to="/accessories">Accessories</Link></li>
            <li><Link to="/sale">Sale</Link></li>
        </nav>

        <div className="header-actions">
          <input className="search" placeholder="Search" />
          <span className="material-symbols-outlined">person</span>
          <div className="cart">
            <span className="material-symbols-outlined">shopping_bag</span>
            <span className="badge">2</span>
          </div>
        </div>
      </div>
    </header>
  )
}
