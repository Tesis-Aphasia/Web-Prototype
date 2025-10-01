import React from "react";

function PatientHome({ onRegister, onExercise }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold mb-6">Modo Paciente</h1>
        <div className="space-y-4">
          <button
            onClick={onRegister}
            className="w-full btn btn-primary py-3 rounded-lg font-semibold"
          >
            Registrarse
          </button>
          <button
            onClick={onExercise}
            className="w-full btn btn-ghost py-3 rounded-lg font-semibold border"
          >
            Ir a Ejercicios
          </button>
        </div>
      </div>
    </div>
  );
}

export default PatientHome;
