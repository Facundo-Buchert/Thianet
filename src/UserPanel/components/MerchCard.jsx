// src/UserPanel/components/MerchCard.jsx

import "./MerchCard.css";

export const MerchCard = ({ product }) => {
  const image = product.img?.[0]; // primera imagen del array

  return (
    <div className="card">
      <div
        className="card-img"
        style={{
          backgroundImage: image ? `url(${image})` : undefined,
        }}
      />
      <div className="card-body">
        <h4>{product.title}</h4>
        <p>{product.isTrending ? "Trending" : "Producto"}</p>
        <div className="card-footer">
          <span className="price">${product.price}</span>
          <button className="btn-small">Agregar</button>
        </div>
      </div>
    </div>
  );
};
