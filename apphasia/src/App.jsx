// src/App.js
import React, { useState } from "react";
import ContextSelection from "./components/Start/ContextSelection";
import ActionSelection from "./components/Phase1/ActionSelection";
import SentenceExpansion from "./components/Phase2/SentenceExpansion";
import SentenceEvaluation from "./components/Phase3/SentenceEvaluation";
import Conclusion from "./components/Conclusion/Conclusion";
import "./index.css"; // Asegúrate de tener tu CSS global/Tailwind configurado

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedContext, setSelectedContext] = useState(null);
  const [selectedActionDetails, setSelectedActionDetails] = useState(null);
  const [sentenceExpansionDetails, setSentenceExpansionDetails] =
    useState(null);
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
            previousData={{
              selectedContext,
              selectedActionDetails,
              sentenceExpansionDetails,
            }}
          />
        );
      case 5:
        return (
          <Conclusion
            onRestart={() => setCurrentStep(1)}
            selectedContext={selectedContext}
            selectedActionDetails={selectedActionDetails}
            sentenceExpansionDetails={sentenceExpansionDetails}
            evaluatedSentences={evaluatedSentences}
          />
        );
      default:
        return <div>Página no encontrada</div>;
    }
  };

  return <div className="App">{renderCurrentStep()}</div>;
}

export default App;
