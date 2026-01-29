import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartCard from '../components/CartCard';
import supabase from '../../../utils/supabase';
import './Cart.css';

const SHIPPING_OPTIONS = [
  { key: 'caba', label: 'CABA – Moto mensajería (Lunes a viernes · 15 a 22 hs)', cost: 4000 },
  { key: 'gba1', label: 'GBA 1 – Moto mensajería (Vicente López, San Isidro, San Fernando, San Martín, Tres de Febrero, Morón, Hurlingham, Ituzaingó, La Matanza, Lomas de Zamora, Lanús, Avellaneda)', cost: 6000 },
  { key: 'gba2', label: 'GBA 2 – Moto mensajería (Tigre, Malvinas Argentinas, José C. Paz, San Miguel, Moreno, Merlo, Ezeiza, Esteban Echeverría, Almirante Brown, Quilmes, Florencio Varela, Berazategui) - A cotizar', cost: null },
  { key: 'correo_sucursal', label: 'Correo Arg. – Retiro en sucursal (hasta 3 prendas)', cost: 6500 },
  { key: 'correo_domicilio', label: 'Correo Arg. – Envío a domicilio (hasta 3 prendas)', cost: 10500 },
  { key: 'correo_mas3', label: 'Correo Argentino – Más de 3 prendas. A cotizar', cost: null },
  { key: 'via_cargo', label: 'Vía Cargo – Retiro en terminal (Se abona el envío al retirar)', cost: 0 }
];

