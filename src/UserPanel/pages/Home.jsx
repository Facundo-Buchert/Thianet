// src/UserPanel/pages/Home.jsx
import { useMemo } from 'react';
import { useProducts } from '../../context/ProductsContext';
import { MerchCard } from '../components/MerchCard';
import { Link } from 'react-router-dom';
import supabase from '../../../utils/supabase';
import './Home.css';

export const Home = () => {
  const { trending } = useProducts();

  // obtener publicUrl del banner (getPublicUrl es sincronico y no hace fetch)
  const { data: pubData } = supabase.storage.from('banners').getPublicUrl('home-banner.jpg') || {};
  const publicUrl = pubData?.publicUrl ?? pubData?.public_url ?? null;

  // memoizar url final (añadimos cache-buster para forzar reload cuando necesites)
  const bannerImg = useMemo(() => {
    if (!publicUrl) {
      // fallback (puede ser un asset local o placeholder)
      return 'https://via.placeholder.com/1600x600?text=Banner+no+disponible';
    }
    return `${publicUrl}?v=${Date.now()}`;
  }, [publicUrl]);

  return (
    <main className="home">
      <section
        className="hero"
        style={{
          background: `linear-gradient(to right, rgba(0,0,0,.6), rgba(0,0,0,0.15)), url('${bannerImg}') center/cover no-repeat`
        }}
      >
        <div className="hero-content">
          <h2>
            Productos TOP <br /> Temporada 25-26
          </h2>
          <p>
            Vestí con las camisetas más emblemáticas del mundo y sumá puntos con
            tus compras.
          </p>
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

export default Home;
