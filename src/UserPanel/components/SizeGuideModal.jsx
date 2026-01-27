// src/components/SizeGuideModal.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import "./SizeGuideModal.css";

/*
  Nota:
  - Coloca las 6 imágenes en src/components/size-guides/ con los nombres:
    stadium.png, match.png, shorts.png, conjuntos.png, kits.png, camperas.png
  - Si cambiás la ubicación o los nombres, actualizá los imports abajo.
*/
const stadiumImg = "https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/Captura%20(1).png";
const matchImg = "https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/Captura%20(1).png";
const shortsImg = "https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/Captura%20(1).png";
const conjuntosImg = "https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/Captura%20(1).png";
const kitsImg = "https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/Captura%20(1).png";
const camperasImg = "https://qlsdsfxwjzuqzrwrlenr.supabase.co/storage/v1/object/public/img-varias/Captura%20(1).png";

const GUIDES = [
  {
    key: "stadium",
    title: "Camiseta Adulto Stadium / Retro",
    img: stadiumImg,
    note: "Talles aproximados. Puede variar ±2 cm.",
    table: {
      header: ["Talle", "S", "M", "L", "XL", "XXL"],
      rows: [
        ["Pecho (1/2)", "50", "52", "54", "56", "59"],
        ["Largo", "70", "72", "74", "76", "78"],
        ["Altura Ref.", "165-170", "170-175", "175-180", "180-185", "185-190"]
      ]
    }

  },
  {
    key: "match",
    title: "Camiseta Adulto Match",
    img: matchImg,
    note: "Talles aproximados. Puede variar ±2 cm.",
    table: {
      header: ["Talle", "S", "M", "L", "XL", "XXL"],
      rows: [
        ["Pecho (1/2)", "48", "50", "52", "54", "56"],
        ["Largo", "71", "73", "75", "77", "79"]
      ]
    }

  },
  {
    key: "shorts",
    title: "Shorts Adulto",
    img: shortsImg,
    note: "Talles aproximados. Puede variar ±2 cm.",
    table: {
      header: ["Talle", "S", "M", "L", "XL", "XXL"],
      rows: [
        ["Cintura (1/2)", "30", "32", "34", "36", "38"],
        ["Largo", "44", "46", "48", "50", "50"],
        ["Altura Ref.", "165-170", "170-175", "175-180", "180-185", "185-190"]
      ]
    }

  },
  {
    key: "camperas",
    title: "Camperas",
    img: camperasImg,
    note: "Talles aproximados. Puede variar ±2 cm.",
    table: {
      header: ["Talle", "S", "M", "L", "XL", "XXL"],
      rows: [
        ["Pecho (1/2)", "52", "54", "56", "58", "60"],
        ["Largo", "66", "68", "69", "70", "72"]
      ]
    }
  },
  {
    key: "conjuntos",
    title: "Conjuntos Deportivos",
    img: conjuntosImg,
    note: "Talles aproximados. Puede variar ±3 cm.",
    table: {
      header: ["Talle", "S", "M", "L", "XL"],
      rows: [
        ["Estatura", "160-170", "165-175", "170-180", "175-185"],
        ["Largo", "70", "72", "74", "76"],
        ["Pecho (1/2)", "50", "52", "56", "60"],
        ["Largo manga", "60", "62", "65", "67"],
        ["Largo pantalón", "96", "100", "104", "106"],
        ["Cadera", "56", "58", "60", "62"]
      ]
    }

  },
  {
    key: "kits",
    title: "Kits Niñxs (Camiseta - Short)",
    img: kitsImg,
    note: "Talles aproximados. Puede variar ±2 cm.",
    table: {
      header: ["Talle", "XXS / 2", "XS / 4", "S / 6", "M / 8", "L / 10", "XL / 12", "XXL / 14"],
      rows: [
        ["Cintura Short (1/2)", "20-37", "21-39", "22-41", "23-42", "24-44", "25-46", "26-48"],
        ["Largo Short", "30", "32", "34", "36", "38", "40", "42"],
        ["Pecho (1/2)", "35", "37", "39", "41", "43", "45", "47"],
        ["Largo Camiseta", "44", "47", "50", "53", "56", "59", "62"],
        ["Edad Ref.", "2 - 3", "4 - 5", "5 - 6", "7 - 8", "9 - 10", "11 - 12", "13 - 14"],
        ["Altura Ref.", "95-105", "105-110", "115-125", "125-135", "135-145", "145-155", "155-160"]
      ]
    }

  }
];

/**
 * Utility: normaliza strings para matching con garmentType
 */
