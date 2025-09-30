import os, json
from typing import Dict, List, Optional
from typing_extensions import TypedDict
import firebase_admin
from firebase_admin import credentials, firestore

from langgraph.graph import StateGraph
from langchain_core.tools import tool
from openai import AzureOpenAI

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
AZURE_DEPLOYMENT = "gpt-4.1"     # tu deployment
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
class ExerciseState(TypedDict, total=False):
    contexto: str
    nivel: str
    verbos: List[str]
    verbos_clasificados: Dict[str, List[str]]
    verbo_seleccionado: str
    oraciones_svo: List[Dict[str, str]]
    pares: List[Dict]
    oraciones: List[Dict]
    doc_id: Optional[str]

# ==============================
# HELPERS FIRESTORE
# ==============================
def _normalize_for_front(doc_id: str, data: dict) -> dict:
    return {
        "id": doc_id,
        "verbo": data.get("verbo", ""),
        "nivel": data.get("nivel", ""),
        "context_hint": data.get("context_hint", ""),
        "reviewed": bool(data.get("reviewed", False)),
        "pares": data.get("pares", []),
        "oraciones": data.get("oraciones", []),
    }

def get_exercise_from_db(verbo: str) -> Optional[dict]:
    q = db.collection("exercises").where("verbo", "==", verbo).limit(1)
    docs = q.stream()
    for d in docs:
        return _normalize_for_front(d.id, d.to_dict())
    return None

def save_exercise_to_db(verbo, nivel, context_hint, reviewed, pares, oraciones) -> str:
    doc = {
        "verbo": verbo,
        "nivel": nivel,
        "context_hint": context_hint,
        "reviewed": bool(reviewed),
        "pares": pares,
        "oraciones": oraciones,
    }
    ref = db.collection("exercises").add(doc)[1]
    return ref.id

