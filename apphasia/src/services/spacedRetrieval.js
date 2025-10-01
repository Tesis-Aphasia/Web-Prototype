import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Suscribe a las tarjetas SR de un paciente.
 * Trae siempre las ordenadas por `next_due` (más urgentes primero).
 */
export function subscribeSRCards(userId, cb) {
  const col = collection(db, "sr_cards");

  // 🔥 solo filtro por user_id, sin orderBy
  let q = query(col, where("user_id", "==", userId));

  const unsub = onSnapshot(q, (snap) => {
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // 🔥 ordenar en el front
    items = items.sort((a, b) => (a.next_due || 0) - (b.next_due || 0));
    cb(items);
  });

  return unsub;
}

export async function updateSRCard(cardId, patch) {
  const ref = doc(db, "sr_cards", cardId);
  await updateDoc(ref, patch);
}

export async function fetchSRCardById(id) {
  const ref = doc(db, "sr_cards", id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
