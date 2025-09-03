import os
from openai import AzureOpenAI

endpoint = "https://invuniandesai-2.openai.azure.com/"
model_name = "gpt-4o-mini"
deployment = "gpt"

subscription_key = ""
api_version = "2024-12-01-preview"
prompt = ''' 
Genera un JSON con la siguiente estructura. No agregues comentarios adicionales, solo el json. 
Todo el ejercicio debe girar alrededor de un único verbo.

Formato requerido:
{
  "verbo": "string",
  "pares": [
    {
      "sujeto": "string",
      "objeto": "string",
      "expansiones": {
        "donde": {
          "opciones": ["string", "string", "string", "string"],
          "opcion_correcta": "string"
        },
        "cuando": {
          "opciones": ["string", "string", "string", "string"],
          "opcion_correcta": "string"
        },
        "por_que": {
          "opciones": ["string", "string", "string", "string"],
          "opcion_correcta": "string"
        }
      }
    }
  ]
}

Reglas importantes:

verbo: el verbo en infinitivo que se va a trabajar en todo el ejercicio. Sin ser genéricos como ‘hacer’ o ‘tener’. Elige el verbo dentro del contexto de ir a un supermercado. 

pares: debe haber 3 pares correctos, cada uno con el mismo verbo. Los pares tienen libertad creativa no deben estar relacionados con el contexto del supermercado. Deben ser plausibles y únicos en relacion con los otros pares. 

Cada par tiene:

sujeto (quién hace la acción), no uses pronombres ni nombres propios. 

objeto (qué recibe la acción).

expansiones → 3 preguntas: dónde, cuándo, por qué.

Cada expansión debe tener exactamente 4 opciones, con solo 1 opción correcta (opcion_correcta).
 '''

client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=endpoint,
    api_key=subscription_key,
)

response = client.chat.completions.create(
    messages=[
        {
            "role": "system",
            "content": "Eres experto en las terapias del lenguaje y en la generación de ejercicios VNeST (Verb Network Strengthening Treatment) para pacientes con afasia",
        },
        {
            "role": "user",
            "content": prompt
        }
    ],
    max_tokens=4096,
    temperature=1.0,
    top_p=1.0,
    model=deployment
)

print(response.choices[0].message.content)

