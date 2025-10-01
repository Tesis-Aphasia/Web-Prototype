import os, json
from typing import Dict, List, Optional
from typing_extensions import TypedDict
import firebase_admin
from firebase_admin import credentials, firestore
from openai import AzureOpenAI
from prompts_sr import generate_sr_prompt

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
# STATE
# ==============================
class SRState(TypedDict, total=False):
    user_id: str
    patient_profile: Dict
    cards: List[Dict]

# ==============================
# HELPERS FIRESTORE
# ==============================
def save_sr_cards(user_id: str, cards: List[Dict]):
    col = db.collection("sr_cards")
    for i, card in enumerate(cards):
        doc_id = f"{user_id}-{i}"
        col.document(doc_id).set({
            "card_id": doc_id,
            "user_id": user_id,
            "stimulus": card["stimulus"],
            "answer": card["answer"],
            "category": card.get("category", "personal"),
            "intervals_sec": [15, 30, 60, 120, 240],
            "interval_index": 0,
            "success_streak": 0,
            "lapses": 0,
            "next_due": 0,
            "status": "learning",
        })

# ==============================
# PROMPT RUNNER
# ==============================
def parse_json(raw: str):
    s = raw.strip()
    if s.startswith("```"):
        s = s.strip("`")
        start = s.find("{")
        end = s.rfind("}")
        if start != -1 and end != -1:
            s = s[start:end+1]
    return json.loads(s)

def run_prompt(prompt: str) -> Dict:
    client = get_client()
    resp = client.chat.completions.create(
        model=AZURE_DEPLOYMENT,
        messages=[
            {"role": "system", "content": "Eres experto en terapia del lenguaje y Spaced Retrieval."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )
    content = resp.choices[0].message.content
    return parse_json(content)

# ==============================
# MAIN
# ==============================
def main_langraph_sr(user_id: str, patient_profile: dict):
    prompt = generate_sr_prompt(patient_profile)
    out = run_prompt(prompt)

    cards = out.get("cards", [])
    if not cards:
        raise ValueError("El modelo no devolvió tarjetas SR")

    save_sr_cards(user_id, cards)

    return {"user_id": user_id, "cards": cards}

if __name__ == "__main__":
    # ejemplo con un perfil falso
    profile = {
        "personal": {"nombre": "María", "lugar_nacimiento": "Bogotá"},
        "familia": {"hijos": ["Daniel", "Laura"], "pareja": "Carlos"},
        "rutinas": {"comida_favorita": "Ajiaco", "actividad_favorita": "Caminar"},
        "objetos": {"mascota": {"nombre": "Rocky"}},
    }
    res = main_langraph_sr("paciente123", profile)
    print(json.dumps(res, indent=2, ensure_ascii=False))
