import React from 'react';
import './Home.css';

export const Home = () => {
  return (
    <main className="home">
      <section className="hero">
        <div className="hero-content">
          <h2>
            Pieles legendarias <br /> Temporada 25-26
          </h2>
          <p>
            Vestí con las camisetas más emblemáticas del mundo y sumá puntos con
            tus compras.
          </p>
          <button className="btn-primary">
            Comprar
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </section>

      <section className="section">
        <h3>Tendencias</h3>

        <div className="products">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <div className="card-img" />
              <div className="card-body">
                <h4>Producto de prueba</h4>
                <p>Unisex</p>
                <div className="card-footer">
                  <span className="price">$25.00</span>
                  <button className="btn-small">Agregar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
