import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import supabase from '../../../utils/supabase';
import { useCart } from '../../context/CartContext';
import SizeGuideModal from '../components/SizeGuideModal';
import './MerchDetail.css';

const placeholder = 'https://via.placeholder.com/800x1000?text=Sin+imagen';

export default function MerchDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  useEffect(() => {
    setProduct(null);
    setSelectedImg(0);
    setSelectedSize(null);
    setQty(1);

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
          setProduct(null);
        } else {
          if (!Array.isArray(data.img)) data.img = Array.isArray(data.img) ? data.img : [];
          if (!data.stockPerSize || typeof data.stockPerSize !== 'object') data.stockPerSize = {};
          if (!Array.isArray(data.characteristics)) data.characteristics = [];
          setProduct(data);
        }
      } catch (e) {
        console.error('Exception fetching product:', e);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  // Mostrar skeleton cuando carga o no hay producto aún
  const isLoading = loading || !product;

  const images = Array.isArray(product?.img) ? product.img : [];
  const mainImage = !isLoading ? (images[selectedImg] ?? placeholder) : null;

  const stockObj = product?.stockPerSize || {};
  const sizes = Object.entries(stockObj).map(([k, v]) => [k, Number(v)]);
  const maxForSelected = selectedSize ? Number(stockObj[selectedSize] ?? 0) : 0;

  const openModal = (e) => { e?.preventDefault?.(); setIsSizeGuideOpen(true); };
  const closeModal = () => setIsSizeGuideOpen(false);

  const handleQtyChange = (next) => {
    if (!selectedSize) return setQty(1);
    const max = Math.max(1, maxForSelected);
    if (next < 1) return setQty(1);
    if (next > max) return setQty(max);
    setQty(next);
  };

  const addToCart = () => {
    if (isLoading) return;
    if (!selectedSize) return;
    const available = Number(product.stockPerSize?.[selectedSize] ?? 0);
    addItem({
      productId: product.id,
      title: product.title,
      img: product.img?.[0],
      size: selectedSize,
      qty,
      price: Number(product.price ?? 0),
      price1: product.price1 !== undefined ? Number(product.price1) : undefined,
      price2: product.price2 !== undefined ? Number(product.price2) : undefined,
      maxStock: available,
    });
  };

  return (
    <main className="merch-detail">
      <div className="detail-grid">
        {/* LEFT: galería */}
        <div className="images">
          {isLoading ? (
            <div className="main-image skeleton-box" />
          ) : (
            <div
              className="main-image"
              role="img"
              aria-label={product.title}
              style={{ backgroundImage: `url(${mainImage})` }}
            />
          )}

          <div className="thumbs" role="tablist" aria-label="Miniaturas">
            {isLoading ? (
              // 4 thumbs skeleton
              [0,1,2,3].map(i => <div className="thumb skeleton-box" key={i} />)
            ) : images.length === 0 ? (
              <button
                className="thumb active"
                style={{ backgroundImage: `url(${placeholder})` }}
                aria-selected="true"
                onClick={() => setSelectedImg(0)}
              />
            ) : (
              images.map((img, i) => (
                <button
                  key={i}
                  className={`thumb ${i === selectedImg ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedImg(i);
                    const el = document.querySelector('.main-image');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  aria-selected={i === selectedImg}
                  style={{ backgroundImage: `url(${img})` }}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT: info */}
        <div className={`info ${isLoading ? 'skeleton' : ''}`}>
          <div className="info-top">
            {isLoading ? (
              <div className="skeleton-line title" style={{ width: '60%', height: 28 }} />
            ) : (
              <h1 className="title">{product.title}</h1>
            )}

            <div className="meta">
              {isLoading ? (
                <>
                  <div className="skeleton-line" style={{ width: 80, height: 18 }} />
                  <div className="skeleton-line" style={{ width: 140, height: 28 }} />
                </>
              ) : (
                <>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">{product.price}</span>
                  </div>
                  <div className="price0">
                    <span className="currency">$</span>
                    <span className="amount">{product.price0}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="skeleton-line" style={{ height: 56, width: '100%', marginTop: 12 }} />
          ) : (
            <p className="description">{product.description}</p>
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
              <SizeGuideModal isOpen={isSizeGuideOpen} onClose={closeModal} />
            </div>

            <div className="size-grid">
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
                    >
                      {size}
                      {disabled && <span className="sr-only"> (Agotado)</span>}
                    </button>
                  );
                })
              )}
            </div>

            {selectedSize && !isLoading && (
              <p className="stock-note">
                {maxForSelected > 0 ? (
                  maxForSelected >= 3 ? (
                    maxForSelected > 10 ? (
                      <span></span>
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
              <button onClick={() => handleQtyChange(qty - 1)} aria-label="Disminuir cantidad" disabled={isLoading}>−</button>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => handleQtyChange(Number(e.target.value || 1))}
                aria-label="Cantidad"
                disabled={isLoading}
              />
              <button onClick={() => handleQtyChange(qty + 1)} aria-label="Aumentar cantidad" disabled={isLoading}>+</button>
            </div>

            <button
              className="add-btn"
              onClick={addToCart}
              disabled={isLoading || !selectedSize || maxForSelected <= 0}
              aria-disabled={isLoading || !selectedSize || maxForSelected <= 0}
            >
              <span className="cart-icon">🛒</span>
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

            <br />

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
