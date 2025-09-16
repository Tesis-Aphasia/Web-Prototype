// src/components/therapist/ExerciseListItem.jsx
import React from "react";
import "./therapist.css";

export default function ExerciseListItem({ item, onOpen }) {
  const pillClass = item.reviewed ? "pill pill-reviewed" : "pill pill-pending";

  return (
    <button onClick={() => onOpen(item)} className="exercise-item">
      <div className={pillClass}>
        {item.reviewed ? "Revisado" : "Pendiente"}
      </div>

      <div className="exercise-info">
        <div className="exercise-title">
          {item.verbo} <span className="nivel">/ {item.nivel}</span>
        </div>

        <div className="exercise-context">
          Contexto: <span>{item.context_hint || "—"}</span>
        </div>

        <div className="exercise-meta">
          Pares: <span>{item.pares?.length || 0}</span> · Oraciones:{" "}
          <span>{item.oraciones?.length || 0}</span>
        </div>
      </div>

      <div className="exercise-action">Editar</div>
    </button>
  );
}
