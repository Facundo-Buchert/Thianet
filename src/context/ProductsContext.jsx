import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import supabase from '../../utils/supabase';

const ProductsContext = createContext();
export const useProducts = () => useContext(ProductsContext);

const PAGE_SIZE = 20;

export const ProductsProvider = ({ children }) => {
  const [allProducts, setAllProducts] = useState([]); // todos los productos traídos desde Supabase
  const [products, setProducts] = useState([]);       // productos de la página actual (paginated)
  const [trending, setTrending] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // filtros / orden
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [order, setOrder] = useState('default');

  // debounce para search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // traer todos los productos que tienen stock (una sola vez) - implementado en batches para evitar límite 1000
  const fetchAll = async () => {
    setLoading(true);
    try {
      const BATCH = 1000; // tamaño por petición (Supabase suele limitar por defecto a 1000)
      let from = 0;
      let all = [];

      while (true) {
        // pedimos un rango
        const to = from + BATCH - 1;
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('hasstock', true)
          .eq('isVisible', true)
          .range(from, to); // <- clave para evitar corte en 1000

        if (error) {
          console.error('Error fetching products batch', { from, to, error });
          throw error;
        }

        if (!data || data.length === 0) break;

        all.push(...data);

        // si recibimos menos que el batch, ya no hay más
        if (data.length < BATCH) break;

        // siguiente batch
        from += BATCH;
      }

      setAllProducts(all || []);
    } catch (err) {
      console.error('Products fetch error', err);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // trending (se mantiene independiente)
  const fetchTrending = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('hasstock', true)
        .eq('isVisible', true)
        .eq('isTrending', true)
        .limit(8);

      setTrending(data || []);
    } catch (e) {
      console.error('Error fetching trending', e);
      setTrending([]);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchTrending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // categorías únicas derivadas de allProducts (para rellenar select / chips)
  const categories = useMemo(() => {
    const set = new Set();
    allProducts.forEach(p => {
      const c = (p.category || '').toString().trim();
      if (c) set.add(c);
    });
    return ['all', ...Array.from(set)]; // 'all' primero
  }, [allProducts]);

  // filteredProducts según debouncedSearch, category y order
  const filteredProducts = useMemo(() => {
    let list = [...allProducts];

    if (debouncedSearch) {
      const normalize = (str = '') =>
        str
          .toString()
          .normalize('NFD')
          .replace(/\p{M}/gu, '')
          .toLowerCase();

      const tokens = normalize(debouncedSearch)
        .split(/\s+/)
        .filter(Boolean); // palabras separadas por espacios

      list = list.filter(p => {
        const searchable = normalize(
          [
            p.title,
            p.category,
            p.subtitle,
            p.description,
            p.brand,
            Array.isArray(p.tags) ? p.tags.join(' ') : '',
            p.sku
          ].join(' ')
        );

        // TODAS las palabras deben existir como substring
        return tokens.every(t => searchable.includes(t));
      });
    }

    if (category && category !== 'all') {
      list = list.filter(p => (p.category || '').toString() === category);
    }

    if (order === 'price-asc') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (order === 'price-desc') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else {
      list.sort((a, b) => (a.id || 0) - (b.id || 0));
    }

    return list;
  }, [allProducts, debouncedSearch, category, order]);

  const totalResults = filteredProducts.length;
  const maxPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

  // si cambian filtros reseteo a página 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, order]);

  // paginar la lista filtrada
  useEffect(() => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    setProducts(filteredProducts.slice(from, to));
  }, [filteredProducts, page]);

  return (
    <ProductsContext.Provider
      value={{
        // datos
        products,
        trending,
        loading,

        // paginación
        page,
        setPage,
        maxPages,
        totalResults,
        pageSize: PAGE_SIZE,

        // filtros
        search,
        setSearch,
        category,
        setCategory,
        order,
        setOrder,
        categories, // lista dinámica de categorías

        // util
        refetchAll: fetchAll
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};
