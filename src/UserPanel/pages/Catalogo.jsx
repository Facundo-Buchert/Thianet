// src/UserPanel/pages/Catalogo.jsx
import React from 'react';
import { useProducts } from '../../context/ProductsContext';
import { MerchCard } from '../components/MerchCard';
import { useMemo } from 'react';
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

  const sortedCategories = useMemo(() => {
    const arr = Array.from(new Set(categories || []));
    const hasAll = arr.includes('all');
    const others = arr.filter(c => c !== 'all');

    const rankFor = (s = '') => {
      const lower = String(s).toLowerCase();
      if (lower.includes('25/26')) return 0;
      if (lower.includes('retro')) return 1;
      return 2;
    };

    others.sort((a, b) => {
      const ra = rankFor(a);
      const rb = rankFor(b);
      if (ra !== rb) return ra - rb;
      return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
    });

    return hasAll ? ['all', ...others] : others;
  }, [categories]);

  // displayedProducts: cada palabra en el input (separada por espacios) actúa como criterio independiente (AND).
  // Si no hay resultados con AND, cae a OR (parcial).
  const displayedProducts = useMemo(() => {
    if (!search || !String(search).trim()) return products;

    const normalize = (s = '') =>
      String(s)
        .normalize('NFD')
        .replace(/\p{M}/gu, '') // quitar tildes
        .toLowerCase()
        .trim();

    // conserva "/" y "-" en tokens (para casos como 25/26)
    const sanitizeToken = (t = '') =>
      normalize(t).replace(/[^\p{L}\p{N}\/\-]+/gu, ''); // letras, números, / y -

    const rawTokens = String(search)
      .trim()
      .split(/\s+/)
      .map(sanitizeToken)
      .filter(Boolean);

    if (rawTokens.length === 0) return products;

    // campos donde buscarnos
    const makeSearchable = (p) => {
      const parts = [];
      ['title', 'category', 'subtitle', 'description', 'brand', 'tags', 'sku'].forEach(k => {
        if (p[k]) {
          if (Array.isArray(p[k])) parts.push(p[k].join(' '));
          else parts.push(String(p[k]));
        }
      });
      return normalize(parts.join(' '));
    };

    const tokenMatch = (token, searchable) => {
      if (!token) return false;
      // match substring simple (permite "rem" -> "remera", "boc" -> "boca")
      if (searchable.includes(token)) return true;
      // también intentar prefijo de palabras (ej: token "boc" -> palabra "boca")
      const words = searchable.split(/\s+/).map(w => w.replace(/[^\p{L}\p{N}\/\-]/gu, ''));
      if (words.some(w => w.startsWith(token))) return true;
      return false;
    };

    // AND: todos los tokens deben aparecer en algún lugar (en cualquier campo)
    const andMatches = products
      .map(p => {
        const searchable = makeSearchable(p);
        const ok = rawTokens.every(t => tokenMatch(t, searchable));
        return { p, ok };
      })
      .filter(x => x.ok)
      .map(x => x.p);

    if (andMatches.length > 0) {
      // ordenar alfabeticamente por título
      return andMatches.sort((a, b) => String((a.title || '')).localeCompare(String((b.title || '')), 'es', { sensitivity: 'base' }));
    }

    // Fallback OR: al menos 1 token coincide -> ordenar por cantidad de tokens coincidentes (desc)
    const orMatches = products
      .map(p => {
        const searchable = makeSearchable(p);
        let matchedCount = 0;
        for (const t of rawTokens) if (tokenMatch(t, searchable)) matchedCount++;
        return { p, matchedCount };
      })
      .filter(x => x.matchedCount > 0)
      .sort((a, b) => {
        if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
        return String(a.p.title || '').localeCompare(String(b.p.title || ''), 'es', { sensitivity: 'base' });
      })
      .map(x => x.p);

    return orMatches;
  }, [products, search]);

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
              {sortedCategories.length === 0 ? (
                <option value="all">Todas</option>
              ) : (
                sortedCategories.map(c => (
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
        ) : displayedProducts.length === 0 ? (
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
            {displayedProducts.map(p => (
              <div key={p.id} role="listitem">
                <MerchCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="pagination" aria-label="Paginación">
        <div className="pager-left">
          <button onClick={() => { first(); window.scrollTo(0, 0); }} disabled={page === 1} aria-disabled={page === 1} aria-label="Ir a la primera página">Primera</button>
          <button onClick={() => { prev(); window.scrollTo(0, 0); }} disabled={page === 1} aria-disabled={page === 1} aria-label="Página anterior">Anterior</button>
        </div>

        <div className="pager-center" aria-live="polite">
          <span>{page} de {maxPages}</span>
        </div>

        <div className="pager-right">
          <button onClick={() => { next(); window.scrollTo(0, 0); }} disabled={page === maxPages} aria-disabled={page === maxPages} aria-label="Página siguiente">Siguiente</button>
          <button onClick={() => { last(); window.scrollTo(0, 0); }} disabled={page === maxPages} aria-disabled={page === maxPages} aria-label="Ir a la última página">Última</button>
        </div>
      </footer>
    </main>
  );
};

export default Catalogo;
