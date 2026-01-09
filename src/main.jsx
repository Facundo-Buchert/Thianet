import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ProductsProvider } from './context/ProductsContext';
import { CartProvider } from './context/CartContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <CartProvider>
    <ProductsProvider>
      <App />
    </ProductsProvider>
  </CartProvider>

);
