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

