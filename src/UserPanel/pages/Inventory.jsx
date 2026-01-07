// src/UserPanel/pages/Inventory.jsx

import React from 'react';
import { useProducts } from '../../context/ProductsContext';
import { MerchCard } from '../components/MerchCard';
import './Inventory.css';

export const Inventory = () => {
  const { products, loading, page, setPage } = useProducts();

  const prev = () => setPage(Math.max(1, page - 1));
  const next = () => setPage(page + 1);

  return (
    <div className="inventory-page">
      <header className="inventory-header">
        <h2>Catálogo</h2>
        {/* aquí pondrás filtros y buscador luego */}
      </header>

      <section className="catalog">
        {loading ? (
          <p>Cargando productos...</p>
        ) : products.length === 0 ? (
          <p>No hay productos en esta página.</p>
        ) : (
          <div className="products">
            {products.map(p => (
              <MerchCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <footer className="pagination">
        <button onClick={prev} disabled={page === 1}>Anterior</button>
        <span>Página {page}</span>
        <button onClick={next}>Siguiente</button>
      </footer>
    </div>
  );
};

