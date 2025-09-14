// src/components/Phase2/SentenceExpansion.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./SentenceExpansion.css";
import { useExercise } from "../../context/ExerciseContext";

// util: Fisher–Yates
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SentenceExpansion = ({
  onNext,
  onPrevious,
  selectedContext,          // lo sigues recibiendo si lo necesitas mostrar
  selectedActionDetails,     // { who, what } de la pantalla anterior
}) => {
  const { exercise } = useExercise();

  // Guards
  const verbo = exercise?.verbo ?? "";
  const pares = Array.isArray(exercise?.pares) ? exercise.pares : [];
  const who = selectedActionDetails?.who || "";
  const what = selectedActionDetails?.what || "";

  // Buscar el par elegido para extraer expansiones
  const currentPair = useMemo(() => {
    return pares.find(p => p?.sujeto === who && p?.objeto === what) || null;
  }, [pares, who, what]);

  // Preparar listas de opciones desde el JSON (y barajarlas)
  const opciones = useMemo(() => {
    const donde = currentPair?.expansiones?.donde?.opciones || [];
    const cuando = currentPair?.expansiones?.cuando?.opciones || [];
    const porque = currentPair?.expansiones?.por_que?.opciones || [];
    return {
      donde: shuffle(donde),
      cuando: shuffle(cuando),
      porque: shuffle(porque),
      correct: {
        donde: currentPair?.expansiones?.donde?.opcion_correcta || "",
        cuando: currentPair?.expansiones?.cuando?.opcion_correcta || "",
        porque: currentPair?.expansiones?.por_que?.opcion_correcta || "",
      },
    };
  }, [currentPair]);

  // Selecciones del usuario (por defecto, la primera opción si existe)
  const [selectedWhere, setSelectedWhere] = useState("");
  const [selectedWhy, setSelectedWhy] = useState("");
  const [selectedWhen, setSelectedWhen] = useState("");

  // Inicializar cuando cambien las opciones
  useEffect(() => {
    if (opciones.donde.length) setSelectedWhere(opciones.donde[0]);
    if (opciones.porque.length) setSelectedWhy(opciones.porque[0]);
    if (opciones.cuando.length) setSelectedWhen(opciones.cuando[0]);
  }, [opciones.donde, opciones.porque, opciones.cuando]);

  // Construcción de oración (simple; usa verbo tal cual viene y objeto “what”)
  // Ej.: "un perro encontrar una pelota en el parque porque juega con ella por la mañana."
  const fullSentence = useMemo(() => {
    const parts = [
      who || "El sujeto",
      verbo || "hacer",
      what || "algo",
      selectedWhere,
      selectedWhy,
      selectedWhen,
    ].filter(Boolean);
    // minúsculas al inicio si tu who viene en minúscula, respeta tal cual:
    return `${parts.join(" ")}.`.replace(/\s+\./, ".");
  }, [who, verbo, what, selectedWhere, selectedWhy, selectedWhen]);

  const handleNextClick = () => {
    onNext({
      where: selectedWhere,
      why: selectedWhy,
      when: selectedWhen,
      sentence: fullSentence,
    });
  };

  // Si no hay datos, mostrar aviso
  if (!exercise || !currentPair) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="phone-frame">
          <main className="flex-1 overflow-y-auto p-6">
            <h1 className="text-2xl font-bold mb-2">Faltan datos</h1>
            <p className="text-gray-700">
              Regresa y selecciona un contexto y una pareja (¿quién? / ¿qué?) válidos.
            </p>
          </main>
          <footer className="border-t border-gray-200 p-4">
            <button
              onClick={onPrevious}
              className="w-full rounded-lg bg-gray-200 text-gray-700 font-bold py-3 hover:bg-gray-300 transition-colors"
            >
              Volver
            </button>
          </footer>
        </div>
      </div>
    );
  }

  // Radio card reutilizable
  // Radio card con estados correcto/incorrecto
  const RadioCard = ({
      group,
      label,
      value,
      selectedValue,
      correctValue,
      onChange,
    }) => {
    const isSelected = selectedValue === value;
    const isCorrect  = isSelected && value === correctValue;
    const isWrong    = isSelected && value !== correctValue;

    const base =
      "flex w-full items-start rounded-xl px-5 py-3 text-lg transition-all select-none text-left leading-snug";
    const normal =
      "border border-gray-300 bg-white font-medium text-black shadow-sm hover:bg-gray-50";
    const right =
      "border-2 border-green-600 bg-green-50 font-bold text-green-900 shadow-md ring-2 ring-green-500 ring-offset-2";
    const wrong =
      "border-2 border-red-600 bg-red-50 font-bold text-red-900 shadow-md ring-2 ring-red-500 ring-offset-2";

    return (
      <label className={`${base} ${isCorrect ? right : isWrong ? wrong : normal}`}>
        <input
          type="radio"
          name={group}
          value={value}
          checked={isSelected}
          onChange={() => onChange(value)}
          className="sr-only"
          aria-checked={isSelected}
          aria-invalid={isWrong || undefined}
        />
        <span className="break-words max-w-full">{label}</span>
      </label>
    );
  };


  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="phone-frame">
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-center mb-8">
            Completa la oración
          </h1>

          {/* Tarjeta con verbo y pareja elegida */}
          {/* Tarjeta con verbo y pareja elegida */}
          <div className="mb-6 grid gap-3 grid-cols-1 md:grid-cols-3">
            <div className="rounded-2xl bg-zinc-900 p-4 text-white shadow-lg text-center min-w-0">
              <div className="text-[11px] uppercase opacity-70 mb-1">¿Quién?</div>
              <div className="text-[16px] font-bold leading-tight break-words">{who || "—"}</div>
            </div>

            <div className="rounded-2xl p-4 text-white shadow-lg text-center min-w-0 bg-[var(--orange-accent)]">
              <div className="text-[11px] uppercase opacity-70 mb-1">Verbo</div>
              <div className="text-[16px] font-bold leading-tight break-words">{verbo || "—"}</div>
            </div>

            <div className="rounded-2xl bg-zinc-900 p-4 text-white shadow-lg text-center min-w-0">
              <div className="text-[11px] uppercase opacity-70 mb-1">¿Qué?</div>
              <div className="text-[16px] font-bold leading-tight break-words">{what || "—"}</div>
            </div>
          </div>


          <div className="space-y-8">
            {/* ¿DÓNDE? */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-center md:text-left">
                1. ¿DÓNDE?
              </h2>
              <div
                className="flex flex-col gap-3"
                role="radiogroup"
                aria-label="Opciones de Dónde"
              >
                {opciones.donde.map((op) => (
                    <RadioCard
                      key={op}
                      group="donde"
                      label={op}
                      value={op}
                      selectedValue={selectedWhere}
                      correctValue={opciones.correct.donde}
                      onChange={setSelectedWhere}
                    />
                ))}
              </div>
            </section>

            {/* ¿POR QUÉ? */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-center md:text-left">
                2. ¿POR QUÉ?
              </h2>
              <div
                className="flex flex-col gap-3"
                role="radiogroup"
                aria-label="Opciones de Por qué"
              >
                {opciones.porque.map((op) => (
                    <RadioCard
                      key={op}
                      group="porque"
                      label={op}
                      value={op}
                      selectedValue={selectedWhy}
                      correctValue={opciones.correct.porque}
                      onChange={setSelectedWhy}
                    />
                ))}
              </div>
            </section>

            {/* ¿CUÁNDO? */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-center md:text-left">
                3. ¿CUÁNDO?
              </h2>
              <div
                className="flex flex-col gap-3"
                role="radiogroup"
                aria-label="Opciones de Cuándo"
              >
                {opciones.cuando.map((op) => (
                    <RadioCard
                      key={op}
                      group="cuando"
                      label={op}
                      value={op}
                      selectedValue={selectedWhen}
                      correctValue={opciones.correct.cuando}
                      onChange={setSelectedWhen}
                    />
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* footer */}
        <footer className="border-t border-gray-200 p-4">
          <div className="bg-amber-50 rounded-lg p-4 mb-4 text-center">
            <h3 className="font-bold text-lg mb-2 text-gray-800">
              Oración completa:
            </h3>
            <p className="text-gray-700 text-lg">
              <span className="font-bold text-[var(--orange-accent)]">
                {who} {verbo} {what}
              </span>{" "}
              <span className="font-bold text-[var(--orange-accent)]">
                {selectedWhere}
              </span>{" "}
              <span className="font-bold text-[var(--orange-accent)]">
                {selectedWhy}
              </span>{" "}
              <span className="font-bold text-[var(--orange-accent)]">
                {selectedWhen}
              </span>
              .
            </p>
          </div>

          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Fase 2</p>
            <p className="text-sm font-medium text-gray-600">2/4</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
            <div
              className="bg-[var(--orange-accent)] h-2.5 rounded-full"
              style={{ width: "50%" }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onPrevious}
              className="w-1/2 rounded-lg bg-gray-200 text-gray-700 font-bold py-3 cursor-pointer hover:bg-gray-300 transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={handleNextClick}
              className="w-1/2 rounded-lg bg-[var(--orange-accent)] text-white font-bold py-3 cursor-pointer hover:brightness-95 active:scale-[0.98] transition"
            >
              Siguiente
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SentenceExpansion;
