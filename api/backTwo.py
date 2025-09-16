import json
from typing import List, Dict, Any, Optional
from openai import AzureOpenAI
import os, sys, json, random
import firebase_admin
from firebase_admin import credentials, firestore

# ---------- CONFIG CREDENCIALES ----------
KEY_PATH = "serviceAccountKey.json"
if not os.path.isfile(KEY_PATH):
    # 👉 Si te falló antes por la ruta, pega aquí la ABSOLUTA:
    # KEY_PATH = r"d:\ruta\completa\serviceAccountKey.json"
    raise FileNotFoundError(f"No encuentro la llave en: {KEY_PATH}")

# ---------- INIT FIREBASE ----------
if not firebase_admin._apps:
    cred = credentials.Certificate(KEY_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()


# ============== CONFIG ==============
AZURE_ENDPOINT = "https://invuniandesai-2.openai.azure.com/"
AZURE_DEPLOYMENT = "gpt-4.1"  # nombre del deployment del modelo, ej. "gpt-4o-mini"
AZURE_API_KEY = ""
AZURE_API_VERSION = "2024-12-01-preview"  # usa la que tengas habilitada
# ====================================


# ---------- Helpers de Firestore ----------

def _normalize_for_front(doc_id: str, data: dict) -> dict:
    """
    Devuelve SIEMPRE el shape que el front espera.
    Si encuentras documentos viejos con pair_ids (modelo anterior),
    aquí podrías implementar una migración. Por ahora, asumimos que ya vienen embebidos.
    """
    return {
        "id": doc_id,
        "verbo": data.get("verbo", ""),
        "nivel": data.get("nivel", ""),
        "context_hint": data.get("context_hint", ""),
        "reviewed": bool(data.get("reviewed", False)),
        "pares": data.get("pares", []),
        "oraciones": data.get("oraciones", []),
    }

def get_exercise_from_db(verbo: str, nivel: Optional[str] = None, context_hint: Optional[str] = None) -> Optional[dict]:
    """
    Busca un ejercicio por verbo (y opcionalmente nivel / contexto).
    Devuelve el documento NORMALIZADO o None si no hay.
    """
    q = db.collection("exercises").where("verbo", "==", verbo)
    if nivel:
        q = q.where("nivel", "==", nivel)
    if context_hint:
        q = q.where("context_hint", "==", context_hint)

    docs = q.limit(1).stream()
    for d in docs:
        return _normalize_for_front(d.id, d.to_dict())
    return None

def save_exercise_to_db(
    *, verbo: str, nivel: str, context_hint: str, reviewed: bool, pares: list[dict], oraciones: list[dict]
) -> str:
    """
    Crea el documento en 'exercises' con pares EMBEBIDOS.
    """
    doc = {
        "verbo": verbo,
        "nivel": nivel,
        "context_hint": context_hint,
        "reviewed": bool(reviewed),
        "pares": pares,            # 👈 embebidos
        "oraciones": oraciones,
    }
    ref = db.collection("exercises").add(doc)[1]
    return ref.id



# ---------- Prompts ----------

def generate_verb_prompt(contexto: str) -> str:
    # Prompt 1: 7 verbos transitivos específicos
    return (
        f"Dado el siguiente contexto: '{contexto}'. "
        "Genera una lista de exactamente 7 verbos transitivos que cumplan: "
        "0) Deben ser verbos que puedan claramente usarse en el contexto dado; "
        "1) Requieren complemento directo; 2) Son cotidianos y familiares; "
        "3) No son genéricos (evita 'hacer', 'tener', 'llevar'); "
        "4) Son diferentes entre sí; 5) En infinitivo; 6) Mezcla de dificultades. "
        "Responde SOLO con JSON válido, sin texto adicional. "
        'Formato: {"contexto":"string","verbos":["v1","v2","v3","v4","v5","v6","v7"]}'
    )


def verb_by_difficulty(contexto: str, verbos: List[str]) -> str:
    # Prompt 2: clasificar por dificultad
    return (
        "Toma este JSON y clasifica los verbos por dificultad. "
        "Responde SOLO con JSON válido, sin texto adicional. "
        f'Entrada: {{"contexto":"{contexto}","verbos":{json.dumps(verbos, ensure_ascii=False)}}} '
        "Reglas de clasificación: "
        "Fácil = 1–2 sílabas, muy comunes y fáciles de pronunciar; "
        "Medio = 2–3 sílabas y dificultad léxica intermedia; "
        "Difícil = 3+ sílabas o mayor complejidad fonética/léxica. "
        "Distribución equilibrada (p. ej., 2/3/2). "
        'Salida (solo JSON): {"contexto":"string","verbos_clasificados":{"facil":[...],"medio":[...],"dificil":[...]}}'
    )

def pair_subject_object(contexto: str, verbos_clasificados: dict, nivel: str, n_oraciones: int = 3) -> str:
    """
    verbos_clasificados: dict con llaves "facil" | "medio" | "dificil" y listas de verbos (salida del Prompt 2)
    nivel: "facil" | "medio" | "dificil"
    n_oraciones: cuántas oraciones disyuntivas generar (por defecto 3)
    """
    return (
        "PROMPT 3:\n\n"
        f"Contexto: {contexto}\n"
        f"Verbos clasificados: {verbos_clasificados}\n"
        f"Nivel solicitado: {nivel}\n\n"
        "Toma un ÚNICO verbo del nivel indicado y genera oraciones en español siguiendo estas reglas:\n"
        f"- Cantidad: exactamente {n_oraciones} oraciones simples (sujeto + verbo + objeto) usando SIEMPRE el MISMO verbo.\n"
        "- Disyuntivas entre sí: cada sujeto debe vincularse a un objeto que no pueda usarse con otro sujeto de la lista; si intercambias sujeto u objeto entre oraciones y sigue teniendo sentido, la oración es inválida y debe reemplazarse.\n"
        "- Especificidad máxima: las oraciones deben ser tan concretas y únicas que sea imposible intercambiar sujeto y objeto sin perder el sentido.\n"
        "- Variedad: oraciones en contextos/temas distintos.\n"
        "- Conjugación y gramática correctas (presente del indicativo por defecto). Sin pronombres ni nombres propios.\n"
        "- Sujeto: rol/profesión/entidad típicamente **agente** del verbo elegido.\n"
        "- Objeto: persona/objeto/documento típicamente **paciente** o **resultado** del verbo elegido.\n\n"
        "Reglas de PROTOTIPICIDAD (obligatorias):\n"
        "1) Compatibilidad verbo–sujeto: el SUJETO debe ser un agente habitual del verbo (p. ej., si el verbo es transaccional como 'comprar/pagar', agentes típicos: cliente, comprador; para 'enseñar', agente típico: docente/mentor; para 'pesar', agente: dependiente/operario; etc.).\n"
        "2) Compatibilidad verbo–objeto: el OBJETO debe ser una entidad canónica del verbo (p. ej., para 'comprar': productos/mercancías concretas, 'pagar': factura/recibo/cuenta, 'consultar': profesional o fuente de información, 'enseñar': lección/tarea/contenido, 'pesar': fruta/carne/paquete).\n"
        "3) Evita combinaciones inter-dominio débiles o atípicas (ej.: roles educativos con acciones de ingesta; roles familiares con objetos institucionales si no hay vínculo típico con el verbo). Si una combinación no sería reconocida como natural por la mayoría de hablantes, **reescríbela antes de responder**.\n"
        "4) Cobertura de tipos de OBJETO en el conjunto: usa tres tipos distintos entre las oraciones del conjunto: "
        "(a) persona profesional/institucional pertinente al verbo; "
        "(b) objeto/documento/herramienta típica del verbo; "
        "(c) persona de vínculo cercano/autoridad/tutor SOLO si es prototípica para el verbo (p. ej., 'consultar al padre' es válido; 'padre compra uniforme' NO es suficientemente prototípico para 'comprar').\n"
        "5) Prohibido usar sujetos u objetos que hagan la relación trivial o genérica ('persona', 'cosa', 'elemento', etc.).\n"
        "6) Exactamente UNA de las oraciones debe estar directamente relacionada con el contexto dado "
        f"('{contexto}'). Las otras deben ser plausibles y prototípicas aunque no dependan del contexto.\n\n"
        "7) Autochequeo interno (NO lo incluyas en la salida): verifica para cada oración: "
        "(a) sujeto = agente típico del verbo; "
        "(b) objeto = paciente/resultado típico del verbo; "
        "(c) si intercambias S/O, pierde sentido; "
        "(d) no hay solapamiento de tipo de objeto entre las tres oraciones; "
        "(e) descarta pares con prototipicidad baja y reescríbelos.\n\n"
        "Criterios por nivel de dificultad para elegir SUJETO y OBJETO:\n"
        "- Fácil:\n"
        "  • Sujeto: sustantivo de UNA palabra, rol/categoría común (agente típico del verbo).\n"
        "  • Objeto: UNA o DOS palabras, producto/documento/fuente típica del verbo.\n"
        "- Medio:\n"
        "  • Sujeto: UNA–DOS palabras (rol + adjetivo/categoría + especificador) aún prototípico del verbo.\n"
        "  • Objeto: UNA–TRES palabras con descriptor concreto (documento/herramienta/contenido típico del verbo).\n"
        "- Difícil:\n"
        "  • Sujeto: DOS–TRES palabras con modificadores que aumenten especificidad (colectivos/compuestos/adjetivos), sin nombres propios.\n"
        "  • Objeto: TRES–CINCO palabras con alta concreción (puede incluir 'de/para') manteniendo objeto directo plausible y típico del verbo.\n\n"
        "Salida obligatoria: responde SOLO con JSON válido, sin texto adicional.\n"
        "Formato de salida:\n"
        "{"
        f"\"nivel\":\"{nivel}\","
        "\"verbo_seleccionado\":\"string\","
        "\"oraciones\":["
        "{\"oracion\":\"string\",\"sujeto\":\"string\",\"objeto\":\"string\"}"
        "]}"
    )

def sentence_expansion(verbo: str, oraciones: list[dict]) -> str:
    """
    verbo: string (el mismo seleccionado en Prompt 3)
    oraciones: lista de diccionarios [{"oracion": "...", "sujeto": "...", "objeto": "..."}]
    """
    return (
        "PROMPT 4:\n"
        "Toma el siguiente verbo y las oraciones (con sujeto y objeto) y genera expansiones específicas para cada par.\n"
        f"VERBO: {verbo}\n"
        f"ORACIONES: {oraciones}\n\n"
        "Instrucciones:\n"
        "- Para CADA oración, desarrolla 3 interrogantes: ¿Dónde?, ¿Cuándo? y ¿Por qué?.\n"
        "- Cada interrogante debe tener exactamente 4 opciones y solo 1 opción correcta. Debe ser claro que solo hay 1 opción que puede funcionar, las demas no deben tener sentido\n"
        "- Las opciones deben ser concretas y específicas al par (sujeto–verbo–objeto), evitando respuestas genéricas.\n"
        "- Mantén coherencia semántica con el verbo y con el contexto implícito en las oraciones.\n"
        "- No cambies el verbo, el sujeto ni el objeto de entrada.\n"
        "- Responde SOLO con JSON válido, sin texto adicional.\n\n"
        "Formato requerido:\n"
        '{'
        f'"verbo":"{verbo}",'
        '"pares":['
        '{"sujeto":"string","objeto":"string","expansiones":{'
        '"donde":{"opciones":["string","string","string","string"],"opcion_correcta":"string"},'
        '"cuando":{"opciones":["string","string","string","string"],"opcion_correcta":"string"},'
        '"por_que":{"opciones":["string","string","string","string"],"opcion_correcta":"string"}'
        "}}]}"
    )

def generate_prompt(json_prev: dict) -> str:
    """
    json_prev: dict con al menos {"verbo": "...", "pares": [...]}
    Devuelve un prompt que ordena añadir la sección "oraciones" al mismo JSON.
    """
    return (
        "PROMPT 5:\n"
        "Toma el siguiente JSON y AGRÉGALE una última parte llamada \"oraciones\". "
        "No elimines ni cambies ninguna clave existente. Devuelve SOLO JSON válido.\n\n"
        f"JSON de entrada:\n{json.dumps(json_prev, ensure_ascii=False)}\n\n"
        "Requisitos para \"oraciones\":\n"
        "- Usa el MISMO verbo del JSON de entrada.\n"
        "- Crea EXACTAMENTE 10 oraciones simples con sujeto + verbo + complemento (SVC).\n"
        "- Haz oraciones simples y claras.\n"
        "- Mezcla oraciones con sentido (correctas) y oraciones sin sentido o absurdas (incorrectas).\n"
        "- Conjuga bien el verbo en todas las oraciones. Aun si hubiera un error de ortografía, NO lo uses para decidir si es correcta.\n"
        "- Cada elemento debe tener esta forma: {\"oracion\":\"string\",\"correcta\":true|false}.\n\n"
        "Formato requerido (estructura final; respeta lo ya existente y añade la nueva sección):\n"
        "{\n"
        "  \"verbo\": \"string\",\n"
        "  \"pares\": [ { \"sujeto\": \"string\", \"objeto\": \"string\", \"expansiones\": { "
        "\"donde\": {\"opciones\": [\"string\",\"string\",\"string\",\"string\"], \"opcion_correcta\": \"string\"}, "
        "\"cuando\": {\"opciones\": [\"string\",\"string\",\"string\",\"string\"], \"opcion_correcta\": \"string\"}, "
        "\"por_que\": {\"opciones\": [\"string\",\"string\",\"string\",\"string\"], \"opcion_correcta\": \"string\"} } } ],\n"
        "  \"oraciones\": [ { \"oracion\": \"string\", \"correcta\": true } ]\n"
        "}\n"
        "Devuelve SOLO el JSON final actualizado, sin texto adicional."
    )



def generate_prompt_b(contexto: str) -> str:
    # Prompt para pares + oraciones (tu formato exacto)
    return (
        "Genera un JSON con la siguiente estructura. No agregues comentarios adicionales, solo el json. "
        "Todo el ejercicio debe girar alrededor de un único verbo. "
        'Formato requerido: {"verbo":"string","pares":[{"sujeto":"string","objeto":"string","expansiones":{'
        '"donde":{"opciones":["string","string","string","string"],"opcion_correcta":"string"},'
        '"cuando":{"opciones":["string","string","string","string"],"opcion_correcta":"string"},'
        '"por_que":{"opciones":["string","string","string","string"],"opcion_correcta":"string"}}}],'  # la lista real vendrá con N items
        '"oraciones":[{"oracion":"string","correcta":true}]} '
        "Reglas importantes: "
        f"verbo: el verbo en infinitivo que se va a trabajar en todo el ejercicio. Sin ser genéricos como ‘hacer’ o ‘tener’. "
        f"Elige el verbo dentro del contexto de {contexto}. "
        "Debes generar exactamente cuatro oraciones simples en formato sujeto + verbo + complemento, usando SIEMPRE el mismo verbo. "
        "Condiciones obligatorias: Exclusividad (cada oración con sujeto y objeto únicos no intercambiables), "
        "Especificidad máxima, Variedad (4 oraciones distintas en tema). "
        "Después de crear las oraciones, sepáralas en sujeto y objeto (sin pronombres ni nombres propios). "
        "Expansiones: dónde, cuándo, por qué. Cada una con 4 opciones y 1 correcta. "
        "Por último: usando el mismo verbo, crea exactamente 10 oraciones SVC (simples). Mezcla correctas e incorrectas/absurdas. "
        "Conjuga bien el verbo; no cuentes ortografía como criterio de corrección."
    )


# ---------- Cliente Azure ----------

def get_client() -> AzureOpenAI:
    return AzureOpenAI(
        api_key=AZURE_API_KEY,
        azure_endpoint=AZURE_ENDPOINT,
        api_version=AZURE_API_VERSION,
    )

# ---------- Validación mínima del JSON final ----------

def _validate_final(out5: dict):
    if not isinstance(out5, dict):
        raise ValueError("Respuesta final inválida (no dict).")
    if "verbo" not in out5 or not isinstance(out5["verbo"], str) or not out5["verbo"].strip():
        raise ValueError("Falta 'verbo' en la respuesta final.")
    if "pares" not in out5 or not isinstance(out5["pares"], list) or not out5["pares"]:
        raise ValueError("Faltan 'pares' en la respuesta final.")
    if "oraciones" not in out5 or not isinstance(out5["oraciones"], list) or len(out5["oraciones"]) != 10:
        raise ValueError("La respuesta final debe traer exactamente 10 'oraciones'.")

# ---------- Utilidades ----------

def parse_json(raw: str) -> Any:
    """
    Intenta parsear JSON. Si vienen fences o texto extra, limpia.
    """
    s = raw.strip()

    # Quitar fences si vienen
    if s.startswith("```"):
        # elimina primeras y últimas fences
        s = s.strip("`")
        # a veces vienen como ```json ... ```
        # re-corta hasta la primera { y la última }
        start = s.find("{")
        end = s.rfind("}")
        if start != -1 and end != -1:
            s = s[start:end+1]

    # Si aún no empieza con {, intenta recortar
    if not s.startswith("{"):
        start = s.find("{")
        end = s.rfind("}")
        if start != -1 and end != -1:
            s = s[start:end+1]

    return json.loads(s)


def run_prompt(prompt: str) -> Dict[str, Any]:
    client = get_client()
    resp = client.chat.completions.create(
        model=AZURE_DEPLOYMENT,  # nombre del deployment en Azure
        messages=[
            {
                "role": "system",
                "content": (
                    "Eres experto en terapias del lenguaje y en la generación de ejercicios VNeST "
                    "(Verb Network Strengthening Treatment) para pacientes con afasia."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,          # más estable
        top_p=1.0,
        max_tokens=1200,
        response_format={"type": "json_object"},  # fuerza JSON
    )
    content = resp.choices[0].message.content
    return parse_json(content)


# ---------- Flujo principal ----------
def main(contexto: str):
    nivel_dificultad = "facil"      # puedes parametrizarlo
    n_oraciones_disyuntivas = 3

    # 1) Verbos
    out1 = run_prompt(generate_verb_prompt(contexto))
    verbos = out1.get("verbos", [])
    if not isinstance(verbos, list) or len(verbos) != 7:
        raise ValueError("Prompt 1 no devolvió 7 verbos.")
    print("Verbos:", verbos)

    # 2) Clasificación
    out2 = run_prompt(verb_by_difficulty(contexto, verbos))
    verbos_clasificados = out2.get("verbos_clasificados", {})
    if not isinstance(verbos_clasificados, dict) or not any(verbos_clasificados.values()):
        raise ValueError("Prompt 2 sin 'verbos_clasificados' válido.")
    print("Verbos clasificados:", verbos_clasificados)

    # 3) Selección de verbo (con 3 SVO para construir pares)
    out3 = run_prompt(
        pair_subject_object(
            contexto, verbos_clasificados,
            nivel=nivel_dificultad,
            n_oraciones=n_oraciones_disyuntivas
        )
    )  
    print("Prompt 3 output:", out3)
    verbo_seleccionado = out3.get("verbo_seleccionado")
    oraciones_svo = out3.get("oraciones", [])
    if not verbo_seleccionado or len(oraciones_svo) != n_oraciones_disyuntivas:
        raise ValueError("Prompt 3 inválido (verbo u oraciones).")

    # 4) ¿Ya existe en DB?
    ejercicio_db = get_exercise_from_db(verbo_seleccionado)  # o añade filtros: , nivel=nivel_dificultad, context_hint=contexto
    if ejercicio_db:
        # Devuelve en el shape exacto del front
        print("Ejercicio encontrado en DB:", ejercicio_db)
        return ejercicio_db
    print("No existe en DB, se crea uno nuevo.")

    # 5) Generar nuevo (Prompts 4 y 5)
    out4 = run_prompt(sentence_expansion(verbo_seleccionado, oraciones_svo))
    out5 = run_prompt(generate_prompt(out4))
    _validate_final(out5)
    print("Prompt 5 output:", out5)

    verbo_final = out5["verbo"].strip()
    pares_embebidos = out5["pares"]          # 👈 ya vienen listos para embebido
    oraciones_finales = out5["oraciones"]

    # 6) Guardar en DB con campos adicionales requeridos
    doc_id = save_exercise_to_db(
        verbo=verbo_final,
        nivel=nivel_dificultad,
        context_hint=contexto,
        reviewed=False,                 # nuevo → siempre false
        pares=pares_embebidos,          # embebidos
        oraciones=oraciones_finales,
    )

    # 7) Devolver EXACTAMENTE lo que el front necesita
    return {
        "id": doc_id,
        "verbo": verbo_final,
        "nivel": nivel_dificultad,
        "context_hint": contexto,
        "reviewed": False,
        "pares": pares_embebidos,
        "oraciones": oraciones_finales,
    }
