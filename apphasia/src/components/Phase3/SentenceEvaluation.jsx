import React, { useState, useEffect } from 'react';
import './SentenceEvaluation.css'; // Importa el CSS específico

// Componente para una tarjeta de oración individual
const SentenceCard = ({ subject, verb, complement, isSelected, onSelect, onAccept, onReject }) => {
  const baseClasses = "flex cursor-pointer items-center justify-between rounded-lg p-4 shadow-sm transition-all";
  const defaultClasses = "border border-gray-200 bg-white hover:border-[var(--accent-color)] hover:shadow-md";
  const selectedClasses = "border border-[var(--accent-color)] bg-orange-50 shadow-md ring-2 ring-[var(--accent-color)]/20";

  return (
    <div
      className={`${baseClasses} ${isSelected ? selectedClasses : defaultClasses}`}
      onClick={onSelect}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:gap-4 sm:items-center">
        <span className="font-semibold sm:w-40">{subject}</span>
        <span className="text-gray-600 sm:w-40">{verb}</span>
        <span className="text-gray-600 sm:w-48">{complement}</span>
      </div>
      <div className="flex gap-2">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200"
          onClick={(e) => { e.stopPropagation(); onAccept(); }}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
          onClick={(e) => { e.stopPropagation(); onReject(); }}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

const SentenceEvaluation = ({ onNext, onPrevious, previousData }) => {
  // Datos de ejemplo para las oraciones (puedes pasarlos como props o generarlos)
  const [sentences, setSentences] = useState([
    { id: 1, subject: 'The cat', verb: 'is sleeping', complement: 'on the sofa', status: 'pending' },
    { id: 2, subject: 'The children', verb: 'are playing', complement: 'in the park', status: 'pending' },
    { id: 3, subject: 'The chef', verb: 'is cooking', complement: 'a delicious meal', status: 'pending' },
    { id: 4, subject: 'The students', verb: 'are studying', complement: 'for the exam', status: 'pending' },
    { id: 5, subject: 'The artist', verb: 'is painting', complement: 'a beautiful landscape', status: 'pending' },
  ]);

  const [selectedSentenceId, setSelectedSentenceId] = useState(3); // Por defecto el chef está seleccionado

  useEffect(() => {
    // Para la oración del HTML que estaba activa por defecto, marcarla como seleccionada inicialmente.
    // Esto podría ser más dinámico si las oraciones se generan basadas en los datos anteriores.
    // En este ejemplo, se corresponde con el id 3.
  }, []);

  const handleSelectSentence = (id) => {
    setSelectedSentenceId(id);
  };

  const handleAcceptSentence = (id) => {
    setSentences(prevSentences =>
      prevSentences.map(s => (s.id === id ? { ...s, status: 'accepted' } : s))
    );
    // Lógica adicional, por ejemplo, pasar la oración aceptada a la siguiente pantalla
  };

  const handleRejectSentence = (id) => {
    setSentences(prevSentences =>
      prevSentences.map(s => (s.id === id ? { ...s, status: 'rejected' } : s))
    );
    // Lógica adicional
  };

  const handleNextClick = () => {
    // Aquí puedes pasar las oraciones evaluadas o la oración final seleccionada
    onNext(sentences.filter(s => s.status === 'accepted'));
  };

  const handlePreviousClick = () => {
    onPrevious();
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden bg-white text-black">
      <div className="flex h-full grow flex-col" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-100 px-4 py-3 sm:px-10">
          <div className="flex items-center gap-4 text-black">
            <a className="flex items-center gap-2 text-lg font-bold tracking-tight" href="#">
              <svg className="h-6 w-6 text-[var(--accent-color)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>VNeST Practice</span>
            </a>
          </div>
          <button className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-100 text-black hover:bg-gray-200">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.594 3.94c.09-.542.56-1.007 1.11-.95.542.057.955.543.955 1.096v.056c0 .552-.413 1.04-1.007 1.04-.498 0-.955-.386-1.058-.885a1.003 1.003 0 0 1-.002-.11v-.057zM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5zM12 21a8.967 8.967 0 0 1-8.948-8.948 8.967 8.967 0 0 1 8.948-8.948 8.967 8.967 0 0 1 8.948 8.948A8.967 8.967 0 0 1 12 21z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
        </header>

        <main className="flex flex-1 flex-col items-center py-6">
          <div className="w-full max-w-4xl px-4">
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm">
                <p className="font-medium">Phase 3</p>
                <p className="text-gray-500">60%</p> {/* Esto es un valor fijo, se podría hacer dinámico */}
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-[var(--accent-color)]" style={{ width: '60%' }}></div>
              </div>
            </div>
            <h1 className="mb-4 text-2xl font-bold tracking-tight">Evaluate the sentences</h1>
            <div className="space-y-4">
              {sentences.map(sentence => (
                <SentenceCard
                  key={sentence.id}
                  subject={sentence.subject}
                  verb={sentence.verb}
                  complement={sentence.complement}
                  isSelected={selectedSentenceId === sentence.id}
                  onSelect={() => handleSelectSentence(sentence.id)}
                  onAccept={() => handleAcceptSentence(sentence.id)}
                  onReject={() => handleRejectSentence(sentence.id)}
                />
              ))}
            </div>
          </div>
        </main>

        <footer className="sticky bottom-0 border-t border-solid border-gray-100 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-4xl px-4 py-4">
            <div className="flex justify-between gap-4">
              <button
                onClick={handlePreviousClick}
                className="flex h-12 flex-1 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-black text-base font-bold leading-normal tracking-wide transition-colors hover:bg-gray-300"
              >
                <span>Previous</span>
              </button>
              <button
                onClick={handleNextClick}
                className="flex h-12 flex-1 items-center justify-center overflow-hidden rounded-full bg-[var(--accent-color)] text-white text-base font-bold leading-normal tracking-wide transition-colors hover:bg-orange-600"
              >
                <span>Next</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SentenceEvaluation;