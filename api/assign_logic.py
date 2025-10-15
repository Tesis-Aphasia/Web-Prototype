from firebase_admin import firestore
import random

db = firestore.client()

# =====================================
# FUNCIONES DE APOYO
# =====================================

def load_exercise(exercise_id: str):
    """Carga el contenido del ejercicio desde /ejercicios/{id}"""
    doc = db.collection("ejercicios_VNEST").document(exercise_id).get()
    return doc.to_dict()

def assign_exercise_to_patient(patient_id: str, exercise_id: str, context: str):
    """Crea el registro en /patients/{id}/ejerciciosAsignados/"""
    col_ref = db.collection("patients").document(patient_id).collection("ejercicios_asignados")
    docs = col_ref.stream()
    priorities = [d.to_dict().get("prioridad", 0) for d in docs]
    next_priority = max(priorities) + 1 if priorities else 1

    col_ref.document(exercise_id).set({
        "id_ejercicio": f"/ejercicios_VNEST/{exercise_id}",
        "contexto": context,
        "estado": "pendiente",
        "prioridad": next_priority,
        "ultima_fecha_realizado": None,
        "veces_realizado": 0
    })

def get_exercise_for_context(patient_id: str, context: str):
    """Selecciona qué ejercicio mostrar según el estado del paciente"""

    # 1️⃣ Buscar ejercicios asignados de ese contexto
    assigned = db.collection("pacientes").document(patient_id).collection("ejercicios_asignados")\
        .where("contexto", "==", context).stream()

    assigned_list = [doc.to_dict() for doc in assigned]

    pending = [e for e in assigned_list if e["estado"] == "pendiente"]
    completed = [e for e in assigned_list if e["estado"] == "completado"]

    # 2️⃣ Si hay pendientes → mostrar el de menor prioridad
    if pending:
        next_ex = sorted(pending, key=lambda e: e["prioridad"])[0]
        ex_id = next_ex["id_ejercicio"].split("/")[-1]
        return load_exercise(ex_id)

    # 3️⃣ Si no hay pendientes → buscar nuevos ejercicios en /ejercicios
    all_context = db.collection("ejercicios_VNEST").where("contexto", "==", context).stream()
    all_ids = [doc.id for doc in all_context]

    assigned_ids = [e["id_ejercicio"].split("/")[-1] for e in assigned_list]
    available = [x for x in all_ids if x not in assigned_ids]

    if available:
        new_id = random.choice(available)
        assign_exercise_to_patient(patient_id, new_id, context)
        return load_exercise(new_id)

    # 4️⃣ Si ya hizo todos → mostrar el más antiguo
    if completed:
        old_ex = sorted(completed, key=lambda e: e.get("ultima_fecha_realizado") or "9999-12-31")[0]
        ex_id = old_ex["id_ejercicio"].split("/")[-1]
        return load_exercise(ex_id)

    raise ValueError("No hay ejercicios disponibles para este contexto.")
