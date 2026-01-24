// src/UserPanel/pages/Catalogo.jsx
import React from 'react';
import { useProducts } from '../../context/ProductsContext';
import { MerchCard } from '../components/MerchCard';
import './Catalogo.css';

export const Catalogo = () => {
  const {
    products = [],
    loading = false,
    page = 1,
    setPage,
    maxPages = 1,
    totalResults = 0,
    search = '',
    setSearch,
    category = 'all',
    setCategory,
    order = 'default',
    setOrder,
    categories = []
  } = useProducts();

  const prev = () => setPage(Math.max(1, page - 1));
  const next = () => setPage(Math.min(maxPages, page + 1));
  const first = () => setPage(1);
  const last = () => setPage(maxPages);

  const onChipKey = (e, c) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setCategory(c);
      setPage(1);
    }
  };

  return (
    <main className="catalogo-page" role="main">
      <header className="catalogo-header" aria-labelledby="catalogo-title">
        <div className="catalogo-title">
          <h2 id="catalogo-title">Catálogo</h2>
          <div className="catalog-stats" aria-live="polite">
            {loading ? 'Cargando...' : `${totalResults} resultado(s)`}
          </div>
        </div>

        <div className="catalogo-filters" role="region" aria-label="Filtros de búsqueda">
          <div className="search-wrap">
            <label htmlFor="catalog-search" className="visually-hidden">Buscar producto</label>
            <input
              id="catalog-search"
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              aria-label="Buscar producto"
            />
            {search && (
              <button
                className="clear"
                onClick={() => { setSearch(''); setPage(1); }}
                aria-label="Limpiar búsqueda"
                title="Limpiar"
              >
                ✕
              </button>
            )}
          </div>

          <div className="category-select">
            <label htmlFor="catalog-category" className="visually-hidden">Categoría</label>
            <select
              id="catalog-category"
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              aria-label="Seleccionar categoría"
            >
              {categories.length === 0 ? (
                <option value="all">Todas</option>
              ) : (
                categories.map(c => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'Todas' : c}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="right-filters">
            <label htmlFor="catalog-order" className="visually-hidden">Ordenar productos</label>
            <select
              id="catalog-order"
              value={order}
              onChange={e => { setOrder(e.target.value); setPage(1); }}
              aria-label="Ordenar productos"
            >
              <option value="default">Orden</option>
              <option value="price-asc">Precio ↑</option>
              <option value="price-desc">Precio ↓</option>
            </select>
          </div>
        </div>

        {/* category chips (scrollable) */}
        {categories && categories.length > 0 && (
          <div className="category-chips" role="tablist" aria-label="Categorías rápidas">
            {categories.map(c => (
              <button
                key={c}
                className={`chip ${c === category ? 'active' : ''}`}
                onClick={() => { setCategory(c); setPage(1); }}
                onKeyDown={(e) => onChipKey(e, c)}
                aria-pressed={c === category}
                role="tab"
                tabIndex={0}
                title={c === 'all' ? 'Todas las categorías' : c}
              >
                {c === 'all' ? 'Todas' : c}
              </button>
            ))}
          </div>
        )}
      </header>

      <section className="catalog" aria-live="polite">
        {loading ? (
          <div className="products grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton-card" aria-hidden="true" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state" role="status">
            <p>No se encontraron productos.</p>
            <button
              onClick={() => { setCategory('all'); setSearch(''); setOrder('default'); setPage(1); }}
              className="reset-btn"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="products grid" role="list">
            {products.map(p => (
              <div key={p.id} role="listitem">
                <MerchCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="pagination" aria-label="Paginación">
        <div className="pager-left">
          <button onClick={first} disabled={page === 1} aria-disabled={page === 1} aria-label="Ir a la primera página">Primera</button>
          <button onClick={prev} disabled={page === 1} aria-disabled={page === 1} aria-label="Página anterior">Anterior</button>
        </div>

        <div className="pager-center" aria-live="polite">
          <span>{page} de {maxPages}</span>
        </div>

        <div className="pager-right">
          <button onClick={next} disabled={page === maxPages} aria-disabled={page === maxPages} aria-label="Página siguiente">Siguiente</button>
          <button onClick={last} disabled={page === maxPages} aria-disabled={page === maxPages} aria-label="Ir a la última página">Última</button>
        </div>
      </footer>
    </main>
  );
};

export default Catalogo;
