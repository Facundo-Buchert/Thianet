// src/UserPanel/components/MerchCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./MerchCard.css";

export const MerchCard = ({ product }) => {
  const image = product.img?.[0] ?? null;
  const placeholder = "https://via.placeholder.com/800x1000?text=Sin+imagen";
  const price = Number(product.price || 0);
  const price0 = Number(product.price0 || 0);

  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

  return (
    <article className="card" aria-labelledby={`card-title-${product.id}`}>
      <Link
        to={`/merch/${product.id}`}
        className="card-link"
        aria-label={`Ver producto ${product.title}`}
      >
        <div className="card-media" role="img" aria-hidden="true">
          {/* img con lazy + decoding para mejor LCP y menor CLS (container con aspect-ratio fija) */}
          <img
            src={image ?? placeholder}
            alt={product.title ?? "Producto"}
            loading="lazy"
            decoding="async"
            width="800"
            height="1000"
          />
        </div>

        <div className="card-body">
          <div>
            <h4 id={`card-title-${product.id}`} className="card-title">
              {product.title}
            </h4>
            <p className="card-meta">{product.isTrending ? "Trending" : "Producto"}</p>
          </div>

          <div className="card-footer">
            <span className="Price">{formatter.format(price)}</span>
            <span className="Price0">{formatter.format(price0)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default MerchCard;
