// src/components/Phase3/SentenceEvaluation.jsx
import React, { useMemo, useState, useRef } from "react";
import "./SentenceEvaluation.css";
import { useExercise } from "../../context/ExerciseContext";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SentenceEvaluation = ({ onNext, onPrevious }) => {
  const { exercise } = useExercise();

  const initial = useMemo(() => {
    const list = Array.isArray(exercise?.oraciones) ? exercise.oraciones : [];
    const mapped = list.map((o, idx) => ({
      id: idx + 1,
      text: o.oracion,
      correcta: !!o.correcta,
      status: "pending", // "accepted" | "rejected" | "pending"
    }));
    return shuffle(mapped);
  }, [exercise?.oraciones]);

  const [sentences, setSentences] = useState(initial);
  const [index, setIndex] = useState(0);

  // Gestos
  const startX = useRef(null);
  const deltaX = useRef(0);
  const dragging = useRef(false);

  const current = sentences[index];
  const showDone = index >= sentences.length;

  const decide = (id, decision) => {
    setSentences((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: decision } : s))
    );
    setIndex((i) => i + 1);
    startX.current = null;
    deltaX.current = 0;
    dragging.current = false;
  };

  const handleAccept = () => current && decide(current.id, "accepted");
  const handleReject = () => current && decide(current.id, "rejected");

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
    const threshold = 80;
    if (deltaX.current > threshold) {
      handleAccept();
    } else if (deltaX.current < -threshold) {
      handleReject();
    } else {
      deltaX.current = 0;
      dragging.current = false;
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
  const reviewed = sentences.filter((s) => s.status !== "pending");

  const score = useMemo(() => {
    let ok = 0;
    for (const s of reviewed) {
      const userSaysCorrect = s.status === "accepted";
      if (userSaysCorrect === s.correcta) ok++;
    }
    return { ok, total: sentences.length };
  }, [reviewed, sentences.length]);

  const handleFinish = () => {
    onNext?.(accepted);
  };

  if (
    !exercise ||
    !Array.isArray(exercise.oraciones) ||
    exercise.oraciones.length === 0
  ) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="phone-frame">
          <main className="flex-1 overflow-y-auto p-6">
            <h1 className="text-2xl font-bold mb-2">No hay oraciones</h1>
            <p className="text-gray-700">
              Regresa y genera un ejercicio primero.
            </p>
          </main>
          <footer className="border-t border-gray-200 p-4">
            <button
              onClick={onPrevious}
              className="w-full rounded-lg bg-gray-200 text-gray-700 font-bold py-3 hover:bg-gray-300 transition-colors"
            >
              Volver
            </button>
          </footer>
        </div>
      </div>
    );
  }

  // Decididas hasta el momento (en orden)
  const decided = sentences
    .slice(0, index)
    .filter((s) => s.status !== "pending")
    .reverse();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="phone-frame">
        {/* MAIN */}
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-center mb-2">
            Evalúa las oraciones
          </h1>
          <p className="text-center text-sm text-gray-500">
            Desliza a la derecha si es correcta, a la izquierda si es
            incorrecta.
          </p>

          {/* Pila de tarjetas (Tinder-like) */}
          <div className="relative h-72 mt-4 shrink-0">
            {!showDone &&
              sentences.slice(index + 1, index + 3).map((s, i) => (
                <Card
                  key={s.id}
                  sentence={s.text}
                  style={{
                    transform: `translateY(${12 + i * 10}px) scale(${
                      1 - i * 0.04
                    })`,
                    opacity: 0.6 - i * 0.15,
                  }}
                  className="pointer-events-none"
                />
              ))}

            {!showDone && current && (
              <Card
                sentence={current.text}
                style={{
                  transform: `translateX(${deltaX.current}px) rotate(${
                    deltaX.current * 0.05
                  }deg)`,
                  boxShadow:
                    deltaX.current > 0
                      ? "0 10px 25px rgba(34,197,94,.35)"
                      : deltaX.current < 0
                      ? "0 10px 25px rgba(239,68,68,.35)"
                      : undefined,
                }}
                {...bindTouch}
                {...bindMouse}
              >
                <Badge show={deltaX.current > 30} type="good" />
                <Badge show={deltaX.current < -30} type="bad" />
              </Card>
            )}

            {showDone && (
              <div className="h-full flex items-center justify-center text-center px-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">¡Listo!</h2>
                  <p className="text-gray-600">
                    Aciertos: {score.ok} / {score.total}
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Botones Bien / Mal */}
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
          {/* === Historial VERTICAL con altura fija y scroll interno === */}
          {decided.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Tus respuestas
              </h2>

              {/* Contenedor fijo para que no empuje el footer */}

              <div className="flex flex-col gap-3">
                {decided.map((s) => {
                  // Dentro del mapeo de decided:
                  const userSaysCorrect = s.status === "accepted"; // tú marcaste "Bien"
                  const acertaste = userSaysCorrect === s.correcta; // coincide con el ground truth
                  const bg = acertaste
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300";
                  const tagBg = acertaste
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700";
                  const title = acertaste
                    ? "✅ Acertaste"
                    : "❌ Te equivocaste";

                  return (
                    <div
                      key={s.id}
                      className={`rounded-xl border-2 ${bg} p-4 shadow-sm`}
                    >
                      <div
                        className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${tagBg} mb-2`}
                      >
                        {title}
                      </div>
                      <div className="text-gray-900 font-semibold text-lg">
                        {s.text}
                      </div>

                      {/* Si quieres mostrar la etiqueta del sistema */}
                      <div className="text-xs text-gray-600 mt-1">
                        Sistema: {s.correcta ? "Correcta" : "Incorrecta"} · Tú
                        marcaste: {userSaysCorrect ? "Bien" : "Mal"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        {/* FOOTER */}
        <footer className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Fase 3</p>
            <p className="text-sm font-medium text-gray-600">
              {showDone
                ? "3/4"
                : `${Math.min(index + 1, sentences.length)}/${
                    sentences.length
                  }`}
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
            <div
              className="bg-[var(--orange-accent)] h-2.5 rounded-full"
              style={{
                width: `${Math.round(
                  (Math.min(index, sentences.length) / sentences.length) * 100
                )}%`,
              }}
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

const Card = ({ sentence, style, className = "", children, ...handlers }) => {
  return (
    <div
      className={`absolute inset-0 m-3 rounded-2xl border-2 border-gray-200 bg-white shadow-lg flex items-center justify-center text-center p-6 select-none ${className}`}
      style={{
        transition:
          "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
        ...style,
      }}
      {...handlers}
    >
      <div className="max-w-[90%]">
        <p className="text-2xl font-bold text-gray-900 leading-snug">
          {sentence}
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
      className={`absolute top-4 ${
        isGood ? "left-4" : "right-4"
      } px-3 py-1 rounded-full text-sm font-bold
        ${isGood ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}
    >
      {isGood ? "BIEN" : "MAL"}
    </div>
  );
};

export default SentenceEvaluation;
