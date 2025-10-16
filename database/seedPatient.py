import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Inicializar Firebase
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def seed_pacientes():
    pacientes = [
        {
            "email": "maria.gomez@example.com",
            "password": "maria123",
            "nombre": "María Gómez",
            "lugar_nacimiento": "Bogotá",
            "fecha_nacimiento": "1980-05-14",
            "ciudad_residencia": "Bogotá",
            "terapeuta": "terapeuta_001",
            "familiares": [
                {"nombre": "Pedro", "tipo_relacion": "hijo", "descripcion": "Hijo mayor, vive con ella"},
                {"nombre": "Carlos", "tipo_relacion": "esposo", "descripcion": "Apoya en las terapias y acompañamiento diario"},
            ],
            "objetos": [
                {"nombre": "Carro", "tipo_relacion": "transporte", "descripcion": "Sale al parque los fines de semana"},
                {"nombre": "Casa en el campo", "tipo_relacion": "propiedad", "descripcion": "Vacaciones con la familia"},
                {"nombre": "Reloj antiguo", "tipo_relacion": "objeto sentimental", "descripcion": "Era de su padre"},
            ],
            "rutinas": [
                {"titulo": "Salir a caminar", "descripcion": "Camina 30 min cada mañana"},
                {"titulo": "Leer en las tardes", "descripcion": "Novelas después del almuerzo"},
                {"titulo": "Preparar el desayuno", "descripcion": "Café y pan para la familia"},
            ],
            "ejercicios_asignados": [
                {
                    "id_ejercicio": "ej_001",
                    "estado": "pendiente",
                    "prioridad": 3,
                    "ultima_fecha_realizado": None,
                    "veces_realizado": 0,
                },
                {
                    "id_ejercicio": "ej_002",
                    "estado": "realizado",
                    "prioridad": 5,
                    "ultima_fecha_realizado": datetime(2025, 10, 10),
                    "veces_realizado": 2,
                },
            ],
        },
        {
            "email": "juan.perez@example.com",
            "password": "juan456",
            "nombre": "Juan Pérez",
            "lugar_nacimiento": "Medellín",
            "fecha_nacimiento": "1975-11-22",
            "ciudad_residencia": "Cali",
            "terapeuta": None,
            "familiares": [
                {"nombre": "Laura", "tipo_relacion": "hija", "descripcion": "Lo ayuda con ejercicios de memoria"},
            ],
            "objetos": [
                {"nombre": "Motocicleta", "tipo_relacion": "transporte", "descripcion": "Medio preferido antes del ACV"},
                {"nombre": "Guitarra", "tipo_relacion": "hobby", "descripcion": "Toca canciones clásicas"},
            ],
            "rutinas": [
                {"titulo": "Regar las plantas", "descripcion": "Cada mañana revisa el jardín"},
                {"titulo": "Ver noticias", "descripcion": "Noticieros locales por la mañana"},
            ],
            "ejercicios_asignados": [],  # empieza vacío
        },
    ]

    for paciente in pacientes:
        paciente_ref = db.collection("pacientes").document(paciente["email"])
        paciente_data = {k: v for k, v in paciente.items() if k != "ejercicios_asignados"}
        paciente_ref.set(paciente_data)
        print(f"✅ Paciente {paciente['nombre']} creado")

        # Subcolección ejercicios_asignados
        for ejercicio in paciente.get("ejercicios_asignados", []):
            ejercicio_ref = paciente_ref.collection("ejercicios_asignados").document(ejercicio["id_ejercicio"])
            ejercicio_ref.set(ejercicio)
            print(f"   ↳ Ejercicio asignado {ejercicio['id_ejercicio']} agregado")

if __name__ == "__main__":
    seed_pacientes()
