from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.hospitals import router as hospitals_router
from routes.realtime import router as realtime_router
from routes.transfers import router as transfers_router
from routes.auth import router as auth_router
from routes.appointments import router as appointments_router
from routes.hospital_auth import router as hospital_auth_router
from routes.payments import router as payments_router
from routes.inventory import router as inventory_router
from routes.billing import router as billing_router, patient_bills_router
from routes.medical_records import router as medical_records_router


app = FastAPI(
    title="Hospital Network API",
    version="0.1.0",
)

allowed_origins =[
    "https://medichain-lime.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hospitals_router)
app.include_router(transfers_router)
app.include_router(realtime_router)
app.include_router(auth_router)
app.include_router(appointments_router)
app.include_router(hospital_auth_router)
app.include_router(payments_router)
app.include_router(inventory_router)
app.include_router(billing_router)
app.include_router(patient_bills_router)
app.include_router(medical_records_router)


@app.get("/")
def read_root():
    return {"status": "Hospital Network API running"}
