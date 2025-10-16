from firebase_admin import firestore
import random

db = firestore.client()

# =====================================
# FUNCIONES DE APOYO
# =====================================

def load_exercise(exercise_id: str):
    """Carga el contenido del ejercicio desde /ejercicios_VNEST/{id}"""
    doc = db.collection("ejercicios_VNEST").document(exercise_id).get()
    return doc.to_dict()

def assign_exercise_to_patient(patient_id: str, exercise_id: str, context: str):
    """Crea el registro en /patients/{id}/ejerciciosAsignados/"""
    col_ref = db.collection("pacientes").document(patient_id).collection("ejercicios_asignados")
    docs = col_ref.stream()
    priorities = [d.to_dict().get("prioridad", 0) for d in docs]
    next_priority = max(priorities) + 1 if priorities else 1

    col_ref.document(exercise_id).set({
        "id_ejercicio": exercise_id,    
        "contexto": context,
        "estado": "pendiente",
        "prioridad": next_priority,
        "ultima_fecha_realizado": None,
        "veces_realizado": 0
    })

def get_exercise_for_context(email: str, context: str, verbo: str):
    """
    Retorna un ejercicio VNEST correspondiente al contexto y verbo del paciente.
    Primero prioriza los ejercicios personalizados pendientes, luego los demás por prioridad.
    Al buscar ejercicios no asignados, ignora los privados (tipo == 'privado').
    """
    patient_ref = db.collection("pacientes").document(email)

    # 1️⃣ Buscar ejercicios asignados del contexto y verbo
    assigned = patient_ref.collection("ejercicios_asignados") \
        .where("contexto", "==", context) \
        .where("verbo", "==", verbo).stream()
    assigned_list = [doc.to_dict() for doc in assigned]

    pending = [e for e in assigned_list if e["estado"] == "pendiente"]
    completed = [e for e in assigned_list if e["estado"] == "completado"]

    # 2️⃣ Obtener info de personalizado desde colección 'ejercicios'
    for e in pending:
        ex_general_id = e.get("id_ejercicio_general") or e.get("id_ejercicio")
        if ex_general_id:
            doc = db.collection("ejercicios").document(ex_general_id).get()
            if doc.exists:
                e["personalizado"] = doc.to_dict().get("personalizado", False)
            else:
                e["personalizado"] = False
        else:
            e["personalizado"] = False

    # 3️⃣ Ordenar pendientes: primero los personalizados, luego por prioridad
    pending_sorted = sorted(
        pending,
        key=lambda x: (not x["personalizado"], x.get("prioridad", 999))
    )

    if pending_sorted:
        next_ex = pending_sorted[0]
        ex_id = next_ex["id_ejercicio"]
        return load_exercise(ex_id)

    # 4️⃣ Si no hay pendientes → buscar ejercicios no asignados en /ejercicios_VNEST
    all_context_docs = db.collection("ejercicios_VNEST")\
        .where("contexto", "==", context) \
        .where("verbo", "==", verbo).stream()
    all_ids = [doc.id for doc in all_context_docs]

    assigned_ids = [e["id_ejercicio"] for e in assigned_list]
    available = [x for x in all_ids if x not in assigned_ids]

    # 🔹 Filtrar privados según colección 'ejercicios'
    filtered_available = []
    for ex_id in available:
        vn_doc = db.collection("ejercicios_VNEST").document(ex_id).get()
        if vn_doc.exists:
            general_id = vn_doc.to_dict().get("id_ejercicio_general") or ex_id
            ex_doc = db.collection("ejercicios").document(general_id).get()
            if ex_doc.exists:
                tipo = ex_doc.to_dict().get("tipo", "publico")
                if tipo != "privado":
                    filtered_available.append(ex_id)
            else:
                filtered_available.append(ex_id)  # si no existe en 'ejercicios', dejar pasar
    available = filtered_available

    if available:
        new_id = random.choice(available)
        assign_exercise_to_patient(email, new_id, context)
        return load_exercise(new_id)

    # 5️⃣ Si ya hizo todos → mostrar el más antiguo completado
    if completed:
        completed_valid = [e for e in completed if e.get("ultima_fecha_realizado")]
        if completed_valid:
            old_ex = sorted(
                completed_valid,
                key=lambda e: e["ultima_fecha_realizado"]
            )[0]
            ex_id = old_ex["id_ejercicio"]
            return load_exercise(ex_id)

    raise ValueError("No hay ejercicios disponibles para este contexto y verbo.")
