import React, { useState } from "react";
import "./ActionSelection.css";

const ActionSelection = ({ onNext, onPrevious }) => {
  const [selectedWho, setSelectedWho] = useState("");
  const [selectedWhat, setSelectedWhat] = useState("");

  const handleNextClick = () => onNext({ who: selectedWho, what: selectedWhat });

  return (
    // Fondo negro y teléfono centrado
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Marco de teléfono con tamaño fijo (usa las vars definidas en el CSS) */}
      <div className="phone-frame">
        {/* Contenido con scroll si se excede la altura del “teléfono” */}
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-center mb-8">
            Elige ¿quién? y ¿qué?
          </h1>

          {/* Verbo/acción centrada */}
          <div className="mb-8 flex w-full items-center justify-center rounded-xl bg-zinc-900 p-6 text-white shadow-lg">
            <span className="text-3xl font-bold">Correr</span>
          </div>

          {/* Dos columnas en md, una en móvil */}
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            <div className="w-full">
              <h2 className="mb-4 text-center text-2xl font-bold">¿QUIÉN?</h2>
              <div className="space-y-4">
                <ButtonRadio
                  text="La niña"
                  isSelected={selectedWho === "La niña"}
                  onClick={() => setSelectedWho("La niña")}
                />
                <ButtonRadio
                  text="El niño"
                  isSelected={selectedWho === "El niño"}
                  onClick={() => setSelectedWho("El niño")}
                />
                <ButtonRadio
                  text="El perro"
                  isSelected={selectedWho === "El perro"}
                  onClick={() => setSelectedWho("El perro")}
                />
              </div>
            </div>

            <div className="w-full">
              <h2 className="mb-4 text-center text-2xl font-bold">¿QUÉ?</h2>
              <div className="space-y-4">
                <ButtonRadio
                  text="Una pelota"
                  isSelected={selectedWhat === "Una pelota"}
                  onClick={() => setSelectedWhat("Una pelota")}
                />
                <ButtonRadio
                  text="Un libro"
                  isSelected={selectedWhat === "Un libro"}
                  onClick={() => setSelectedWhat("Un libro")}
                />
                <ButtonRadio
                  text="Un juguete"
                  isSelected={selectedWhat === "Un juguete"}
                  onClick={() => setSelectedWhat("Un juguete")}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Footer dentro del teléfono con barra de progreso (Fase 1) */}
        <footer className="border-t border-gray-200 p-4">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Fase 1</p>
              <p className="text-sm font-medium text-gray-600">1/4</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
              <div
                className="bg-[var(--orange-accent)] h-2.5 rounded-full"
                style={{ width: "25%" }}
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
                onClick={handleNextClick}
                className="w-1/2 rounded-lg bg-[var(--orange-accent)] text-white font-bold py-3 cursor-pointer hover:brightness-95 active:scale-[0.98] transition"
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

// Botón-radio consistente con la pantalla anterior (mismas dimensiones y bordes)
const ButtonRadio = ({ text, isSelected, onClick }) => {
  const base =
    "flex w-full items-center justify-center rounded-xl p-6 text-lg transition-all focus:outline-none";
  const normal =
    "border-2 border-gray-200 bg-white font-medium text-black shadow-sm hover:bg-gray-50 cursor-pointer";
  const selected =
    "border-2 border-[var(--orange-accent)] bg-orange-50 font-bold text-black shadow-md ring-2 ring-[var(--orange-accent)] ring-offset-2 cursor-pointer";
  return (
    <button className={`${base} ${isSelected ? selected : normal}`} onClick={onClick}>
      {text}
    </button>
  );
};

export default ActionSelection;
