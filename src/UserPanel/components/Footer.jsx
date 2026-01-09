import "./Footer.css";
import "./SizeGuideModal.jsx"
import { HashLink } from 'react-router-hash-link';
import { Link } from 'react-router-dom';
import SizeGuideModal from "./SizeGuideModal.jsx";

import { useState } from "react";

export const Footer = () => {
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const openModal = (e) => {
    e.preventDefault();
    setIsSizeGuideOpen(true);
  };

  const closeModal = () => {
    setIsSizeGuideOpen(false);
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-title">THIANET</span><span className="footer-dot">.</span>
          </div>
          <p className="footer-text">
            Las mejores camisetas importadas. Sumá puntos con tus compras.
          </p>
        </div>

        <div className="footer-column">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/preguntas-frecuentes">Preguntas Frecuentes</Link></li>
            <li><Link to="/terminos-y-condiciones">Terminos y Condiciones</Link></li>
            <li><a href="https://www.instagram.com/thianet.ar/" target="blank">Instagram</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Ayuda</h4>
          <ul>
            <li><a onClick={openModal}>Guía de talles</a></li>
            <SizeGuideModal isOpen={isSizeGuideOpen} onClose={closeModal} />
            <li><HashLink smooth to="/terminos-y-condiciones#policy-of-changes">Política de cambios</HashLink></li>
            <li><a href="https://api.whatsapp.com/send?phone=5491124712342" target="blank">Contactanos</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Unite como reseller</h4>
          <p>¿Querés revender? Dejanos tu email y te contamos cómo.</p>
          <div className="footer-form">
            <input type="email" placeholder="Tu email" />
            <button>Unite</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 THIANET. All rights reserved. No online payment required for reservation.
      </div>
    </footer>
  );
}