export const Cart = () => {
  const navigate = useNavigate();

  // useCart: defensivo por si tu contexto no provee alguno de estos campos
  const {
    items = [],
    subtotal: effectiveSubtotalFromContext = 0,   // lo que se cobra desde el contexto (no lo vamos a preferir)
    originalSubtotal: originalSubtotalFromContext = 0,
    totalQty = 0,
    clearCart = () => { },
    getEffectivePrice = () => 0
  } = useCart();

  const [loadingOrder, setLoadingOrder] = useState(false);
  const [errorOrder, setErrorOrder] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);

  // shipping UI state
  const [shippingMode, setShippingMode] = useState('my_address'); // 'my_address' | 'other'
  const [selectedMethod, setSelectedMethod] = useState(SHIPPING_OPTIONS[0].key);
  const [otherAddress, setOtherAddress] = useState('');
  const [notes, setNotes] = useState('');

  // profile for "mi dirección"
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const { data: userData, error: authErr } = await supabase.auth.getUser();
        if (authErr) {
          setProfile(null);
          return;
        }
        const user = userData?.user || null;
        if (!user) {
          setProfile(null);
          return;
        }
        const { data: p, error } = await supabase
          .from('users')
          .select('id,userId,name,mail,number,address,default_shipping')
          .eq('id', user.id)
          .single();
        if (!error) setProfile(p || null);
        else setProfile(null);
      } catch (e) {
        console.warn('loadProfile error', e);
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (shippingMode === 'my_address' && profile?.default_shipping) {
      const found = SHIPPING_OPTIONS.find(o => o.key === profile.default_shipping);
      setSelectedMethod(found ? found.key : SHIPPING_OPTIONS[0].key);
    }
  }, [shippingMode, profile]);

  // -----------------------------------------
  // Totales / descuentos (regla solicitada)
  // -----------------------------------------
  // Calculamos localmente (siempre) origSubtotal y effSubtotal a partir de los items actuales.
  // Esto evita confiar en valores stale del contexto y garantiza descuento correcto para 1-3 items.
  const computed = useMemo(() => {
    // subtotal visible (precio mostrado por ítem): preferimos item.price (si existe),
    // si no existe, tomamos el máximo entre price0/price1/price2 como fallback razonable.
    const origSubtotal = items.reduce((acc, it) => {
      const qty = Number(it.qty || 0);
      const visible =  Number(it.price);
      return acc + qty * visible;
    }, 0);

    // effective subtotal calculado LOCALMENTE según reglas (1-3 price0, 4-9 price1, >=10 price2)
    const effLocal = items.reduce((acc, it) => {
      const qty = Number(it.qty || 0);
      // getEffectivePrice toma total como segundo arg; pasamos totalQty explícito
      const effPrice = Number(getEffectivePrice(it, totalQty) || 0);
      return acc + qty * effPrice;
    }, 0);

    // discounts calculado por item: suma( (visible - effPrice) * qty ), y aseguramos >=0
    const rawDiscountsByItems = items.reduce((acc, it) => {
      const qty = Number(it.qty || 0);
      const visible = (it.price);
      const effPrice = Number(getEffectivePrice(it, totalQty) || 0);
      const perItem = Math.max(0, visible - effPrice);
      
      console.log('Item', it.productId, 'qty', qty, 'visible', visible, 'effPrice', effPrice, 'perItem', perItem);
      return acc + perItem * qty;
    }, 0);

    // Use effLocal ALWAYS (no fallback a valores externos).
    const effSubtotal = effLocal;

    const rawDiscounts = Math.max(0, rawDiscountsByItems, origSubtotal - effSubtotal);

    return {
      origSubtotal,
      effSubtotal,
      rawDiscounts
    };
  }, [items, totalQty, getEffectivePrice]);

  const origSubtotalSafe = Number(computed.origSubtotal || 0);
  const effSubtotalSafe = Number(computed.effSubtotal || 0);
  const rawDiscounts = Number(computed.rawDiscounts || 0);

  // redondeo a la centena superior
  const discounts = rawDiscounts > 0 ? Math.ceil(rawDiscounts / 100) * 100 : 0;

  // totalBeforeShipping lo calculamos restando el descuento redondeado al subtotal visible (como venías haciendo)
  const totalBeforeShipping = Number(Math.max(0, origSubtotalSafe - discounts).toFixed(0));

  const shippingOption = SHIPPING_OPTIONS.find(o => o.key === selectedMethod) || SHIPPING_OPTIONS[0];
  const shippingCost = shippingOption?.cost ?? 0;
  const isToQuote = shippingOption?.cost === null;

  const finalTotal = useMemo(() => {
    return Number((totalBeforeShipping + (shippingCost || 0)).toFixed(0));
  }, [totalBeforeShipping, shippingCost]);

  // -----------------------------------------
  // create order
  // -----------------------------------------
  const createOrder = async () => {
    setErrorOrder(null);
    setSuccessOrder(null);
    setLoadingOrder(true);

    try {
      const { data: userData, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        setErrorOrder('Error de autenticación.');
        setLoadingOrder(false);
        return;
      }
      const user = userData?.user;
      if (!user) {
        navigate('/profile/login');
        return;
      }

      const { data: profileData, error: profileErr } = await supabase
        .from('users')
        .select('id, userId, name, mail, number, address, default_shipping')
        .eq('id', user.id)
        .single();

      if (profileErr || !profileData) {
        console.error('Profile fetch error:', profileErr);
        setErrorOrder('No se pudo cargar tu perfil.');
        setLoadingOrder(false);
        return;
      }

      let finalAddress = profileData.address || null;
      if (shippingMode === 'other') {
        if (!otherAddress || otherAddress.trim() === '') {
          setErrorOrder('Completá la dirección de envío alternativa.');
          setLoadingOrder(false);
          return;
        }
        finalAddress = otherAddress.trim();
      }

      const orderItems = items.map(it => ({
        productId: it.productId,
        title: it.title,
        size: it.size,
        qty: Number(it.qty),
        unitPrice: Number(getEffectivePrice(it, totalQty))
      }));

      let notesFinal = (notes || '').toString().trim();
      const shippingNote = isToQuote
        ? `Envio: ${shippingOption?.label} (A COTIZAR).`
        : `Envio: ${shippingOption?.label} ($${shippingCost}).`;
      notesFinal = notesFinal ? `${notesFinal}\n\n${shippingNote}` : shippingNote;

      const payload = {
        clientId: profileData.userId ?? null,
        name: profileData.name ?? null,
        mail: profileData.mail ?? null,
        phone: profileData.number ?? null,
        address: finalAddress ?? null,
        items: orderItems,
        total: Number(finalTotal.toFixed(0)),
        status: isToQuote ? 'pending_quote' : 'pending',
        notes: notesFinal,
        shippingMethod: selectedMethod
      };

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

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  const isEmpty = !items || items.length === 0;

  return (
    <main className="cart-page">
      <section className="cart-list">
        {isEmpty ? <h2>Tu carrito está vacío</h2> : <h2>Tu carrito</h2>}

        {isEmpty ? (
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="cart-item skeleton">
                <div className="cart-item-image skeleton-box" />
                <div className="cart-item-info">
                  <div className="skeleton-line title" />
                  <div className="skeleton-line small" />
                  <div className="skeleton-line small" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {items.map(item => (
              <CartCard
                key={`${item.productId}-${item.size}`}
                item={item}
              />
            ))}
          </div>
        )}
      </section>

      <aside className={`cart-summary ${isEmpty ? 'skeleton' : ''}`}>
        <h3>Resumen</h3>

        <div className="summary-row small">
          <span>Subtotal</span>
          <span className="muted-price">${(origSubtotalSafe).toFixed(0)}</span>
        </div>

        <div className="summary-row">
          <span>Descuentos</span>
          <strong className="discounts">-${discounts.toFixed(0)}</strong>
        </div>

        <div className="summary-row small">
          <span>Subtotal c/descuentos</span>
          <strong className="subtotal">${totalBeforeShipping.toFixed(0)}</strong>
        </div>

        <div className="shipping-section" aria-hidden={isEmpty}>
          <h4>Opciones de envío</h4>

          <div className="radio-row">
            <label>
              <input
                type="radio"
                name="shippingMode"
                value="my_address"
                checked={shippingMode === 'my_address'}
                onChange={() => setShippingMode('my_address')}
                disabled={isEmpty}
              />
              Envío a mi dirección
            </label>

            <label>
              <input
                type="radio"
                name="shippingMode"
                value="other"
                checked={shippingMode === 'other'}
                onChange={() => setShippingMode('other')}
                disabled={isEmpty}
              />
              A otra dirección
            </label>
          </div>

          {shippingMode === 'my_address' && (
            <div className="my-address">
              <div className="address-label">Dirección de facturación / envío</div>
              <div className="address-value">
                {loadingProfile ? 'Cargando...' : (profile?.address || 'No tenés dirección en tu perfil')}
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#444' }}>
                Método de envío aplicado: <strong>{(SHIPPING_OPTIONS.find(o => o.key === selectedMethod)?.label) || selectedMethod}</strong>
                {shippingOption?.cost !== null && ` — $${shippingOption?.cost}`}
                {shippingOption?.cost === null && ' — A cotizar'}
              </div>
            </div>
          )}

          {shippingMode === 'other' && (
            <div className="other-address">
              <label>Elegí método de envío</label>
              <select
                value={selectedMethod}
                onChange={e => setSelectedMethod(e.target.value)}
                disabled={isEmpty}
              >
                {SHIPPING_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} {opt.cost === null ? ' — A cotizar' : ` — $${opt.cost}`}
                  </option>
                ))}
              </select>

              <label style={{ marginTop: 8 }}>Dirección de envío</label>
              <textarea
                placeholder="Calle, número, piso, localidad, CP"
                value={otherAddress}
                onChange={e => setOtherAddress(e.target.value)}
                rows={3}
                disabled={isEmpty}
              />
            </div>
          )}
        </div>

        <div className="notes-section">
          <label>Notas (opcional)</label>
          <textarea
            placeholder="Instrucciones, referencia, horarios, etc."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            disabled={isEmpty}
          />
        </div>

        <div className="summary-row">
          <span>Envío</span>
          <strong className="total">${(shippingCost || 0).toFixed(0)}</strong>
        </div>

        <div className="summary-row grand">
          <span>Total</span>
          <strong className="total">${finalTotal.toFixed(0)}</strong>
        </div>

        <hr />

        {errorOrder && <div className="form-error">{errorOrder}</div>}
        {successOrder && <div className="form-success">{successOrder}</div>}

        <button
          className="checkout-btn"
          onClick={createOrder}
          disabled={loadingOrder || isEmpty}
        >
          {loadingOrder ? 'Creando orden...' : 'Crear orden'}
        </button>
      </aside>
    </main>
  );
};

export default Cart;
