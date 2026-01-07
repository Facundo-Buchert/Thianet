import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../../utils/supabase';

const ProductsContext = createContext();
export const useProducts = () => useContext(ProductsContext);

const PAGE_SIZE = 20;

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .range(from, to);

    if (error) {
      console.error('fetchProducts error:', error);
      setProducts([]);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchTrending = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('isTrending', true)
      .limit(10);

    if (error) {
      console.error('fetchTrending error:', error);
      setTrending([]);
    } else {
      setTrending(data || []);
    }
  };

  useEffect(() => {
    fetchProducts(page);
    fetchTrending();
  }, [page]);

  console.log('ProductsContext products:', products, 'trending:', trending);

  return (
    <ProductsContext.Provider
      value={{
        products,
        trending,
        loading,
        page,
        setPage
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};
