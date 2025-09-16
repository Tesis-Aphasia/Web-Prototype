// src/services/firestore.js
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig"; // instancia inicializada

/**
 * Suscribe a los exercises con filtros opcionales.
 * Prioriza los NO revisados.
 */
export function subscribeExercises({ verbo = "", nivel = "", reviewed = null }, cb) {
  const col = collection(db, "exercises");

  let q = query(col);
  const clauses = [];

  if (verbo) clauses.push(where("verbo", "==", verbo));
  if (nivel) clauses.push(where("nivel", "==", nivel));
  if (reviewed !== null) clauses.push(where("reviewed", "==", reviewed));

  if (clauses.length) {
    q = query(col, ...clauses);
  } else {
    try {
      q = query(col, orderBy("reviewed", "asc"), orderBy("verbo", "asc"));
    } catch {
      // Firestore pedirá índice si hace falta
    }
  }

  const unsub = onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => Number(a.reviewed) - Number(b.reviewed) || a.verbo.localeCompare(b.verbo));
    cb(items);
  });

  return unsub;
}

/**
 * Actualiza campos del exercise (parcial).
 * Acepta { verbo, nivel, context_hint, oraciones, reviewed, pares }
 */
export async function updateExercise(exerciseId, patch) {
  const ref = doc(db, "exercises", exerciseId);

  // Validaciones mínimas
  if (patch?.oraciones) {
    if (!Array.isArray(patch.oraciones) || patch.oraciones.length !== 10) {
      throw new Error("Debes mantener exactamente 10 oraciones.");
    }
    patch.oraciones = patch.oraciones.map((o) => ({
      oracion: String(o.oracion ?? "").trim(),
      correcta: Boolean(o.correcta),
    }));
  }

  if (patch?.pares) {
    if (!Array.isArray(patch.pares)) {
      throw new Error("El campo 'pares' debe ser un array.");
    }
    patch.pares = patch.pares.map((p) => ({
      sujeto: String(p.sujeto ?? "").trim(),
      objeto: String(p.objeto ?? "").trim(),
      expansiones: p.expansiones || {},
    }));
  }

  await updateDoc(ref, patch);
}

/**
 * Trae un exercise por ID.
 */
export async function fetchExerciseById(id) {
  const ref = doc(db, "exercises", id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
