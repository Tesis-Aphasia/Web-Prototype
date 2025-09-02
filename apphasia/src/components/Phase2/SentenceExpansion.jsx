import React, { useState } from "react";
import "./SentenceExpansion.css";

const SentenceExpansion = ({
  onNext,
  onPrevious,
  selectedContext,
  selectedActionDetails,
}) => {
  // Estados por defecto (con la misma capitalización que se muestra en UI)
  const [selectedWhere, setSelectedWhere] = useState("En el parque");
  const [selectedWhy, setSelectedWhy] = useState("Para divertirse");
  const [selectedWhen, setSelectedWhen] = useState("Por la tarde");

  // Construcción de la oración (usa datos previos si existen)
  const baseSentenceSubject = selectedActionDetails?.who || "El sujeto";
  const baseSentenceAction = selectedActionDetails?.action || "corre"; // ej: "corre"
  const fullSentence = `${baseSentenceSubject} ${baseSentenceAction} ${selectedWhere} ${selectedWhy} ${selectedWhen}.`;

  const handleNextClick = () =>
    onNext({ where: selectedWhere, why: selectedWhy, when: selectedWhen });

  // Tarjeta tipo radio (mismo look que los botones de pantallas previas)
  // Tarjeta tipo radio
  const RadioCard = ({ group, label, value, selected, onChange }) => {
    const isSelected = selected === value;
    const base =
      // inline-flex: ancho según contenido; min-w-fit evita que colapse, nowrap evita saltos de línea.
      "inline-flex items-center justify-center rounded-xl px-5 py-3 text-lg transition-all select-none whitespace-nowrap min-w-fit";
    const normal =
      "border-2 border-gray-200 bg-white font-medium text-black shadow-sm hover:bg-gray-50 cursor-pointer";
    const active =
      "border-2 border-[var(--orange-accent)] bg-orange-50 font-bold text-black shadow-md ring-2 ring-[var(--orange-accent)] ring-offset-2 cursor-pointer";
    return (
      <label className={`${base} ${isSelected ? active : normal}`}>
        <input
          type="radio"
          name={group}
          value={value}
          checked={isSelected}
          onChange={() => onChange(value)}
          className="hidden"
        />
        {label}
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

          {selectedActionDetails?.action && (
            <div className="mb-8 flex w-full items-center justify-center rounded-xl bg-zinc-900 p-6 text-white shadow-lg">
              <span className="text-3xl font-bold capitalize">
                {selectedActionDetails.action}
              </span>
            </div>
          )}

          <div className="space-y-8">
            {/* ¿DÓNDE? */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-center md:text-left">
                1. ¿DÓNDE?
              </h2>
              <div
                className="horizontal-scroll -mx-6 px-6 flex gap-3 overflow-x-auto whitespace-nowrap snap-x snap-mandatory"
                role="tablist"
                aria-label="Opciones de Dónde"
              >
                <div className="snap-start">
                  <RadioCard
                    group="donde"
                    label="En el parque"
                    value="En el parque"
                    selected={selectedWhere}
                    onChange={setSelectedWhere}
                  />
                </div>
                <div className="snap-start">
                  <RadioCard
                    group="donde"
                    label="En la biblioteca"
                    value="En la biblioteca"
                    selected={selectedWhere}
                    onChange={setSelectedWhere}
                  />
                </div>
                <div className="snap-start">
                  <RadioCard
                    group="donde"
                    label="En casa"
                    value="En casa"
                    selected={selectedWhere}
                    onChange={setSelectedWhere}
                  />
                </div>
                <div className="snap-start">
                  <RadioCard
                    group="donde"
                    label="En la escuela"
                    value="En la escuela"
                    selected={selectedWhere}
                    onChange={setSelectedWhere}
                  />
                </div>
              </div>
            </section>

            {/* ¿POR QUÉ? */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-center md:text-left">
                2. ¿POR QUÉ?
              </h2>
              <div
                className="horizontal-scroll -mx-6 px-6 flex gap-3 overflow-x-auto whitespace-nowrap snap-x snap-mandatory"
                role="tablist"
                aria-label="Opciones de Por qué"
              >
                <div className="snap-start">
                  <RadioCard
                    group="porque"
                    label="Para estudiar"
                    value="Para estudiar"
                    selected={selectedWhy}
                    onChange={setSelectedWhy}
                  />
                </div>
                <div className="snap-start">
                  <RadioCard
                    group="porque"
                    label="Para relajarse"
                    value="Para relajarse"
                    selected={selectedWhy}
                    onChange={setSelectedWhy}
                  />
                </div>
                <div className="snap-start">
                  <RadioCard
                    group="porque"
                    label="Para divertirse"
                    value="Para divertirse"
                    selected={selectedWhy}
                    onChange={setSelectedWhy}
                  />
                </div>
                <div className="snap-start">
                  <RadioCard
                    group="porque"
                    label="Para trabajar"
                    value="Para trabajar"
                    selected={selectedWhy}
                    onChange={setSelectedWhy}
                  />
                </div>
              </div>
            </section>

            {/* ¿CUÁNDO? */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-center md:text-left">
                3. ¿CUÁNDO?
              </h2>
              <div
                className="horizontal-scroll -mx-6 px-6 flex gap-3 overflow-x-auto whitespace-nowrap snap-x snap-mandatory"
                role="tablist"
                aria-label="Opciones de Cuándo"
              >
                <div className="snap-start">
                  <RadioCard
                    group="cuando"
                    label="Por la mañana"
                    value="Por la mañana"
                    selected={selectedWhen}
                    onChange={setSelectedWhen}
                  />
                </div>
                <div className="snap-start">
                  <RadioCard
                    group="cuando"
                    label="Por la tarde"
                    value="Por la tarde"
                    selected={selectedWhen}
                    onChange={setSelectedWhen}
                  />
                </div>
                <div className="snap-start">
                  <RadioCard
                    group="cuando"
                    label="Por la noche"
                    value="Por la noche"
                    selected={selectedWhen}
                    onChange={setSelectedWhen}
                  />
                </div>
                <div className="snap-start">
                  <RadioCard
                    group="cuando"
                    label="El fin de semana"
                    value="El fin de semana"
                    selected={selectedWhen}
                    onChange={setSelectedWhen}
                  />
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* footer igual que antes */}
        <footer className="border-t border-gray-200 p-4">
          <div className="bg-amber-50 rounded-lg p-4 mb-4 text-center">
            <h3 className="font-bold text-lg mb-2 text-gray-800">
              Oración completa:
            </h3>
            <p className="text-gray-700 text-lg">
              <span className="font-bold text-[var(--orange-accent)]">
                {baseSentenceSubject} {baseSentenceAction}
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
