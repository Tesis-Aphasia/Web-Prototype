// src/components/ContextSelection.js
import React, { useState } from 'react';
import './ContextSelection.css';

const ContextSelection = ({ onNext }) => {
  const [selectedContext, setSelectedContext] = useState('context1');

  const handleContextChange = (event) => {
    setSelectedContext(event.target.id);
  };

  const handleNextClick = () => {
    onNext(selectedContext);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8">Selecciona un contexto</h1>
          <div className="space-y-4">
            <div>
              <input
                type="radio"
                id="context1"
                name="context"
                className="card-radio"
                checked={selectedContext === 'context1'}
                onChange={handleContextChange}
              />
              <label
                htmlFor="context1"
                className="block w-full p-6 text-lg text-left border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 ease-in-out"
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
                checked={selectedContext === 'context2'}
                onChange={handleContextChange}
              />
              <label
                htmlFor="context2"
                className="block w-full p-6 text-lg text-left border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 ease-in-out"
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
                checked={selectedContext === 'context3'}
                onChange={handleContextChange}
              />
              <label
                htmlFor="context3"
                className="block w-full p-6 text-lg text-left border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 ease-in-out"
              >
                Encontrarse a alguien en la calle
              </label>
            </div>
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-500">Paso 1 de 4</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mx-4">
              <div className="bg-[var(--orange-accent)] h-2.5 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleNextClick}
              className="bg-[var(--orange-accent)] text-white font-bold py-3 px-8 rounded-lg text-lg w-full md:w-auto"
            >
              Siguiente
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContextSelection;