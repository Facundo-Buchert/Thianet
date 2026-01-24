// Footer.jsx
import React, { useState } from "react";
import "./Footer.css";
import { HashLink } from "react-router-hash-link";
import { Link } from "react-router-dom";
import SizeGuideModal from "./SizeGuideModal.jsx";

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
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo" aria-hidden="false">
            <span className="footer-title">THIANET</span>
            <span className="footer-dot">.</span>
          </div>
          <p className="footer-text">
            Las mejores camisetas importadas. Sumá puntos con tus compras.
          </p>
        </div>

        <nav className="footer-column" aria-label="Tienda">
          <h4>Shop</h4>
          <ul>
            <li>
              <Link to="/catalogo">Catálogo</Link>
            </li>
            <li>
              <Link to="/preguntas-frecuentes">Preguntas frecuentes</Link>
            </li>
            <li>
              <Link to="/terminos-y-condiciones">Términos y condiciones</Link>
            </li>
            <li>
              <a
                href="https://www.instagram.com/thianet.ar/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </li>
          </ul>
        </nav>

        <div className="footer-column" aria-label="Ayuda">
          <h4>Ayuda</h4>
          <ul>
            <li>
              {/* usar button para acciones que no navegan */}
              <button className="link-style" onClick={openModal}>
                Guía de talles
              </button>
              <SizeGuideModal isOpen={isSizeGuideOpen} onClose={closeModal} />
            </li>
            <li>
              <HashLink smooth to="/terminos-y-condiciones#policy-of-changes">
                Política de cambios
              </HashLink>
            </li>
            <li>
              <a
                href="https://api.whatsapp.com/send?phone=5491124712342"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contactanos
              </a>
            </li>
          </ul>
        </div>

        <form
          className="footer-column footer-form-col"
          action="https://formspree.io/f/mbddrgqq"
          method="POST"
        >
          <h4>Unite como reseller</h4>
          <p>¿Querés revender? Dejanos tu email y te contamos cómo.</p>

          <label className="footer-form" htmlFor="reseller-email">
            <input
              id="reseller-email"
              type="email"
              name="email"
              placeholder="tu@email.com"
              required
              aria-label="Email para revendedor"
            />
            {/* campo oculto con defaultValue para evitar controlled value warnings */}
            <textarea
              name="message"
              className="display-none"
              defaultValue="Quiero ser revendedor, contactame."
            />
            <button type="submit" className="btn-primary">
              Unite
            </button>
          </label>
        </form>
      </div>

      <div className="footer-bottom" aria-hidden="false">
        © 2026 THIANET. All rights reserved. No online payment required for
        reservation.
      </div>
    </footer>
  );
};

export default Footer;
