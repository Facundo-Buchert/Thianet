// src/UserPanel/pages/Home.jsx
import { useMemo } from 'react';
import { useProducts } from '../../context/ProductsContext';
import { MerchCard } from '../components/MerchCard';
import { Link } from 'react-router-dom';
import supabase from '../../../utils/supabase';
import './Home.css';

export const Home = () => {
  const { trending } = useProducts();

  // obtener publicUrl del banner (getPublicUrl es síncrono)
  const { data: pubData } = supabase.storage.from('banners').getPublicUrl('home-banner.jpg') || {};
  const publicUrl = pubData?.publicUrl ?? pubData?.public_url ?? null;

  // memoizar url final (añadimos cache-buster si cambia la publicUrl)
  const bannerImg = useMemo(() => {
    if (!publicUrl) {
      return 'https://via.placeholder.com/1600x600?text=Banner+no+disponible';
    }
    return `${publicUrl}?v=${new Date().getTime()}`;
  }, [publicUrl]);

  return (
    <main className="home">
      <section
        className="hero"
        role="img"
        aria-label="Banner: Productos top temporada 2025-2026"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,.6), rgba(0,0,0,0.15)), url('${bannerImg}')`
        }}
      >
        {/* imagen escondida para accesibilidad / lectores de pantalla */}
        <img src={bannerImg} alt="Banner de la temporada 2025-2026" className="visually-hidden" />

        <div className="hero-content">
          <h2>
            Productos TOP
            <br />
            Temporada 25-26
          </h2>
          <p>
            Vestí con las camisetas más emblemáticas del mundo y sumá puntos con tus compras.
          </p>

          <Link to="/catalogo" className="btn-primary" aria-label="Ir al catálogo">
            Ver catálogo
          </Link>
        </div>
      </section>

      <section className="section">
        <h3>Tendencias</h3>

        <div className="products" role="list">
          {trending.length === 0 ? (
            <p>No hay productos destacados aún.</p>
          ) : (
            trending.map(product => (
              <div key={product.id} role="listitem">
                <MerchCard product={product} />
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;
