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
    subtotal: effectiveSubtotal = null,
    totalQty = 0,
    clearCart = () => { }
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
    // load profile (if logged)
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
        // Pedimos también default_shipping
        const { data: p, error } = await supabase
          .from('users')
          .select('id,userId,name,mail,number,address,default_shipping')
          .eq('id', user.id)
          .single();
        if (!error) {
          setProfile(p || null);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.warn('loadProfile error', e);
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  // cuando el usuario elige "mi dirección", activamos el método por defecto si existe en profile
  useEffect(() => {
    if (shippingMode === 'my_address' && profile?.default_shipping) {
      // si el valor del profile no coincide con un shipping option valido, fallback al primero
      const found = SHIPPING_OPTIONS.find(o => o.key === profile.default_shipping);
      setSelectedMethod(found ? found.key : SHIPPING_OPTIONS[0].key);
    }
    // si cambias a otra dirección, dejamos el selectedMethod tal cual (el usuario puede cambiar)
  }, [shippingMode, profile]);

  // -----------------------------------------
  // Totales / descuentos (mantengo la lógica que pediste)
  // -----------------------------------------
  const itemsPrice = useMemo(() => {
    return items.reduce((acc, it) => {
      const qty = Number(it.qty || 0);
      const p0 = Number(it.price0 ?? it.price ?? 0);
      return acc + qty * p0;
    }, 0);
  }, [items]);

  const itemsDiscountsBase = itemsPrice ? itemsPrice - itemsPrice / 1.14 : 0;

  let discounts = 0;
  if (effectiveSubtotal !== null && effectiveSubtotal !== undefined) {
    const candidate = Number(effectiveSubtotal) - itemsDiscountsBase;
    const rawDiscounts = Math.max(0, itemsPrice - (isNaN(candidate) ? 0 : candidate));

    // Aplicamos el redondeo hacia arriba a la centena
    discounts = Math.ceil(rawDiscounts / 100) * 100;
  } else {
    discounts = 0;
  }

  const totalBeforeShipping = Number(Math.max(0, itemsPrice - discounts).toFixed(0));

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
      // 1) Usuario autenticado
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

      // 2) Traer perfil desde public.users usando id (UUID)
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

      // determinar address final
      let finalAddress = profileData.address || null;
      if (shippingMode === 'other') {
        if (!otherAddress || otherAddress.trim() === '') {
          setErrorOrder('Completá la dirección de envío alternativa.');
          setLoadingOrder(false);
          return;
        }
        finalAddress = otherAddress.trim();
      }

      // items payload
      const orderItems = items.map(it => ({
        productId: it.productId,
        title: it.title,
        size: it.size,
        qty: Number(it.qty),
        unitPrice: Number(it.price0 ?? it.price)
      }));

      // notas
      let notesFinal = (notes || '').toString().trim();
      const shippingNote = isToQuote
        ? `Envio: ${shippingOption?.label} (A COTIZAR).`
        : `Envio: ${shippingOption?.label} ($${shippingCost}).`;
      notesFinal = notesFinal ? `${notesFinal}\n\n${shippingNote}` : shippingNote;

      // payload (agrego shippingMethod para trazarlo)
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
  // RENDER: siempre renderizo la misma estructura
  // -----------------------------------------
  const isEmpty = !items || items.length === 0;

  return (
    <main className="cart-page">
      <section className="cart-list">
        {isEmpty ? <h2>Tu carrito está vacío</h2> : <h2>Tu carrito</h2>}

        {isEmpty ? (
          // skeleton list cuando está vacío (simula 3 items)
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
          // lista real
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
          <span className="muted-price">${itemsPrice.toFixed(0)}</span>
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
              {/* muestro método de envío que se está aplicando */}
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
