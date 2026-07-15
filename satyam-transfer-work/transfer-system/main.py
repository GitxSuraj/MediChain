from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel

app = FastAPI()

# ---- Allow requests from any origin (fine for local dev) ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- MongoDB connection ----
MONGO_URI = "mongodb+srv://twistersatyam_medichain:MiGFuNcqfMjlZkdT@cluster0.z8irybe.mongodb.net/?appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["hospital_network"]
transfers_collection = db["transfers"]

# ---- Track connected WebSocket clients ----
connected_clients = []

# ---- Data shape for a transfer request ----
class TransferRequest(BaseModel):
    patient_name: str
    patient_id: str
    from_hospital: str
    to_hospital: str
    required_facility: str

# ---- WebSocket endpoint: browsers connect here to listen ----
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    print(f"Client connected! Total clients: {len(connected_clients)}")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
        print(f"Client disconnected. Total clients: {len(connected_clients)}")

# ---- Helper function: send a message to every connected client ----
async def broadcast(message: dict):
    for client_ws in connected_clients:
        await client_ws.send_json(message)

# ---- REST endpoint: create a transfer request ----
@app.post("/transfers")
async def create_transfer(transfer: TransferRequest):
    transfer_dict = transfer.dict()
    result = transfers_collection.insert_one(transfer_dict)
    transfer_dict["_id"] = str(result.inserted_id)

    await broadcast({"event": "transfer_request", "data": transfer_dict})

    return {"status": "success", "transfer": transfer_dict}


from bson import ObjectId

class TransferResponse(BaseModel):
    status: str  # "accepted" or "declined"

@app.post("/transfers/{transfer_id}/respond")
async def respond_to_transfer(transfer_id: str, response: TransferResponse):
    transfers_collection.update_one(
        {"_id": ObjectId(transfer_id)},
        {"$set": {"status": response.status}}
    )

    await broadcast({
        "event": "transfer_response",
        "data": {"transfer_id": transfer_id, "status": response.status}
    })

    return {"status": "success"}

patients_collection = db["patients"]

@app.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    patient = patients_collection.find_one({"_id": ObjectId(patient_id)})
    if patient:
        patient["_id"] = str(patient["_id"])
        return patient
    return {"error": "Patient not found"}