function normalizeKey(str = "") {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * SizeGuideModal
 * Props:
 *  - isOpen (bool)
 *  - onClose (func)
 *  - garmentType (string?) -> si viene, modal mostrará solo la guía que coincida
 *    con ese garmentType (matching flexible). Si no viene, muestra selector.
 *
 * Uso desde publicación (producto):
 *   <SizeGuideModal isOpen={open} onClose={close} garmentType={product.garmentType} />
 *
 * Uso desde footer:
 *   <SizeGuideModal isOpen={open} onClose={close} />
 */
export default function SizeGuideModal({ isOpen, onClose, garmentType = null }) {
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // estado local: qué guía se muestra (clave de GUIDES)
  // Si garmentType viene, el modal intentará seleccionar la guía correspondiente y deshabilitar selector.
  const initialKey = useMemo(() => {
    if (!garmentType) return GUIDES[0].key;
    // intentar encontrar match por key o título
    const gNorm = normalizeKey(garmentType);
    let found = GUIDES.find(
      (g) => g.key === gNorm || normalizeKey(g.title).includes(gNorm) || gNorm.includes(g.key)
    );
    if (!found) {
      // fallback: si garmentType contiene palabras clave
      found = GUIDES.find((g) => normalizeKey(g.title).includes(gNorm.split("_")[0]));
    }
    return (found && found.key) || GUIDES[0].key;
  }, [garmentType]);

  const [activeKey, setActiveKey] = useState(initialKey);
  // si nos pasan garmentType y el modal se abre repetidas veces con otro garmentType,
  // debemos sincronizar activeKey con la prop:
  useEffect(() => {
    if (garmentType) {
      setActiveKey(initialKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garmentType, initialKey]);

  // si garmentType viene, ocultamos selector (porque abriste desde producto)
  const isProductContext = Boolean(garmentType);

  // focus management & trap (conservando las ideas del modal original)
  useEffect(() => {
    let cleanup = () => {};
    if (isOpen) {
      // bloquear scroll
      document.body.style.overflow = "hidden";
      previouslyFocusedRef.current = document.activeElement;

      // after render, focus first focusable in container:
      setTimeout(() => {
        const focusable = containerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length) {
          focusable[0].focus();
        }
      }, 0);

      const onKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
          return;
        }
        if (e.key === "Tab") {
          const focusable = Array.from(
            containerRef.current?.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) || []
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
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
      cleanup = () => {
        document.removeEventListener("keydown", onKey);
      };
    }
    return () => {
      // cleanup
      try { cleanup(); } catch (e) {}
      document.body.style.overflow = "";
      if (previouslyFocusedRef.current && previouslyFocusedRef.current.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeGuide = GUIDES.find((g) => g.key === activeKey) || GUIDES[0];

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
        className="modal-container sizeguide-modal"
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

          <div className="header-controls">
            {/* Si estoy en footer (no product context) muestro selector para elegir guía */}
            {!isProductContext && (
              <label className="select-label" htmlFor="sizeguide-select">
                Ver guía:
                <select
                  id="sizeguide-select"
                  value={activeKey}
                  onChange={(e) => setActiveKey(e.target.value)}
                >
                  {GUIDES.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              className="close-btn"
              onClick={onClose}
              aria-label="Cerrar guía de talles"
            >
              ×
            </button>
          </div>
        </div>

        <div className="modal-content" id="sizeguide-desc">
          <div className="left-panel">
            <div className="tip-box" tabIndex={-1}>
              <strong>Tip pro:</strong>
              <p>
                Toma una prenda que te quede bien, colócala sobre una superficie
                plana y mide siguiendo el diagrama.
              </p>
            </div>

            <div className="shirt-diagram">
              <img
                src={activeGuide.img}
                alt={`${activeGuide.title} - tabla de talles`}
                loading="lazy"
                width="800"
                height="400"
              />
              <div className="legend" aria-hidden="true">
                <span><b>A</b>: Ancho (Pecho)</span>
                <span><b>B</b>: Largo total</span>
              </div>
            </div>
          </div>

          <div className="right-panel">
            <h3>{activeGuide.title}</h3>

            <div className="table-wrap" role="table" aria-label={`Tabla de talles: ${activeGuide.title}`}>
              {/* Si la guía tiene una tabla "data" (ej la sexta), renderizarla en HTML para accesibilidad.
                  De lo contrario se muestra un aviso para ver la imagen. */}
              {activeGuide.table ? (
                <table>
                  <thead>
                    <tr>
                      {activeGuide.table.header.map((h, i) => (
                        <th key={i} scope="col">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeGuide.table.rows.map((r, i) => (
                      <tr key={i}>
                        {r.map((cell, j) => <td key={j}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="image-note" role="region" aria-live="polite">
                  <p>Revisá la tabla en la imagen a la izquierda para ver los valores de talles.</p>
                </div>
              )}
            </div>

            <p className="note">
              {activeGuide.note || "Las medidas pueden variar +/- 1 cm debido al proceso de confección."}
            </p>
          </div>
        </div>

        <div className="modal-footer">
          {/* Si estamos en contexto producto y queremos permitir cambio (por si el producto no especifica),
              podés setear isProductContext=false al llamar. Actualmente, si viene garmentType mostramos solo el correspondiente. */}
          <button className="confirm-btn" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
