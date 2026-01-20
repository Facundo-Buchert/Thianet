// src/UserPanel/pages/Cart.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartCard from '../components/CartCard';
import supabase from '../../../utils/supabase';
import './Cart.css';

export const Cart = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();

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

  // subtotal real desde items
  const itemsPrice = items.reduce((acc, it) => {
    return acc + Number(it.qty || 0) * Number(it.price0 ?? it.price ?? 0);
  }, 0);

  const total = Number(itemsPrice.toFixed(2));

  const createOrder = async () => {
    setErrorOrder(null);
    setSuccessOrder(null);
    setLoadingOrder(true);

    try {
      /* 1) Usuario autenticado (supabase.user tiene `id` - UUID) */
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        navigate('/profile/login');
        return;
      }

      /* 2) Traer perfil desde public.users usando id (UUID) */
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('id, userId, name, mail, number, address')
        .eq('id', user.id)   // <<-- usar id (UUID) que viene de auth
        .single();

      if (profileErr || !profile) {
        console.error('Profile fetch error:', profileErr);
        setErrorOrder('No se pudo cargar tu perfil.');
        setLoadingOrder(false);
        return;
      }

      /* 3) Items EXACTOS para jsonb */
      const orderItems = items.map(it => ({
        productId: it.productId,
        title: it.title,
        size: it.size,
        qty: Number(it.qty),
        unitPrice: Number(it.price0 ?? it.price)
      }));

      /* 4) Payload final (clientId usa userId bigint de tu tabla) */
      const payload = {
        clientId: profile.userId ?? null,
        name: profile.name ?? null,
        mail: profile.mail ?? null,
        phone: profile.number ?? null,
        address: profile.address ?? null,
        items: orderItems,
        total,
        status: 'pending'
      };

      /* 5) Insert */
      const { error } = await supabase
        .from('orders')
        .insert([payload]);

      if (error) {
        console.error('Orders insert error:', error);
        setErrorOrder('Error al crear la orden.');
        setLoadingOrder(false);
        return;
      }

      clearCart();
      setSuccessOrder('Orden creada correctamente.');
      setLoadingOrder(false);

      setTimeout(() => navigate('/profile'), 1000);

    } catch (err) {
      console.error('Unexpected error:', err);
      setErrorOrder('Error inesperado.');
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
          <span>Total</span>
          <strong className="total">${total.toFixed(2)}</strong>
        </div>

        <hr /><br />

        {errorOrder && <div className="form-error">{errorOrder}</div>}
        {successOrder && <div className="form-success">{successOrder}</div>}

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
