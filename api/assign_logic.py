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

def assign_exercise_to_patient(patient_id: str, exercise_id: str):
    """
    Crea el registro en /patients/{id}/ejercicios_asignados/
    Buscando automáticamente el contexto según el tipo de ejercicio.
    """
    try:
        # 1️⃣ Buscar el ejercicio base para saber su tipo
        exercise_doc = db.collection("ejercicios").document(exercise_id).get()
        if not exercise_doc.exists:
            raise ValueError(f"❌ No existe el ejercicio con ID {exercise_id}")

        exercise_data = exercise_doc.to_dict()
        tipo = exercise_data.get("terapia")

        if not tipo:
            raise ValueError(f"⚠️ El ejercicio {exercise_id} no tiene campo 'tipo' definido")

        # 2️⃣ Buscar el contexto según el tipo
        context = None
        if tipo == "VNEST":
            sub_doc = db.collection("ejercicios_VNEST").document(exercise_id).get()
            if sub_doc.exists:
                context = sub_doc.to_dict().get("contexto")
        elif tipo == "SR":
            sub_doc = db.collection("ejercicios_SR").document(exercise_id).get()
            if sub_doc.exists:
                context = sub_doc.to_dict().get("contexto")

        if not context:
            raise ValueError(f"⚠️ No se encontró el contexto para el ejercicio {exercise_id} (tipo {tipo})")

        # 3️⃣ Calcular la prioridad del nuevo ejercicio
        col_ref = db.collection("pacientes").document(patient_id).collection("ejercicios_asignados")
        docs = col_ref.stream()
        priorities = [d.to_dict().get("prioridad", 0) for d in docs]
        next_priority = max(priorities) + 1 if priorities else 1

        # 4️⃣ Crear el documento en la subcolección del paciente
        col_ref.document(exercise_id).set({
            "id_ejercicio": exercise_id,
            "contexto": context,
            "tipo": tipo,
            "estado": "pendiente",
            "prioridad": next_priority,
            "ultima_fecha_realizado": None,
            "veces_realizado": 0
        })

        print(f"✅ Ejercicio {exercise_id} asignado correctamente al paciente {patient_id}")

    except Exception as e:
        print(f"❌ Error al asignar ejercicio: {e}")

def get_exercise_for_context(email: str, context: str):
    """
    Retorna un ejercicio VNEST correspondiente al contexto del paciente.
    Si hay ejercicios pendientes, devuelve el de menor prioridad.
    Si no, asigna uno nuevo desde /ejercicios_VNEST.
    """
    patient_ref = db.collection("pacientes").document(email)

    # 1️⃣ Buscar ejercicios asignados del contexto
    assigned = patient_ref.collection("ejercicios_asignados") \
        .where("contexto", "==", context).stream()
    assigned_list = [doc.to_dict() for doc in assigned]

    pending = [e for e in assigned_list if e["estado"] == "pendiente"]
    completed = [e for e in assigned_list if e["estado"] == "completado"]

    # 2️⃣ Si hay pendientes → mostrar el de menor prioridad
    if pending:
        next_ex = sorted(pending, key=lambda e: e["prioridad"])[0]
        ex_id = next_ex["id_ejercicio"]
        return load_exercise(ex_id)

    # 3️⃣ Si no hay pendientes → buscar ejercicios no asignados en /ejercicios_VNEST
    all_context_docs = db.collection("ejercicios_VNEST").where("contexto", "==", context).stream()
    all_ids = [doc.id for doc in all_context_docs]

    assigned_ids = [e["id_ejercicio"] for e in assigned_list]
    available = [x for x in all_ids if x not in assigned_ids]

    if available:
        new_id = random.choice(available)
        assign_exercise_to_patient(email, new_id, context)
        return load_exercise(new_id)

    # 4️⃣ Si ya hizo todos → mostrar el más antiguo completado
    if completed:
        completed_valid = [e for e in completed if e.get("ultima_fecha_realizado")]
        if completed_valid:
            old_ex = sorted(
                completed_valid,
                key=lambda e: e["ultima_fecha_realizado"]
            )[0]
            ex_id = old_ex["id_ejercicio"]
            return load_exercise(ex_id)

    raise ValueError("No hay ejercicios disponibles para este contexto.")