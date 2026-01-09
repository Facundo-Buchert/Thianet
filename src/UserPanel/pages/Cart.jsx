// src/UserPanel/pages/Cart.jsx
import { useCart } from '../../context/CartContext';
import CartCard from '../components/CartCard';
import './Cart.css';

export const Cart = () => {
  const { items, subtotal: effectiveSubtotal, totalQty } = useCart();

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
  const total = itemsPrice - discounts || 0;

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

        <button className="checkout-btn">
          Crear orden
        </button>
      </aside>
    </main>
  );
};
