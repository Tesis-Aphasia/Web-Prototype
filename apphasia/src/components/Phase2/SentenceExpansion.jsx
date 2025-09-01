import React, { useState, useEffect } from 'react';
import './SentenceExpansion.css'; // Importa el CSS específico

const SentenceExpansion = ({ onNext, onPrevious, selectedContext, selectedActionDetails }) => {
  // Estados para las selecciones de cada categoría
  const [selectedWhere, setSelectedWhere] = useState('En el parque'); // Default del HTML
  const [selectedWhy, setSelectedWhy] = useState('Para divertirse'); // Default del HTML
  const [selectedWhen, setSelectedWhen] = useState('Por la tarde'); // Default del HTML

  // Un ejemplo de cómo podrías construir la oración base con los datos de las ventanas anteriores
  // Esto es solo un placeholder, la oración real podría ser más compleja.
  const baseSentenceSubject = selectedActionDetails?.who || 'El sujeto';
  const baseSentenceAction = selectedActionDetails?.action || 'hace algo'; // Asumiendo que 'Correr' de la ventana anterior es 'action'
  const fullSentence = `${baseSentenceSubject} ${baseSentenceAction} ${selectedWhere} ${selectedWhy} ${selectedWhen}.`;

  // useEffect para manejar el cambio de fuentes o variables CSS si es necesario
  useEffect(() => {
    // Si necesitas aplicar fuentes o variables CSS específicamente a este componente
    // y no están manejadas globalmente o por Tailwind, podrías hacerlo aquí.
    // Por ejemplo, si Spline Sans solo se usa aquí, podrías importar y aplicar al div principal.
  }, []);

  const handleNextClick = () => {
    onNext({ where: selectedWhere, why: selectedWhy, when: selectedWhen });
  };

  const handlePreviousClick = () => {
    onPrevious();
  };

  // Componente auxiliar para los botones de opción (tarjetas)
  const RadioCard = ({ name, value, isSelected, onChange, children }) => {
    return (
      <label
        className={`card flex items-center justify-center p-4 rounded-lg border-2 text-center cursor-pointer 
                   ${isSelected ? 'active' : ''}`}
      >
        {children}
        <input
          type="radio"
          name={name}
          value={value}
          checked={isSelected}
          onChange={() => onChange(value)}
          className="hidden"
        />
      </label>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">Expande la oración base</h1>
            <p className="text-gray-500 text-center mb-6">Selecciona una opción para cada categoría para completar la oración.</p>
            <div className="w-full">
              <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-gray-700">Progreso</span>
                <span className="text-sm font-medium text-gray-700">3/5</span>
              </div>
              <div className="w-full progress-bar-bg rounded-full h-2.5">
                <div className="progress-bar-fill h-2.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4">1. ¿DÓNDE?</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <RadioCard name="donde" value="en el parque" isSelected={selectedWhere === 'en el parque'} onChange={setSelectedWhere}>
                  En el parque
                </RadioCard>
                <RadioCard name="donde" value="en la biblioteca" isSelected={selectedWhere === 'en la biblioteca'} onChange={setSelectedWhere}>
                  En la biblioteca
                </RadioCard>
                <RadioCard name="donde" value="en casa" isSelected={selectedWhere === 'en casa'} onChange={setSelectedWhere}>
                  En casa
                </RadioCard>
                <RadioCard name="donde" value="en la escuela" isSelected={selectedWhere === 'en la escuela'} onChange={setSelectedWhere}>
                  En la escuela
                </RadioCard>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">2. ¿POR QUÉ?</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <RadioCard name="porque" value="para estudiar" isSelected={selectedWhy === 'para estudiar'} onChange={setSelectedWhy}>
                  Para estudiar
                </RadioCard>
                <RadioCard name="porque" value="para relajarse" isSelected={selectedWhy === 'para relajarse'} onChange={setSelectedWhy}>
                  Para relajarse
                </RadioCard>
                <RadioCard name="porque" value="para divertirse" isSelected={selectedWhy === 'para divertirse'} onChange={setSelectedWhy}>
                  Para divertirse
                </RadioCard>
                <RadioCard name="porque" value="para trabajar" isSelected={selectedWhy === 'para trabajar'} onChange={setSelectedWhy}>
                  Para trabajar
                </RadioCard>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">3. ¿CUÁNDO?</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <RadioCard name="cuando" value="por la mañana" isSelected={selectedWhen === 'por la mañana'} onChange={setSelectedWhen}>
                  Por la mañana
                </RadioCard>
                <RadioCard name="cuando" value="por la tarde" isSelected={selectedWhen === 'por la tarde'} onChange={setSelectedWhen}>
                  Por la tarde
                </RadioCard>
                <RadioCard name="cuando" value="por la noche" isSelected={selectedWhen === 'por la noche'} onChange={setSelectedWhen}>
                  Por la noche
                </RadioCard>
                <RadioCard name="cuando" value="el fin de semana" isSelected={selectedWhen === 'el fin de semana'} onChange={setSelectedWhen}>
                  El fin de semana
                </RadioCard>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-50 rounded-lg p-4 mb-4 text-center">
            <h3 className="font-bold text-lg mb-2 text-gray-800">Oración completa:</h3>
            <p className="text-gray-700 text-lg">
              {/* Aquí usamos los estados y los props para construir la oración dinámicamente */}
              <span className="font-bold text-[var(--primary-color)]">
                {baseSentenceSubject} {baseSentenceAction}
              </span>{' '}
              <span className="font-bold text-[var(--primary-color)]">{selectedWhere}</span>{' '}
              <span className="font-bold text-[var(--primary-color)]">{selectedWhy}</span>{' '}
              <span className="font-bold text-[var(--primary-color)]">{selectedWhen}</span>.
            </p>
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={handlePreviousClick}
              className="btn-secondary font-bold py-3 px-6 rounded-full text-lg"
            >
              Anterior
            </button>
            <button
              onClick={handleNextClick}
              className="btn-primary font-bold py-3 px-6 rounded-full text-lg"
            >
              Siguiente
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SentenceExpansion;