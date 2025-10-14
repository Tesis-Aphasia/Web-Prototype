import React, { useEffect, useState } from "react";
import { updateExercise } from "../../services/firestore";
import "./therapist.css";

export default function SREditor({ open, onClose, exercise }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ pregunta: "", respuesta: "", reviewed: false });

  useEffect(() => {
    if (exercise)
      setForm({
        pregunta: exercise.pregunta || "",
        respuesta: exercise.respuesta || "",
        reviewed: Boolean(exercise.reviewed),
      });
  }, [exercise]);

  const handleSave = async () => {
    if (!exercise) return;
    setError("");
    setSaving(true);
    try {
      await updateExercise(exercise.id, {
        pregunta: form.pregunta.trim(),
        respuesta: form.respuesta.trim(),
        reviewed: Boolean(form.reviewed),
      });
      onClose(true);
    } catch (e) {
      setError(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !exercise) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <header className="modal__header">
          <h3 className="modal__title">Editar ejercicio SR</h3>
          <button className="btn btn-ghost" onClick={() => onClose(false)}>✕</button>
        </header>

        <main className="modal__body space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Pregunta</label>
            <input
              className="input"
              value={form.pregunta}
              onChange={(e) => setForm((p) => ({ ...p, pregunta: e.target.value }))}
              placeholder="¿Cómo te llamas?"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Respuesta</label>
            <input
              className="input"
              value={form.respuesta}
              onChange={(e) => setForm((p) => ({ ...p, respuesta: e.target.value }))}
              placeholder="Me llamo Ana"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="reviewed"
              type="checkbox"
              className="w-5 h-5"
              checked={form.reviewed}
              onChange={(e) => setForm((p) => ({ ...p, reviewed: e.target.checked }))}
            />
            <label htmlFor="reviewed" className="text-sm font-medium">
              Marcar como revisado
            </label>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </main>

        <footer className="modal__footer">
          <button onClick={() => onClose(false)} className="btn btn-ghost">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
