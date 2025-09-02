import React from "react";
import "./Conclusion.css"; // reutiliza el estilo de phone-frame definido antes

const Conclusion = ({ onRestart, selectedContext, selectedActionDetails, sentenceExpansionDetails, evaluatedSentences }) => {
  // Obtenemos el verbo trabajado (el que salió en ActionSelection)
  const workedVerb = selectedActionDetails?.action || "—";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="phone-frame">
        <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold text-[var(--orange-accent)] mb-6">
            🎉 ¡Felicidades!
          </h1>
          <p className="text-lg text-gray-700 mb-4">
            Has completado el ejercicio de VNeST.
          </p>

          {/* Resumen */}
          <div className="w-full bg-amber-50 rounded-xl p-4 text-left mb-6">
            <p className="mb-2">
              <span className="font-bold">Contexto inicial:</span> {selectedContext || "—"}
            </p>
            <p className="mb-2">
              <span className="font-bold">Acción:</span>{" "}
              {selectedActionDetails?.who} {workedVerb} {selectedActionDetails?.what}
            </p>
            <p className="mb-2">
              <span className="font-bold">Oración expandida:</span>{" "}
              {sentenceExpansionDetails?.where} {sentenceExpansionDetails?.why}{" "}
              {sentenceExpansionDetails?.when}
            </p>
            <p className="mb-2">
              <span className="font-bold">Verbo trabajado:</span> {workedVerb}
            </p>
          </div>

          {/* Oraciones aceptadas */}
          {evaluatedSentences?.length > 0 && (
            <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 text-left">
              <h2 className="text-xl font-bold mb-2 text-gray-800">
                ✅ Oraciones aceptadas:
              </h2>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                {evaluatedSentences.map((s) => (
                  <li key={s.id}>
                    {s.subject} {s.verb} {s.complement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Botón reinicio */}
          <button
            onClick={onRestart}
            className="w-full rounded-lg bg-[var(--orange-accent)] text-white font-bold py-3 cursor-pointer hover:brightness-95 active:scale-[0.98] transition"
          >
            Empezar de nuevo
          </button>
        </main>
      </div>
    </div>
  );
};

export default Conclusion;
