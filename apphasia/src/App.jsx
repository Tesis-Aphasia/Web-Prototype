// src/App.js
import React, { useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebaseConfig";

import ContextSelection from "./components/Start/ContextSelection";
import ActionSelection from "./components/Phase1/ActionSelection";
import SentenceExpansion from "./components/Phase2/SentenceExpansion";
import SentenceEvaluation from "./components/Phase3/SentenceEvaluation";
import Conclusion from "./components/Conclusion/Conclusion";
import TherapistReviewPage from "./components/Therapist/TherapistReviewPage";
import RegisterPatient from "./components/Patient/RegisterPatient";
import SRPractice from "./components/SpacedRetrieval/SRPractice";

import "./index.css";

function App() {
  // --- estados globales ---
  const [mode, setMode] = useState(null); // "user" | "therapist"
  const [patientView, setPatientView] = useState("login"); // "login" | "register" | "registerForm" | "menu" | "vnest" | "sr"

  const [userId, setUserId] = useState(localStorage.getItem("patientId") || "");
  const [tempId, setTempId] = useState(""); // <-- ¡mover aquí fue la clave!
  const [patientExists, setPatientExists] = useState(false);
  const [error, setError] = useState("");

  // --- estados VNeST ---
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedContext, setSelectedContext] = useState(null);
  const [selectedActionDetails, setSelectedActionDetails] = useState(null);
  const [sentenceExpansionDetails, setSentenceExpansionDetails] = useState(null);
  const [evaluatedSentences, setEvaluatedSentences] = useState([]);

  // ---- Flujo VNeST ----
  const handleContextSelectionNext = (exerciseData) => {
    setSelectedContext(exerciseData.context_hint);
    setSelectedActionDetails(exerciseData);
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

  const renderVNeSTFlow = () => {
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

  // ---- Verificar paciente en Firestore ----
  const checkPatient = async () => {
    if (!userId) {
      setError("Debes ingresar un ID de paciente");
      return;
    }
    try {
      const ref = doc(db, "patients", userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPatientExists(true);
        setError("");
        localStorage.setItem("patientId", userId);
        setPatientView("menu");
      } else {
        setError("No existe un paciente con ese ID");
        setPatientExists(false);
      }
    } catch (err) {
      setError("Error consultando paciente");
      console.error(err);
    }
  };

  // ---- Landing: seleccionar modo ----
  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold mb-6">Selecciona modo</h1>
          <div className="space-y-4">
            <button
              onClick={() => {
                setMode("user");
                setPatientView("login");
              }}
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

  // ---- Modo terapeuta ----
  if (mode === "therapist") {
    return <TherapistReviewPage />;
  }

  // ---- Modo usuario: login de paciente ----
  if (patientView === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold mb-6">Ingreso Paciente</h1>
          <div className="space-y-4 text-left">
            <label htmlFor="patientId" className="block text-sm font-semibold text-gray-700">
              ID de Paciente
            </label>
            <input
              id="patientId"
              type="text"
              placeholder="Ej: paciente001"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              onClick={checkPatient}
              className="w-full btn btn-primary py-3 rounded-lg font-semibold"
            >
              Entrar
            </button>

            <p className="text-center text-sm text-gray-600 mt-4">
              ¿No tienes un paciente registrado?{" "}
              <span
                onClick={() => {
                  setTempId("");              // limpiar el buffer del nuevo ID
                  setPatientView("register"); // ir a pantalla para escribir ID
                }}
                className="text-orange-600 font-semibold cursor-pointer"
              >
                Crear nuevo
              </span>
            </p>

            <button
              onClick={() => setMode(null)}
              className="btn-back mt-4"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Pantalla para pedir ID antes de registro ----
  if (patientView === "register") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Crear nuevo paciente</h2>
          <p className="text-gray-600 mb-4">
            Ingresa un identificador único para este paciente.
            Guárdalo bien, ya que lo necesitarás para iniciar sesión.
          </p>

          <input
            type="text"
            placeholder="Ej: paciente001"
            value={tempId}
            onChange={(e) => setTempId(e.target.value)}
            className="w-full border rounded-lg p-2 mb-4"
          />

          <button
            disabled={!tempId.trim()}
            onClick={() => {
              setUserId(tempId.trim());      // este será el docId en Firestore
              setPatientView("registerForm");
            }}
            className="w-full btn btn-primary py-3 rounded-lg font-semibold"
          >
            Continuar
          </button>

          <button
            onClick={() => setPatientView("login")}
            className="btn-back mt-4"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // ---- Formulario real de registro ----
  if (patientView === "registerForm") {
    return (
      <RegisterPatient
        userId={userId}
        onDone={() => setPatientView("login")}
      />
    );
  }

  // ---- Menú de ejercicios (solo si existe paciente válido) ----
  if (patientView === "menu" && patientExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold mb-6">Elige un ejercicio</h1>
          <div className="space-y-4">
            <button
              onClick={() => {
                setPatientView("vnest");
                setCurrentStep(1);
              }}
              className="w-full btn btn-primary py-3 rounded-lg font-semibold"
            >
              Ejercicios VNeST
            </button>
            <button
              onClick={() => setPatientView("sr")}
              className="w-full btn btn-primary py-3 rounded-lg font-semibold"
            >
              Ejercicios de Memoria (SR)
            </button>
            <button
              onClick={() => {
                setPatientExists(false);
                setPatientView("login");
              }}
              className="btn-back"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Spaced Retrieval ----
  if (patientView === "sr") {
    return <SRPractice userId={userId} onExit={() => setPatientView("menu")} />;
  }

  // ---- VNeST ----
  if (patientView === "vnest") {
    return <div className="App">{renderVNeSTFlow()}</div>;
  }

  return <div>Página no encontrada</div>;
}

export default App;
