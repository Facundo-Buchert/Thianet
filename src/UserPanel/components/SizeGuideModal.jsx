import { useEffect } from "react";
import "./SizeGuideModal.css";

export default function SizeGuideModal({ isOpen, onClose }) {

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => {e.stopPropagation();}}>
        <div className="modal-header">
          <div>
            <h2>Guía de talles</h2>
            <p className="subtitle">Encuentra tu ajuste perfecto</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="left-panel">
            <div className="tip-box">
              <strong>Tip pro:</strong>
              <p>
                Toma una camiseta que te quede bien, colócala sobre una superficie
                plana y mide siguiendo el diagrama.
              </p>
            </div>

            <div className="shirt-diagram">
              <img src="https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/Captura%20(1).png" alt="Guía de medición" />
              <div className="legend">
                <span><b>A</b>: Ancho (Pecho)</span>
                <span><b>B</b>: Largo total</span>
              </div>
            </div>
          </div>

          <div className="right-panel">
            <h3>Tabla de medidas</h3>

            <table>
              <thead>
                <tr>
                  <th>Talla</th>
                  <th>Ancho (A)</th>
                  <th>Largo (B)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>S</td><td>48 cm</td><td>70 cm</td></tr>
                <tr><td>M</td><td>50 cm</td><td>72 cm</td></tr>
                <tr><td>L</td><td>52 cm</td><td>74 cm</td></tr>
                <tr><td>XL</td><td>54 cm</td><td>76 cm</td></tr>
                <tr><td>XXL</td><td>56 cm</td><td>78 cm</td></tr>
                <tr><td>XXXL</td><td>58 cm</td><td>80 cm</td></tr>
              </tbody>
            </table>

            <p className="note">
              * Las medidas pueden variar +/- 1 cm debido al proceso de confección.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="confirm-btn" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
