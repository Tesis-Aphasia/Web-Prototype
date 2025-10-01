// src/services/patients.js
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig"; // instancia inicializada

/**
 * Suscribe a la colección de pacientes.
 * Los ordenamos por fecha de creación.
 */
export function subscribePatients(cb) {
  const col = collection(db, "patients");

  let q;
  try {
    q = query(col, orderBy("created_at", "asc"));
  } catch {
    q = query(col);
  }

  const unsub = onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(items);
  });

  return unsub;
}

/**
 * Actualiza un paciente (merge parcial).
 * Ej: updatePatient("id123", { personal: { nombre: "Nuevo nombre" } })
 */
export async function updatePatient(patientId, patch) {
  const ref = doc(db, "patients", patientId);
  await updateDoc(ref, patch);
}

/**
 * Trae un paciente por ID.
 */
export async function fetchPatientById(id) {
  const ref = doc(db, "patients", id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function savePatientProfile(userId, profileData) {
  const ref = doc(db, "patients", userId);

  await setDoc(
    ref,
    {
      user_id: userId,
      created_at: Date.now(),
      ...profileData,
    },
    { merge: true } // no sobreescribe todo, solo actualiza lo enviado
  );
}