// src/components/Start/ContextSelection.js
import React, { useState } from "react";
import "./ContextSelection.css";
import { useExercise } from "../../context/ExerciseContext";

const API_URL = "http://127.0.0.1:8000/context/";

const ContextSelection = ({ onNext }) => {
  const [selectedContext, setSelectedContext] = useState("context1");
  const [customContext, setCustomContext] = useState("");
  const [selectedContextInfo, setSelectedContextInfo] = useState("Hacer mercado");
  const { setExercise } = useExercise();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContextChange = (e) => {
    setSelectedContext(e.target.id);
    setSelectedContextInfo(e.target.nextSibling.textContent);
  };

  const handleCustomContextChange = (e) => {
    setCustomContext(e.target.value);
    setSelectedContext("custom");
    setSelectedContextInfo(e.target.value);
  };

  const sendRequest = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: selectedContextInfo, nivel : 'facil' }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      setExercise(data);
      onNext(data);
    } catch (e) {
      setError(e.message || "Error enviando el contexto");
    } finally {
      setLoading(false);
    }
  };

  const handleNextClick = () => {
    if (!selectedContextInfo?.trim()) return;
    sendRequest();
  };

  // Pantalla de cargando dentro del “teléfono”
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="phone-frame">
          <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
            <div className="flex flex-col items-center gap-4">
              <div
                className="h-16 w-16 rounded-full border-4 border-gray-200 border-t-[var(--orange-accent)] animate-spin"
                aria-label="Cargando"
                role="status"
              />
              <div className="space-y-1">
                <p className="text-xl font-bold text-gray-900">Creando el ejercicio…</p>
                <p className="text-sm text-gray-500">Esto puede tardar unos segundos</p>
              </div>
            </div>
          </main>

          <footer className="border-t border-gray-200 p-4">
            <div className="text-center text-sm text-gray-500">
              Contexto: <span className="font-semibold">{selectedContextInfo || "—"}</span>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    /* fondo negro y centrado del teléfono */
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* marco de teléfono con tamaño fijo */}
      <div className="phone-frame">
        {/* main con scroll vertical si el contenido crece */}
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-center mb-8">Selecciona un contexto</h1>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
              {error}
              <div className="mt-2">
                <button
                  onClick={sendRequest}
                  className="rounded-md bg-red-600 text-white px-3 py-1 text-sm font-bold hover:brightness-110"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

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
                Ir a la tienda
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
                Cita médica
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
                Reunion familiar
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
              disabled={!selectedContextInfo?.trim() || loading}
              className="w-1/2 rounded-lg bg-[var(--orange-accent)] text-white font-bold py-3 cursor-pointer hover:brightness-95 active:scale-[0.98] transition disabled:opacity-60"
            >
              {loading ? "Generando…" : "Siguiente"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ContextSelection;
