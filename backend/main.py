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
from routes.vitals import router as vitals_router
from routes.orders import router as orders_router
from routes.clinic_management import router as clinic_management_router
from routes.reminders import router as reminders_router
from routes.reviews import router as reviews_router


app = FastAPI(
    title="MediChain API",
    description="Unified MediChain backend — hospital network, patient portal, inventory, billing, reminders, reviews.",
    version="2.0.0",
)

allowed_origins = [
    "https://medichain-lime.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core hospital + transfer + realtime
app.include_router(hospitals_router)
app.include_router(transfers_router)
app.include_router(realtime_router)

# Auth
app.include_router(auth_router)
app.include_router(hospital_auth_router)

# Patient journeys
app.include_router(appointments_router)
app.include_router(payments_router)
app.include_router(medical_records_router)
app.include_router(reminders_router)

# Hospital operations
app.include_router(inventory_router)
app.include_router(billing_router)
app.include_router(patient_bills_router)
app.include_router(vitals_router)
app.include_router(orders_router)
app.include_router(clinic_management_router)

# Patient experience
app.include_router(reviews_router)


@app.get("/")
def read_root():
    return {"status": "MediChain API running", "version": "2.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "medichain-backend", "version": "2.0.0"}
