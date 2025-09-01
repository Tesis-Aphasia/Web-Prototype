import React, { useState } from 'react';
import './ActionSelection.css'; // Importa el CSS específico

const ActionSelection = ({ onNext, onPrevious }) => {
  const [selectedWho, setSelectedWho] = useState('El perro'); // Valor inicial del HTML
  const [selectedWhat, setSelectedWhat] = useState('Un libro'); // Valor inicial del HTML

  const handleWhoChange = (who) => {
    setSelectedWho(who);
  };

  const handleWhatChange = (what) => {
    setSelectedWhat(what);
  };

  const handleNextClick = () => {
    // Pasa las selecciones al componente padre
    onNext({ who: selectedWho, what: selectedWhat });
  };

  const handlePreviousClick = () => {
    onPrevious();
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white">
      {/* Estilo de fuente directamente en el div principal para encapsular */}
      <main className="flex h-full w-full flex-col" style={{ fontFamily: '"Inter", "Spline Sans", sans-serif' }}>
        <div className="flex-1 bg-white">
          <div className="mx-auto flex h-full max-w-lg flex-col px-4 pt-8 pb-20 md:px-8">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-600">Fase 1</p>
                <p className="text-sm font-medium text-zinc-600">1/4</p> {/* Esto es 1/4 pero es la fase 1 de un ejercicio de 4 (debería ser 1/4 general) */}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-zinc-200">
                <div className="h-2 w-1/4 rounded-full bg-zinc-900"></div>
              </div>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="mb-12 flex w-full flex-col items-center">
                <div className="flex w-full items-center justify-center rounded-xl bg-zinc-900 p-8 text-white shadow-lg">
                  <span className="text-4xl font-bold">Correr</span>
                </div>
              </div>
              <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
                {/* Columna ¿QUIÉN? */}
                <div className="w-full">
                  <h2 className="mb-4 text-center text-2xl font-bold text-zinc-900">¿QUIÉN?</h2>
                  <div className="space-y-4">
                    <ButtonRadio
                      text="La niña"
                      isSelected={selectedWho === 'La niña'}
                      onClick={() => handleWhoChange('La niña')}
                    />
                    <ButtonRadio
                      text="El niño"
                      isSelected={selectedWho === 'El niño'}
                      onClick={() => handleWhoChange('El niño')}
                    />
                    <ButtonRadio
                      text="El perro"
                      isSelected={selectedWho === 'El perro'}
                      onClick={() => handleWhoChange('El perro')}
                    />
                  </div>
                </div>
                {/* Columna ¿QUÉ? */}
                <div className="w-full">
                  <h2 className="mb-4 text-center text-2xl font-bold text-zinc-900">¿QUÉ?</h2>
                  <div className="space-y-4">
                    <ButtonRadio
                      text="Una pelota"
                      isSelected={selectedWhat === 'Una pelota'}
                      onClick={() => handleWhatChange('Una pelota')}
                    />
                    <ButtonRadio
                      text="Un libro"
                      isSelected={selectedWhat === 'Un libro'}
                      onClick={() => handleWhatChange('Un libro')}
                    />
                    <ButtonRadio
                      text="Un juguete"
                      isSelected={selectedWhat === 'Un juguete'}
                      onClick={() => handleWhatChange('Un juguete')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-zinc-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-lg px-4 py-3 md:px-8">
            <div className="flex justify-between">
              <button
                onClick={handlePreviousClick}
                className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-xl bg-zinc-200 py-3 px-5 text-base font-bold text-zinc-600 transition-colors hover:bg-zinc-300"
              >
                <span>Anterior</span>
              </button>
              <button
                onClick={handleNextClick}
                className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-xl bg-[var(--accent-color)] py-3 px-5 text-base font-bold text-white transition-colors hover:bg-orange-600"
              >
                <span>Siguiente</span>
              </button>
            </div>
          </div>
        </nav>
      </main>
    </div>
  );
};

// Componente auxiliar para los botones de radio personalizados
const ButtonRadio = ({ text, isSelected, onClick }) => {
  const baseClasses = "flex w-full items-center justify-center rounded-xl p-6 text-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)]";
  const defaultClasses = "border border-zinc-200 bg-white font-medium text-zinc-900 shadow-sm hover:bg-zinc-50";
  const selectedClasses = "border-2 border-[var(--accent-color)] bg-orange-50 font-bold text-zinc-900 shadow-md ring-2 ring-[var(--accent-color)] ring-offset-2";

  return (
    <button
      className={`${baseClasses} ${isSelected ? selectedClasses : defaultClasses}`}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default ActionSelection;