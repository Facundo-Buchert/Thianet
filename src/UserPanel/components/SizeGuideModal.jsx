// src/components/SizeGuideModal.jsx
import { useEffect, useRef } from "react";
import "./SizeGuideModal.css";

export default function SizeGuideModal({ isOpen, onClose }) {
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // bloquear scroll
      document.body.style.overflow = "hidden";
      // guardar foco previo
      previouslyFocusedRef.current = document.activeElement;
      // setear foco al modal (close button)
      const focusable = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length) {
        focusable[0].focus();
      }

      const onKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        } else if (e.key === "Tab") {
          // trap focus
          const nodes = Array.from(focusable || []);
          if (nodes.length === 0) return;
          const first = nodes[0];
          const last = nodes[nodes.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("keydown", onKey);
      };
    }

    // cleanup when closing
    return () => {};
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      // restaurar scroll y foco si el componente se desmonta
      document.body.style.overflow = "";
      if (previouslyFocusedRef.current && previouslyFocusedRef.current.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        // cerrar si clic afuera (mousedown para evitar issues con focus)
        if (e.target === overlayRef.current) onClose();
      }}
      ref={overlayRef}
      aria-hidden={!isOpen}
    >
      <div
        className="modal-container"
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sizeguide-title"
        aria-describedby="sizeguide-desc"
        onMouseDown={(e) => e.stopPropagation()} /* evitar cierre al clicar dentro */
      >
        <div className="modal-header">
          <div>
            <h2 id="sizeguide-title">Guía de talles</h2>
            <p className="subtitle">Encuentra tu ajuste perfecto</p>
          </div>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Cerrar guía de talles"
          >
            ×
          </button>
        </div>

        <div className="modal-content" id="sizeguide-desc">
          <div className="left-panel">
            <div className="tip-box" tabIndex={-1}>
              <strong>Tip pro:</strong>
              <p>
                Toma una camiseta que te quede bien, colócala sobre una superficie
                plana y mide siguiendo el diagrama.
              </p>
            </div>

            <div className="shirt-diagram" aria-hidden="false">
              <img
                src="https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/Captura%20(1).png"
                alt="Diagrama de medición: A = Ancho (Pecho), B = Largo total"
                loading="lazy"
                width="600"
                height="400"
              />
              <div className="legend" aria-hidden="true">
                <span><b>A</b>: Ancho (Pecho)</span>
                <span><b>B</b>: Largo total</span>
              </div>
            </div>
          </div>

          <div className="right-panel">
            <h3>Tabla de medidas</h3>

            <div className="table-wrap" role="table" aria-label="Tabla de talles">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Talla</th>
                    <th scope="col">Ancho (A)</th>
                    <th scope="col">Largo (B)</th>
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
            </div>

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
