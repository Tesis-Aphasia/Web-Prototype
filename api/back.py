import json
import os
from openai import AzureOpenAI


def generate_prompt(context: str):
    prompt1 = ''' 
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
      ], 
        "oraciones": [
        {
          "oracion": "string",
          "correcta": true
        }]
    }

    Reglas importantes:

    verbo: el verbo en infinitivo que se va a trabajar en todo el ejercicio. Sin ser genéricos como ‘hacer’ o ‘tener’. Elige el verbo dentro del contexto de ''' + context + '''

    Debes generar exactamente cuatro pares en formato:
    sujeto + verbo + complemento, usando SIEMPRE el mismo verbo.
    Condiciones obligatorias: Exclusividad de pares: Cada sujeto debe estar vinculado a un complemento que no pueda ser usado con ningún otro sujeto dentro de los 3 pares. Ningún sujeto debe poder ejecutar la acción sobre el complemento de los otros pares. Especificidad máxima: Los pares deben ser tan concretos y únicos que sea imposible intercambiar sujeto y complemento sin perder el sentido. Variedad: Los tres pares deben ser totalmente diferentes en su contexto y tema. Pueden ser creativos y no tienen que estar relacionados entre sí.

    Cada par tiene:
    sujeto (quién hace la acción), no uses pronombres ni nombres propios. Puede ser una persona, rol, profesión, animal, entidad o cosa.  
    complemento (qué recibe la acción), la entidad sobre la que recae la acción en relacion al sujeto. Puede ser un objeto, una persona o un tema. Tiene que tener sentido que el sujeto realice la acción sobre el complemento.
    expansiones → 3 preguntas: dónde, cuándo, por qué.
    Cada expansión debe tener exactamente 4 opciones, con solo 1 opción correcta (opcion_correcta).

    Por ultimo: 
    Usando el mismo verbo, crea exactamente 10 oraciones con sujeto + verbo + complemento (simple). Haz que las oraciones sean simples.
    Mezcla frases con sentido (correctas) y sin sentido (incorrectas o absurdas). En todas las oraciones conjuga bien el verbo, y aún si estuviera mal conjugado no cuentes eso como error. 

    '''
    return prompt1


def main(context: str):
  endpoint = "https://invuniandesai-2.openai.azure.com/"
  model_name = "gpt-4o-mini"
  deployment = "gpt"

  subscription_key = ""
  api_version = "2024-12-01-preview"

  client = AzureOpenAI(
      api_version=api_version,
      azure_endpoint=endpoint,
      api_key=subscription_key,
  )
  print(context)
  response = client.chat.completions.create(
      messages=[
          {
              "role": "system",
              "content": "Eres experto en las terapias del lenguaje y en la generación de ejercicios VNeST (Verb Network Strengthening Treatment) para pacientes con afasia",
          },
          {
              "role": "user",
              "content": generate_prompt(context),
          }
      ],
      max_tokens=4096,
      temperature=1.0,
      top_p=1.0,
      model=deployment
  )

  #print(response.choices[0].message.content)
  #print(type(response.choices[0].message.content))
  return json.loads(response.choices[0].message.content)
