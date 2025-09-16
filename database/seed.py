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

# ---------- UTILS ----------
def norm(s: str) -> str:
    return " ".join((s or "").strip().split())

def assert_len(arr, n, name):
    if not isinstance(arr, list) or len(arr) != n:
        raise ValueError(f"{name} debe ser un array de tamaño {n}")

def validate_exp_block(block: dict, name: str):
    opciones = block.get("opciones") or []
    assert_len(opciones, 4, f"expansiones.{name}.opciones")
    opciones = [norm(x) for x in opciones]
    correct = norm(block.get("opcion_correcta", ""))
    if correct not in opciones:
        raise ValueError(f"expansiones.{name}.opcion_correcta no está en opciones")
    return {"opciones": opciones, "opcion_correcta": correct}

def find_pair_id(verbo: str, sujeto: str, objeto: str):
    q = (db.collection("pairs")
         .where("verbo", "==", verbo)
         .where("sujeto", "==", sujeto)
         .where("objeto", "==", objeto)
         .limit(1)
         .get())
    return q[0].id if q else None

def upsert_pair(verbo: str, par: dict, context_hint: str) -> str:
    sujeto = norm(par.get("sujeto", ""))
    objeto  = norm(par.get("objeto", ""))
    exp = par.get("expansiones") or {}
    if not (verbo and sujeto and objeto and exp):
        raise ValueError("par inválido: falta verbo/sujeto/objeto/expansiones")

    # Validar y normalizar expansiones
    exp_norm = {
        "donde":   validate_exp_block(exp.get("donde")   or {}, "donde"),
        "cuando":  validate_exp_block(exp.get("cuando")  or {}, "cuando"),
        "por_que": validate_exp_block(exp.get("por_que") or {}, "por_que"),
    }

    payload = {
        "verbo": verbo,
        "sujeto": sujeto,
        "objeto": objeto,
        "expansiones": exp_norm,
        "context_hint": norm(context_hint),
    }

    existing_id = find_pair_id(verbo, sujeto, objeto)
    if existing_id:
        # actualiza (merge) por si cambió alguna opción
        db.collection("pairs").document(existing_id).set(payload, merge=True)
        return existing_id
    else:
        ref = db.collection("pairs").add(payload)[1]
        return ref.id

def pick_3_pair_ids(verbo: str, pair_ids: list[str], context_hint: str) -> list[str]:
    """Elige 3 ids; si es posible incluye 1 con context_hint == contexto."""
    if len(pair_ids) <= 3:
        return pair_ids

    # Cargar los pairs para ver sus hints
    docs = db.collection("pairs").where("verbo", "==", verbo).get()
    meta = {d.id: d.to_dict() for d in docs if d.id in pair_ids}

    must = [pid for pid in pair_ids if meta.get(pid, {}).get("context_hint") == context_hint]
    rest = [pid for pid in pair_ids if pid not in must]

    chosen = []
    if must:
        chosen.append(random.choice(must))
    random.shuffle(rest)
    chosen += rest[: (3 - len(chosen))]
    return chosen[:3]

def create_exercise(verbo: str, nivel: str, context_hint: str, pair_ids: list[str], oraciones: list[dict]) -> str:
    if nivel not in ["facil", "medio", "dificil"]:
        raise ValueError("nivel debe ser 'facil' | 'medio' | 'dificil'")
    if len(oraciones) != 10:
        raise ValueError("se requieren exactamente 10 oraciones")
    if len(pair_ids) < 3:
        raise ValueError("se requieren al menos 3 pairs")

    # Normalizar y validar oraciones
    norm_oraciones = []
    for o in oraciones:
        s = norm(o.get("oracion", ""))
        c = bool(o.get("correcta", False))
        if not s:
            raise ValueError("hay una oración vacía")
        norm_oraciones.append({"oracion": s, "correcta": c})

    final_pair_ids = pick_3_pair_ids(verbo, pair_ids, context_hint)

    payload = {
        "verbo": verbo,
        "nivel": nivel,
        "context_hint": norm(context_hint),
        "pair_ids": final_pair_ids,
        "oraciones": norm_oraciones,
        "reviewed": False
    }
    ref = db.collection("exercises").add(payload)[1]
    return ref.id

def seed_from_json(path: str):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    contexto = norm(data.get("contexto", ""))
    idioma   = norm(data.get("idioma", "es"))  # no se usa para guardar, pero lo aceptamos
    nivel    = norm(data.get("nivel", "facil"))
    jf       = data.get("json_final") or {}
    verbo    = norm(jf.get("verbo", ""))

    if not contexto or not verbo:
        raise ValueError("contexto y json_final.verbo son obligatorios")

    # Upsert de pairs y recolección de IDs
    pair_ids = []
    for par in jf.get("pares", []):
        pid = upsert_pair(verbo, par, context_hint=contexto)
        pair_ids.append(pid)
    if not pair_ids:
        raise ValueError("json_final.pares vacío")

    # Crear exercise
    ex_id = create_exercise(
        verbo=verbo,
        nivel=nivel,
        context_hint=contexto,
        pair_ids=pair_ids,
        oraciones=jf.get("oraciones", []),
    )

    print("OK ✅")
    print("Pairs:", pair_ids)
    print("Exercise:", ex_id)

# ---------- MAIN ----------
if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else "input.json"
    seed_from_json(input_path)
