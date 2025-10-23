# main_profile_structure.py
import os, json
from dotenv import load_dotenv
from typing import Dict, Any
import firebase_admin
from firebase_admin import credentials, firestore
from openai import AzureOpenAI
from prompts_profile_structure import generate_profile_structure_prompt

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
load_dotenv("env.env")
AZURE_ENDPOINT = "https://invuniandesai-2.openai.azure.com/"
AZURE_DEPLOYMENT = "gpt-4.1"
AZURE_API_KEY = os.getenv("AZURE_API_KEY")
AZURE_API_VERSION = "2024-12-01-preview"

def get_client() -> AzureOpenAI:
    return AzureOpenAI(
        api_key=AZURE_API_KEY,
        azure_endpoint=AZURE_ENDPOINT,
        api_version=AZURE_API_VERSION,
    )

# ==============================
# OPENAI RUNNER
# ==============================
def run_prompt(prompt: str) -> Dict[str, Any]:
    client = get_client()
    resp = client.chat.completions.create(
        model=AZURE_DEPLOYMENT,
        messages=[
            {"role": "system", "content": "Eres un asistente experto en estructurar perfiles clínicos de pacientes con afasia."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=1500,
        response_format={"type": "json_object"},
    )
    content = resp.choices[0].message.content.strip()
    return json.loads(content)

# ==============================
# MAIN FUNCTION
# ==============================
def main_profile_structure(user_id: str, raw_text: str):
    """
    Recibe texto no estructurado del paciente y devuelve un perfil organizado
    con secciones: personal, familia, rutinas y objetos.
    """

    prompt = generate_profile_structure_prompt(raw_text, user_id)
    result = run_prompt(prompt)

    # (Opcional) Guardar una copia estructurada del perfil
    doc_ref = db.collection("perfiles_IA").document(user_id)
    doc_ref.set({
        "user_id": user_id,
        "raw_text": raw_text,
        "structured_profile": result,
        "timestamp": firestore.SERVER_TIMESTAMP
    })

    return {"ok": True, "user_id": user_id, "structured_profile": result}