# ==============================
# PROMPTS (importados)
# ==============================
from prompts_vnest import (
    generate_verb_prompt,
    verb_by_difficulty,
    pair_subject_object,
    sentence_expansion,
    generate_prompt,
)

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
    print("\n" + "="*60)

    print("Prompt enviado:\n", prompt[:1000], "...")  # imprimimos máx 1000 chars
    print("="*60)

    resp = client.chat.completions.create(
        model=AZURE_DEPLOYMENT,
        messages=[
            {"role": "system", "content": "Eres experto en terapias del lenguaje y generación de ejercicios VNeST."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
        max_tokens=1500,
        response_format={"type": "json_object"},
    )

    content = resp.choices[0].message.content
    print("📥 Respuesta cruda:\n", content)
    print("="*60 + "\n")

    return parse_json(content)


def _validate_final(out5: dict):
    if "verbo" not in out5 or not out5["verbo"]:
        raise ValueError("Falta 'verbo'")
    if "pares" not in out5 or not isinstance(out5["pares"], list):
        raise ValueError("Faltan pares")
    if "oraciones" not in out5 or len(out5["oraciones"]) != 10:
        raise ValueError("Debe haber 10 oraciones")

# ==============================
# NODOS
# ==============================
def step1_generate_verbs(state: ExerciseState) -> ExerciseState:
    """Genera 7 verbos transitivos a partir del contexto proporcionado."""
    out1 = run_prompt(generate_verb_prompt(state["contexto"]))
    state["verbos"] = out1["verbos"]
    return state

def step2_classify_verbs(state: ExerciseState) -> ExerciseState:
    """Clasifica los verbos generados en fácil, medio y difícil."""
    out2 = run_prompt(verb_by_difficulty(state["contexto"], state["verbos"]))
    state["verbos_clasificados"] = out2["verbos_clasificados"]
    return state

def step3_select_pairs(state: ExerciseState) -> ExerciseState:
    """Selecciona un verbo del nivel indicado y genera 3 oraciones SVO disyuntivas."""
    out3 = run_prompt(
        pair_subject_object(
            state["contexto"],
            state["verbos_clasificados"],
            nivel=state["nivel"],
            n_oraciones=3,
        )
    )
    state["verbo_seleccionado"] = out3["verbo_seleccionado"]
    state["oraciones_svo"] = out3["oraciones"]
    return state

def step4_expand_sentences(state: ExerciseState) -> ExerciseState:
    """Genera expansiones y 10 oraciones; fija 'verbo' en el state pase lo que pase."""
    out4 = run_prompt(sentence_expansion(state["verbo_seleccionado"], state["oraciones_svo"]))
    final_prompt = generate_prompt(out4)
    out5 = run_prompt(final_prompt)

    # Aunque falle la validación, no queremos romper la cadena
    try:
        _validate_final(out5)
    except Exception as e:
        print("_validate_final falló:", e)

    # Verbo final robusto
    verbo_final = (out5.get("verbo") or state.get("verbo_seleccionado") or "").strip()
    if not verbo_final:
        raise ValueError("No se pudo determinar 'verbo' en step4.")

    # Devuelve solo el delta con 'verbo'
    return {
        "verbo": verbo_final,
        "pares": out5.get("pares", []),
        "oraciones": out5.get("oraciones", []),
    }


def step5_save_db(state: ExerciseState) -> ExerciseState:
    """Lee/guarda en Firestore y normaliza salida para el front."""
    # Fallback seguro
    verbo_final = (state.get("verbo") or state.get("verbo_seleccionado") or "").strip()
    if not verbo_final:
        raise ValueError("State sin 'verbo' y sin 'verbo_seleccionado' en step5.")

    # 1) Reusar si existe
    ejercicio = get_exercise_from_db(verbo_final)
    if ejercicio:
        return {
            "doc_id": ejercicio["id"],
            "verbo": ejercicio["verbo"],
            "nivel": ejercicio.get("nivel", state.get("nivel")),
            "contexto": ejercicio.get("context_hint", state.get("contexto")),
            "reviewed": ejercicio.get("reviewed", False),
            "pares": ejercicio.get("pares", []),
            "oraciones": ejercicio.get("oraciones", []),
        }

    # 2) Guardar
    doc_id = save_exercise_to_db(
        verbo=verbo_final,
        nivel=state["nivel"],
        context_hint=state["contexto"],
        reviewed=False,
        pares=state.get("pares", []),
        oraciones=state.get("oraciones", []),
    )
    return {
        "doc_id": doc_id,
        "verbo": verbo_final,
        "nivel": state["nivel"],
        "contexto": state["contexto"],
        "reviewed": False,
    }


# ==============================
# GRAFO
# ==============================
def build_graph():
    graph = StateGraph(ExerciseState)

    graph.add_node("step1_generate_verbs", step1_generate_verbs)
    graph.add_node("step2_classify_verbs", step2_classify_verbs)
    graph.add_node("step3_select_pairs", step3_select_pairs)
    graph.add_node("step4_expand_sentences", step4_expand_sentences)
    graph.add_node("step5_save_db", step5_save_db)

    graph.add_edge("step1_generate_verbs", "step2_classify_verbs")
    graph.add_edge("step2_classify_verbs", "step3_select_pairs")
    graph.add_edge("step3_select_pairs", "step4_expand_sentences")
    graph.add_edge("step4_expand_sentences", "step5_save_db")

    graph.set_entry_point("step1_generate_verbs")
    graph.set_finish_point("step5_save_db")

    return graph.compile()

# ==============================
# MAIN
# ==============================
def main_langraph_vnest(contexto: str, nivel="facil"):
    workflow = build_graph()
    initial_state = {"contexto": contexto, "nivel": nivel}
    final_state = workflow.invoke(initial_state)

    return {
        "id": final_state.get("doc_id", "fake_id"),
        "verbo": final_state.get("verbo") or final_state.get("verbo_seleccionado"),
        "nivel": final_state.get("nivel"),
        "context_hint": final_state.get("contexto"),
        "reviewed": final_state.get("reviewed", False),
        "pares": final_state.get("pares", []),
        "oraciones": final_state.get("oraciones", []),
    }


if __name__ == "__main__":
    resultado = main_langraph_vnest("Un hospital")
    print(json.dumps(resultado, indent=2, ensure_ascii=False))
