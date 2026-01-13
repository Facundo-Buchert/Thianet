import React from "react";
import { NavLink } from "react-router-dom";
import "./MenuA.css";

const MenuA = () => {
  return (
    <aside className="admin-menu">
      <div className="menu-top">
        <div className="menu-user">
          <div
            className="menu-avatar"
            style={{
              backgroundImage:
                "url('https://us.123rf.com/450wm/rrraven/rrraven1108/rrraven110800078/10421860-bal%C3%B3n-de-f%C3%BAtbol.jpg?ver=6')",
            }}
          />
          <div className="menu-user-info">
            <div className="menu-user-name">Tienda Camisetas</div>
            <div className="menu-user-role">Administrador</div>
          </div>
        </div>

        <nav className="menu-nav">
          <NavLink end to="/admin" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>

          <NavLink to="/admin/productos" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="nav-text">Productos</span>
          </NavLink>

          <NavLink to="/admin/ordenes" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="nav-text">Ordenes</span>
          </NavLink>

          <NavLink to="/admin/clientes" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="material-symbols-outlined">group</span>
            <span className="nav-text">Clientes</span>
          </NavLink>

          <NavLink to="/admin/config" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="material-symbols-outlined">settings</span>
            <span className="nav-text">Configuración</span>
          </NavLink>
        </nav>
      </div>

      <div className="menu-bottom">
        <button className="logout-btn">
          <span className="material-symbols-outlined">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default MenuA;
