// src/App.js
import React, { useState } from 'react';
import ContextSelection from './components/Start/ContextSelection';
import ActionSelection from './components/Phase1/ActionSelection';
import SentenceExpansion from './components/Phase2/SentenceExpansion';
import SentenceEvaluation from './components/Phase3/SentenceEvaluation'; // Importa el nuevo componente
import './index.css'; // Asegúrate de tener tu CSS global/Tailwind configurado

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedContext, setSelectedContext] = useState(null);
  const [selectedActionDetails, setSelectedActionDetails] = useState(null);
  const [sentenceExpansionDetails, setSentenceExpansionDetails] = useState(null);
  const [evaluatedSentences, setEvaluatedSentences] = useState([]); // Nuevo estado para esta ventana

  const handleContextSelectionNext = (context) => {
    setSelectedContext(context);
    setCurrentStep(2);
    console.log("Contexto seleccionado:", context);
  };

  const handleActionSelectionNext = (details) => {
    setSelectedActionDetails(details);
    setCurrentStep(3);
    console.log("Acción seleccionada:", details);
  };

  const handleActionSelectionPrevious = () => {
    setCurrentStep(1);
  };

  const handleSentenceExpansionNext = (details) => {
    setSentenceExpansionDetails(details);
    setCurrentStep(4);
    console.log("Expansión de oración:", details);
  };

  const handleSentenceExpansionPrevious = () => {
    setCurrentStep(2);
  };

  const handleSentenceEvaluationNext = (acceptedSentences) => {
    setEvaluatedSentences(acceptedSentences);
    setCurrentStep(5); // Hemos añadido un paso 5 para el "final"
    console.log("Oraciones evaluadas y aceptadas:", acceptedSentences);
  };

  const handleSentenceEvaluationPrevious = () => {
    setCurrentStep(3); // Vuelve al paso 3
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <ContextSelection onNext={handleContextSelectionNext} />;
      case 2:
        return (
          <ActionSelection
            onNext={handleActionSelectionNext}
            onPrevious={handleActionSelectionPrevious}
            selectedContext={selectedContext}
          />
        );
      case 3:
        return (
          <SentenceExpansion
            onNext={handleSentenceExpansionNext}
            onPrevious={handleSentenceExpansionPrevious}
            selectedContext={selectedContext}
            selectedActionDetails={selectedActionDetails}
          />
        );
      case 4:
        return (
          <SentenceEvaluation
            onNext={handleSentenceEvaluationNext}
            onPrevious={handleSentenceEvaluationPrevious}
            previousData={{ selectedContext, selectedActionDetails, sentenceExpansionDetails }}
          />
        );
      case 5:
        // Pantalla final o resumen
        return (
          <div className="flex flex-col min-h-screen items-center justify-center p-4">
            <h2 className="text-3xl font-bold text-center mb-6">¡Felicidades, has completado el ejercicio!</h2>
            <p className="text-lg text-gray-700 mb-2">Contexto inicial: <span className="font-semibold">{selectedContext || 'N/A'}</span></p>
            <p className="text-lg text-gray-700 mb-2">Acción: <span className="font-semibold">{selectedActionDetails?.who} {selectedActionDetails?.what}</span></p>
            <p className="text-lg text-gray-700 mb-4">Oración expandida: <span className="font-semibold">{sentenceExpansionDetails?.where} {sentenceExpansionDetails?.why} {sentenceExpansionDetails?.when}</span></p>

            {evaluatedSentences.length > 0 && (
              <>
                <h3 className="text-xl font-bold mt-6 mb-3">Oraciones evaluadas y aceptadas:</h3>
                <ul className="list-disc pl-5 text-gray-800">
                  {evaluatedSentences.map(s => (
                    <li key={s.id}>{s.subject} {s.verb} {s.complement}</li>
                  ))}
                </ul>
              </>
            )}

            <button onClick={() => setCurrentStep(1)} className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-full text-lg hover:bg-blue-700 transition-colors">Empezar de nuevo</button>
          </div>
        );
      default:
        return <div>Página no encontrada</div>;
    }
  };

  return (
    <div className="App">
      {renderCurrentStep()}
    </div>
  );
}

export default App;