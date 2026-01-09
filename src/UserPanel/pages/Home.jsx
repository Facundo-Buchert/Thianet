// src/UserPanel/pages/Home.jsx

import { useProducts } from '../../context/ProductsContext';
import { MerchCard } from '../components/MerchCard';
import { Link } from 'react-router-dom';
import './Home.css';

export const Home = () => {
  const { trending } = useProducts();

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
          {trending.length === 0 ? (
            <p>No hay productos destacados aún.</p>
          ) : (
            trending.map(product => (
              <MerchCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>
    </main>
  );
};

