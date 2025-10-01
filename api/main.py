from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import backTwo as back
from main_langraph_sr import main_langraph_sr


# 👇 importamos la nueva función
from main_langraph_vnest import main_langraph_vnest  

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ContextPayload(BaseModel):
    context: str
    nivel: str = "facil"   # opcional, default "facil"

class SRPayload(BaseModel):
    user_id: str
    profile: dict

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/context/")
def create_exercise(payload: ContextPayload):
    #response = back.main(payload.context)
    response = main_langraph_vnest(payload.context, nivel=payload.nivel)
    return response

@app.post("/spaced-retrieval/")
def create_sr_cards(payload: SRPayload):
    response = main_langraph_sr(payload.user_id, payload.profile)
    return response