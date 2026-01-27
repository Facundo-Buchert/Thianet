// src/components/Terms.jsx
import React from "react";

/**
 * Terms & Conditions component
 * - Versión autónoma y responsive, similar al componente FAQ.
 * - Cada cláusula está en un <details> para facilitar lectura y accesibilidad.
 */

const TermsAndConditions = () => {
  return (
    <main className="terms-page" aria-labelledby="terms-title">
      <style>{`
        .terms-page {
          max-width: 980px;
          margin: 24px auto;
          padding: 20px;
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #222;
          box-sizing: border-box;
        }

        .terms-header {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          margin-bottom: 18px;
        }

        .terms-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
        }

        .terms-sub {
          margin: 0;
          color: #666;
          font-size: 0.95rem;
        }

        .terms-list {
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
          font-weight: 800;
          font-size: 1rem;
          outline: none;
        }

        summary::-webkit-details-marker { display: none; } /* hide default marker on WebKit */

        details[open] summary { color: #d90429; }

        .terms-content {
          margin-top: 12px;
          color: #333;
          line-height: 1.5;
          font-size: 0.98rem;
        }

        .terms-content p { margin: 8px 0; }
        .terms-content ul, .terms-content ol { margin: 8px 0 8px 18px; }

        .small-note { color: #666; font-size: 0.9rem; }

        @media (max-width: 620px) {
          .terms-page { padding: 14px; }
          summary { font-size: 0.98rem; }
        }
      `}</style>

      <header className="terms-header">
        <div>
          <h1 id="terms-title" className="terms-title">Términos y Condiciones</h1>
          <div className="terms-sub">Leé atentamente antes de confirmar una compra.</div>
        </div>
      </header>

      <section className="terms-list" aria-live="polite">
        <details open>
          <summary>Introducción</summary>
          <div className="terms-content">
            <p>
              Al realizar una compra a través de este sitio web, el cliente declara haber leído,
              comprendido y aceptado los presentes Términos y Condiciones.
            </p>
            <p className="small-note">
              Se recomienda además leer la sección de Preguntas Frecuentes, donde se detallan aspectos operativos del proceso de compra.
            </p>
          </div>
        </details>

        <details>
          <summary>1) ACEPTACIÓN DE LOS TÉRMINOS</summary>
          <div className="terms-content">
            <p>
              La confirmación de un pedido implica la aceptación total de los Términos y Condiciones vigentes al momento de la compra.
            </p>
          </div>
        </details>

        <details>
          <summary>2) RESPONSABILIDAD DEL CLIENTE</summary>
          <div className="terms-content">
            <p>El cliente es responsable de verificar correctamente antes de confirmar el pedido:</p>
            <ul>
              <li>Modelo seleccionado</li>
              <li>Talle elegido</li>
              <li>Datos personales y de contacto</li>
              <li>Dirección de envío</li>
            </ul>

            <p>
              La realización del pedido, así como el pago total o el pago de una seña, se consideran compromiso de compra.
            </p>

            <p>
              En los casos en que el pedido haya sido confirmado por WhatsApp y se haya abonado el total o una seña, el producto se considera solicitado especialmente para el cliente.
              Por este motivo, ante una cancelación posterior, la seña abonada no será reintegrada.
            </p>

            <p>
              Si el pedido no fue confirmado ni abonado, no se genera compromiso de compra.
            </p>

            <p>
              Una vez confirmado el pedido, no se realizan modificaciones.
            </p>
          </div>
        </details>

        <details>
          <summary>3) PEDIDOS POR ENCARGO</summary>
          <div className="terms-content">
            <p>
              Los pedidos por encargo corresponden a productos que no se encuentran en stock y se realizan exclusivamente para el cliente.
            </p>
            <p>
              La seña del 50% se toma como compromiso de compra. Una vez realizado el pedido al fabricante, el producto comienza a confeccionarse o importarse especialmente según lo solicitado.
            </p>
            <p>
              Por este motivo, los pedidos por encargo no pueden ser modificados, cancelados ni devueltos, ya que se trata de productos solicitados especialmente para el cliente.
              Solo se aceptarán cambios en caso de fallas considerables de fábrica.
            </p>
          </div>
        </details>

        <details>
          <summary>4) POLÍTICA DE CAMBIOS</summary>
          <div className="terms-content">
            <p>
              El cliente es responsable de elegir correctamente el talle. Se recomienda revisar las tablas de medidas orientativas y comparar con una prenda propia antes de realizar la compra.
            </p>
            <p>
              No se realizan cambios por talle, modelo ni por otros motivos. Cada prenda se envía específicamente según lo solicitado por el cliente y no se trabaja con stock destinado a cambios.
              Solo se aceptan cambios por fallas considerables de fábrica, no por detalles menores propios de prendas AAA.
            </p>

            <p>La falla deberá ser notificada dentro de las 48 hs de recibido el producto.</p>

            <p>Para que el cambio sea evaluado, la prenda deberá encontrarse:</p>
            <ul>
              <li>Sin uso</li>
              <li>Sin lavar</li>
              <li>Con etiquetas colocadas</li>
              <li>En su packaging original</li>
            </ul>
          </div>
        </details>

        <details>
          <summary>5) ENTREGAS NO CONCRETADAS Y NUEVOS ENVÍOS</summary>
          <div className="terms-content">
            <p>
              En caso de que el pedido no pueda ser entregado por ausencia en el domicilio, datos incorrectos, o no sea retirado a tiempo de la sucursal del correo o empresa de encomienda, el envío será considerado como entrega fallida.
            </p>
            <p>
              Si el pedido requiere un nuevo envío, el mismo deberá ser abonado nuevamente por el cliente, independientemente del método de envío utilizado originalmente.
            </p>
          </div>
        </details>

        <details>
          <summary>6) LIMITACIÓN DE RESPONSABILIDAD</summary>
          <div className="terms-content">
            <p>
              La empresa se responsabiliza únicamente por las entregas realizadas mediante mensajería privada.
              No se responsabiliza por demoras, extravíos o inconvenientes derivados del servicio de correo o empresas de encomienda, ya que estos dependen de operadores logísticos externos.
            </p>
            <p>
              Tampoco se responsabiliza por inconvenientes derivados de:
            </p>
            <ul>
              <li>Datos incorrectos proporcionados por el cliente</li>
              <li>Errores en la elección del talle o modelo</li>
            </ul>
          </div>
        </details>

        <details>
          <summary>7) CONTACTO</summary>
          <div className="terms-content">
            <p>
              Ante cualquier consulta relacionada con los Términos y Condiciones, el cliente puede comunicarse a través de:
            </p>
            <ul>
              <li><strong>Instagram:</strong> <a className="terms-link" href="https://www.instagram.com/thianet.ar/" target="_blank" rel="noopener noreferrer">@thianet.ar</a></li>
              <li><strong>WhatsApp:</strong> <a className="terms-link" href="https://api.whatsapp.com/send?phone=5491124712342" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            </ul>
          </div>
        </details>

        <details>
          <summary>8) VIGENCIA</summary>
          <div className="terms-content">
            <p>
              Los presentes Términos y Condiciones pueden ser modificados sin previo aviso y se aplican a todas las compras realizadas a través del sitio web.
            </p>
          </div>
        </details>
      </section>
    </main>
  );
};

export default TermsAndConditions;
