// src/services/products.service.js
import { supabase } from '../utils/supabase';

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*');

  if (error) throw error;
  return data;
}

/*
Después vas a agregar:

getTrendingProducts

searchProducts

filterProducts
*/