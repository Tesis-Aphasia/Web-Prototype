// src/pages/TherapistReviewPage.jsx
import React, { useEffect, useState } from "react";
import ExerciseListItem from "./ExerciseListItem";
import ExerciseEditor from "./ExerciseEditor";
import { subscribeExercises } from "../../services/firestore";
// 1) importa los estilos del dashboard
import "./therapist.css";

const niveles = ["", "facil", "medio", "dificil"];

export default function TherapistReviewPage() {
  const [filters, setFilters] = useState({ verbo: "", nivel: "", reviewed: null });
  const [items, setItems] = useState([]);
  const [openEditor, setOpenEditor] = useState(false);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    const unsub = subscribeExercises(filters, setItems);
    return () => unsub && unsub();
  }, [filters]);

  const open = (item) => {
    setCurrent(item);
    setOpenEditor(true);
  };

  const close = () => {
    setOpenEditor(false);
    setCurrent(null);
  };

  return (
    <div className="dash">{/* 2) layout principal de dashboard */}
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <div className="dash-brand__logo" />
          <div className="dash-brand__title">Aphasia · Revisión</div>
        </div>

        <div className="nav-group">
          <div className="nav-label">Panel</div>
          <a className="nav-link is-active" href="#/therapist">Ejercicios</a>
          <a className="nav-link" href="#/stats">Estadísticas</a>
        </div>
      </aside>

      {/* Header */}
      <header className="dash-header">
        <h1 className="header-title">Revisión de ejercicios</h1>
        <div className="header-actions">
          <span className="chip">Total: {items.length}</span>
          <button className="btn btn-primary" onClick={() => setFilters({ verbo: "", nivel: "", reviewed: null })}>
            Limpiar filtros
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="dash-main">
        {/* 3) Toolbar de filtros */}
        <div className="toolbar">
          <div className="field field--wide">
            <input
              className="input"
              placeholder="Filtrar por verbo (ej. comprar)"
              value={filters.verbo}
              onChange={(e) => setFilters((f) => ({ ...f, verbo: e.target.value.trim() }))}
            />
          </div>

          <div className="field">
            <select
              className="select"
              value={filters.nivel}
              onChange={(e) => setFilters((f) => ({ ...f, nivel: e.target.value }))}
            >
              {niveles.map((n) => (
                <option key={n} value={n}>
                  {n ? `Nivel: ${n}` : "Todos los niveles"}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <select
              className="select"
              value={String(filters.reviewed)}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((f) => ({
                  ...f,
                  reviewed: val === "null" ? null : val === "true",
                }));
              }}
            >
              <option value="null">Todos</option>
              <option value="false">Pendientes</option>
              <option value="true">Revisados</option>
            </select>
          </div>

          <div className="field">
            <button
              className="btn btn-ghost w-full"
              onClick={() => setFilters({ verbo: "", nivel: "", reviewed: null })}
            >
              Reset
            </button>
          </div>
        </div>

        {/* 4) Tabla de ejercicios usando estilos del dashboard */}
        <div className="table-toolbar">
          <div className="text-muted">
            {filters.reviewed === null ? "Mostrando todos" : filters.reviewed ? "Solo revisados" : "Solo pendientes"}
          </div>
        </div>

        <div className="card">
          <div className="card__body p-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Verbo</th>
                  <th>Nivel</th>
                  <th>Contexto</th>
                  <th>Pairs</th>
                  <th>Oraciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>
                      <span className={`pill ${it.reviewed ? "pill--reviewed" : "pill--pending"}`}>
                        {it.reviewed ? "Revisado" : "Pendiente"}
                      </span>
                    </td>
                    <td><span className="chip">{it.verbo || "—"}</span></td>
                    <td><span className="chip">{it.nivel || "—"}</span></td>
                    <td className="text-muted">{it.context_hint || "—"}</td>
                    <td className="text-muted">{it.pares?.length || 0}</td>
                    <td className="text-muted">{it.oraciones?.length || 0}</td>
                    <td>
                      <button className="btn" onClick={() => open(it)}>Abrir</button>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-10">
                      No hay ejercicios con estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>


        <div className="pagination mt-3">
          <button className="page-btn" disabled>‹</button>
          <button className="page-btn">›</button>
        </div>
        
      </main>

      {/* Modal editor (reutiliza tu componente) */}
      <ExerciseEditor open={openEditor} onClose={close} exercise={current} />
    </div>
  );
}
