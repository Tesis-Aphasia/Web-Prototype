import json
from typing import List, Dict, Any
from openai import AzureOpenAI

# ============== CONFIG ==============
AZURE_ENDPOINT = "https://invuniandesai-2.openai.azure.com/"
AZURE_DEPLOYMENT = "gpt-4.1"  # nombre del deployment del modelo, ej. "gpt-4o-mini"
AZURE_API_KEY = ""
AZURE_API_VERSION = "2024-12-01-preview"  # usa la que tengas habilitada
# ====================================


# ---------- Prompts ----------

def generate_verb_prompt(contexto: str) -> str:
    # Prompt 1: 7 verbos transitivos específicos
    return (
        f"Dado el siguiente contexto: '{contexto}'. "
        "Genera una lista de exactamente 7 verbos transitivos que cumplan: "
        "1) Requieren complemento directo; 2) Son cotidianos y familiares; "
        "3) No son genéricos (evita 'hacer', 'tener'); "
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
    contexto: str (p.ej., "hacer mercado")
    verbos_clasificados: dict con llaves "facil" | "medio" | "dificil" y listas de verbos (salida del Prompt 2)
    nivel: "facil" | "medio" | "dificil"
    n_oraciones: cuántas oraciones disyuntivas generar (por defecto 3)
    """
    return (
        "PROMPT 3:\n\n"
        f"Contexto: '{contexto}'.\n"
        f"Verbos clasificados: {verbos_clasificados}\n"
        f"Nivel solicitado: {nivel}\n\n"
        "Toma un ÚNICO verbo del nivel indicado y genera oraciones en español siguiendo estas reglas:\n"
        f"- Cantidad: exactamente {n_oraciones} oraciones simples (sujeto + verbo + objeto) usando SIEMPRE el MISMO verbo.\n"
        "- Disyuntivas entre sí: cada sujeto debe vincularse a un objeto que no pueda usarse con otro sujeto de la lista. \n"
        "estas oraciones haran parte de un ejercicio de emparejamiento, por lo que no deben ser intercambiables.\n"
        "- Especificidad máxima: las oraciones deben ser tan concretas y únicas que sea imposible intercambiar sujeto y objeto sin perder el sentido.\n"
        "- Variedad: las oraciones deben ser diferentes en contexto/tema; pueden ser creativas.\n"
        "- Conjugación y gramática correctas (presente del indicativo por defecto). Sin pronombres ni nombres propios.\n"
        "- Sujeto: quien realiza la acción (persona/rol/profesión/animal/entidad/cosa), sin pronombres ni nombres propios.\n"
        "- Objeto: quien/lo que recibe la acción (persona/objeto/tema), con sentido directo respecto del verbo.\n\n"
        "Criterios por nivel de dificultad para elegir SUJETO y OBJETO:\n"
        "- Fácil:\n"
        "  • Sujeto: sustantivo de UNA sola palabra, cotidiano y familiar (p.ej., roles comunes o categorías simples).\n"
        "  • Objeto: sustantivo/objeto de UNA o DOS palabras, cotidiano y familiar.\n"
        "- Medio:\n"
        "  • Sujeto: sintagma nominal de DOS palabras (p.ej., rol + adjetivo / categoría + especificador), cotidiano pero más específico.\n"
        "  • Objeto: sintagma nominal de DOS o TRES palabras con descriptor concreto (p.ej., 'fruta madura', 'lista de compras').\n"
        "- Difícil:\n"
        "  • Sujeto: sintagma nominal de DOS o TRES palabras con modificador(es) que aumenten especificidad (colectivos, compuestos, adjetivos calificativos), evitando nombres propios.\n"
        "  • Objeto: sintagma nominal de TRES a CINCO palabras con alto nivel de concreción (puede incluir especificadores como 'de/para' siempre que siga siendo objeto directo plausible, p.ej., 'registro de inventario semanal').\n\n"
        "Salida obligatoria: responde SOLO con JSON válido, sin texto adicional.\n"
        "Formato de salida:\n"
        '{'
        '"contexto":"'+ contexto + '",'
        '"nivel":"'+ nivel + '",'
        '"verbo_seleccionado":"string",'
        '"oraciones":['
        '{"oracion":"string","sujeto":"string","objeto":"string"}'
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


# ---------- Flujo ejemplo ----------
def main(contexto: str):
    # -------- Parámetros de entrada --------
    #contexto = "hacer mercado"
    nivel_dificultad = "medio"   # "facil" | "medio" | "dificil"
    n_oraciones_disyuntivas = 3  # cantidad de oraciones SVC en paso 3

    # -------- Paso 1: Verbos (7) --------
    p1 = generate_verb_prompt(contexto)
    out1 = run_prompt(p1)  # dict forzado a JSON por run_prompt
    verbos = out1.get("verbos", [])
    print("Prompt1 verbos:", verbos)

    # Validación mínima
    if not isinstance(verbos, list) or len(verbos) != 7:
        raise ValueError("El Prompt 1 no devolvió exactamente 7 verbos.")

    # -------- Paso 2: Clasificación por dificultad --------
    p2 = verb_by_difficulty(contexto, verbos)
    out2 = run_prompt(p2)  # {"contexto":..., "verbos_clasificados":{...}}
    verbos_clasificados = out2.get("verbos_clasificados", {})
    print("Prompt2 clasificados:", json.dumps(out2, ensure_ascii=False, indent=2))

    # Validación mínima
    if not isinstance(verbos_clasificados, dict) or not any(verbos_clasificados.values()):
        raise ValueError("El Prompt 2 no devolvió 'verbos_clasificados' válido.")

    # -------- Paso 3: Oraciones disyuntivas con SUJETO/OBJETO (elige 1 verbo del nivel) --------
    p3 = pair_subject_object(contexto, verbos_clasificados, nivel=nivel_dificultad, n_oraciones=n_oraciones_disyuntivas)
    out3 = run_prompt(p3)  # {"contexto","nivel","verbo_seleccionado","oraciones":[{oracion,sujeto,objeto}]}
    verbo_seleccionado = out3.get("verbo_seleccionado")
    oraciones_svo = out3.get("oraciones", [])
    print("Prompt3 verbo seleccionado:", verbo_seleccionado)
    print("Prompt3 oraciones SVO:", json.dumps(oraciones_svo, ensure_ascii=False, indent=2))

    if not verbo_seleccionado or not isinstance(oraciones_svo, list) or len(oraciones_svo) != n_oraciones_disyuntivas:
        raise ValueError("El Prompt 3 no devolvió el 'verbo_seleccionado' o la cantidad correcta de 'oraciones'.")

    # -------- Paso 4: Expansiones (dónde/cuándo/por qué) para cada SVO --------
    p4 = sentence_expansion(verbo_seleccionado, oraciones_svo)
    out4 = run_prompt(p4)  # {"verbo":"...","pares":[{sujeto,objeto,expansiones:{...}}]}
    print("Prompt4 pares con expansiones:", json.dumps(out4, ensure_ascii=False, indent=2))

    if "verbo" not in out4 or "pares" not in out4 or not isinstance(out4["pares"], list):
        raise ValueError("El Prompt 4 no devolvió 'verbo' y 'pares' válidos.")

    # -------- Paso 5: Agregar sección final de 10 oraciones (correcta/incorrecta) --------
    p5 = generate_prompt(out4)         # pasamos TODO el JSON del paso 4
    out5 = run_prompt(p5)      # mismo JSON + "oraciones":[{oracion,correcta}]
    print("Prompt5 JSON final:", json.dumps(out5, ensure_ascii=False, indent=2))

    # Validación mínima final
    if "oraciones" not in out5 or not isinstance(out5["oraciones"], list) or len(out5["oraciones"]) != 10:
        raise ValueError("El Prompt 5 no devolvió exactamente 10 oraciones en la sección final.")

    # -------- Resultado final utilizable --------
    resultado_final = out5
    # Si quieres guardarlo:
    # with open("vnest_ejercicio.json", "w", encoding="utf-8") as f:
    #     json.dump(resultado_final, f, ensure_ascii=False, indent=2)

    # 3) (opcional) Siguiente prompt usando contexto/clasificación
    # p3 = generate_prompt(contexto)
    # out3 = run_prompt(p3)
    # print("Prompt3:", json.dumps(out3, ensure_ascii=False, indent=2))
    return resultado_final
