// src/UserPanel/components/MerchCard.jsx

import { useNavigate } from 'react-router-dom';
import "./MerchCard.css";

export const MerchCard = ({ product }) => {

  const image = product.img?.[0]; // primera imagen del array

  const navigate = useNavigate();

  return (
    <div className="card" onClick={() => navigate(`/merch/${product.id}`)}>
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
          <span className="Price">${product.price}</span>
          <span className="Price0">${product.price0}</span>
          {/*<button className="btn-small">Ver más</button>*/}
        </div>
      </div>
    </div>
  );
};
