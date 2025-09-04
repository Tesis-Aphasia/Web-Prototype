
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import back 

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

@app.get("/")
def read_root():
   return {"Hello": "World"}

@app.post("/context/")
def create_exercise(payload: ContextPayload):
    response = back.main(payload.context)
    return response
