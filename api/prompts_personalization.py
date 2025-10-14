import json

def generate_personalization_prompt(base_exercise: dict, patient_profile: dict, user_id: str) -> str:
    """
    Construye el prompt para personalizar un ejercicio base con información del paciente.
    """
    return f"""
Eres un terapeuta experto en afasia y personalización de ejercicios de lenguaje.

Tienes un ejercicio base y el perfil de un paciente.
Tu tarea es adaptar el contenido del ejercicio al contexto del paciente,
manteniendo la estructura y los campos originales.

Perfil del paciente:
{json.dumps(patient_profile, ensure_ascii=False, indent=2)}

Ejercicio base:
{json.dumps(base_exercise, ensure_ascii=False, indent=2)}

Instrucciones:
1. Reemplaza nombres genéricos ("el agricultor", "la persona", "el cliente") 
   por miembros de la familia, lugares, rutinas o intereses del paciente.
2. No cambies el nivel ni el tipo del ejercicio.
3. Devuelve un JSON con la misma estructura, pero con el contenido adaptado.
4. Incluye estos campos adicionales:
   - "id_paciente": "{user_id}"
   - "personalizado": true
   - "referencia_base": "{base_exercise.get('id', '')}"
   - "contexto_personal": breve explicación de cómo se adaptó.
5. No cambies el contexto original: debe mantenerse igual a "{base_exercise.get('context_hint')}".
    """

