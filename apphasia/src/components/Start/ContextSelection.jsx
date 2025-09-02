// src/components/ContextSelection.js
import React, { useState } from "react";
import "./ContextSelection.css";

const ContextSelection = ({ onNext }) => {
  const [selectedContext, setSelectedContext] = useState("context1");
  const [customContext, setCustomContext] = useState("");
  const [selectedContextInfo, setSelectedContextInfo] = useState("Hacer mercado");

  const handleContextChange = (e) => {
    setSelectedContext(e.target.id);
    setSelectedContextInfo(e.target.nextSibling.textContent);
  };

  const handleCustomContextChange = (e) => {
    setCustomContext(e.target.value);
    setSelectedContext("custom");
    setSelectedContextInfo(e.target.value);
  };

  const handleNextClick = () => onNext(selectedContextInfo);

  return (
    /* fondo negro y centrado del teléfono */
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* marco de teléfono con tamaño fijo */}
      <div className="phone-frame">
        {/* main con scroll vertical si el contenido crece */}
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-center mb-8">Selecciona un contexto</h1>

          <div className="space-y-4">
            <div>
              <input
                type="radio"
                id="context1"
                name="context"
                className="card-radio"
                checked={selectedContext === "context1"}
                onChange={handleContextChange}
              />
              <label
                htmlFor="context1"
                className="block w-full p-6 text-lg text-left border-2 border-gray-200 rounded-xl transition-all duration-200 ease-in-out"
              >
                Hacer mercado
              </label>
            </div>

            <div>
              <input
                type="radio"
                id="context2"
                name="context"
                className="card-radio"
                checked={selectedContext === "context2"}
                onChange={handleContextChange}
              />
              <label
                htmlFor="context2"
                className="block w-full p-6 text-lg text-left border-2 border-gray-200 rounded-xl transition-all duration-200 ease-in-out"
              >
                Ir a un restaurante
              </label>
            </div>

            <div>
              <input
                type="radio"
                id="context3"
                name="context"
                className="card-radio"
                checked={selectedContext === "context3"}
                onChange={handleContextChange}
              />
              <label
                htmlFor="context3"
                className="block w-full p-6 text-lg text-left border-2 border-gray-200 rounded-xl transition-all duration-200 ease-in-out"
              >
                Encontrarse a alguien en la calle
              </label>
            </div>

            {/* Contexto personalizado */}
            <div>
              <input
                type="radio"
                id="custom"
                name="context"
                className="card-radio"
                checked={selectedContext === "custom"}
                onChange={handleContextChange}
              />
              <label
                htmlFor="custom"
                className="block w-full p-6 text-lg text-left border-2 border-gray-200 rounded-xl transition-all duration-200 ease-in-out cursor-text"
              >
                <input
                  type="text"
                  placeholder="Escribe tu propio contexto..."
                  value={customContext}
                  onChange={handleCustomContextChange}
                  className="w-full border-none focus:ring-0 bg-transparent outline-none"
                />
              </label>
            </div>
          </div>
        </main>

        {/* footer fijo dentro del teléfono */}
        <footer className="border-t border-gray-200 p-4">
          <div className="flex justify-end">
            <button
              onClick={handleNextClick}
              className="w-1/2 rounded-lg bg-[var(--orange-accent)] text-white font-bold py-3 cursor-pointer hover:brightness-95 active:scale-[0.98] transition"
            >
              Siguiente
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ContextSelection;
