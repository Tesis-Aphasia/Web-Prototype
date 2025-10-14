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
from assign_logic import get_exercise_for_context

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
    user_id: str
    context: str
    nivel: str = "facil"   # opcional, default "facil"

class SRPayload(BaseModel):
    user_id: str
    profile: dict

class CompletePayload(BaseModel):
    user_id: str
    exercise_id: str
    success: bool = True  # si quieres más adelante distinguir si lo hizo bien o mal

@app.get("/")
def read_root():
    return {"Hello": "World"}

# Endpoint para generar un ejercicio dado un contexto - usado por el terapeuta
@app.post("/context/generate")
def create_exercise(payload: ContextPayload):
    #response = back.main(payload.context)
    response = main_langraph_vnest(payload.context, nivel=payload.nivel)
    return response

# Endpoint para asignar o buscar un ejercicio para el paciente - usado por la app móvil
@app.post("/context/")
def get_exercise_for_patient(payload: ContextPayload):
    """
    Endpoint para el paciente (app móvil).
    Busca el ejercicio que le corresponde (asignado, nuevo o repaso)
    según su historial en ejerciciosAsignados.
    """
    try:
        response = get_exercise_for_context(payload.user_id, payload.context)
        return response
    except Exception as e:
        return {"error": str(e)}

# Endpoint para generar tarjetas de Spaced Retrieval - usado al crear un paciente
@app.post("/spaced-retrieval/")
def create_sr_cards(payload: SRPayload):
    response = main_langraph_sr(payload.user_id, payload.profile)
    return response

# Endpoint para personalizar un ejercicio base - usado por el terapeuta o la app móvil
@app.post("/personalize-exercise/")
def personalize_exercise(payload: SRPayload, exercise_type: str, exercise_id: str):
    response = main_personalization(payload.user_id, exercise_type, exercise_id, payload.profile)
    return response

@app.post("/complete-exercise/")
def complete_exercise(payload: CompletePayload):
    """
    Actualiza el estado del ejercicio asignado cuando el paciente lo completa.
    """
    try:
        patient_ref = db.collection("patients").document(payload.user_id)
        assigned_ref = patient_ref.collection("ejerciciosAsignados").document(payload.exercise_id)
        doc = assigned_ref.get()

        if not doc.exists:
            return {"error": f"Ejercicio {payload.exercise_id} no encontrado para este paciente."}

        data = doc.to_dict()
        current_priority = data.get("prioridad", 1)
        current_streak = data.get("veces_realizado", 0)

        # Nueva prioridad (si fue exitoso, lo movemos al final de la cola)
        new_priority = current_priority + 1 if payload.success else max(1, current_priority - 1)

        # Actualizar documento
        assigned_ref.update({
            "estado": "completado",
            "ultima_fecha": datetime.utcnow().isoformat(),
            "veces_realizado": current_streak + 1,
            "prioridad": new_priority
        })

        return {
            "ok": True,
            "message": "Ejercicio actualizado correctamente",
            "new_priority": new_priority
        }

    except Exception as e:
        return {"error": str(e)}
