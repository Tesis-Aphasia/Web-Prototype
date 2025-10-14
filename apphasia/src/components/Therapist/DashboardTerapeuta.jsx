import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "./DashboardTerapeuta.css";

const DashboardTerapeuta = () => {
  const navigate = useNavigate();
  const [terapeuta, setTerapeuta] = useState(null);
  const [numPacientes, setNumPacientes] = useState(0);
  const [numPendientes, setNumPendientes] = useState(0);

  useEffect(() => {
    const email = localStorage.getItem("terapeutaEmail");
    if (!email) {
      navigate("/");
      return;
    }

    const fetchTerapeuta = async () => {
      try {
        const ref = doc(db, "terapeutas", email);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setTerapeuta({ id: snap.id, ...snap.data() });

          const pacientesRef = collection(db, "patients");
          const pacientesQuery = query(pacientesRef, where("terapeuta", "==", email));
          const unsubPacientes = onSnapshot(pacientesQuery, (snapshot) =>
            setNumPacientes(snapshot.size)
          );

          const ejerciciosRef = collection(db, "exercises");
          const ejerciciosQuery = query(ejerciciosRef, where("reviewed", "==", false));
          const unsubEjercicios = onSnapshot(ejerciciosQuery, (snapshot) =>
            setNumPendientes(snapshot.size)
          );

          return () => {
            unsubPacientes();
            unsubEjercicios();
          };
        }
      } catch (err) {
        console.error("Error al obtener terapeuta:", err);
      }
    };

    fetchTerapeuta();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("terapeutaEmail");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* --- NAVBAR --- */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3 px-4 fixed-top">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <h3
            className="fw-bold text-primary m-0 dashboard-logo"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          >
            Rehabilita
          </h3>

          <ul className="nav d-none d-md-flex gap-4">
            <li className="nav-item">
              <button
                onClick={() => navigate("/dashboard")}
                className="nav-link active fw-semibold text-primary"
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
                className="nav-link fw-semibold text-dark"
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
            {terapeuta ? (
              <div className="d-flex align-items-center gap-2">
                <div className="circle-avatar bg-primary text-white fw-bold">
                  {terapeuta.nombre ? terapeuta.nombre[0].toUpperCase() : "T"}
                </div>
                <span className="fw-semibold">{terapeuta.nombre || terapeuta.id}</span>
              </div>
            ) : (
              <span className="text-muted small">Cargando...</span>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-primary fw-semibold ms-3"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* --- CONTENIDO --- */}
      <main className="container py-5 mt-5">
        <h2 className="fw-bold mb-5 text-dark">Dashboard</h2>

        <div className="row g-4 justify-content-center">
          {/* Card 1 */}
          <div className="col-md-5">
            <div className="card dashboard-card p-4 shadow-sm border-0">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="fw-semibold text-secondary mb-1">Pacientes asociados</p>
                  <h1 className="fw-bold text-primary">{numPacientes}</h1>
                </div>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/387/387561.png"
                  alt="Pacientes"
                  className="dashboard-icon"
                />
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="col-md-5">
            <div className="card dashboard-card p-4 shadow-sm border-0">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="fw-semibold text-secondary mb-1">Ejercicios por revisar</p>
                  <h1 className="fw-bold text-primary">{numPendientes}</h1>
                </div>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/2972/2972338.png"
                  alt="Ejercicios"
                  className="dashboard-icon"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardTerapeuta;
