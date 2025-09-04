// src/components/Phase1/ActionSelection.jsx
import React, { useMemo, useState } from "react";
import "./ActionSelection.css";
import { useExercise } from "../../context/ExerciseContext";

// Fisher–Yates
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ActionSelection = ({ onNext, onPrevious }) => {
  const { exercise } = useExercise();

  const verbo = exercise?.verbo ?? "";
  const pares = Array.isArray(exercise?.pares) ? exercise.pares : [];

  // Conjuntos únicos
  const { sujetosShuffled, objetosShuffled, validPairs } = useMemo(() => {
    const s = new Set();
    const o = new Set();
    const vp = new Set();
    for (const p of pares) {
      if (p?.sujeto) s.add(p.sujeto);
      if (p?.objeto) o.add(p.objeto);
      if (p?.sujeto && p?.objeto) vp.add(`${p.sujeto}|||${p.objeto}`);
    }
    return {
      sujetosShuffled: shuffle(Array.from(s)),
      objetosShuffled: shuffle(Array.from(o)),
      validPairs: vp,
    };
  }, [pares]);

  const [selectedWho, setSelectedWho] = useState("");
  const [selectedWhat, setSelectedWhat] = useState("");

  const pairIsValid =
    selectedWho && selectedWhat
      ? validPairs.has(`${selectedWho}|||${selectedWhat}`)
      : false;

  const handleNextClick = () => {
    if (!pairIsValid) return; // bloqueo extra por seguridad
    onNext({ who: selectedWho, what: selectedWhat });
  };

  if (!exercise) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="phone-frame">
          <main className="flex-1 overflow-y-auto p-6">
            <h1 className="text-2xl font-bold mb-4">No hay ejercicio cargado</h1>
            <p className="text-gray-700">Vuelve y selecciona un contexto para generar el ejercicio.</p>
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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="phone-frame">
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-center mb-8">Elige ¿quién? y ¿qué?</h1>

          {/* Verbo */}
          <div className="mb-8 flex w-full items-center justify-center rounded-xl bg-zinc-900 p-6 text-white shadow-lg">
            <span className="text-3xl font-bold">{verbo || "Acción"}</span>
          </div>

          {/* Aviso si combo inválido */}
          {selectedWho && selectedWhat && !pairIsValid && (
            <div className="mb-4 text-sm text-red-600 text-center">
              Esa combinación no va junta. Intenta con otro sujeto u objeto.
            </div>
          )}

          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            <div className="w-full">
              <h2 className="mb-4 text-center text-2xl font-bold">¿QUIÉN?</h2>
              <div className="space-y-4">
                {sujetosShuffled.map((suj) => (
                  <ButtonRadio
                    key={suj}
                    text={suj}
                    isSelected={selectedWho === suj}
                    onClick={() => setSelectedWho(suj)}
                  />
                ))}
              </div>
            </div>

            <div className="w-full">
              <h2 className="mb-4 text-center text-2xl font-bold">¿QUÉ?</h2>
              <div className="space-y-4">
                {objetosShuffled.map((obj) => (
                  <ButtonRadio
                    key={obj}
                    text={obj}
                    isSelected={selectedWhat === obj}
                    onClick={() => setSelectedWhat(obj)}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-gray-200 p-4">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Fase 1</p>
              <p className="text-sm font-medium text-gray-600">1/4</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
              <div className="bg-[var(--orange-accent)] h-2.5 rounded-full" style={{ width: "25%" }} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onPrevious}
                className="w-1/2 rounded-lg bg-gray-200 text-gray-700 font-bold py-3 hover:bg-gray-300 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={handleNextClick}
                disabled={!pairIsValid}
                className="w-1/2 rounded-lg bg-[var(--orange-accent)] text-white font-bold py-3 hover:brightness-95 active:scale-[0.98] transition disabled:opacity-60"
              >
                Siguiente
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const ButtonRadio = ({ text, isSelected, onClick }) => {
  const base = "flex w-full items-center justify-center rounded-xl p-6 text-lg transition-all focus:outline-none";
  const normal = "border-2 border-gray-200 bg-white font-medium text-black shadow-sm hover:bg-gray-50 cursor-pointer";
  const selected = "border-2 border-[var(--orange-accent)] bg-orange-50 font-bold text-black shadow-md ring-2 ring-[var(--orange-accent)] ring-offset-2 cursor-pointer";
  return (
    <button className={`${base} ${isSelected ? selected : normal}`} onClick={onClick}>
      {text}
    </button>
  );
};

export default ActionSelection;
