import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import ExerciseEditor from "./ExerciseEditor";
import "./EjerciciosTerapeuta.css";

const EjerciciosTerapeuta = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showVnestEditor, setShowVnestEditor] = useState(false);
  const [showSREditor, setShowSREditor] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "exercises"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setExercises(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleEdit = (exercise) => {
    setSelectedExercise(exercise);
    if (exercise.tipo === "SR") setShowSREditor(true);
    else setShowVnestEditor(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este ejercicio?")) {
      await deleteDoc(doc(db, "exercises", id));
    }
  };

  const handleCloseEditor = (updated) => {
    setShowVnestEditor(false);
    setShowSREditor(false);
    setSelectedExercise(null);
    if (updated) console.log("Ejercicio actualizado.");
  };

  const handleGenerateNew = () => {
    alert("✨ Aquí se abriría el flujo de generación con IA");
  };

  return (
    <div className="ejercicios-container">
      {/* === NAVBAR === */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3 px-4 fixed-top">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <h3
            className="fw-bold text-primary m-0 cursor-pointer"
            onClick={() => navigate("/dashboard")}
            style={{ cursor: "pointer" }}
          >
            Rehabilita
          </h3>

          <ul className="nav d-none d-md-flex gap-4">
            <li className="nav-item">
              <button
                onClick={() => navigate("/dashboard")}
                className="nav-link fw-semibold text-dark"
              >
                Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => navigate("/pacientes")}
                className="nav-link fw-semibold text-dark"
              >
                Pacientes
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => navigate("/ejercicios")}
                className="nav-link fw-semibold text-primary border-bottom border-2 border-primary"
              >
                Ejercicios
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => navigate("/ajustes")}
                className="nav-link fw-semibold text-dark"
              >
                Ajustes
              </button>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            <span className="fw-semibold">
              {localStorage.getItem("terapeutaEmail")}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem("terapeutaEmail");
                navigate("/");
              }}
              className="btn btn-sm btn-outline-primary fw-semibold ms-2"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* === CONTENIDO === */}
      <main className="container py-5 mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-dark mb-0">Gestión de Ejercicios</h2>
          <button
            onClick={handleGenerateNew}
            className="btn btn-primary fw-semibold d-flex align-items-center gap-2"
          >
            <i className="bi bi-plus-lg"></i> Nuevo ejercicio
          </button>
        </div>

        <div className="card shadow-sm border-0 rounded-4">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Título / Verbo</th>
                  <th>Tipo</th>
                  <th>Nivel</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((e) => (
                  <tr key={e.id} className="table-row">
                    <td>{e.verbo || e.titulo || "—"}</td>
                    <td>{e.tipo || "VNeST"}</td>
                    <td>{e.nivel || "—"}</td>
                    <td>
                      {e.reviewed ? (
                        <span className="badge bg-success-subtle text-success px-3 py-2">
                          Aprobado
                        </span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning px-3 py-2">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-3">
                        <button
                          className="text-primary fw-semibold border-0 bg-transparent"
                          onClick={() => handleEdit(e)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-danger fw-semibold border-0 bg-transparent"
                          onClick={() => handleDelete(e.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {exercises.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No hay ejercicios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* === EDITORES === */}
      {showVnestEditor && selectedExercise && (
        <ExerciseEditor
          open={showVnestEditor}
          onClose={handleCloseEditor}
          exercise={selectedExercise}
        />
      )}
      {showSREditor && selectedExercise && (
        <SREditor
          open={showSREditor}
          onClose={handleCloseEditor}
          exercise={selectedExercise}
        />
      )}
    </div>
  );
};

export default EjerciciosTerapeuta;
