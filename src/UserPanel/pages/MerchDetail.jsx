// src/UserPanel/pages/MerchDetail.jsx
import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import supabase from '../../../utils/supabase';
import { useCart } from '../../context/CartContext';
import SizeGuideModal from '../components/SizeGuideModal';
import './MerchDetail.css';

const PLACEHOLDER = 'https://via.placeholder.com/800x1000?text=Sin+imagen';

export default function MerchDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const mainImgRef = useRef(null);
  const thumbsRef = useRef(null);

  // Fetch product
  useEffect(() => {
    setProduct(null);
    setSelectedImg(0);
    setSelectedSize(null);
    setQty(1);

    if (!id) return;

    let mounted = true;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching product:', error);
          if (mounted) setProduct(null);
        } else {
          // ensure shapes
          data.img = Array.isArray(data.img) ? data.img : [];
          data.stockPerSize = typeof data.stockPerSize === 'object' && data.stockPerSize !== null ? data.stockPerSize : {};
          data.characteristics = Array.isArray(data.characteristics) ? data.characteristics : [];
          if (mounted) setProduct(data);
        }
      } catch (e) {
        console.error('Exception fetching product:', e);
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => { mounted = false; };
  }, [id]);

  const isLoading = loading || !product;

  const images = Array.isArray(product?.img) ? product.img : [];
  const mainImage = !isLoading ? (images[selectedImg] ?? PLACEHOLDER) : PLACEHOLDER;

  const stockObj = product?.stockPerSize || {};
  const sizes = Object.entries(stockObj).map(([k, v]) => [k, Number(v)]);
  const maxForSelected = selectedSize ? Number(stockObj[selectedSize] ?? 0) : 0;

  const openModal = (e) => { e?.preventDefault?.(); setIsSizeGuideOpen(true); };
  const closeModal = () => setIsSizeGuideOpen(false);

  const garmentType = product?.garmentType || '';

  // quantity control with bounds
  const handleQtyChange = (next) => {
    if (!selectedSize) return setQty(1);
    const max = Math.max(1, maxForSelected);
    if (Number.isNaN(next)) return;
    const val = Math.max(1, Math.min(max, Number(next)));
    setQty(val);
  };

  const addToCart = () => {
    if (isLoading) return;
    if (!selectedSize) return;
    const available = Number(product.stockPerSize?.[selectedSize] ?? 0);
    if (available <= 0) return;
    addItem({
      productId: product.id,
      title: product.title,
      img: product.img?.[0] ?? PLACEHOLDER,
      size: selectedSize,
      qty,
      price: Number(product.price ?? 0),
      price0: product.price0 !== undefined ? Number(product.price0) : undefined,
      price1: product.price1 !== undefined ? Number(product.price1) : undefined,
      price2: product.price2 !== undefined ? Number(product.price2) : undefined,
      maxStock: available,
    });
  };

  // scroll main image into view when selectedImg changes
  useEffect(() => {
    const el = mainImgRef.current;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedImg]);

  return (
    <main className="merch-detail" role="main">
      <div className="detail-grid">
        {/* LEFT: galería */}
        <div className="images" aria-hidden={isLoading ? "true" : "false"}>
          {isLoading ? (
            <div className="main-image skeleton-box" />
          ) : (
            <figure className="main-image" ref={mainImgRef}>
              {/* preferimos eager para LCP en la imagen principal */}
              <img
                src={mainImage}
                alt={product.title ?? "Producto"}
                loading={selectedImg === 0 ? 'eager' : 'lazy'}
                decoding="async"
                width="800"
                height="1000"
              />
            </figure>
          )}

          <div
            className="merchDetailThumbs"
            role="tablist"
            aria-label="Miniaturas"
            ref={thumbsRef}
          >
            {isLoading ? (
              [0,1,2,3].map(i => <div className="merchDetailThumb skeleton-box" key={i} />)
            ) : images.length === 0 ? (
              <button
                className="merchDetailThumb active"
                style={{ backgroundImage: `url(${PLACEHOLDER})` }}
                aria-selected="true"
                onClick={() => setSelectedImg(0)}
              />
            ) : (
              images.map((img, i) => (
                <button
                  key={i}
                  className={`merchDetailThumb ${i === selectedImg ? 'active' : ''}`}
                  onClick={() => setSelectedImg(i)}
                  aria-selected={i === selectedImg}
                  aria-label={`Ver imagen ${i + 1}`}
                  style={{ backgroundImage: `url(${img})` }}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT: info */}
        <div className={`info ${isLoading ? 'skeleton' : ''}`} aria-busy={isLoading}>
          <div className="info-top">
            {isLoading ? (
              <div className="skeleton-line title" style={{ width: '60%', height: 28 }} />
            ) : (
              <h1 className="title">{product.title}</h1>
            )}

            <div className="meta" aria-hidden={isLoading}>
              {isLoading ? (
                <>
                  <div className="skeleton-line" style={{ width: 80, height: 18 }} />
                  <div className="skeleton-line" style={{ width: 140, height: 28 }} />
                </>
              ) : (
                <>
                  <div className="price" aria-label="Precio anterior">
                    <span className="currency">$</span>
                    <span className="amount">{product.price ?? ''}</span>
                  </div>
                  <div className="price0" aria-label="Precio actual">
                    <span className="currency">$</span>
                    <span className="amount">{product.price0}</span>
                  </div>
                  <div className="points">¡Podes ganar hasta <span className="points-amount">{Math.round((product.price0 ?? 0) / 100)}</span> puntos!</div>
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="skeleton-line" style={{ height: 56, width: '100%', marginTop: 12 }} />
          ) : (
            <p className="description">{product.description}</p>
          )}

          {isLoading ? (
            <div className="skeleton-line" style={{ height: 12, width: '100%', marginTop: 12 }} />
          ) : (
            <p className="description">
              <strong>PROMOS CANTIDAD:</strong><br/>
              Teniendo en el carrito en total:<br/>
              - 3 a 9 productos: el valor de esta prenda queda en ${product.price1} c/u.<br/>
              - 10 o más productos: queda en ${product.price2} c/u.
            </p>
          )}

          <hr />

          {/* Talles */}
          <div className="sizes-block">
            <div className="sizes-header">
              {isLoading ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="skeleton-line" style={{ width: 160, height: 20 }} />
                  <div className="skeleton-line" style={{ width: 80, height: 28 }} />
                </div>
              ) : (
                <>
                  <h4>Selecciona tu talla</h4>
                  <button onClick={openModal} className="size-guide" type="button">Guía de talles</button>
                </>
              )}
              <SizeGuideModal isOpen={isSizeGuideOpen} onClose={closeModal} garmentType={garmentType}/>
            </div>

            <div className="size-grid" role="radiogroup" aria-label="Tallas disponibles">
              {isLoading ? (
                [0,1,2,3].map(i => <div key={i} className="size-btn skeleton-box" style={{ height: 44, width: 80 }} />)
              ) : sizes.length === 0 ? (
                <div className="no-sizes">Sin talles</div>
              ) : (
                sizes.map(([size, stock]) => {
                  const disabled = stock <= 0;
                  return (
                    <button
                      key={size}
                      className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => !disabled && setSelectedSize(size)}
                      disabled={disabled || isLoading}
                      aria-pressed={selectedSize === size}
                      aria-label={`${size} ${disabled ? 'agotado' : `${stock} disponibles`}`}
                      type="button"
                    >
                      <span className="size-label">{size}</span>
                      {disabled && <span className="sr-only"> (Agotado)</span>}
                    </button>
                  );
                })
              )}
            </div>

            {selectedSize && !isLoading && (
              <p className="stock-note" aria-live="polite">
                {maxForSelected > 0 ? (
                  maxForSelected >= 3 ? (
                    maxForSelected > 10 ? (
                      <span>Stock suficiente</span>
                    ) : (
                      <span>Quedan {maxForSelected} unidades en talla {selectedSize}.</span>
                    )
                  ) : (
                    <span className="low">¡Solo quedan {maxForSelected} unidades en talla {selectedSize}!</span>
                  )
                ) : (
                  <span className="out">Talle sin stock</span>
                )}
              </p>
            )}
          </div>

          {/* cantidad + CTA */}
          <div className="actions-row">
            <div className="qty-control" aria-label="Cantidad">
              <button
                onClick={() => handleQtyChange(qty - 1)}
                aria-label="Disminuir cantidad"
                disabled={isLoading}
                type="button"
              >−</button>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => handleQtyChange(Number(e.target.value || 1))}
                aria-label="Cantidad"
                disabled={isLoading}
              />
              <button
                onClick={() => handleQtyChange(qty + 1)}
                aria-label="Aumentar cantidad"
                disabled={isLoading}
                type="button"
              >+</button>
            </div>

            <button
              className="add-btn"
              onClick={addToCart}
              disabled={isLoading || !selectedSize || maxForSelected <= 0}
              aria-disabled={isLoading || !selectedSize || maxForSelected <= 0}
            >
              <span className="cart-icon" aria-hidden="true">🛒</span>
              {isLoading ? 'Cargando...' : 'Añadir al carrito'}
            </button>
          </div>

          {/* detalles colapsables */}
          <div className="details">
            <details open>
              <summary>Características</summary>

              {isLoading ? (
                <>
                  <div className="skeleton-line" style={{ height: 14, width: '70%' }} />
                  <div className="skeleton-line" style={{ height: 14, width: '50%' }} />
                </>
              ) : (
                Array.isArray(product.characteristics) && product.characteristics.length > 0 ? (
                  <ul className="characteristics-list">
                    {product.characteristics.map((c, idx) => <li key={idx}>{c}</li>)}
                  </ul>
                ) : (
                  <div className="muted">Sin características</div>
                )
              )}
            </details>

            <details>
              <summary>Envíos y devoluciones</summary>
              <p>Envío y devoluciones según política.</p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
