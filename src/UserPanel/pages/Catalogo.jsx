import React from 'react';
import { useProducts } from '../../context/ProductsContext';
import { MerchCard } from '../components/MerchCard';
import './Catalogo.css';

export const Catalogo = () => {
  const {
    products,
    loading,
    page,
    setPage,
    maxPages,
    totalResults,
    search,
    setSearch,
    category,
    setCategory,
    order,
    setOrder,
    categories
  } = useProducts();

  const prev = () => setPage(Math.max(1, page - 1));
  const next = () => setPage(Math.min(maxPages, page + 1));
  const first = () => setPage(1);
  const last = () => setPage(maxPages);

  return (
    <div className="catalogo-page">
      <header className="catalogo-header">
        <div className="catalogo-title">
          <h2>Catálogo</h2>
          <div className="catalog-stats">
            {loading ? 'Cargando...' : `${totalResults} resultado(s)`}
          </div>
        </div>

        <div className="catalogo-filters">
          <div className="search-wrap">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="clear" onClick={() => setSearch('')}>✕</button>}
          </div>

          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
              {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'Todas' : c}</option>)}
            </select>

          <div className="right-filters">
            <select
              value={order}
              onChange={e => setOrder(e.target.value)}
              aria-label="Ordenar productos"
            >
              <option value="default">Orden</option>
              <option value="price-asc">Precio ↑</option>
              <option value="price-desc">Precio ↓</option>
            </select>
          </div>
        </div>
      </header>

      <section className="catalog">
        {loading ? (
          <div className="products grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron productos.</p>
            <button onClick={() => { setCategory('all'); setSearch(''); setOrder('default'); }}>
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="products grid">
            {products.map(p => (
              <MerchCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <footer className="pagination">
        <div className="pager-left">
          <button onClick={first} disabled={page === 1}>Primera</button>
          <button onClick={prev} disabled={page === 1}>Anterior</button>
        </div>

        <div className="pager-center">
          <span>{page} de {maxPages}</span>
        </div>

        <div className="pager-right">
          <button onClick={next} disabled={page === maxPages}>Siguiente</button>
          <button onClick={last} disabled={page === maxPages}>Última</button>
        </div>
      </footer>
    </div>
  );
};
