// src/components/therapist/ExerciseEditor.jsx
import React, { useEffect, useMemo, useState } from "react";
import { updateExercise } from "../../services/firestore";
import "./therapist.css";

const NIVELES = ["facil", "medio", "dificil"];

export default function ExerciseEditor({ open, onClose, exercise }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    verbo: "",
    nivel: "facil",
    context_hint: "",
    reviewed: false,
    pares: [],
    oraciones: Array.from({ length: 10 }, () => ({ oracion: "", correcta: false })),
  });

  useEffect(() => {
    if (!exercise) return;
    setForm({
      verbo: exercise.verbo || "",
      nivel: exercise.nivel || "facil",
      context_hint: exercise.context_hint || "",
      reviewed: Boolean(exercise.reviewed),
      pares: exercise.pares || [],
      oraciones: (exercise.oraciones || []).map((o) => ({
        oracion: o.oracion || "",
        correcta: Boolean(o.correcta),
      })),
    });
  }, [exercise]);

  const canSave = useMemo(() => {
    if (!form.verbo.trim()) return false;
    if (!NIVELES.includes(form.nivel)) return false;
    if (!Array.isArray(form.oraciones) || form.oraciones.length !== 10) return false;
    if (form.oraciones.some((o) => !o.oracion.trim())) return false;
    return true;
  }, [form]);

  const handleOracionChange = (idx, field, value) => {
    setForm((prev) => {
      const arr = [...prev.oraciones];
      arr[idx] = { ...arr[idx], [field]: field === "correcta" ? Boolean(value) : value };
      return { ...prev, oraciones: arr };
    });
  };

  const handleParChange = (idx, field, value) => {
    setForm((prev) => {
      const arr = [...prev.pares];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, pares: arr };
    });
  };

  const handleExpChange = (idx, k, optIdx, value) => {
    setForm((prev) => {
      const arr = [...prev.pares];
      const exp = arr[idx].expansiones || {};
      const opciones = exp[k]?.opciones || [];
      arr[idx] = {
        ...arr[idx],
        expansiones: {
          ...exp,
          [k]: {
            ...exp[k],
            opciones: opciones.map((o, j) => (j === optIdx ? value : o)),
          },
        },
      };
      return { ...prev, pares: arr };
    });
  };

  const handleSave = async () => {
    if (!exercise) return;
    setError("");
    setSaving(true);
    try {
      await updateExercise(exercise.id, {
        verbo: form.verbo.trim(),
        nivel: form.nivel,
        context_hint: form.context_hint.trim(),
        reviewed: Boolean(form.reviewed),
        pares: form.pares,
        oraciones: form.oraciones,
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
          <h3 className="modal__title">Revisión de ejercicio</h3>
          <button className="btn btn-ghost" onClick={() => onClose(false)} aria-label="Cerrar">
            ✕
          </button>
        </header>

        <main className="modal__body space-y-6">
          {/* Campos principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Verbo</label>
              <input
                className="input"
                value={form.verbo}
                onChange={(e) => setForm((p) => ({ ...p, verbo: e.target.value }))}
                placeholder="comprar"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Nivel</label>
              <select
                className="select"
                value={form.nivel}
                onChange={(e) => setForm((p) => ({ ...p, nivel: e.target.value }))}
              >
                {NIVELES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Contexto</label>
              <input
                className="input"
                value={form.context_hint}
                onChange={(e) => setForm((p) => ({ ...p, context_hint: e.target.value }))}
                placeholder="hacer mercado"
              />
            </div>
          </div>

          {/* Toggle revisado */}
          <div className="flex items-center gap-3">
            <input
              id="reviewed"
              type="checkbox"
              className="w-5 h-5"
              checked={form.reviewed}
              onChange={(e) => setForm((p) => ({ ...p, reviewed: e.target.checked }))}
            />
            <label htmlFor="reviewed" className="text-sm font-medium">Marcar como revisado</label>
          </div>

          {/* Pares (editables) */}
          <section>
            <h4 className="font-bold text-lg mb-2">Pares (editables)</h4>
            <div className="grid gap-3">
              {form.pares.map((p, idx) => (
                <div key={idx} className="card">
                  <div className="card__body space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-muted">Sujeto</label>
                      <input
                        className="input"
                        value={p.sujeto}
                        onChange={(e) => handleParChange(idx, "sujeto", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted">Objeto</label>
                      <input
                        className="input"
                        value={p.objeto}
                        onChange={(e) => handleParChange(idx, "objeto", e.target.value)}
                      />
                    </div>
                    {["donde", "por_que", "cuando"].map((k) => (
                      <div key={k}>
                        <label className="text-xs font-semibold text-muted block mb-1">
                          {k.replace("_", " ").toUpperCase()}
                        </label>
                        {p.expansiones?.[k]?.opciones?.map((opt, i) => (
                          <input
                            key={i}
                            className="input mb-1"
                            value={opt}
                            onChange={(e) => handleExpChange(idx, k, i, e.target.value)}
                          />
                        ))}
                        <div className="text-xs text-muted">
                          Correcta: {p.expansiones?.[k]?.opcion_correcta}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Oraciones (editables) */}
          <section>
            <h4 className="font-bold text-lg mb-2">Oraciones (10)</h4>
            <div className="grid gap-2">
              {form.oraciones.map((o, idx) => (
                <div key={idx} className="sentence-row">
                  <input
                    type="checkbox"
                    checked={o.correcta}
                    onChange={(e) => handleOracionChange(idx, "correcta", e.target.checked)}
                  />
                  <input
                    className="input"
                    value={o.oracion}
                    onChange={(e) => handleOracionChange(idx, "oracion", e.target.value)}
                    placeholder={`Oración ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 text-red-800 px-3 py-2">
              {error}
            </div>
          )}
        </main>

        <footer className="modal__footer">
          <button onClick={() => onClose(false)} className="btn btn-ghost">Cancelar</button>
          <button
            disabled={!canSave || saving}
            onClick={handleSave}
            className="btn btn-primary disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </footer>
      </div>
    </div>
  );
}
