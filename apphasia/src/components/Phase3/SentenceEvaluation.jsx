import React, { useMemo, useState, useRef } from "react";
import "./SentenceEvaluation.css";

const SentenceEvaluation = ({ onNext, onPrevious, previousData }) => {
  // Dataset de ejemplo (puedes inyectarlo por props si prefieres)
  const initial = useMemo(
    () => ([
      { id: 1, subject: "La niña",    verb: "corre",        complement: "en el parque",     status: "pending" },
      { id: 2, subject: "El niño",    verb: "lee",          complement: "en la biblioteca",  status: "pending" },
      { id: 3, subject: "El perro",   verb: "conduce",      complement: "un coche",          status: "pending" }, // incorrecta
      { id: 4, subject: "La maestra", verb: "enseña",       complement: "en la escuela",     status: "pending" },
      { id: 5, subject: "El chef",    verb: "cocina",       complement: "una sopa",          status: "pending" },
    ]),
    []
  );

  const [sentences, setSentences] = useState(initial);
  const [index, setIndex] = useState(0);

  // Gestos
  const startX = useRef(null);
  const deltaX = useRef(0);
  const dragging = useRef(false);

  const current = sentences[index];
  const remaining = sentences.length - index;
  const progress = Math.round(((index) / sentences.length) * 100); // progreso antes de enviar
  const showDone = index >= sentences.length;

  const decide = (id, decision) => {
    setSentences((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: decision } : s))
    );
    // avanzamos a la siguiente
    setIndex((i) => i + 1);
    // reset drag
    startX.current = null;
    deltaX.current = 0;
    dragging.current = false;
  };

  const handleAccept = () => current && decide(current.id, "accepted");
  const handleReject = () => current && decide(current.id, "rejected");

  // touch/mouse handlers para swipe
  const onStart = (clientX) => {
    if (!current) return;
    startX.current = clientX;
    deltaX.current = 0;
    dragging.current = true;
  };
  const onMove = (clientX) => {
    if (!dragging.current || startX.current == null) return;
    deltaX.current = clientX - startX.current;
  };
  const onEnd = () => {
    if (!current) return;
    const threshold = 80; // px
    if (deltaX.current > threshold) {
      handleAccept();
    } else if (deltaX.current < -threshold) {
      handleReject();
    } else {
      // snap back
      deltaX.current = 0;
      dragging.current = false;
      // forzamos re-render con un pequeño truco
      setIndex((i) => i + 0);
    }
  };

  const bindTouch = {
    onTouchStart: (e) => onStart(e.touches[0].clientX),
    onTouchMove: (e) => onMove(e.touches[0].clientX),
    onTouchEnd: onEnd,
  };
  const bindMouse = {
    onMouseDown: (e) => onStart(e.clientX),
    onMouseMove: (e) => dragging.current && onMove(e.clientX),
    onMouseUp: onEnd,
    onMouseLeave: () => dragging.current && onEnd(),
  };

  const accepted = sentences.filter((s) => s.status === "accepted");

  const handleFinish = () => {
    onNext?.(accepted);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="phone-frame">
        {/* MAIN scrolleable si algo se extiende verticalmente */}
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-center mb-6">Evalúa las oraciones</h1>

          {/* Pila de tarjetas tipo Tinder */}
          <div className="relative h-72 mt-2">
            {/* Siguiente/siguientes tarjetas en el fondo para efecto de pila */}
            {!showDone &&
              sentences.slice(index + 1, index + 3).map((s, i) => (
                <Card
                  key={s.id}
                  subject={s.subject}
                  verb={s.verb}
                  complement={s.complement}
                  style={{
                    transform: `translateY(${12 + i * 10}px) scale(${1 - i * 0.04})`,
                    opacity: 0.6 - i * 0.15,
                  }}
                  className="pointer-events-none"
                />
              ))}

            {/* Tarjeta actual draggable */}
            {!showDone && current && (
              <Card
                subject={current.subject}
                verb={current.verb}
                complement={current.complement}
                style={{
                  transform: `translateX(${deltaX.current}px) rotate(${deltaX.current * 0.05}deg)`,
                  boxShadow:
                    deltaX.current > 0
                      ? "0 10px 25px rgba(34,197,94,.35)" // verde
                      : deltaX.current < 0
                      ? "0 10px 25px rgba(239,68,68,.35)" // rojo
                      : undefined,
                }}
                {...bindTouch}
                {...bindMouse}
              >
                {/* Badges de feedback en drag */}
                <Badge show={deltaX.current > 30} type="good" />
                <Badge show={deltaX.current < -30} type="bad" />
              </Card>
            )}

            {/* Estado final */}
            {showDone && (
              <div className="h-full flex items-center justify-center text-center px-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">¡Listo!</h2>
                  <p className="text-gray-600">
                    Aceptaste {accepted.length} de {sentences.length} oraciones.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Botones Bien / Mal accesibles */}
          {!showDone && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 rounded-lg bg-red-100 text-red-600 font-bold py-3 cursor-pointer hover:bg-red-200 transition"
                aria-label="Marcar como incorrecta"
              >
                Mal
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 rounded-lg bg-green-100 text-green-600 font-bold py-3 cursor-pointer hover:bg-green-200 transition"
                aria-label="Marcar como correcta"
              >
                Bien
              </button>
            </div>
          )}
        </main>

        {/* FOOTER con progreso y acciones (sin navbar) */}
        <footer className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Fase 3</p>
            <p className="text-sm font-medium text-gray-600">3/4</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
            <div
              className="bg-[var(--orange-accent)] h-2.5 rounded-full"
              style={{ width: "75%" }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onPrevious}
              className="w-1/2 rounded-lg bg-gray-200 text-gray-700 font-bold py-3 cursor-pointer hover:bg-gray-300 transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={showDone ? handleFinish : handleAccept}
              className="w-1/2 rounded-lg bg-[var(--orange-accent)] text-white font-bold py-3 cursor-pointer hover:brightness-95 active:scale-[0.98] transition"
            >
              {showDone ? "Finalizar" : "Marcar Bien"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

/* --- Subcomponentes --- */

const Card = ({ subject, verb, complement, style, className = "", children, ...handlers }) => {
  return (
    <div
      className={`absolute inset-0 m-3 rounded-2xl border-2 border-gray-200 bg-white shadow-lg flex items-center justify-center text-center p-6 select-none ${className}`}
      style={{ transition: "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease", ...style }}
      {...handlers}
    >
      <div className="max-w-[90%]">
        <p className="text-2xl font-bold text-gray-900 leading-snug">
          <span className="text-[var(--orange-accent)]">{subject}</span>{" "}
          <span className="text-gray-800">{verb}</span>{" "}
          <span className="text-gray-700">{complement}</span>
        </p>
      </div>
      {children}
    </div>
  );
};

const Badge = ({ show, type }) => {
  if (!show) return null;
  const isGood = type === "good";
  return (
    <div
      className={`absolute top-4 ${isGood ? "left-4" : "right-4"} px-3 py-1 rounded-full text-sm font-bold
        ${isGood ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}
    >
      {isGood ? "BIEN" : "MAL"}
    </div>
  );
};

export default SentenceEvaluation;
