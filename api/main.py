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

@app.get("/")
def read_root():
    return {"Hello": "World"}

# Endpoint para generar un ejercicio dado un contexto - usado por el terapeuta
@app.post("/context/generate")
def create_exercise(payload: ContextGeneratePayload):
    print("Payload recibido:", payload)
    #response = back.main(payload.context)
    response = main_langraph_vnest(payload.context, payload.nivel, payload.creado_por, payload.tipo)
    return response

# Endpoint para asignar o buscar un ejercicio para el paciente - usado por la app móvil
@app.post("/context/")
def get_exercise_for_patient(payload: ContextPayload):
    try:
        print(f"📩 Payload recibido: {payload.dict()}")

        response = get_exercise_for_context(payload.email, payload.context)

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
def personalize_exercise(payload: SRPayload, exercise_type: str, exercise_id: str):
    response = main_personalization(payload.user_id, exercise_type, exercise_id, payload.profile)
    return response

# Endpoint para asignar un ejercicio - usado por el terapeuta
@app.post("/assign-exercise/")
def assign_exercise(payload: ContextPayload, exercise_id: str):
    try:
        assign_exercise_to_patient(payload.user_id, exercise_id, payload.context)
        return {"ok": True, "message": f"Ejercicio {exercise_id} asignado al paciente {payload.user_id} en contexto {payload.context}"}
    except Exception as e:
        return {"error": str(e)}

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