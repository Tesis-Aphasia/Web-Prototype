from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from firebase_admin import firestore
from datetime import datetime

# Importaciones de tus funciones auxiliares
from main_langraph_vnest import main_langraph_vnest
from main_langraph_sr import main_langraph_sr
from main_personalization import main_personalization
from assign_logic import assign_exercise_to_patient, get_exercise_for_context

app = FastAPI()
db = firestore.client()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
#  MODELOS DE PAYLOAD
# ========================
class ContextPayload(BaseModel):
    context: str
    verbo: str
    nivel: str
    user_id: str  # 👈 reemplaza email

class ContextGeneratePayload(BaseModel):
    context: str
    nivel: str
    creado_por: str
    tipo: str 

class SRPayload(BaseModel):
    user_id: str
    profile: dict

class CompleteExercisePayload(BaseModel):
    user_id: str  # 👈 reemplaza email
    id_ejercicio: str
    contexto: str

class PersonalizePayload(BaseModel):
    user_id: str
    exercise_id: str
    profile: dict

class AssignPayload(BaseModel):
    user_id: str
    exercise_id: str

class ContextOnlyPayload(BaseModel):
    context: str
    user_id: Optional[str] = None  # 👈 reemplaza email

class ProfileStructurePayload(BaseModel):
    user_id: str
    raw_text: str

# ========================
#  ENDPOINTS
# ========================

@app.get("/")
def read_root():
    return {"Hello": "World"}

# --- Generar ejercicio VNEST
@app.post("/context/generate")
def create_exercise(payload: ContextGeneratePayload):
    response = main_langraph_vnest(payload.context, payload.nivel, payload.creado_por, payload.tipo)
    return response

# --- Generar tarjetas SR
@app.post("/spaced-retrieval/")
def create_sr_cards(payload: SRPayload):
    print("Payload recibido:", payload)
    response = main_langraph_sr(payload.user_id, payload.profile)
    return response

# --- Personalizar ejercicio
@app.post("/personalize-exercise/")
def personalize_exercise(payload: PersonalizePayload):
    response = main_personalization(payload.user_id, payload.exercise_id, payload.profile)
    return response

# --- Estructurar perfil
@app.post("/profile/structure/")
def structure_profile(payload: ProfileStructurePayload):
    from main_profile_structure import main_profile_structure
    response = main_profile_structure(payload.user_id, payload.raw_text)
    print("Respuesta generada:", response)
    return response

#TODO: QUITAR DE AQUÍ Y PONERLO COMO SERVICIO EN LA MOVIL
# --- Obtener ejercicio VNEST por contexto
@app.post("/get_exercise_context/")
def get_exercise_for_patient(payload: ContextPayload):
    try:
        print(f"Payload recibido: {payload.dict()}")
        response = get_exercise_for_context(payload.user_id, payload.context, payload.verbo)
        print(f"Respuesta generada: {response}")
        return response
    except Exception as e:
        print(f"Error en get_exercise_for_patient: {e}")
        return {"error": str(e)}

#TODO: QUITAR DE AQUÍ Y PONERLO COMO SERVICIO EN LA MOVIL
# --- Completar ejercicio asignado
@app.post("/completar_ejercicio/")
def completar_ejercicio(payload: CompleteExercisePayload):
    patient_ref = db.collection("pacientes").document(payload.user_id)
    ejercicios_ref = patient_ref.collection("ejercicios_asignados")

    query = ejercicios_ref.where("id_ejercicio", "==", payload.id_ejercicio).where("contexto", "==", payload.contexto).stream()
    for doc in query:
        ejercicios_ref.document(doc.id).update({
            "estado": "completado",
            "ultima_fecha_realizado": firestore.SERVER_TIMESTAMP,
        })
        return {"status": "success", "message": "Ejercicio completado"}

    return {"status": "error", "message": "Ejercicio no encontrado"}

#TODO: QUITAR DE AQUÍ Y PONERLO COMO SERVICIO EN LA MOVIL
# --- Obtener verbos de un contexto
@app.post("/context/verbs/")
def get_verbs_for_context(payload: ContextOnlyPayload):
    context = payload.context
    email = getattr(payload, "email", None)

    vnest_docs = db.collection("ejercicios_VNEST").where("contexto", "==", context).stream()
    vnest_list = [d.to_dict() | {"_id": d.id} for d in vnest_docs]

    verbs_dict = {}
    for ex in vnest_list:
        verbo = ex.get("verbo")
        if not verbo:
            continue

        # ✅ incluir también el id
        id_general = ex.get("id_ejercicio_general") or ex.get("_id")
        verbs_dict[verbo] = {
            "verbo": verbo,
            "highlight": False,
            "id_ejercicio_general": id_general,  # <-- agregado
        }

    # === si no se envía email, retorna básico ===
    if not email:
        return {"context": context, "verbs": list(verbs_dict.values())}

    # === resto del código igual (para marcar highlight) ===
    asignados_ref = db.collection("pacientes").document(email).collection("ejercicios_asignados").stream()
    asignados = [a.to_dict() for a in asignados_ref]
    pendientes_ids = [
        a.get("id_ejercicio")
        for a in asignados
        if a.get("personalizado") is True
        and a.get("estado") == "pendiente"
        and a.get("tipo") == "VNEST"
        and a.get("contexto") == context
    ]

    if not pendientes_ids:
        return {"context": context, "verbs": list(verbs_dict.values())}

    verbos_pendientes = set()
    for ex in vnest_list:
        if ex.get("_id") in pendientes_ids or ex.get("id_ejercicio_general") in pendientes_ids:
            verbo = ex.get("verbo")
            if verbo:
                verbos_pendientes.add(verbo)

    for verbo in verbos_pendientes:
        if verbo in verbs_dict:
            verbs_dict[verbo]["highlight"] = True

    return {"context": context, "verbs": list(verbs_dict.values())}

#TODO: QUITAR DE AQUÍ Y PONERLO COMO SERVICIO EN LA MOVIL
# --- Obtener lista de contextos VNEST
@app.get("/contexts")
def get_contexts():
    ejercicios = db.collection("ejercicios_VNEST").stream()
    contextos = sorted(list({doc.to_dict().get("contexto") for doc in ejercicios if doc.to_dict().get("contexto")}))
    return {"contexts": contextos}
