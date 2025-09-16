// src/App.js
import React, { useState } from "react";
import ContextSelection from "./components/Start/ContextSelection";
import ActionSelection from "./components/Phase1/ActionSelection";
import SentenceExpansion from "./components/Phase2/SentenceExpansion";
import SentenceEvaluation from "./components/Phase3/SentenceEvaluation";
import Conclusion from "./components/Conclusion/Conclusion";
import TherapistReviewPage from "./components/Therapist/TherapistReviewPage";
import "./index.css";

function App() {
  const [mode, setMode] = useState(null); // null | "user" | "therapist"
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedContext, setSelectedContext] = useState(null);
  const [selectedActionDetails, setSelectedActionDetails] = useState(null);
  const [sentenceExpansionDetails, setSentenceExpansionDetails] = useState(null);
  const [evaluatedSentences, setEvaluatedSentences] = useState([]);

  // ---- Handlers del flujo de usuario ----
  const handleContextSelectionNext = (context) => {
    setSelectedContext(context);
    setCurrentStep(2);
  };
  const handleActionSelectionNext = (details) => {
    setSelectedActionDetails(details);
    setCurrentStep(3);
  };
  const handleActionSelectionPrevious = () => setCurrentStep(1);

  const handleSentenceExpansionNext = (details) => {
    setSentenceExpansionDetails(details);
    setCurrentStep(4);
  };
  const handleSentenceExpansionPrevious = () => setCurrentStep(2);

  const handleSentenceEvaluationNext = (acceptedSentences) => {
    setEvaluatedSentences(acceptedSentences);
    setCurrentStep(5);
  };
  const handleSentenceEvaluationPrevious = () => setCurrentStep(3);

  const renderUserFlow = () => {
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

  // ---- Render principal ----
  if (!mode) {
    // landing inicial
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold mb-6">Selecciona modo</h1>
          <div className="space-y-4">
            <button
              onClick={() => setMode("user")}
              className="w-full btn btn-primary py-3 rounded-lg font-semibold"
            >
              Modo Usuario
            </button>
            <button
              onClick={() => setMode("therapist")}
              className="w-full btn btn-ghost py-3 rounded-lg font-semibold border"
            >
              Modo Terapeuta
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "therapist") {
    return <TherapistReviewPage />;
  }

  // modo usuario
  return <div className="App">{renderUserFlow()}</div>;
}

export default App;
