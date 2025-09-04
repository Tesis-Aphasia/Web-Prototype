import React, { createContext, useContext, useState, useEffect } from "react";

const ExerciseContext = createContext(null);

export const ExerciseProvider = ({ children }) => {
  const [exercise, setExercise] = useState(() => {
    const saved = localStorage.getItem("exercise");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (exercise) localStorage.setItem("exercise", JSON.stringify(exercise));
  }, [exercise]);

  return (
    <ExerciseContext.Provider value={{ exercise, setExercise }}>
      {children}
    </ExerciseContext.Provider>
  );
};

export const useExercise = () => {
  const ctx = useContext(ExerciseContext);
  if (!ctx) throw new Error("useExercise must be used within ExerciseProvider");
  return ctx;
};
