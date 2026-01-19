// src/UserPanel/pages/Cart.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartCard from '../components/CartCard';
import supabase from '../../../utils/supabase';
import './Cart.css';

export const Cart = () => {
  const navigate = useNavigate();
  const { items, subtotal: effectiveSubtotal, totalQty, clearCart } = useCart();

  const [loadingOrder, setLoadingOrder] = useState(false);
  const [errorOrder, setErrorOrder] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);

  if (items.length === 0) {
    return (
      <main className="cart-page empty">
        <h2>Tu carrito</h2>
        <p>No tenés productos agregados todavía.</p>
      </main>
    );
  }

  // subtotal mostrado en la UI = suma price0 * qty (lo mismo que se muestra en cada CartCard)
  const itemsPrice = items.reduce((acc, it) => {
    const qty = Number(it.qty || 0);
    const p0 = Number(it.price0 ?? it.price ?? 0);
    return acc + qty * p0;
  }, 0);

  const itemsDiscountsBase = itemsPrice - itemsPrice / 1.14;

  // effectiveSubtotal viene del contexto y ya aplica price1/price2 según reglas (subtotal con descuentos)
  // Descuentos = diferencia entre price0 total y subtotal efectivo
  const discounts = Math.max(0, itemsPrice - (Number(effectiveSubtotal) - itemsDiscountsBase || 0));

  // Total final = subtotal efectivo (itemsPrice - discounts)
  const total = (itemsPrice - discounts) || 0;

  // crear orden en la tabla 'orders'
  const createOrder = async () => {
    setErrorOrder(null);
    setSuccessOrder(null);

    // obtener usuario local (snapshot)
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('thianet_user') || 'null');
    } catch (e) {
      user = null;
    }

    if (!user || !user.id) {
      // sin usuario: redirigir a login para completar datos
      navigate('/profile/login');
      return;
    }

    // preparar items del pedido (snapshot)
    const orderItems = items.map(it => ({
      productId: it.productId,
      title: it.title,
      size: it.size,
      qty: Number(it.qty || 0),
      unitPrice: Number(it.price0 ?? it.price ?? 0)
    }));

    // payload para la tabla orders (ajustalo si tu tabla usa otros nombres)
    const payload = {
      clientId: user.id ?? null,
      name: user.name ?? null,
      mail: user.mail ?? null,
      phone: user.number ?? null,
      address: user.adress ?? null,
      items: orderItems,
      total: Number(total.toFixed(2)),
      status: 'pending'
    };

    setLoadingOrder(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error', error);
        setErrorOrder(error.message || 'Error al crear la orden.');
        setLoadingOrder(false);
        return;
      }

      // éxito: limpiar carrito y mostrar mensaje
      clearCart();
      setSuccessOrder('Orden creada correctamente. Gracias por tu compra.');
      setLoadingOrder(false);

      // opcional: redirigir a perfil / pedidos (ajusta la ruta si tenés una específica)
      setTimeout(() => navigate('/profile'), 1000);
    } catch (err) {
      console.error('Unexpected error creating order', err);
      setErrorOrder('Error inesperado al crear la orden. Reintentá.');
      setLoadingOrder(false);
    }
  };

  return (
    <main className="cart-page">
      <section className="cart-list">
        <h2>Tu carrito</h2>

        {items.map(item => (
          <CartCard
            key={`${item.productId}-${item.size}`}
            item={item}
          />
        ))}
      </section>

      <aside className="cart-summary">
        <h3>Resumen</h3>

        <div className="summary-row">
          <span>Subtotal</span>
          <strong className='subtotal'>${itemsPrice.toFixed(2)}</strong>
        </div>

        <div className="summary-row">
          <span>Descuentos</span>
          <strong className='discounts'>-${discounts.toFixed(2)}</strong>
        </div>

        <div className="summary-row">
          <span>Total</span>
          <strong className='total'>${total.toFixed(2)}</strong>
        </div>

        <hr /><br />

        {errorOrder && <div className="form-error" style={{marginBottom:8}}>{errorOrder}</div>}
        {successOrder && <div className="form-success" style={{marginBottom:8}}>{successOrder}</div>}

        <button
          className="checkout-btn"
          onClick={createOrder}
          disabled={loadingOrder}
        >
          {loadingOrder ? 'Creando orden...' : 'Crear orden'}
        </button>
      </aside>
    </main>
  );
};

export default Cart;
