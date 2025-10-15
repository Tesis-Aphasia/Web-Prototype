import os, json
from typing import Dict, Any
from typing_extensions import TypedDict
import firebase_admin
from firebase_admin import credentials, firestore
from openai import AzureOpenAI
from prompts_personalization import generate_personalization_prompt
from assign_logic import assign_exercise_to_patient

# ==============================
# FIREBASE CONFIG
# ==============================
KEY_PATH = "serviceAccountKey.json"
if not firebase_admin._apps:
    cred = credentials.Certificate(KEY_PATH)
    firebase_admin.initialize_app(cred)
db = firestore.client()

# ==============================
# AZURE CONFIG
# ==============================
AZURE_ENDPOINT = "https://invuniandesai-2.openai.azure.com/"
AZURE_DEPLOYMENT = "gpt-4.1"
AZURE_API_KEY = os.getenv("AZURE_API_KEY", "")
AZURE_API_VERSION = "2024-12-01-preview"

def get_client() -> AzureOpenAI:
    return AzureOpenAI(
        api_key=AZURE_API_KEY,
        azure_endpoint=AZURE_ENDPOINT,
        api_version=AZURE_API_VERSION,
    )

# ==============================
# FIRESTORE HELPERS
# ==============================
def get_exercise_base(exercise_id: str) -> Dict[str, Any]:
    """
    Obtiene un ejercicio base desde /exercises/{exercise_id}
    """
    doc_ref = db.collection("exercises").document(exercise_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise ValueError(f"Ejercicio base '{exercise_id}' no encontrado.")
    return doc.to_dict()

import uuid

def save_personalized_exercise(exercise_data: Dict[str, Any]):
    """
    Guarda el ejercicio personalizado en /exercises/{id_base}_{id_paciente}
    Sobrescribe si el mismo paciente vuelve a personalizar el mismo ejercicio.
    """
    base_id = exercise_data.get("referencia_base", "base")
    user_id = exercise_data.get("id_paciente", "unknown")

    # 🆔 ID simple y legible
    doc_id = f"{base_id}_{user_id}"
    exercise_data["id"] = doc_id

    db.collection("exercises").document(doc_id).set(exercise_data)
    return doc_id

# ==============================
# OPENAI RUNNER
# ==============================
def run_prompt(prompt: str) -> Dict[str, Any]:
    client = get_client()
    resp = client.chat.completions.create(
        model=AZURE_DEPLOYMENT,
        messages=[
            {"role": "system", "content": "Eres un terapeuta experto en lenguaje y afasia. Debes personalizar ejercicios de terapia."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
        max_tokens=1500,
        response_format={"type": "json_object"},
    )
    content = resp.choices[0].message.content.strip()
    return json.loads(content)

# ==============================
# MAIN PERSONALIZATION
# ==============================
def main_personalization(exercise_id: str, patient_profile: Dict[str, Any]):
    """
    Genera un ejercicio personalizado a partir de un ejercicio base (/exercises/{exercise_id})
    usando el perfil del paciente (que contiene su user_id) y guarda el resultado en Firestore.
    """
    # 1️⃣ Extraer el user_id del perfil
    user_id = patient_profile.get("user_id")
    if not user_id:
        raise ValueError("El perfil del paciente no contiene 'user_id'.")

    # 2️⃣ Obtener el ejercicio base
    base_exercise = get_exercise_base(exercise_id)

    # 3️⃣ Crear el prompt
    prompt = generate_personalization_prompt(base_exercise, patient_profile, user_id)

    # 4️⃣ Ejecutar el modelo
    result = run_prompt(prompt)

    # 5️⃣ Agregar metadatos y asegurar contexto
    result["id_paciente"] = user_id
    result["personalizado"] = True
    result["base"] = False
    result["referencia_base"] = exercise_id
    result["contexto"] = base_exercise.get("contexto") or base_exercise.get("context_hint")

    # 6️⃣ Guardar en Firestore
    new_id = save_personalized_exercise(result)

    context = result.get("contexto", "General")
    assign_exercise_to_patient(user_id, new_id, context)

    return {"ok": True, "saved_id": new_id, "personalized": result}

# ==============================
# TEST (EJEMPLO)
# ==============================
if __name__ == "__main__":
    patient_id = "Andrea"   # el ID del documento en /patients
    exercise_id = "6ixn7LFB6rQ1cxTPQYEL"  # ejercicio base

    # 🔹 Leer perfil directamente desde /patients/{id}
    doc_ref = db.collection("patients").document(patient_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise ValueError(f"No existe el documento del paciente {patient_id}")

    profile = doc.to_dict()

    print("Perfil cargado desde Firestore:")
    print(json.dumps(profile, indent=2, ensure_ascii=False))

    # 🔹 Ejecutar la personalización con el perfil real
    res = main_personalization(
        exercise_id=exercise_id,
        patient_profile=profile
    )

    print("\nResultado de la personalización:")
    print(json.dumps(res, indent=2, ensure_ascii=False))

