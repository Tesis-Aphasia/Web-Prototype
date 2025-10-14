import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()


def seed_ejercicios():
    # ==============================
    # 1️⃣ Colección general: ejercicios
    # ==============================
    ejercicios = [
        {
            "id": "E001",
            "terapia": "VNEST",
            "revisado": False,
            "tipo": "público",
            "creado_por": "terapeuta_001"
        },
        {
            "id": "E002",
            "terapia": "SR",
            "revisado": False,
            "tipo": "privado",
            "creado_por": "terapeuta_002"
        },
        {
            "id": "E003",
            "terapia": "SR",
            "revisado": True,
            "tipo": "público",
            "creado_por": "terapeuta_003"
        }
    ]

    for ej in ejercicios:
        db.collection("ejercicios").document(ej["id"]).set(ej)
        print(f"✅ Ejercicio general {ej['id']} creado")

    # ==============================
    # 2️⃣ Ejercicio VNEST (Hacer mercado)
    # ==============================
    vnest_doc = {
        "id_ejercicio_general": "E001",
        "nivel": "fácil",
        "contexto": "Hacer mercado",
        "verbo": "comprar",
        "oraciones": [
            {"oracion": "El cliente compra pan.", "correcta": True},
            {"oracion": "El turista compra un recuerdo.", "correcta": True},
            {"oracion": "El estudiante compra un cuaderno.", "correcta": True},
            {"oracion": "El perro compra una bicicleta.", "correcta": False},
            {"oracion": "La lámpara compra una manzana.", "correcta": False},
            {"oracion": "Mi abuela compra verduras en el mercado.", "correcta": True},
            {"oracion": "El sol compra zapatos nuevos.", "correcta": False},
            {"oracion": "El niño compra caramelos.", "correcta": True},
            {"oracion": "La silla compra flores para la mesa.", "correcta": False},
            {"oracion": "La profesora compra libros para la clase.", "correcta": True}
        ],
        "pares": [
            {
                "sujeto": "cliente",
                "objeto": "pan",
                "expansiones": {
                    "cuando": {
                        "opciones": [
                            "Por la mañana antes del desayuno",
                            "A medianoche",
                            "Durante una película",
                            "Mientras llueve dentro de casa"
                        ],
                        "opcion_correcta": "Por la mañana antes del desayuno"
                    },
                    "donde": {
                        "opciones": [
                            "En la panadería del barrio",
                            "En la farmacia",
                            "En la biblioteca",
                            "En la ferretería"
                        ],
                        "opcion_correcta": "En la panadería del barrio"
                    },
                    "por_que": {
                        "opciones": [
                            "Porque necesita pan fresco para el desayuno",
                            "Porque quiere aprender a bailar",
                            "Porque perdió su paraguas",
                            "Porque está buscando un libro"
                        ],
                        "opcion_correcta": "Porque necesita pan fresco para el desayuno"
                    }
                }
            },
            {
                "sujeto": "turista",
                "objeto": "recuerdo",
                "expansiones": {
                    "cuando": {
                        "opciones": [
                            "Después de visitar el museo",
                            "Mientras duerme en el hotel",
                            "Durante una clase de matemáticas",
                            "Cuando está en el avión"
                        ],
                        "opcion_correcta": "Después de visitar el museo"
                    },
                    "donde": {
                        "opciones": [
                            "En la tienda de souvenirs del museo",
                            "En la carnicería",
                            "En el gimnasio",
                            "En la clínica dental"
                        ],
                        "opcion_correcta": "En la tienda de souvenirs del museo"
                    },
                    "por_que": {
                        "opciones": [
                            "Porque quiere llevar un recuerdo de su viaje",
                            "Porque necesita arreglar su coche",
                            "Porque tiene hambre",
                            "Porque perdió sus llaves"
                        ],
                        "opcion_correcta": "Porque quiere llevar un recuerdo de su viaje"
                    }
                }
            },
            {
                "sujeto": "estudiante",
                "objeto": "cuaderno",
                "expansiones": {
                    "cuando": {
                        "opciones": [
                            "Al inicio del ciclo escolar",
                            "Durante una fiesta de cumpleaños",
                            "Cuando va al dentista",
                            "Mientras nada en la piscina"
                        ],
                        "opcion_correcta": "Al inicio del ciclo escolar"
                    },
                    "donde": {
                        "opciones": [
                            "En la papelería cerca de la escuela",
                            "En la pescadería",
                            "En el parque de diversiones",
                            "En la peluquería"
                        ],
                        "opcion_correcta": "En la papelería cerca de la escuela"
                    },
                    "por_que": {
                        "opciones": [
                            "Porque necesita tomar apuntes en clase",
                            "Porque quiere cocinar una pizza",
                            "Porque va a ver una película",
                            "Porque debe pasear al perro"
                        ],
                        "opcion_correcta": "Porque necesita tomar apuntes en clase"
                    }
                }
            }
        ]
    }
    db.collection("ejercicios_VNEST").document("E001").set(vnest_doc)
    print("✅ Ejercicio VNEST E001 creado")

    # ==============================
    # 3️⃣ Ejercicios SR (Spaced Retrieval)
    # ==============================
    ejercicios_sr = [
        {
            "id_ejercicio_general": "E002",
            "pregunta": "¿Dónde guardas la leche?",
            "rta_correcta": "En la nevera"
        },
        {
            "id_ejercicio_general": "E003",
            "pregunta": "¿Cómo se llama tu hijo?",
            "rta_correcta": "Pedro"
        }
    ]

    for sr in ejercicios_sr:
        db.collection("ejercicios_SR").document(sr["id_ejercicio_general"]).set(sr)
        print(f"✅ Ejercicio SR {sr['id_ejercicio_general']} creado")

if __name__ == "__main__":
    seed_ejercicios()
