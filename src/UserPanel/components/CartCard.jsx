// src/UserPanel/components/CartCard.jsx
import './CartCard.css';
import { useCart } from '../../context/CartContext';

const CartCard = ({ item }) => {
  const { updateQty, removeItem, totalQty, getEffectivePrice } = useCart();

  const qty = Number(item.qty || 0);

  // precio base mostrado (price0). Fallback a item.price por compatibilidad.
  const unitPrice = Number(item.price0 ?? item.price ?? 0);

  // Precio efectivo (solo para cálculos internos de descuentos)
  const effectivePrice = Number(getEffectivePrice(item, totalQty) || 0);

  // Totales basados en price0 (lo que se muestra en la card)
  const originalTotal = unitPrice * qty;

  // Aun que no mostramos aquí el precio con descuento, lo calculamos si hace falta
  const discountedTotal = effectivePrice * qty;
  const saving = Math.max(0, originalTotal - discountedTotal);

  return (
    <article className="cart-card">
      <img
        src={item.img ?? '/placeholder.jpg'}
        alt={item.title}
        className="cart-image"
      />

      <div className="cart-details">
        <h4>{item.title}</h4>
        <span className="cart-size">Talle: {item.size}</span>

        <button
          className="remove-link"
          onClick={() => removeItem(item.productId, item.size)}
        >
          Quitar
        </button>
      </div>

      <div className="cart-qty">
        <button onClick={() => updateQty(item.productId, item.size, Math.max(1, qty - 1))}>
          −
        </button>
        <span>{qty}</span>
        <button onClick={() => updateQty(item.productId, item.size, qty + 1)}>
          +
        </button>
      </div>

      <div className="cart-prices">
        <span className="unit-price">${unitPrice.toFixed(2)}</span>
        <strong className="item-total">${originalTotal.toFixed(2)}</strong>
      </div>
    </article>
  );
};

export default CartCard;
