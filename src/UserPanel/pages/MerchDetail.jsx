// src/Path/To/MerchDetail.jsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import supabase from '../../../utils/supabase';
import { useCart } from '../../context/CartContext';
import SizeSelector from '../components/SizeSelector';
import SizeGuideModal from '../components/SizeGuideModal';
import './MerchDetail.css';

const placeholder =
  'https://via.placeholder.com/800x1000?text=Sin+imagen';

const MerchDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const openModal = (e) => {
    e.preventDefault();
    setIsSizeGuideOpen(true);
  };

  const closeModal = () => {
    setIsSizeGuideOpen(false);
  };

  useEffect(() => {
    setProduct(null);
    setSelectedImg(0);
    setSelectedSize(null);
    setQty(1);

    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error('Error fetching product:', error);
      } else {
        // ensure consistent shapes
        if (!data.img) data.img = [];
        if (!data.stockPerSize) data.stockPerSize = {};
        // ensure characteristics is an array (defensive)
        if (!Array.isArray(data.characteristics)) data.characteristics = [];
        setProduct(data);
      }
      setLoading(false);
    };

    if (id) fetchProduct();
  }, [id]);

  if (loading) return <div className="merch-loading">Cargando...</div>;
  if (!product) return null;

  const images = Array.isArray(product.img) ? product.img : [];
  const mainImage = images[selectedImg] ?? placeholder;

  const stockObj = product.stockPerSize || {};
  // stockObj values may be strings (jsonb), convert to number safely
  const sizes = Object.entries(stockObj).map(([k, v]) => [k, Number(v)]);
  const maxForSelected = selectedSize ? Number(stockObj[selectedSize] ?? 0) : 0;

  const handleQtyChange = (next) => {
    if (!selectedSize) return setQty(1);
    const max = Math.max(1, maxForSelected);
    if (next < 1) return setQty(1);
    if (next > max) return setQty(max);
    setQty(next);
  };

  const addToCart = () => {
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
          <div
            className="main-image"
            role="img"
            aria-label={product.title}
            style={{ backgroundImage: `url(${mainImage})` }}
          />

          <div className="thumbs" role="tablist" aria-label="Miniaturas">
            {/* always show up to 4 thumbs horizontally */}
            {images.length === 0 ? (
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
                    // reset focus a la imagen
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
        <div className="info">
          <div className="info-top">
            <h1 className="title">{product.title}</h1>

            <div className="meta">
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">{product.price}</span>
              </div>
              <div className="price0">
                <span className="currency">$</span>
                <span className="amount">{product.price0}</span>
              </div>
              <div className="points">¡Podes ganar hasta <span className="points-amount">{Math.round((product.price0 ?? 0) / 100)}</span> puntos!</div>
            </div>

            {/* optional rating placeholder */}
            {/*<div className="rating">
              <div className="stars" aria-hidden="true">★★★★★</div>
              <div className="reviews">124 opiniones</div>
            </div>*/}
          </div>

          <p className="description">{product.description}</p>

          <hr />

          {/* Talles */}
          <div className="sizes-block">
            <div className="sizes-header">
              <h4>Selecciona tu talla</h4>
              <button onClick={openModal} className="size-guide" type="button">Guía de talles</button>
              <SizeGuideModal isOpen={isSizeGuideOpen} onClose={closeModal} />
            </div>

            <div className="size-grid">
              {sizes.length === 0 && <div className="no-sizes">Sin talles</div>}
              {sizes.map(([size, stock]) => {
                const disabled = stock <= 0;
                return (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => !disabled && setSelectedSize(size)}
                    disabled={disabled}
                    aria-pressed={selectedSize === size}
                  >
                    {size}
                    {disabled && <span className="sr-only"> (Agotado)</span>}
                  </button>
                );
              })}
            </div>

            {selectedSize && (
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
              <button
                onClick={() => handleQtyChange(qty - 1)}
                aria-label="Disminuir cantidad"
              >−</button>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => handleQtyChange(Number(e.target.value || 1))}
                aria-label="Cantidad"
              />
              <button
                onClick={() => handleQtyChange(qty + 1)}
                aria-label="Aumentar cantidad"
              >+</button>
            </div>

            <button
              className="add-btn"
              onClick={addToCart}
              disabled={!selectedSize || maxForSelected <= 0}
              aria-disabled={!selectedSize || maxForSelected <= 0}
            >
              <span className="cart-icon">🛒</span>
              Añadir al carrito
            </button>
          </div>

          {/* detalles colapsables */}
          <div className="details">
            <details open>
              <summary>Características</summary>

              {/* usa product.characteristics (array de textos) */}
              {Array.isArray(product.characteristics) && product.characteristics.length > 0 ? (
                <ul className="characteristics-list">
                  {product.characteristics.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              ) : (
                <div className="muted">Sin características</div>
              )}

            </details>

            <br />

            <details>
              <summary>Envíos y Devoluciones</summary>
              <p>Envío y devoluciones según política.</p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MerchDetail;
