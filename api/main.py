from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import backTwo as back
from datetime import datetime
from firebase_admin import firestore

# importamos la nueva función
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

class ContextPayload(BaseModel):
    context: str
    verbo: str
    nivel: str
    email: str

class ContextGeneratePayload(BaseModel):
    context: str
    nivel: str
    creado_por: str
    tipo: str 

class SRPayload(BaseModel):
    user_id: str
    profile: dict

class CompleteExercisePayload(BaseModel):
    email: str
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

@app.get("/")
def read_root():
    return {"Hello": "World"}

# Endpoint para generar un ejercicio dado un contexto - usado por el terapeuta
@app.post("/context/generate")
def create_exercise(payload: ContextGeneratePayload):
    print("Payload recibido:", payload)
    #response = back.main(payload.context)
    response = main_langraph_vnest(payload.context, payload.nivel, payload.creado_por, payload.tipo)
    print("Respuesta generada:", response)
    return response

# Endpoint para asignar o buscar un ejercicio para el paciente - usado por la app móvil
@app.post("/context/")
def get_exercise_for_patient(payload: ContextPayload):
    try:
        print(f"📩 Payload recibido: {payload.dict()}")

        response = get_exercise_for_context(payload.email, payload.context, payload.verbo)

        print(f"✅ Respuesta generada: {response}")
        return response

    except Exception as e:
        print(f"❌ Error en get_exercise_for_patient: {e}")
        return {"error": str(e)}


# Endpoint para generar tarjetas de Spaced Retrieval - usado al crear un paciente
@app.post("/spaced-retrieval/")
def create_sr_cards(payload: SRPayload):
    print("Payload recibido:", payload)
    response = main_langraph_sr(payload.user_id, payload.profile)
    return response

# Endpoint para personalizar un ejercicio base - usado por el terapeuta o la app móvil
@app.post("/personalize-exercise/")
def personalize_exercise(payload: PersonalizePayload):
    response = main_personalization(payload.user_id, payload.exercise_id, payload.profile)
    return response

# Endpoint para asignar un ejercicio - usado por el terapeuta
@app.post("/assign-exercise/")
def assign_exercise(payload: AssignPayload):
    assign_exercise_to_patient(payload.user_id, payload.exercise_id)
    return {"ok": True, "message": f"Ejercicio {payload.exercise_id} asignado al paciente {payload.user_id}"}


@app.post("/completar_ejercicio/")
def completar_ejercicio(payload: CompleteExercisePayload):
    try:
        patient_ref = db.collection("pacientes").document(payload.email)
        ejercicios_ref = patient_ref.collection("ejercicios_asignados")

        # Buscar el ejercicio correspondiente
        query = ejercicios_ref.where("id_ejercicio", "==", payload.id_ejercicio).where("contexto", "==", payload.contexto).stream()

        for doc in query:
            ejercicios_ref.document(doc.id).update({
                "estado": "completado",
                "ultima_fecha_realizado": firestore.SERVER_TIMESTAMP,
            })
            return {"status": "success", "message": "Ejercicio completado"}

        return {"status": "error", "message": "Ejercicio no encontrado"}

    except Exception as e:
        print(f"❌ Error en completar_ejercicio: {e}")
        return {"error": str(e)}
    
@app.post("/context/verbs")
def get_verbs_for_context(payload: ContextOnlyPayload):
    """
    Retorna los verbos únicos para un contexto dado.
    No asigna todavía ningún ejercicio.
    """
    context = payload.context

    # Traemos todos los ejercicios VNEST de ese contexto
    exercises = db.collection("ejercicios_VNEST").where("contexto", "==", context).stream()
    exercises_list = [doc.to_dict() for doc in exercises]

    # Extraemos los verbos únicos
    verbs = list({ex["verbo"] for ex in exercises_list if "verbo" in ex})

    return {"context": context, "verbs": verbs}