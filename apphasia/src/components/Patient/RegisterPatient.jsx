import { useState } from "react";
import { savePatientProfile } from "../../services/patients";
import "./register.css";

function RegisterPatient({ userId, onDone }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    fecha_nacimiento: "",
    lugar_nacimiento: "",
    direccion: "",
    hijos: [],
    hijoInput: "",
    pareja: "",
    comida_favorita: "",
    actividad_favorita: "",
    mascota: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function addHijo() {
    if (form.hijoInput.trim()) {
      setForm({
        ...form,
        hijos: [...form.hijos, form.hijoInput.trim()],
        hijoInput: "",
      });
    }
  }

    async function handleSave() {
    setLoading(true);
    const profileData = {
        personal: {
        nombre: form.nombre,
        fecha_nacimiento: form.fecha_nacimiento,
        lugar_nacimiento: form.lugar_nacimiento,
        direccion: form.direccion,
        },
        familia: {
        hijos: form.hijos,
        pareja: form.pareja,
        },
        rutinas: {
        comida_favorita: form.comida_favorita,
        actividad_favorita: form.actividad_favorita,
        },
        objetos: {
        mascota: { nombre: form.mascota },
        },
    };

    try {
        // 1) Guardar paciente
        await savePatientProfile(userId, profileData);

        // 2) Generar tarjetas SR iniciales
        await fetch("http://localhost:8000/spaced-retrieval/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: userId,
            profile: profileData,
        }),
        });

        // 3) Pasar a pantalla final
        setStep(4);
    } catch (err) {
        console.error(err);
        alert("❌ Error al guardar paciente");
    } finally {
        setLoading(false);
    }
    }


  // ---- STEP 0: Inicio ----
  if (step === 0) {
    return (
      <div className="register-container">
        <div className="register-card">
          <h2 className="register-title">Registro de Paciente</h2>
          <p className="register-subtitle">
            Por favor, completa tu información. Un cuidador puede ayudarte si es necesario.
          </p>
          <button onClick={() => setStep(1)} className="btn btn-primary">
            Siguiente
          </button>
          <button onClick={onDone} className="btn-back">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ---- STEP 1: Información personal ----
  if (step === 1) {
    return (
      <div className="register-container">
        <div className="register-card">
          <h2 className="register-title">Información Personal</h2>

          <div>
            <label className="register-label" htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              name="nombre"
              placeholder="Escribe tu nombre"
              value={form.nombre}
              onChange={handleChange}
              className="register-input"
            />
          </div>

          <div>
            <label className="register-label" htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
            <input
              id="fecha_nacimiento"
              type="date"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              className="register-input"
            />
          </div>

          <div>
            <label className="register-label" htmlFor="lugar_nacimiento">Lugar de nacimiento</label>
            <input
              id="lugar_nacimiento"
              name="lugar_nacimiento"
              placeholder="Escribe tu ciudad"
              value={form.lugar_nacimiento}
              onChange={handleChange}
              className="register-input"
            />
          </div>

          <div>
            <label className="register-label" htmlFor="direccion">Dirección</label>
            <input
              id="direccion"
              name="direccion"
              placeholder="Escribe tu dirección"
              value={form.direccion}
              onChange={handleChange}
              className="register-input"
            />
          </div>

          <div className="register-actions">
            <button onClick={() => setStep(0)} className="btn btn-beige">Atrás</button>
            <button onClick={() => setStep(2)} className="btn btn-primary">Siguiente</button>
          </div>
          <button onClick={onDone} className="btn btn-beige register-cancel">Cancelar</button>
        </div>
      </div>
    );
  }

  // ---- STEP 2: Familia ----
  if (step === 2) {
    return (
      <div className="register-container">
        <div className="register-card">
          <h2 className="register-title">Familia</h2>

          <div>
            <label className="register-label" htmlFor="hijoInput">Hijos</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                id="hijoInput"
                name="hijoInput"
                placeholder="Nombre del hijo"
                value={form.hijoInput}
                onChange={handleChange}
                className="register-input"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={addHijo} className="btn btn-beige">
                + Añadir
              </button>
            </div>
            {form.hijos.length > 0 && (
              <ul className="register-list">
                {form.hijos.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="register-label" htmlFor="pareja">Pareja</label>
            <input
              id="pareja"
              name="pareja"
              placeholder="Nombre de la pareja"
              value={form.pareja}
              onChange={handleChange}
              className="register-input"
            />
          </div>

          <div className="register-actions">
            <button onClick={() => setStep(1)} className="btn btn-beige">Atrás</button>
            <button onClick={() => setStep(3)} className="btn btn-primary">Siguiente</button>
          </div>
          <button onClick={onDone} className="btn btn-beige register-cancel">Cancelar</button>
        </div>
      </div>
    );
  }

  // ---- STEP 3: Preguntas de rutina ----
  if (step === 3) {
    return (
      <div className="register-container">
        <div className="register-card">
          <h2 className="register-title">Preguntas de rutina</h2>

          <div>
            <label className="register-label" htmlFor="comida_favorita">Comida favorita</label>
            <input
              id="comida_favorita"
              name="comida_favorita"
              placeholder="Escribe tu respuesta"
              value={form.comida_favorita}
              onChange={handleChange}
              className="register-input"
            />
          </div>

          <div>
            <label className="register-label" htmlFor="actividad_favorita">Actividad favorita</label>
            <input
              id="actividad_favorita"
              name="actividad_favorita"
              placeholder="Escribe tu respuesta"
              value={form.actividad_favorita}
              onChange={handleChange}
              className="register-input"
            />
          </div>

          <div>
            <label className="register-label" htmlFor="mascota">Mascota (nombre)</label>
            <input
              id="mascota"
              name="mascota"
              placeholder="Escribe tu respuesta"
              value={form.mascota}
              onChange={handleChange}
              className="register-input"
            />
          </div>

          <div className="register-actions">
            <button onClick={() => setStep(2)} className="btn btn-beige">Atrás</button>
            <button onClick={handleSave} disabled={loading} className="btn btn-primary">
              {loading ? "Guardando..." : "Finalizar"}
            </button>
          </div>
          <button onClick={onDone} className="btn btn-beige register-cancel">Cancelar</button>
        </div>
      </div>
    );
  }

  // ---- STEP 4: Finalizado ----
  if (step === 4) {
    return (
      <div className="register-container">
        <div className="register-card">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <h2 className="register-title">¡Registro completado!</h2>
          <p className="register-subtitle">
            Tu cuenta ha sido creada con éxito. Ahora puedes comenzar a usar la aplicación y explorar los ejercicios.
          </p>
          <button onClick={onDone} className="btn btn-primary">
            Ir a ejercicios
          </button>
          <button onClick={onDone} className="btn btn-beige register-cancel">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }
}

export default RegisterPatient;
