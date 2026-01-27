// src/UserPanel/pages/Home.jsx
import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '../../context/ProductsContext';
import { MerchCard } from '../components/MerchCard';
import { Link } from 'react-router-dom';
import supabase from '../../../utils/supabase';
import './Home.css';

export const Home = () => {
  const { trending } = useProducts();

  // ===== HOME TEXT =====
  const [homeText, setHomeText] = useState({
    text1: 'Nueva colección',
    text2: 'Temporada 25-26',
    text3: 'Vestí con las camisetas más emblemáticas del mundo y sumá puntos con tus compras.',
  });

  useEffect(() => {
    const fetchHomeText = async () => {
      const { data, error } = await supabase
        .from('home-text')
        .select('text1, text2, text3')
        .single();

      if (!error && data) {
        setHomeText({
          text1: data.text1,
          text2: data.text2 || homeText.text2,
          text3: data.text3 || homeText.text3,
        });
      }
    };

    fetchHomeText();
  }, []);
  // =====================

  const { data: pubData } =
    supabase.storage.from('banners').getPublicUrl('home-banner.jpg') || {};
  const publicUrl = pubData?.publicUrl ?? pubData?.public_url ?? null;

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
        aria-label="Banner"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,.6), rgba(0,0,0,0.15)), url('${bannerImg}')`,
        }}
      >
        <img
          src={bannerImg}
          alt="Banner de la temporada 2025-2026"
          className="visually-hidden"
        />

        <div className="hero-content">
          <h2>
            {homeText.text1}
            <br />
            {homeText.text2}
          </h2>
          <p>{homeText.text3}</p>

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
