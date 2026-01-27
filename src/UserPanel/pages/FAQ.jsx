// src/components/FAQ.jsx
import React from "react";

/**
 * FAQ component (Preguntas frecuentes)
 *
 * - Archivo autónomo: incluye estilos mínimos embebidos para que sea responsive.
 * - Usa <details>/<summary> para accesibilidad y comportamiento colapsable nativo.
 * - Texto y estructura respetan el contenido que suministraste.
 */

const FAQ = () => {
  return (
    <main className="faq-page" aria-labelledby="faq-title">
      <style>{`
        .faq-page {
          max-width: 980px;
          margin: 24px auto;
          padding: 20px;
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #222;
          box-sizing: border-box;
        }

        .faq-header {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          margin-bottom: 18px;
        }

        .faq-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
        }

        .faq-sub {
          margin: 0;
          color: #666;
          font-size: 0.95rem;
        }

        .faq-list {
          display: grid;
          gap: 10px;
          margin-top: 12px;
        }

        details {
          background: #fff;
          border: 1px solid #eee;
          padding: 14px 16px;
          border-radius: 10px;
          box-shadow: 0 6px 18px rgba(0,0,0,0.03);
        }

        summary {
          cursor: pointer;
          list-style: none;
          font-weight: 700;
          font-size: 1rem;
          outline: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        summary::-webkit-details-marker { display: none; } /* hide default marker on WebKit */

        details[open] summary {
          color: #d90429;
        }

        .faq-content {
          margin-top: 12px;
          color: #333;
          line-height: 1.5;
          font-size: 0.97rem;
        }

        .faq-content p { margin: 8px 0; }

        .faq-content ul, .faq-content ol {
          margin: 8px 0 8px 18px;
        }

        .small-note {
          color: #666;
          font-size: 0.9rem;
        }

        a.faq-link {
          color: #d90429;
          text-decoration: none;
        }

        a.faq-link:hover, a.faq-link:focus {
          text-decoration: underline;
        }

        @media (max-width: 620px) {
          .faq-page { padding: 14px; }
          summary { font-size: 0.98rem; }
        }
      `}</style>

      <header className="faq-header">
        <div>
          <h1 id="faq-title" className="faq-title">Preguntas frecuentes</h1>
          <div className="faq-sub">Respuestas rápidas sobre pedidos, envíos, talles y contacto.</div>
        </div>
      </header>

      <section className="faq-list" aria-live="polite">
        <details>
          <summary>1) ¿CÓMO PUEDO REALIZAR UN PEDIDO?</summary>
          <div className="faq-content">
            <p>
              Seleccioná en la web los ítems que querés, elegí bien el talle y destino de envío.
              Asegurate de dejar correctamente tu email y número de WhatsApp: por ahí te contactamos para confirmar y cerrar la compra.
            </p>
            <p>Tambi&eacute;n podés escribirnos directamente por:</p>
            <ul>
              <li><a className="faq-link" href="https://api.whatsapp.com/send?phone=5491124712342" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
              <li><a className="faq-link" href="https://www.instagram.com/thianet.ar/" target="_blank" rel="noopener noreferrer">Instagram (@thianet.ar)</a></li>
            </ul>
          </div>
        </details>

        <details>
          <summary>2) ¿QUÉ MEDIOS DE PAGO ACEPTAN?</summary>
          <div className="faq-content">
            <p>Aceptamos:</p>
            <ul>
              <li>Transferencia bancaria (100% al momento del pedido).</li>
              <li>Pago mixto: 10% por transferencia y el resto en efectivo al recibir. (Disponible solo para CABA, GBA 1 y GBA 2).</li>
              <li>Link de pago (al precio de lista, sin promociones).</li>
            </ul>
            <p className="small-note">Ante cualquier duda puntual, escribinos y te lo confirmamos.</p>
          </div>
        </details>

        <details>
          <summary>3) ¿CÓMO SON LOS PRECIOS?</summary>
          <div className="faq-content">
            <p>En el listado de stock vas a encontrar todos los precios y las promos por cantidad. El carrito ajusta automáticamente los valores según:</p>
            <ul>
              <li>1 unidad</li>
              <li>3 a 9 unidades</li>
              <li>10 unidades o más</li>
            </ul>
            <p>Las membresías “Team +10” de momento se gestionan únicamente por WhatsApp y tienen cupos limitados.</p>
            <p>Los pedidos por encargo se cotizan en dólares, según la prenda.</p>
          </div>
        </details>

        <details>
          <summary>4) ¿HACEN VENTA MAYORISTA?</summary>
          <div className="faq-content">
            <p>Sí. Contamos con descuentos por cantidad que se reflejan directamente en el carrito.</p>
            <p>Si te interesa acceder a la membresía paga, escribinos por WhatsApp con el mensaje: <strong>“Quiero suscribirme a la membresía”</strong>.</p>
          </div>
        </details>

        <details>
          <summary>5) ¿CUÁNTO TIEMPO DEMORA EN LLEGAR MI PEDIDO? ¿REALIZAN ENVÍOS A TODO EL PAÍS?</summary>
          <div className="faq-content">
            <p>Realizamos envíos a toda la Argentina.</p>
            <ul>
              <li><strong>CABA y GBA:</strong> hasta 48 hs hábiles. Entregas de lunes a viernes de 16 a 22 hs.</li>
              <li><strong>Interior del país:</strong> despachamos dentro de ese mismo plazo; luego se suma el tiempo del correo (2 a 9 días hábiles según la localidad).</li>
            </ul>
            <p className="small-note">Los costos de envío pueden variar según tarifas vigentes.</p>
          </div>
        </details>

        <details>
          <summary>6) ¿SE PUEDE RETIRAR PERSONALMENTE?</summary>
          <div className="faq-content">
            <p>De momento no contamos con punto de retiro. Realizamos únicamente envíos a domicilio.</p>
          </div>
        </details>

        <details>
          <summary>7) ¿CÓMO ELIJO MI TALLE?</summary>
          <div className="faq-content">
            <p>Podés revisar las tablas orientativas de talles disponibles en cada prenda, con medidas aproximadas para ayudarte a elegir. Recomendamos chequear las medidas con una prenda que te quede bien, ya que no se realizan cambios por talle.</p>
          </div>
        </details>

        <details>
          <summary>8) ¿PUEDO PERSONALIZAR MI PRENDA CON NOMBRE Y/O NÚMERO?</summary>
          <div className="faq-content">
            <p>No realizamos personalizaciones sobre prendas en stock.</p>
            <p>Si querés una prenda personalizada, podés hacerlo mediante la opción “Pedido por Encargo”.</p>
          </div>
        </details>

        <details>
          <summary>9) ¿CÓMO FUNCIONA EL PEDIDO POR ENCARGO?</summary>
          <div className="faq-content">
            <p>El pedido por encargo permite traer prendas que no están en stock, ya sea por talle, modelo o personalización específica.</p>
            <ul>
              <li>Se abona una seña del 50%.</li>
              <li>Se realiza el pedido al fabricante.</li>
              <li>La prenda se importa y se confecciona especialmente para vos.</li>
            </ul>
            <p className="small-note">⏳ Al tratarse de una prenda personalizada e importada, el plazo estimado es de 50 a 70 días.</p>
          </div>
        </details>

        <details>
          <summary>10) ¿CUÁL ES LA POLÍTICA DE CAMBIOS O DEVOLUCIONES?</summary>
          <div className="faq-content">
            <p>Trabajamos con prendas de excelente calidad y revisamos cada envío antes de despachar.</p>
            <p>Si recibís una prenda defectuosa o incorrecta, escribinos dentro de las 24 hs hábiles posteriores a la recepción y lo resolvemos.</p>
            <p className="small-note">⚠️ Importante: No realizamos cambios por talle o modelo. Al ser prendas AAA, pueden existir detalles menores que no se consideran falla y no habilitan cambio.</p>
          </div>
        </details>

        <details>
          <summary>11) ¿CÓMO DEBO LAVAR Y GUARDAR MIS PRENDAS?</summary>
          <div className="faq-content">
            <ol>
              <li>Lavarlas por el revés y con agua fría.</li>
              <li>NUNCA meterlas en la secadora. (Esto daña estampados.)</li>
              <li>Preferentemente lavar a mano en un recipiente grande (usar poco jabón).</li>
              <li>Al secar al aire, evitar sol directo para conservar color y estampados.</li>
              <li>Para coleccionistas: un lavado cada 9 meses es una buena práctica.</li>
              <li>Si las camisetas tienen nombre/número, lo ideal es guardarlas colgadas; dobladas pueden dañarse más.</li>
            </ol>
          </div>
        </details>

        <details>
          <summary>12) ¿CÓMO PUEDO CONTACTARLOS?</summary>
          <div className="faq-content">
            <p>Podés escribirnos por:</p>
            <ul>
              <li><a className="faq-link" href="https://www.instagram.com/thianet.ar/" target="_blank" rel="noopener noreferrer">Instagram @thianet.ar</a></li>
              <li><a className="faq-link" href="https://api.whatsapp.com/send?phone=5491124712342" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            </ul>
            <p>Respondemos lo antes posible.</p>
          </div>
        </details>
      </section>
    </main>
  );
};

export default FAQ;
