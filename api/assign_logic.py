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

def get_exercise_for_context(email: str, context: str, verbo: str):
    patient_ref = db.collection("pacientes").document(email)

    # 1️⃣ Traer todos los ejercicios asignados del contexto
    assigned_docs = patient_ref.collection("ejercicios_asignados")\
        .where("contexto", "==", context).stream()
    assigned_list = [doc.to_dict() for doc in assigned_docs]

    # 2️⃣ Filtrar por verbo y agregar 'personalizado'
    pending = []
    completed = []
    for e in assigned_list:
        vn_doc = db.collection("ejercicios_VNEST").document(e["id_ejercicio"]).get()
        if not vn_doc.exists:
            continue
        vn_data = vn_doc.to_dict()
        if vn_data.get("verbo") != verbo:
            continue

        general_id = vn_data.get("id_ejercicio_general")
        personalizado = False
        if general_id:
            ex_doc = db.collection("ejercicios").document(general_id).get()
            if ex_doc.exists:
                personalizado = ex_doc.to_dict().get("personalizado", False)

        e["personalizado"] = personalizado
        e["prioridad"] = int(e.get("prioridad", 999))

        if e["estado"] == "pendiente":
            pending.append(e)
        else:
            completed.append(e)

    # 3️⃣ Ordenar pendientes: personalizados primero, luego por prioridad
    pending_sorted = sorted(pending, key=lambda x: (not x["personalizado"], x["prioridad"]))
    if pending_sorted:
        return load_exercise(pending_sorted[0]["id_ejercicio"])

    # 4️⃣ Buscar ejercicios no asignados (VNEST) filtrando verbo
    all_docs = db.collection("ejercicios_VNEST")\
        .where("contexto", "==", context).stream()
    available = []
    for doc in all_docs:
        data = doc.to_dict()
        if data.get("verbo") != verbo:
            continue
        if any(a["id_ejercicio"] == doc.id for a in assigned_list):
            continue

        # Revisar tipo en ejercicios
        general_id = data.get("id_ejercicio_general")
        tipo = "publico"
        if general_id:
            ex_doc = db.collection("ejercicios").document(general_id).get()
            if ex_doc.exists:
                tipo = ex_doc.to_dict().get("tipo", "publico")
        if tipo != "privado":
            available.append(data)

    if available:
        choice = random.choice(available)
        assign_exercise_to_patient(email, choice["id"])
        return load_exercise(choice["id"])

    # 5️⃣ Mostrar completado más antiguo
    completed_valid = [e for e in completed if e.get("ultima_fecha_realizado")]
    if completed_valid:
        old_ex = sorted(completed_valid, key=lambda e: e["ultima_fecha_realizado"])[0]
        return load_exercise(old_ex["id_ejercicio"])

    raise ValueError("No hay ejercicios disponibles para este contexto y verbo.")
