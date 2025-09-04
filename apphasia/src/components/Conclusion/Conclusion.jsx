// src/components/Conclusion/Conclusion.jsx
import React, { useMemo } from "react";
import "./Conclusion.css";
import { useExercise } from "../../context/ExerciseContext";

const Conclusion = ({
  onRestart,
  selectedContext,
  selectedActionDetails,     // { who, what }
  sentenceExpansionDetails,  // { where, why, when, sentence? }
  evaluatedSentences,        // (no lo mostramos)
}) => {
  const { exercise } = useExercise();
  const verbo = exercise?.verbo ?? "—";
  const who = selectedActionDetails?.who ?? "—";
  const what = selectedActionDetails?.what ?? "—";

  // Oración final: usa la que viene calculada; si no, la arma simple.
  const finalSentence = useMemo(() => {
    if (sentenceExpansionDetails?.sentence) return sentenceExpansionDetails.sentence;
    const parts = [
      who !== "—" ? who : null,
      verbo !== "—" ? verbo : null,
      what !== "—" ? what : null,
      sentenceExpansionDetails?.where,
      sentenceExpansionDetails?.why,
      sentenceExpansionDetails?.when,
    ].filter(Boolean);
    return parts.length ? `${parts.join(" ")}.`.replace(/\s+\./, ".") : "—";
  }, [who, what, verbo, sentenceExpansionDetails]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="phone-frame">
        <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold text-[var(--orange-accent)] mb-6">🎉 ¡Felicidades!</h1>
          <p className="text-lg text-gray-700 mb-4">Has completado el ejercicio de VNeST.</p>

          {/* Resumen compacto */}
          <div className="w-full grid gap-4 mb-6 md:grid-cols-2">
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 text-left">
              <p className="mb-2">
                <span className="font-bold">Contexto:</span> {selectedContext || "—"}
              </p>
              <p className="mb-2">
                <span className="font-bold">Pareja:</span> {who} + {what}
              </p>
              <p className="mb-2">
                <span className="font-bold">Verbo trabajado:</span> {verbo}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 shadow-sm p-4 text-left">
              <p className="font-bold mb-2 text-gray-800">Oración final</p>
              <p className="text-gray-800 text-lg">{finalSentence}</p>
              {/* Si quieres ver también los detalles por separado, descomenta:
              <ul className="mt-2 text-sm text-gray-700 list-disc pl-5">
                <li><b>Dónde:</b> {sentenceExpansionDetails?.where || "—"}</li>
                <li><b>Por qué:</b> {sentenceExpansionDetails?.why || "—"}</li>
                <li><b>Cuándo:</b> {sentenceExpansionDetails?.when || "—"}</li>
              </ul>
              */}
            </div>
          </div>

          {/* CTA */}
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
