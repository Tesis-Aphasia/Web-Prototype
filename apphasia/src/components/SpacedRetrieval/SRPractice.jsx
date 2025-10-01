// src/components/spacedretrieval/SRPractice.jsx
import React, { useEffect, useMemo, useState } from "react";
import { subscribeSRCards, updateSRCard } from "../../services/spacedRetrieval";
import { computeNext, consolidateBaseline, getIntervals } from "../../utils/srEngine";
import "./sr.css";

function SRPractice({ userId, onExit }) {
  const [cards, setCards] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const current = useMemo(
    () => cards.find((c) => c.id === currentId) || null,
    [cards, currentId]
  );

  // estado local de la tarjeta actual
  const [cardState, setCardState] = useState(null);

  // UI state
  const [mode, setMode] = useState("question"); // "question" | "timer" | "doneCard"
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);

  // suscribirse a tarjetas desde Firestore
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeSRCards(userId, (arr) => {
      setCards(arr);
      if (!currentId && arr.length) {
        setCurrentId(arr[0].id);
        // inicializar estado para nueva tarjeta
        setCardState({
          ...arr[0],
          baseline_index: -1, // ningún acierto consolidado aún
          interval_index: 0,  // preparado arranca en 15s
          success_streak: 0,
          lapses: 0,
          last_answer_correct: null,
          last_timer_index: null,
        });
        setMode("question");
        setTyped("");
        setFeedback("");
        setSecondsLeft(0);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentId]);

  // efecto para countdown
  useEffect(() => {
    if (mode !== "timer") return;
    if (secondsLeft <= 0) {
      onTimerFinished();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, secondsLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!current || !cardState) return;

    const userAns = (typed || "").trim().toLowerCase();
    const correctAns = (current.answer || "").trim().toLowerCase();
    const isCorrect = userAns === correctAns;

    setTyped("");

    // aplicar la lógica de SR
    const updated = computeNext(cardState, isCorrect);
    setCardState(updated);
    setSecondsLeft(updated.current_interval);
    setMode("timer");
    setFeedback(isCorrect ? "✅ Correcto" : `❌ Incorrecto. Respuesta: ${current.answer || "—"}`);

    // persistir cambios básicos en Firestore
    try {
      await updateSRCard(current.id, {
        interval_index: updated.interval_index,
        baseline_index: updated.baseline_index,
        success_streak: updated.success_streak,
        lapses: updated.lapses,
        next_due: updated.next_due,
        status: updated.status,
      });
    } catch (err) {
      console.error("updateSRCard error:", err);
    }
  };

  const onTimerFinished = () => {
    if (!cardState) return;
    // consolidar baseline si fue un acierto
    let consolidated = consolidateBaseline(cardState);
    setCardState(consolidated);

    // si completó el de 240s y fue correcto → fin
    if (
      consolidated.last_answer_correct &&
      consolidated.last_timer_index === getIntervals().length - 1
    ) {
      setMode("doneCard");
      return;
    }

    // volver a preguntar
    setMode("question");
    setFeedback("");
  };

  if (!current || !cardState) {
    return (
      <div className="sr-container">
        <div className="sr-card">
          <h2 className="sr-title">No hay ejercicios todavía 😊</h2>
          <button onClick={onExit} className="btn btn-beige">
            Volver
          </button>
        </div>
      </div>
    );
  }

  // encabezado dinámico
  const intervals = getIntervals();
  const header =
    mode === "timer"
      ? `Intervalo actual: ${intervals[cardState.last_timer_index ?? Math.max(cardState.baseline_index, 0)]}s`
      : `Base: ${intervals[Math.max(cardState.baseline_index, 0)]}s — Próximo si aciertas: ${intervals[cardState.interval_index]}s`;

  return (
    <div className="sr-container">
      <div className="sr-card">
        <div style={{ marginBottom: "0.75rem", color: "#6b7280", fontSize: "0.95rem" }}>
          {header}
        </div>

        {mode === "question" && (
          <>
            <h2 className="sr-title">{current.stimulus}</h2>
            <form onSubmit={handleSubmit} className="sr-form">
              <input
                type="text"
                className="sr-input"
                placeholder="Escribe tu respuesta"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary mt-2">
                Enviar
              </button>
            </form>
            {feedback && <p className="sr-subtitle mt-2">{feedback}</p>}
          </>
        )}

        {mode === "timer" && (
          <>
            <h2 className="sr-title">{feedback || "⏳ Espera…"}</h2>
            <p className="sr-subtitle">
              Repetiremos esta pregunta en <b>{secondsLeft}</b> segundos
            </p>
          </>
        )}

        {mode === "doneCard" && (
          <>
            <h2 className="sr-title">🎉 ¡Completaste esta pregunta!</h2>
            <p className="sr-subtitle">Has superado el último intervalo (240s).</p>
            <div className="sr-actions" style={{ justifyContent: "center" }}>
              <button onClick={onExit} className="btn btn-primary">
                Volver
              </button>
            </div>
          </>
        )}

        <button onClick={onExit} className="btn btn-beige sr-exit mt-4">
          Salir
        </button>
      </div>
    </div>
  );
}

export default SRPractice;
