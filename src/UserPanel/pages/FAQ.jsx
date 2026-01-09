import React from 'react';

export default function FAQ() {
  return (
    <main className="faq-root">
      <div className="faq-container">
        <header className="faq-header">
          <h1>Preguntas Frecuentes</h1>
          <p className="faq-sub">
            En esta sección respondemos las consultas más comunes para que tengas una
            experiencia clara, simple y transparente.
          </p>
        </header>

        <article className="faq-article">
          <section className="faq-item">
            <h2>¿Qué tipo de servicios o productos ofrecen?</h2>
            <p>
              Ofrecemos soluciones diseñadas para cubrir distintas necesidades según el
              tipo de cliente. Cada producto o servicio cuenta con una descripción
              detallada donde se especifican sus características, alcances y
              condiciones particulares.
            </p>
            <p>
              Recomendamos revisar la información disponible en cada sección o
              contactarnos si necesitás asesoramiento antes de contratar.
            </p>
          </section>

          <section className="faq-item">
            <h2>¿Cómo puedo realizar una compra o contratar un servicio?</h2>
            <p>
              El proceso es simple e intuitivo. Solo tenés que seleccionar el producto o
              servicio deseado y seguir los pasos indicados en el sitio. Antes de
              confirmar, podrás revisar el detalle completo de tu solicitud.
            </p>
            <p>
              Una vez finalizado el proceso, recibirás una confirmación con la
              información correspondiente.
            </p>
          </section>

          <section className="faq-item">
            <h2>¿Cuáles son los medios de pago disponibles?</h2>
            <p>
              Contamos con distintos medios de pago para adaptarnos a tus preferencias.
              Las opciones disponibles se informan al momento de finalizar la operación
              y pueden variar según el tipo de producto o servicio.
            </p>
            <p>
              Todas las transacciones se procesan a través de plataformas seguras para
              garantizar la protección de tus datos.
            </p>
          </section>

          <section className="faq-item">
            <h2>¿Los precios incluyen impuestos y cargos adicionales?</h2>
            <p>
              Los precios publicados incluyen la información básica del producto o
              servicio. En caso de existir impuestos, cargos administrativos o costos
              adicionales, estos se detallarán antes de confirmar la operación.
            </p>
            <p>
              De esta forma, siempre conocerás el importe final antes de avanzar.
            </p>
          </section>

          <section className="faq-item">
            <h2>¿Realizan envíos o entregas?</h2>
            <p>
              Cuando el servicio o producto lo requiera, se informarán las condiciones de
              envío o entrega correspondientes. Los plazos indicados son estimativos y
              pueden verse afectados por factores externos.
            </p>
            <p>
              Es importante verificar que los datos proporcionados sean correctos para
              evitar demoras o inconvenientes.
            </p>
          </section>

          <section className="faq-item">
            <h2>¿Puedo solicitar cambios o devoluciones?</h2>
            <p>
              Sí. Existen políticas específicas para cambios y devoluciones que aplican
              según el tipo de producto o servicio contratado. Estas políticas respetan
              la normativa vigente y se encuentran detalladas en los Términos y
              Condiciones.
            </p>
            <p>
              Para más información podés consultar la sección de <a href="/terminos-y-condiciones#policy-of-changes">Política de cambios</a>.
            </p>
          </section>

          <section className="faq-item">
            <h2>¿Qué sucede si tengo un problema con mi pedido o servicio?</h2>
            <p>
              Si detectás algún inconveniente, te recomendamos comunicarte con nosotros
              lo antes posible. Nuestro equipo evaluará la situación y buscará brindarte
              una solución adecuada en el menor tiempo posible.
            </p>
          </section>

          <section className="faq-item">
            <h2>¿Mis datos personales están protegidos?</h2>
            <p>
              Sí. La protección de tus datos es una prioridad. La información personal se
              utiliza únicamente para gestionar los servicios ofrecidos y se trata de
              acuerdo con la normativa vigente.
            </p>
            <p>
              Podés consultar más detalles en nuestra Política de Privacidad.
            </p>
          </section>

          <section className="faq-item">
            <h2>¿Puedo contactarlos para recibir asesoramiento?</h2>
            <p>
              Por supuesto. Contamos con distintos canales de contacto para responder tus
              consultas. Nuestro objetivo es brindarte una atención clara, rápida y
              personalizada.
            </p>
          </section>

          <p className="faq-final">
            Si tu consulta no se encuentra en esta sección, no dudes en escribirnos.
            Estamos para ayudarte.
          </p>
        </article>
      </div>

      <style>{`
        :root {
          --faq-bg: #ffffff;
          --faq-muted: #6b7280;
          --faq-accent: #0b74da;
          --faq-max-width: 900px;
        }

        .faq-root {
          background: var(--faq-bg);
          padding: 32px 16px;
          display: flex;
          justify-content: center;
          font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial;
          color: #111827;
        }

        .faq-container {
          width: 100%;
          max-width: var(--faq-max-width);
        }

        .faq-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
        }

        .faq-sub {
          margin: 0 0 24px 0;
          color: var(--faq-muted);
          line-height: 1.6;
        }

        .faq-article {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
        }

        .faq-item {
          margin-bottom: 22px;
        }

        .faq-item h2 {
          font-size: 18px;
          margin-bottom: 6px;
          color: #0f172a;
        }

        .faq-item p {
          margin: 6px 0;
          line-height: 1.65;
          color: #374151;
        }

        .faq-item a {
          color: var(--faq-accent);
          text-decoration: none;
          font-weight: 500;
        }

        .faq-item a:hover {
          text-decoration: underline;
        }

        .faq-final {
          margin-top: 16px;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .faq-header h1 {
            font-size: 22px;
          }

          .faq-article {
            padding: 16px;
          }

          .faq-item h2 {
            font-size: 16px;
          }
        }
      `}</style>
    </main>
  );
}
