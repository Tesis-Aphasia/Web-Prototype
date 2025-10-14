import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "./PacientesTerapeuta.css";

const PacientesTerapeuta = () => {
  const navigate = useNavigate();
  const [terapeutaEmail, setTerapeutaEmail] = useState(
    localStorage.getItem("terapeutaEmail")
  );
  const [pacientes, setPacientes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState({ nombre: "", email: "", edad: "" });

  useEffect(() => {
    if (!terapeutaEmail) {
      navigate("/");
      return;
    }
    const q = query(collection(db, "patients"), where("terapeuta", "==", terapeutaEmail));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPacientes(docs);
    });
    return () => unsub();
  }, [terapeutaEmail, navigate]);

  const handleSelect = (p) => {
    setSelected(p);
    setEditData({
      nombre: p.nombre || "",
      email: p.email || "",
      edad: p.edad || "",
    });
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "patients", selected.id), editData);
      alert("Paciente actualizado con éxito ✅");
    } catch (err) {
      console.error("Error actualizando paciente:", err);
      alert("Error al actualizar ❌");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("terapeutaEmail");
    navigate("/");
  };

  return (
    <div className="pacientes-container">
      {/* NAVBAR */}
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
                className="nav-link fw-semibold text-primary border-bottom border-2 border-primary"
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
            <span className="fw-semibold">{terapeutaEmail}</span>
            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-primary fw-semibold ms-2"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENIDO */}
      <main className="container py-5 mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-dark mb-0">Pacientes</h2>
          <button className="btn btn-primary fw-semibold">
            + Agregar Paciente
          </button>
        </div>

        {/* TABLA */}
        <div className="card shadow-sm border-0 rounded-4 mb-5">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Edad</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={`table-row ${
                      selected?.id === p.id ? "table-active" : ""
                    }`}
                  >
                    <td>{p.nombre || "—"}</td>
                    <td>{p.email || "—"}</td>
                    <td>{p.edad || "—"}</td>
                  </tr>
                ))}
                {pacientes.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center text-muted py-3">
                      No hay pacientes asociados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL DE EDICIÓN */}
        {selected && (
          <div className="card shadow border-0 rounded-4 p-4">
            <h4 className="fw-bold mb-4 text-dark">Editar Paciente</h4>
            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Nombre</label>
                <input
                  type="text"
                  className="form-control"
                  value={editData.nombre}
                  onChange={(e) =>
                    setEditData({ ...editData, nombre: e.target.value })
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Edad</label>
                <input
                  type="number"
                  className="form-control"
                  value={editData.edad}
                  onChange={(e) =>
                    setEditData({ ...editData, edad: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="d-flex justify-content-between">
              <button onClick={handleUpdate} className="btn btn-primary fw-semibold">
                Guardar cambios
              </button>

              <button
                onClick={() =>
                  alert(`Asignar ejercicios a ${selected.nombre}`)
                }
                className="btn btn-outline-primary fw-semibold"
              >
                Asignar ejercicios
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PacientesTerapeuta;
