import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

/*
 Item shape (normalized):
 {
   productId: number | string,
   title: string,
   img?: string,
   size: string,
   qty: number,
   price0: number,   // base price (price0)
   price1?: number,  // price for 4-9
   price2?: number,  // price for >=10
   maxStock?: number
 }
*/

const STORAGE_KEY = 'thianet_cart_v1';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  // load from localStorage once (with migration/normalization)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const normalized = parsed.map(it => {
        const qty = Math.max(1, Number(it.qty || 0));
        const price0 = Number(it.price0 ?? it.price ?? 0);
        const price1 = it.price1 !== undefined ? Number(it.price1) : undefined;
        const price2 = it.price2 !== undefined ? Number(it.price2) : undefined;
        const maxStock = it.maxStock !== undefined ? Number(it.maxStock) : undefined;

        return {
          productId: it.productId,
          title: it.title,
          img: it.img,
          size: it.size,
          qty,
          price0,
          price1,
          price2,
          maxStock
        };
      });

      setItems(normalized);
    } catch (e) {
      console.error('Error loading cart from localStorage', e);
    }
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }
  }, [items]);

  const keyOf = (it) => `${String(it.productId)}|${String(it.size)}`;

  // compute total quantity in cart (sum of qty)
  const totalQty = useMemo(() => items.reduce((s, i) => s + (Number(i.qty) || 0), 0), [items]);

  // effective price for an item depending on totalQty
  // siempre devuelve un número
  const getEffectivePrice = (item, total = totalQty) => {
    if (!item) return 0;

    const p0 = Number(item.price0 ?? item.price ?? 0) || 0;
    const p1 = item.price1 !== undefined ? Number(item.price1) : p0;
    const p2 = item.price2 !== undefined ? Number(item.price2) : p1;

    if (total >= 10) return p2 ?? p1 ?? p0;
    if (total >= 4) return p1 ?? p0;
    return p0;
  };

  const subtotal = useMemo(() => {
    const total = items.reduce((s, i) => {
      const qty = Number(i.qty || 0);
      const price = getEffectivePrice(i, totalQty);
      return s + qty * price;
    }, 0);
    return total;
  }, [items, totalQty]);

  // Merge or add item. Returns { ok: boolean, message?: string }
  const addItem = (incoming) => {
    // sanitize incoming and normalize prices
    const it = {
      productId: incoming.productId,
      title: incoming.title,
      img: incoming.img,
      size: incoming.size,
      qty: Math.max(1, Number(incoming.qty || 1)),

      // prices normalized
      price0: Number(incoming.price0 ?? incoming.price ?? 0),
      price1: incoming.price1 !== undefined ? Number(incoming.price1) : undefined,
      price2: incoming.price2 !== undefined ? Number(incoming.price2) : undefined,

      maxStock: incoming.maxStock !== undefined ? Number(incoming.maxStock) : undefined,
    };

    // check stock if provided
    if (typeof it.maxStock === 'number' && it.qty > it.maxStock) {
      it.qty = it.maxStock;
      if (it.qty === 0) return { ok: false, message: 'No hay stock disponible para ese talle.' };
    }

    setItems(prev => {
      const copy = [...prev];
      const idx = copy.findIndex(i => keyOf(i) === keyOf(it));
      if (idx !== -1) {
        const existing = { ...copy[idx] };
        const newQty = existing.qty + it.qty;
        const max = typeof existing.maxStock === 'number' ? existing.maxStock : it.maxStock;
        existing.qty = typeof max === 'number' ? Math.min(newQty, max) : newQty;
        copy[idx] = existing;
      } else {
        copy.push(it);
      }
      return copy;
    });

    return { ok: true };
  };

  const removeItem = (productId, size) => {
    setItems(prev => prev.filter(i => !(String(i.productId) === String(productId) && String(i.size) === String(size))));
  };

  // update qty but cap by maxStock if given
  const updateQty = (productId, size, qty) => {
    setItems(prev => {
      const copy = prev.map(i => ({ ...i }));
      const idx = copy.findIndex(i => String(i.productId) === String(productId) && String(i.size) === String(size));
      if (idx === -1) return prev;
      const it = copy[idx];
      const desired = Math.max(1, Number(qty || 1));
      if (typeof it.maxStock === 'number') {
        it.qty = Math.min(desired, it.maxStock);
      } else {
        it.qty = desired;
      }
      copy[idx] = it;
      return copy;
    });
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalQty,
        subtotal,
        getEffectivePrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
