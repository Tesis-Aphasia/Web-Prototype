import os, json
from typing import Dict, Any
from typing_extensions import TypedDict
import firebase_admin
from firebase_admin import credentials, firestore
from openai import AzureOpenAI
from prompts_personalization import generate_personalization_prompt
from assign_logic import assign_exercise_to_patient
import uuid

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
    Obtiene un ejercicio base desde /ejercicios/{exercise_id} y su contenido
    extendido según el tipo (VNEST o SR).
    """

    # 1️⃣ Obtener el documento base
    doc_ref = db.collection("ejercicios").document(exercise_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise ValueError(f"Ejercicio base '{exercise_id}' no encontrado.")

    base_data = doc.to_dict()

    # 2️⃣ Determinar tipo (VNEST o SR)
    tipo = base_data.get("terapia")
    if not tipo:
        raise ValueError(f"El ejercicio '{exercise_id}' no tiene campo 'terapia' o 'tipo' definido.")

    # 3️⃣ Obtener los datos específicos según el tipo
    tipo = tipo.upper()
    extra_data = {}

    if tipo == "VNEST":
        extra_ref = db.collection("ejercicios_VNEST").document(exercise_id)
        extra_doc = extra_ref.get()
        if extra_doc.exists:
            extra_data = extra_doc.to_dict()
    elif tipo == "SR":
        extra_ref = db.collection("ejercicios_SR").document(exercise_id)
        extra_doc = extra_ref.get()
        if extra_doc.exists:
            extra_data = extra_doc.to_dict()

    # 4️⃣ Combinar ambos diccionarios (base + detalles)
    full_exercise = {**base_data, **extra_data}

    return full_exercise

def save_personalized_exercise(exercise_data: Dict[str, Any]):
    """
    Guarda el ejercicio personalizado tanto en la colección general /ejercicios
    como en su colección específica (ejercicios_VNEST o ejercicios_SR).
    """

    # --- 1️⃣ Crear ID único para el nuevo ejercicio ---
    doc_id = f"E{uuid.uuid4().hex[:6].upper()}"
    exercise_data["id"] = doc_id

    # --- 2️⃣ Atributos generales obligatorios ---
    general_data = {
        "id": doc_id,
        "terapia": exercise_data.get("terapia"),  # VNEST o SR
        "revisado": False,
        "tipo": "privado",                       # público o privado
        "creado_por": exercise_data.get("creado_por"),
        "personalizado": True,
        "referencia_base": exercise_data.get("referencia_base"),  # id del ejercicio base
        "id_paciente": exercise_data.get("id_paciente"),
        "descripcion_adaptado": exercise_data.get("descripcion_adaptado", ""),
        "contexto": exercise_data.get("contexto"),
    }

    # --- 3️⃣ Guardar en la colección general ---
    db.collection("ejercicios").document(doc_id).set(general_data)

    # --- 4️⃣ Guardar en la colección específica según terapia ---
    terapia = exercise_data.get("terapia")
    if terapia == "VNEST":
        venest_data = {
            "id_ejercicio_general": doc_id,
            "contexto": exercise_data.get("contexto"),
            "nivel": exercise_data.get("nivel"),
            "oraciones": exercise_data.get("oraciones", []),
            "pares": exercise_data.get("pares", []),
            "verbo": exercise_data.get("verbo", ""),
        }
        db.collection("ejercicios_VNEST").document(doc_id).set(venest_data)
    elif terapia == "SR":
        db.collection("ejercicios_SR").document(doc_id).set(exercise_data)
    else:
        raise ValueError(f"Terapia desconocida: {terapia}")

    print(f"✅ Ejercicio personalizado guardado: {doc_id}")
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
def main_personalization(user_id: str, exercise_id: str, patient_profile: Dict[str, Any]):
    """
    Genera un ejercicio personalizado a partir de un ejercicio base (/exercises/{exercise_id})
    usando el perfil del paciente (que contiene su user_id) y guarda el resultado en Firestore.
    """

    # 2️⃣ Obtener el ejercicio base
    base_exercise = get_exercise_base(exercise_id)

    # 3️⃣ Crear el prompt
    prompt = generate_personalization_prompt(base_exercise, patient_profile, user_id)

    # 4️⃣ Ejecutar el modelo
    result = run_prompt(prompt)

    # 5️⃣ Agregar metadatos y asegurar contexto
    # result["id_paciente"] = user_id
    # result["personalizado"] = True
    # result["base"] = False
    # result["referencia_base"] = exercise_id
    result["contexto"] = base_exercise.get("contexto") or base_exercise.get("context_hint")

    # 6️⃣ Guardar en Firestore
    new_id = save_personalized_exercise(result)

    assign_exercise_to_patient(user_id, new_id)

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

