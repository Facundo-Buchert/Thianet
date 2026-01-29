// src/context/CartContext.jsx
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
   price: number,   // precio original (visible)
   price0?: number, // price for 1-3
   price1?: number, // price for 4-9
   price2?: number, // price for >=10
   maxStock?: number
 }
*/

const STORAGE_KEY = 'thianet_cart_v1';

const maxDefined = (...vals) => {
  const defined = vals.filter(v => typeof v === 'number' && !Number.isNaN(v));
  if (defined.length === 0) return undefined;
  return Math.max(...defined);
};

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

        // parse prices safely: keep undefined if missing (don't fallback price0 -> price)
        const explicitPrice = (it.price !== undefined && it.price !== null) ? Number(it.price) : undefined;
        const p0 = (it.price0 !== undefined && it.price0 !== null) ? Number(it.price0) : undefined;
        const p1 = (it.price1 !== undefined && it.price1 !== null) ? Number(it.price1) : undefined;
        const p2 = (it.price2 !== undefined && it.price2 !== null) ? Number(it.price2) : undefined;

        // price visible: prefer explicitPrice, otherwise take the maximum of defined price tiers,
        // if none present fallback to 0
        const computedMax = maxDefined(p0, p1, p2);
        const priceVisible = explicitPrice !== undefined
          ? explicitPrice
          : (computedMax !== undefined ? computedMax : 0);

        const maxStock = it.maxStock !== undefined ? Number(it.maxStock) : undefined;

        console.log(it);
        
        return {
          productId: it.productId,
          title: it.title,
          img: it.img,
          size: it.size,
          qty,
          price: priceVisible,   // original visible price
          price0: p0,
          price1: p1,
          price2: p2,
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

  // effective price for an item depending on the QUANTITY OF THAT ITEM (siempre devuelve un número)
  const getEffectivePrice = (item, groupQty) => {
    if (!item) return 0;

    // determine which quantity to use for bracket: prefer explicit groupQty, otherwise item's qty
    const qty = (groupQty !== undefined && groupQty !== null) ? Number(groupQty) : Number(item.qty || 0);

    // precios normalizados: if price0 missing, fallback to item.price or 0 for calculations
    const p0 = (item.price0 !== undefined && item.price0 !== null) ? Number(item.price0) : ((item.price !== undefined && item.price !== null) ? Number(item.price) : 0);
    const p1 = (item.price1 !== undefined && item.price1 !== null) ? Number(item.price1) : p0;
    const p2 = (item.price2 !== undefined && item.price2 !== null) ? Number(item.price2) : p1;

    if (qty >= 10) return p2;
    if (qty >= 3) return p1;
    return p0;
  };

  // charged subtotal (efectivo según reglas)
  const subtotal = useMemo(() => {
    const total = items.reduce((s, i) => {
      const qty = Number(i.qty || 0);
      const price = getEffectivePrice(i, qty);
      return s + qty * price;
    }, 0);
    return total;
  }, [items, totalQty]);

  // original subtotal (suma por price visible)
  const originalSubtotal = useMemo(() => {
    return items.reduce((s, i) => {
      const qty = Number(i.qty || 0);
      const p = Number(i.price ?? (i.price0 ?? 0));
      return s + qty * p;
    }, 0);
  }, [items]);

  // Merge or add item. Returns { ok: boolean, message?: string }
  const addItem = (incoming) => {
    // sanitize incoming and normalize prices
    // IMPORTANT: do NOT assign price0 = incoming.price when incoming.price0 is missing.
    const p0 = (incoming.price0 !== undefined && incoming.price0 !== null) ? Number(incoming.price0) : undefined;
    const p1 = (incoming.price1 !== undefined && incoming.price1 !== null) ? Number(incoming.price1) : undefined;
    const p2 = (incoming.price2 !== undefined && incoming.price2 !== null) ? Number(incoming.price2) : undefined;

    const explicitPrice = (incoming.price !== undefined && incoming.price !== null) ? Number(incoming.price) : undefined;

    // Determine visible price: explicitPrice preferred, otherwise max of defined tiers, otherwise 0
    const computedMax = maxDefined(p0, p1, p2);
    const priceVisible = explicitPrice !== undefined ? explicitPrice : (computedMax !== undefined ? computedMax : 0);

    const it = {
      productId: incoming.productId,
      title: incoming.title,
      img: incoming.img,
      size: incoming.size,
      qty: Math.max(1, Number(incoming.qty || 1)),

      // price visible: prefer explicit incoming.price, otherwise max of defined tiers
      price: priceVisible,

      // keep undefined if the tier was not provided by upstream (so we don't silently copy price -> price0)
      price0: p0,
      price1: p1,
      price2: p2,

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

        // Merge tiered prices only if incoming provided them (do not overwrite existing tiers with undefined)
        existing.price = it.price;
        if (it.price0 !== undefined) existing.price0 = it.price0;
        if (it.price1 !== undefined) existing.price1 = it.price1;
        if (it.price2 !== undefined) existing.price2 = it.price2;
        if (it.maxStock !== undefined) existing.maxStock = it.maxStock;

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
        subtotal,         // charged subtotal (con descuentos aplicados)
        originalSubtotal, // suma por price visible (lo que se muestra como "precio base")
        getEffectivePrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
